import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { connectSocket, disconnectSocket, onNewMessage, offNewMessage } from '../../services/socket'

export default function ParentHeader() {
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const { token, user } = useAuthStore()

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

  useEffect(() => {
    document.title = `NeuroCare — ${getPageTitle()}`
  }, [location.pathname])

  // Get first name from full_name
  const getFirstName = () => {
    if (!user?.full_name) return 'Ota-ona'
    return user.full_name.split(' ')[0]
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="relative">
              <span className="text-xl">💬</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'O'}
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-gray-800">
                {getFirstName()}
              </div>
              <div className="text-xs text-gray-500">Ota-ona</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}