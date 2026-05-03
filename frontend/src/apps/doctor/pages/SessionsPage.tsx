import { useState, useEffect } from 'react'
import { doctorApi } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import type { Session, Child } from '../../types'

type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<SessionStatus>('scheduled')
  const [sessions, setSessions] = useState<Session[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newSession, setNewSession] = useState({
    child_id: '',
    scheduled_at: '',
    duration_minutes: 45,
    session_type: 'speech',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
    fetchChildren()
  }, [activeTab])

  useEffect(() => {
    document.title = 'NeuroCare — Sessiyalar'
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await doctorApi.getSessions(activeTab)
      setSessions(res.data?.data?.sessions || [])
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err)
      setError('Sessiyalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const fetchChildren = async () => {
    try {
      const res = await doctorApi.getChildren()
      setChildren(res.data?.data?.children || [])
    } catch (err) {
      console.error('Failed to fetch children:', err)
    }
  }

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await doctorApi.createSession({
        ...newSession,
        scheduled_at: new Date(newSession.scheduled_at).toISOString()
      })
      setShowModal(false)
      setNewSession({
        child_id: '',
        scheduled_at: '',
        duration_minutes: 45,
        session_type: 'speech',
        notes: ''
      })
      fetchSessions()
    } catch (err: any) {
      console.error('Failed to create session:', err)
      alert('Sessiya yaratishda xatolik: ' + (err.response?.data?.error || 'Nomalum xatolik'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteSession = async (sessionId: string, notes: string) => {
    setActionLoading(sessionId)
    try {
      await doctorApi.completeSession(sessionId, { status: 'completed', session_notes: notes })
      fetchSessions()
    } catch (err) {
      console.error('Failed to complete session:', err)
      alert('Sessiyani yakunlashda xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Sessiyani bekor qilishni tasdiqlaysizmi?')) return
    setActionLoading(sessionId)
    try {
      await doctorApi.updateSession(sessionId, { status: 'cancelled' })
      fetchSessions()
    } catch (err) {
      console.error('Failed to cancel session:', err)
      alert('Bekor qilishda xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { key: SessionStatus; label: string }[] = [
    { key: 'scheduled', label: 'Kelayotgan' },
    { key: 'completed', label: 'Bajarilgan' },
    { key: 'cancelled', label: 'Bekor qilingan' },
  ]

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child?.full_name || 'Nomalum'
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('uz-UZ'),
      time: date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sessiyalar</h1>
        <Button onClick={() => setShowModal(true)} variant="primary">
          + Yangi sessiya
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchSessions} className="text-blue-600 hover:underline">
            Qayta urinish
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📅</p>
          <p>Sessiyalar topilmadi</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const { date, time } = formatDateTime(session.scheduled_at)
            return (
              <Card key={session.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👶</span>
                      <span className="font-semibold text-gray-900">
                        {getChildName(session.child_id)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        📅 {date}, {time}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱ {session.duration_minutes} daqiqa
                      </span>
                      <span className="flex items-center gap-1">
                        🏥 {session.session_type === 'speech' ? 'Logoped' : 'Psixolog'}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            const notes = prompt('Sessiya haqida izoh (ixtiyoriy):', '')
                            if (notes !== null) handleCompleteSession(session.id, notes)
                          }}
                          disabled={actionLoading === session.id}
                        >
                          {actionLoading === session.id ? '⏳' : '✓'} Yakunlash
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelSession(session.id)}
                          disabled={actionLoading === session.id}
                        >
                          ✕ Bekor qilish
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Yangi sessiya yaratish"
      >
        <form onSubmit={handleSubmitSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bola
            </label>
            <select
              value={newSession.child_id}
              onChange={(e) => setNewSession({ ...newSession, child_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Bola tanlang...</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.full_name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Sana va vaqt"
            type="datetime-local"
            value={newSession.scheduled_at}
            onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })}
            required
          />

          <Input
            label="Davomiyligi (daqiqa)"
            type="number"
            min="15"
            max="120"
            value={newSession.duration_minutes}
            onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sessiya turi
            </label>
            <select
              value={newSession.session_type}
              onChange={(e) => setNewSession({ ...newSession, session_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="speech">Logoped</option>
              <option value="psychology">Psixolog</option>
              <option value="occupational">Reabilitatsiya</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <textarea
              value={newSession.notes}
              onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Bekor qilish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
