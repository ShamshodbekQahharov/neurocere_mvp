import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { doctorApi } from '../../services/api'
import Badge from '../ui/Badge'

export default function Header() {
  const location = useLocation()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await doctorApi.getNotifications()
      const data = res.data?.data || []
      setNotifications(Array.isArray(data) ? data : [])
      const unread = Array.isArray(data) ? data.filter((n: any) => !n.is_read).length : 0
      setUnreadCount(unread)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
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
          <button
            onClick={fetchNotifications}
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

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {typeof window !== 'undefined' &&
                ((JSON.parse(localStorage.getItem('user') || '{}').firstName?.charAt(0) || 'D') +
                  (JSON.parse(localStorage.getItem('user') || '{}').lastName?.charAt(0) || 'R'))}
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-gray-800">
                {typeof window !== 'undefined' &&
                  JSON.parse(localStorage.getItem('user') || '{}').firstName || 'Doktor'}
              </div>
              <div className="text-xs text-gray-500">Doktor</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}