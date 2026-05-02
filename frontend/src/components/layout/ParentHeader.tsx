import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { connectSocket, disconnectSocket, onNewMessage, offNewMessage } from '../../services/socket'

export default function ParentHeader() {
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const { token } = useAuthStore()

  const pageTitleMap: Record<string, string> = {
    '/parent': 'Dashboard',
    '/parent/report': 'Hisobot',
    '/parent/progress': 'Progress',
    '/parent/chat': 'Chat',
    '/parent/learn': "O'rganish",
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-sm text-gray-500">Ota-ona paneli</span>
        </div>
      </div>
    </header>
  )
}