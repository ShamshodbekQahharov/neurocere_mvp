import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result?.success) {
        const role = result.user?.role
        if (role === 'doctor')      navigate('/doctor')
        else if (role === 'parent') navigate('/parent')
        else if (role === 'child')  navigate('/child')
        else                        navigate('/login')
      } else {
        setError(result?.message || 'Login yoki parol xato')
      }
    } catch {
      setError('Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT — Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden animated-bg flex-col items-center justify-center p-12">

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Glow blob */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-teal-light/20 blur-3xl pointer-events-none" />

        {/* Content */}
        <div
          className={`relative z-10 text-center transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-3xl backdrop-blur-sm border border-white/25 mb-8 floating shadow-float">
            <span className="text-4xl">🧠</span>
          </div>

          <h1 className="font-serif text-4xl text-white mb-4 leading-tight">
            Bolalar rivojlanishini
            <br />
            <em className="text-teal-light">kuzating</em>
          </h1>

          <p className="text-white/70 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            AI yordamida davolash jarayonini yangi bosqichga olib chiqing
          </p>

          {/* Feature badges */}
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {[
              { icon: '🩺', text: 'Doktor paneli' },
              { icon: '👨‍👩‍👧', text: 'Ota-ona portal' },
              { icon: '🎮', text: "Bola o'yinlari" },
            ].map((f, i) => (
              <div
                key={i}
                className="glass rounded-2xl px-5 py-3 flex items-center gap-3 text-white"
                style={{ animation: `fadeUp 0.6s ease ${0.2 + i * 0.1}s both` }}
              >
                <span className="text-xl">{f.icon}</span>
                <span className="font-medium text-sm">{f.text}</span>
                <span className="ml-auto text-teal-light text-xs">✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-cream">
        <div
          className={`w-full max-w-md transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-navy rounded-2xl mb-4">
              <span className="text-3xl">🧠</span>
            </div>
            <h1 className="font-serif text-2xl text-navy">NeuroCare</h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8 shadow-navy">
            <h2 className="font-serif text-2xl text-navy mb-2">Xush kelibsiz</h2>
            <p className="text-muted text-sm mb-8">Hisobingizga kiring</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2 fade-up">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Email manzil
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3.5 bg-cream-dark rounded-xl border-2 border-transparent text-navy placeholder-muted text-sm font-medium transition-all duration-200 focus:outline-none focus:border-teal focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 pr-12 bg-cream-dark rounded-xl border-2 border-transparent text-navy placeholder-muted text-sm font-medium transition-all duration-200 focus:outline-none focus:border-teal focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors"
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-navy text-white py-3.5 rounded-xl font-medium text-sm relative overflow-hidden transition-all duration-200 hover:bg-navy-light hover:-translate-y-0.5 hover:shadow-navy active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-teal/0 to-teal/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                      </svg>
                      Kirilmoqda...
                    </span>
                  ) : 'Kirish →'}
                </span>
              </button>
            </form>
          </div>

          <p className="text-center text-muted text-xs mt-6">NeuroCare Platform &copy; 2025</p>
        </div>
      </div>
    </div>
  )
}
