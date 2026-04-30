import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const menuItems = [
    { path: '/doctor', icon: '🏠', label: 'Dashboard' },
    { path: '/doctor/children', icon: '👶', label: 'Bemorlar' },
    { path: '/doctor/reports', icon: '📋', label: 'Hisobotlar' },
    { path: '/doctor/sessions', icon: '📅', label: 'Sessiyalar' },
    { path: '/doctor/chat', icon: '💬', label: 'Chat' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-blue-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-white text-xl font-bold">NeuroCare</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-blue-200 hover:bg-blue-800 hover:text-white transition-colors ${
                isActive ? 'bg-blue-700 text-white' : ''
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-blue-200 hover:bg-blue-800 hover:text-white transition-colors rounded-lg"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm font-medium">Chiqish</span>
        </button>
        {user && (
          <div className="mt-4 px-4 py-3 text-blue-200 text-sm opacity-75">
            <div className="font-medium">{user.firstName} {user.lastName}</div>
            <div className="opacity-75">{user.email}</div>
          </div>
        )}
      </div>
    </aside>
  )
}
