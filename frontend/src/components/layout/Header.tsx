import { useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { doctorApi } from '../../services/api'
import { connectSocket, disconnectSocket, onNewMessage, offNewMessage } from '../../services/socket'
import Badge from '../ui/Badge'

const pageTitleMap: Record<string, string> = {
  '/doctor':          'Dashboard',
  '/doctor/children': 'Bemorlar',
  '/doctor/reports':  'Hisobotlar',
  '/doctor/sessions': 'Sessiyalar',
  '/doctor/chat':     'Chat',
}

export default function Header() {
  const location      = useLocation()
  const { token, user } = useAuthStore()

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [showDropdown, setShowDropdown]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitleMap)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) return title
    }
    return 'Dashboard'
  }

  const pageIcons: Record<string, string> = {
    'Dashboard':   '🏠',
    'Bemorlar':    '👶',
    'Hisobotlar':  '📋',
    'Sessiyalar':  '📅',
    'Chat':        '💬',
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'D'

  useEffect(() => { fetchNotifications() }, [])

  useEffect(() => {
    if (!token) return
    const socket = connectSocket(token)
    onNewMessage(() => setUnreadCount(prev => prev + 1))
    return () => { offNewMessage(); disconnectSocket() }
  }, [token])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res  = await doctorApi.getNotifications()
      const data = res.data?.data?.notifications || []
      const list = Array.isArray(data) ? data : []
      setNotifications(list)
      setUnreadCount(list.filter((n: any) => !n.is_read).length)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.is_read).map(n => doctorApi.markNotificationRead(n.id))
      )
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  const title = getPageTitle()

  return (
    <header className="bg-white border-b border-gray-100 h-16 flex items-center px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between w-full">

        {/* Left: breadcrumb */}
        <div className="flex items-center gap-3 ml-12 lg:ml-0">
          <span className="text-xl">{pageIcons[title] || '📄'}</span>
          <h1 className="font-serif text-xl text-navy">{title}</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-cream-dark hover:bg-cream transition-colors"
              aria-label="Bildirishnomalar"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <Badge
                  label={unreadCount > 9 ? '9+' : unreadCount.toString()}
                  variant="danger"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold"
                />
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-navy border border-gray-100 overflow-hidden z-50 fade-up">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-medium text-navy text-sm">Bildirishnomalar</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-teal hover:underline">
                      Barchasini o'qildi
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-muted text-sm">Yuklanmoqda...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-3xl mb-2">🔔</p>
                      <p className="text-muted text-sm">Bildirishnomalar yo'q</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-cream-dark transition-colors ${
                          !n.is_read ? 'bg-teal-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">
                            {n.type === 'report' ? '📋' : n.type === 'session' ? '📅' : '🔔'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{n.title}</p>
                            <p className="text-xs text-muted truncate">{n.body}</p>
                            <p className="text-xs text-muted/60 mt-1">
                              {new Date(n.created_at).toLocaleDateString('uz-UZ')}
                            </p>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-teal mt-1.5 flex-shrink-0" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-navy leading-none">{user?.full_name || 'Doktor'}</p>
              <p className="text-xs text-muted mt-0.5">Shifokor</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
