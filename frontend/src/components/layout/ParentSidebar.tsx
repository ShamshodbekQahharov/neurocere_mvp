import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ParentSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const menuItems = [
    { path: '/parent', icon: '🏠', label: 'Dashboard' },
    { path: '/parent/report', icon: '📝', label: 'Hisobot' },
    { path: '/parent/progress', icon: '📈', label: 'Progress' },
    { path: '/parent/chat', icon: '💬', label: 'Chat' },
    { path: '/parent/learn', icon: '📚', label: "O'rganish" },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-green-600 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-green-700">
        <h1 className="text-white text-xl font-bold">NeuroCare</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-green-100 hover:bg-green-700 hover:text-white transition-colors ${
                isActive ? 'bg-green-700 text-white' : ''
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto p-4 border-t border-green-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-green-100 hover:bg-green-700 hover:text-white transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm font-medium">Chiqish</span>
        </button>
      </div>
    </aside>
  )
}
