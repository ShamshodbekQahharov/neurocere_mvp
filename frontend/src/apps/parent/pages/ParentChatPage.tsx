import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../services/api'
import { format, isToday, isYesterday } from 'date-fns'
import toast from 'react-hot-toast'
import { connectSocket, disconnectSocket, joinChildRoom, onNewMessage, offNewMessage } from '../../../services/socket'

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  child_id: string
  content: string
  is_read: boolean
  created_at: string
}

type AIHistory = {
  role: 'user' | 'assistant'
  content: string
}

export default function ParentChatPage() {
  const [activeTab, setActiveTab] = useState<'doctor' | 'ai'>('doctor')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [childId, setChildId] = useState<string | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [doctorName, setDoctorName] = useState<string>('Dr. Alisher Karimov')
  const [aiHistory, setAiHistory] = useState<AIHistory[]>([
    { role: 'assistant', content: 'Salom! Men NeuroCare AI yordamchisiman. Bolangiz haqida savollaringiz bormi?' }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)
  const { user, token } = useAuthStore()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const scrollAiToBottom = useCallback(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    scrollAiToBottom()
  }, [aiHistory, scrollAiToBottom])

  useEffect(() => {
    fetchChildData()
  }, [])

  useEffect(() => {
    if (activeTab === 'doctor' && token && childId) {
      const socket = connectSocket(token)
      joinChildRoom(childId)
      
      onNewMessage((msg) => {
        setMessages(prev => [...prev, msg])
        scrollToBottom()
      })

      return () => {
        offNewMessage()
        disconnectSocket()
      }
    }
  }, [token, childId, activeTab, scrollToBottom])

  const fetchChildData = async () => {
    try {
      const childrenRes = await api.get('/api/children')
      const children = childrenRes.data?.data?.children || []
      if (children.length > 0) {
        setChildId(children[0].id)
        if (children[0].doctor_id) {
          setDoctorId(children[0].doctor_id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch child data:', err)
    }
  }

  const fetchMessages = async () => {
    if (!childId) return
    try {
      const res = await api.get(`/api/messages?child_id=${childId}`)
      setMessages(res.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'doctor') {
      fetchMessages()
    }
  }, [activeTab, childId])

  const handleSend = async () => {
    if (!newMessage.trim() || !childId || !doctorId) return

    setSending(true)
    try {
      await api.post('/api/messages', {
        child_id: childId,
        receiver_id: doctorId,
        content: newMessage.trim()
      })
      setNewMessage('')
    } catch (err) {
      toast.error("Xabar yuborilmadi")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (activeTab === 'doctor') {
        handleSend()
      } else {
        handleAiSend()
      }
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Kecha ' + format(date, 'HH:mm')
    return format(date, 'dd.MM HH:mm')
  }

  const handleAiSend = async () => {
    if (!aiInput.trim() || !childId) return

    const userMessage = aiInput.trim()
    setAiInput('')
    setAiLoading(true)

    setAiHistory(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await api.post('/api/ai/chatbot', {
        question: userMessage,
        child_id: childId,
        history: aiHistory.slice(-5)
      })
      
      const aiResponse = res.data?.data?.response || 'Kechirasiz, javob bera olmadim.'
      setAiHistory(prev => [...prev, { role: 'assistant', content: aiResponse }])
    } catch (err) {
      console.error('AI chat error:', err)
      setAiHistory(prev => [...prev, { role: 'assistant', content: 'Kechirasiz, xatolik yuzaga keldi. Qaytadan urinib ko\'ring.' }])
    } finally {
      setAiLoading(false)
    }
  }

  const TypingIndicator = () => (
    <div className="flex gap-1 p-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'doctor'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💬 Doktor bilan
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'ai'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🤖 AI Yordamchi
        </button>
      </div>

      {/* Doctor Chat Content */}
      {activeTab === 'doctor' && (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                👨‍⚕️
              </div>
              <div>
                <div className="font-medium text-gray-800">{doctorName}</div>
                <div className="text-xs text-gray-500">Neyrolog</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Xabarlar yo'q. Birinchi xabarni yuboring!
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-xs ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}
                    >
                      <div>{message.content}</div>
                      <div className={`text-xs opacity-60 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Xabar yozing..."
                rows={1}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? '...' : '➤'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* AI Chat Content */}
      {activeTab === 'ai' && (
        <>
          {/* AI Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold">
                🤖
              </div>
              <div>
                <div className="font-medium text-gray-800">NeuroCare AI</div>
                <div className="text-xs text-gray-500">Savol bering...</div>
              </div>
            </div>
          </div>

          {/* AI Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 max-w-xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={aiEndRef} />
          </div>

          {/* AI Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Savol yozing..."
                rows={1}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleAiSend}
                disabled={aiLoading || !aiInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoading ? '...' : '➤'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}