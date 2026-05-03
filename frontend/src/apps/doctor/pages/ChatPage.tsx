import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { doctorApi } from '../../../services/api'
import api from '../../../services/api'
import { connectSocket, disconnectSocket, joinChildRoom, onNewMessage, offNewMessage } from '../../../services/socket'
import { format, isToday, isYesterday } from 'date-fns'
import toast from 'react-hot-toast'

type Child = {
  id: string
  full_name: string
  parent?: {
    id: string
    full_name: string
  }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  child_id: string
  content: string
  is_read: boolean
  created_at: string
}

export default function ChatPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, token } = useAuthStore()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!token) return
    const socket = connectSocket(token)
    
    onNewMessage((msg) => {
      if (selectedChild && msg.child_id === selectedChild.id) {
        setMessages(prev => [...prev, msg])
        scrollToBottom()
      }
    })

    return () => {
      offNewMessage()
      disconnectSocket()
    }
  }, [token, selectedChild, scrollToBottom])

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    document.title = 'NeuroCare — Chat'
  }, [])

  const fetchChildren = async () => {
    setLoading(true)
    try {
      const res = await doctorApi.getChildrenCount()
      const childrenData = res.data?.data?.children || []
      const childrenWithParents = await Promise.all(
        childrenData.map(async (child: any) => {
          const childWithParent: Child = {
            id: child.id,
            full_name: child.full_name,
            parent: child.parent ? {
              id: child.parent.id || child.parent.user_id,
              full_name: child.parent.full_name
            } : undefined
          }
          return childWithParent
        })
      )
      setChildren(childrenWithParents)
    } catch (err) {
      console.error('Failed to fetch children:', err)
      toast.error('Bolalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (childId: string) => {
    try {
      const res = await api.get(`/api/messages?child_id=${childId}`)
      setMessages(res.data?.data || [])
      scrollToBottom()
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      toast.error('Xabarlarni yuklashda xatolik')
    }
  }

  const handleChildSelect = async (child: Child) => {
    setSelectedChild(child)
    setMessages([])
    await fetchMessages(child.id)
    joinChildRoom(child.id)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChild) return

    setSending(true)
    try {
      const receiverId = selectedChild.parent?.id
      if (!receiverId) {
        toast.error('Ota-ona ID topilmadi')
        return
      }
      await api.post('/api/messages', {
        child_id: selectedChild.id,
        receiver_id: receiverId,
        content: newMessage.trim()
      })
      setNewMessage('')
      scrollToBottom()
    } catch (err) {
      toast.error("Xabar yuborilmadi")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Kecha ' + format(date, 'HH:mm')
    return format(date, 'dd.MM HH:mm')
  }

  const filteredChildren = children.filter(child =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Left Panel - Children List */}
      <div className="w-[30%] border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Bemorlar</h2>
          <input
            type="text"
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Hech qanday bemor topilmadi
            </div>
          ) : (
            filteredChildren.map((child) => (
              <div
                key={child.id}
                onClick={() => handleChildSelect(child)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                  selectedChild?.id === child.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                  {getInitials(child.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{child.full_name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {child.parent?.full_name || 'Ota-ona'}
                  </div>
                  {child.lastMessage && (
                    <div className="text-xs text-gray-400 truncate mt-1">{child.lastMessage}</div>
                  )}
                </div>
                {child.unreadCount && child.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {child.unreadCount > 9 ? '9+' : child.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="w-[70%] flex flex-col">
        {selectedChild ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                  {getInitials(selectedChild.full_name)}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{selectedChild.parent?.full_name || 'Ota-ona'}</div>
                  <div className="text-xs text-gray-500">👤 {selectedChild.full_name}</div>
                </div>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">online</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Xabarlar yo'q. Birinchi xabarni yuboring!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-xs ${
                        isOwnMessage(message)
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}
                    >
                      <div>{message.content}</div>
                      <div className={`text-xs opacity-60 mt-1 ${isOwnMessage(message) ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Suhbatlashish uchun bemor tanlang
          </div>
        )}
      </div>
    </div>
  )
}