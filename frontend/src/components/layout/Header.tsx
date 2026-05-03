import { useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { doctorApi } from '../../services/api'
import { connectSocket, disconnectSocket, onNewMessage, offNewMessage } from '../../services/socket'
import Badge from '../ui/Badge'

export default function Header() {
  const location = useLocation()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { token, user } = useAuthStore()

  const pageTitleMap: Record<string, string> = {
    '/doctor': 'Dashboard',
    '/doctor/children': 'Bemorlar',
    '/doctor/reports': 'Hisobotlar',
    '/doctor/sessions': 'Sessiyalar',
    '/doctor/chat': 'Chat',
  }

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitleMap)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return title
      }
    }
    return 'Dashboard'
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (!token) return
    const socket = connectSocket(token)
    
    onNewMessage(() => {
      setUnreadCount(prev => prev + 1)
    })

    return () => {
      offNewMessage()
      disconnectSocket()
    }
  }, [token])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await doctorApi.getNotifications()
      const data = res.data?.data?.notifications || []
      setNotifications(Array.isArray(data) ? data : [])
      const unread = Array.isArray(data) ? data.filter((n: any) => !n.is_read).length : 0
      setUnreadCount(unread)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.is_read)
          .map((n) => doctorApi.markNotificationRead(n.id))
      )
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  // Get user initials safely
  const getUserInitials = () => {
    if (!user?.full_name) return 'D'
    const parts = user.full_name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] || '') + (parts[1][0] || '')
    }
    return user.full_name[0] || 'D'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between w-full">
        {/* Left: Page Title */}
        <div className="text-xl font-semibold text-gray-800">
          {getPageTitle()}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Bildirishnomalar"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <Badge
                  label={unreadCount.toString()}
                  variant="danger"
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold"
                />
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Bildirishnomalar</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Barchasini o'qildi
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Yuklanmoqda...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Bildirishnomalar yo'q</div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">
                            {notification.type === 'report' ? '📋' :
                             notification.type === 'session' ? '📅' :
                             '🔔'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {notification.body}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleDateString('uz-UZ')}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-gray-800">
                {user?.full_name || 'Doktor'}
              </div>
              <div className="text-xs text-gray-500">Doktor</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}