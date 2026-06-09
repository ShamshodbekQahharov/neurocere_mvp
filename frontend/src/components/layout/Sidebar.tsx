import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const menuItems = [
  { path: '/doctor',          icon: '🏠', label: 'Dashboard' },
  { path: '/doctor/children', icon: '👶', label: 'Bemorlar' },
  { path: '/doctor/reports',  icon: '📋', label: 'Hisobotlar' },
  { path: '/doctor/sessions', icon: '📅', label: 'Sessiyalar' },
  { path: '/doctor/chat',     icon: '💬', label: 'Chat' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'D'

  const SidebarContent = () => (
    <aside className="w-64 bg-navy flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-xl floating">
            🧠
          </div>
          <div>
            <span className="font-serif text-white text-lg leading-none">NeuroCare</span>
            <p className="text-white/40 text-xs mt-0.5">Medical Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-3">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-teal text-white shadow-teal'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className={`text-lg transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-red-500/20 transition-all duration-200 group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
          <span className="text-sm font-medium">Chiqish</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white shadow-navy"
        aria-label="Menyuni ochish"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 h-full z-50 transition-transform duration-300">
            <div className="flex items-start h-full">
              <SidebarContent />
              <button
                onClick={() => setMobileOpen(false)}
                className="mt-4 ml-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white"
                aria-label="Menyuni yopish"
              >
                ✕
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
