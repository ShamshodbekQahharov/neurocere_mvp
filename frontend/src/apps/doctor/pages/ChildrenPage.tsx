import { useEffect, useState } from 'react'
import axios from 'axios'
import { doctorApi } from '../../../services/api'
import Modal from '../../../components/ui/Modal'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type Child = {
  id: string
  full_name: string
  birth_date: string
  diagnosis: string
  icd_code?: string
  notes?: string
}

type CreatedCredentials = {
  child: { id: string; full_name: string; diagnosis: string }
  parent_credentials: { email: string; password: string }
  child_credentials: { email: string; password: string }
}

const DIAGNOSIS_OPTIONS = [
  { value: 'ZRR', label: 'ZRR' },
  { value: 'ZPRR', label: 'ZPRR' },
  { value: 'ASD', label: 'ASD' },
  { value: 'SDVG', label: 'SDVG' },
  { value: 'other', label: 'Boshqa' },
] as const

const DIAGNOSIS_COLORS: Record<string, string> = {
  ZRR: 'bg-blue-100 text-blue-700',
  ZPRR: 'bg-purple-100 text-purple-700',
  ASD: 'bg-orange-100 text-orange-700',
  SDVG: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '', birth_date: '', diagnosis: '', icd_code: '', notes: '',
  })

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailChild, setDetailChild] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const openDetail = (child: Child) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    api.get(`/api/children/${child.id}`)
      .then(res => { setDetailChild(res.data.data.child) })
      .catch(() => { toast.error("Ma'lumot yuklanmadi"); setShowDetailModal(false) })
      .finally(() => setDetailLoading(false))
  }

  useEffect(() => { fetchChildren() }, [])
  useEffect(() => { document.title = 'NeuroCare — Bemorlar' }, [])

  useEffect(() => {
    if (selectedChild && showEditModal) {
      setEditForm({
        full_name: selectedChild.full_name || '',
        birth_date: selectedChild.birth_date || '',
        diagnosis: selectedChild.diagnosis || '',
        icd_code: selectedChild.icd_code || '',
        notes: selectedChild.notes || '',
      })
    }
  }, [selectedChild, showEditModal])

  const fetchChildren = async () => {
    try {
      const res = await doctorApi.getChildrenCount()
      setChildren(res.data?.data?.children || [])
    } catch {
      toast.error('Bolalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedChild) return
    setEditLoading(true)
    try {
      await api.put(`/api/children/${selectedChild.id}`, editForm)
      toast.success("Bemor ma'lumotlari yangilandi!")
      setShowEditModal(false)
      setSelectedChild(null)
      const res = await api.get('/api/children')
      setChildren(res.data.data?.children || [])
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedChild) return
    setDeleteLoading(true)
    try {
      await api.delete(`/api/children/${selectedChild.id}`)
      toast.success(`${selectedChild.full_name} arxivlandi`)
      setShowDeleteModal(false)
      setSelectedChild(null)
      const res = await api.get('/api/children')
      setChildren(res.data.data?.children || [])
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddChild = async (formData: any) => {
    try {
      const res = await doctorApi.createChildWithAccounts(formData)
      setShowAddModal(false)
      setCredentials(res.data.data)
      fetchChildren()
    } catch (err: any) {
      throw err
    }
  }

  const formatAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth())
    const years = Math.floor(months / 12)
    const rem = months % 12
    if (years > 0) return `${years} yosh`
    return `${rem} oy`
  }

  const filteredChildren = children.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bemorlar</h1>
          <p className="text-gray-500 text-sm mt-1">
            Jami: <span className="font-semibold">{children.length}</span> bola
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-800 transition-colors"
        >
          + Yangi bemor qo'shish
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Ism yoki tashxis bo'yicha qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Children list */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1" />
                <div className="h-8 bg-gray-200 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👶</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery ? "Qidiruv natijasi yo'q" : "Hali bemor qo'shilmagan"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? "Boshqa so'rov bilan sinab ko'ring"
              : "Birinchi bemorni qo'shish uchun tugmani bosing"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-800"
            >
              Yangi bemor qo'shish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredChildren.map((child) => (
            <div
              key={child.id}
              onClick={() => openDetail(child)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">👶</div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    DIAGNOSIS_COLORS[child.diagnosis] || DIAGNOSIS_COLORS.other
                  }`}
                >
                  {child.diagnosis || 'Boshqa'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 text-base mb-1">
                {child.full_name}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {formatAge(child.birth_date)} • {child.birth_date?.split('-')[0] || ''}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openDetail(child) }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors text-center"
                >
                  Batafsil
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setShowEditModal(true) }}
                  className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm hover:bg-amber-100 transition-colors"
                  title="Tahrirlash"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setShowDeleteModal(true) }}
                  className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors"
                  title="Arxivlash"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Yangi bemor qo'shish"
        size="lg"
      >
        <AddChildForm
          onSubmit={handleAddChild}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Child Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailChild(null) }}
        title={detailChild?.full_name || 'Yuklanmoqda...'}
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : detailChild ? (
          <ChildDetailTabs child={detailChild} formatAge={formatAge} />
        ) : null}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedChild(null) }}
        title="Bemor ma'lumotlarini tahrirlash"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism *</label>
            <input
              type="text"
              value={editForm.full_name}
              onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana *</label>
            <input
              type="date"
              value={editForm.birth_date}
              onChange={e => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tashxis *</label>
            <select
              value={editForm.diagnosis}
              onChange={e => setEditForm(prev => ({ ...prev, diagnosis: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanlang</option>
              {DIAGNOSIS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ICD kodi</label>
            <input
              type="text"
              value={editForm.icd_code}
              onChange={e => setEditForm(prev => ({ ...prev, icd_code: e.target.value }))}
              placeholder="F80.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izohlar</label>
            <textarea
              value={editForm.notes}
              onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEditSubmit}
              disabled={editLoading || !editForm.full_name}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {editLoading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button
              onClick={() => { setShowEditModal(false); setSelectedChild(null) }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedChild(null) }}
        title="Bemorni arxivlash"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-2 font-medium">Rostdan ham arxivlamoqchimisiz?</p>
          <p className="text-gray-500 text-sm mb-6">
            <strong>{selectedChild?.full_name}</strong> profili arxivlanadi.
            Istalgan vaqt qayta tiklash mumkin.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {deleteLoading ? 'Arxivlanmoqda...' : 'Ha, arxivlash'}
            </button>
            <button
              onClick={() => { setShowDeleteModal(false); setSelectedChild(null) }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  )
}

// ─── Child Detail Tabs ───────────────────────────────────────────────────────

type DetailTabsProps = {
  child: any
  formatAge: (d: string) => string
}

function ChildDetailTabs({ child, formatAge }: DetailTabsProps) {
  const [tab, setTab] = useState<'info' | 'parent' | 'childLogin' | 'stats'>('info')

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} nusxa olindi!`))
  }

  const tabs = [
    { key: 'info', label: '📋 Asosiy' },
    { key: 'parent', label: '👨‍👩‍👧 Ota-ona' },
    { key: 'childLogin', label: '🎮 Bola login' },
    { key: 'stats', label: '📊 Statistika' },
  ] as const

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">👶</div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                DIAGNOSIS_COLORS[child.diagnosis] || DIAGNOSIS_COLORS.other
              }`}
            >
              {child.diagnosis || 'Boshqa'}
            </span>
            <span className="text-sm text-gray-500">{formatAge(child.birth_date)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Asosiy */}
      {tab === 'info' && (
        <div className="space-y-3">
          <Row label="To'liq ism" value={child.full_name} />
          <Row label="Tug'ilgan sana" value={child.birth_date} />
          <Row label="Yoshi" value={formatAge(child.birth_date)} />
          <Row label="Tashxis" value={child.diagnosis || 'Boshqa'} />
          <Row label="ICD kodi" value={child.icd_code || '—'} />
          {child.notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Izoh</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{child.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ota-ona */}
      {tab === 'parent' && (
        <div>
          {child.parent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
              <p className="font-semibold text-green-900 text-base">👤 {child.parent.full_name}</p>
              {child.parent.phone && (
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <span>📞</span> {child.parent.phone}
                </p>
              )}
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <span>📧</span> {child.parent.email}
              </p>
              <div className="border-t border-green-200 pt-3 mt-2">
                <p className="text-xs font-semibold text-green-800 mb-2">LOGIN MA'LUMOTLARI</p>
                <p className="text-sm font-mono text-gray-800">📧 {child.parent.login.email}</p>
                {child.parent.login.temp_password ? (
                  <p className="text-sm font-mono text-gray-800 mt-1">🔑 {child.parent.login.temp_password}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Parol mavjud emas</p>
                )}
              </div>
              <button
                onClick={() => copy(
                  `Ota-ona login:\nEmail: ${child.parent.login.email}\nParol: ${child.parent.login.temp_password || '—'}`,
                  'Ota-ona login'
                )}
                className="w-full mt-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition-colors"
              >
                📋 Nusxa olish
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">👤</p>
              <p className="text-sm">Login ma'lumotlari topilmadi.</p>
              <p className="text-xs mt-1">Bemor invite tizimi orqali qo'shilmagan.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Bola login */}
      {tab === 'childLogin' && (
        <div>
          {child.child_login ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
              <p className="font-semibold text-purple-900 text-base">🎮 {child.child_login.full_name}</p>
              <div className="border-t border-purple-200 pt-3">
                <p className="text-xs font-semibold text-purple-800 mb-2">BOLA TIZIMGA KIRISH</p>
                <p className="text-sm font-mono text-gray-800">📧 {child.child_login.email}</p>
                {child.child_login.temp_password ? (
                  <p className="text-sm font-mono text-gray-800 mt-1">🔑 {child.child_login.temp_password}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Parol mavjud emas</p>
                )}
              </div>
              <button
                onClick={() => copy(
                  `Bola login:\nEmail: ${child.child_login.email}\nParol: ${child.child_login.temp_password || '—'}`,
                  'Bola login'
                )}
                className="w-full mt-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm hover:bg-purple-800 transition-colors"
              >
                📋 Nusxa olish
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🎮</p>
              <p className="text-sm">Login ma'lumotlari topilmadi.</p>
              <p className="text-xs mt-1">Bemor invite tizimi orqali qo'shilmagan.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Statistika */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Hisobotlar" value={child.stats?.total_reports ?? 0} unit="ta" color="blue" />
          <StatCard label="O'rtacha kayfiyat" value={child.stats?.avg_mood ?? '—'} unit="/10" color="green" />
          <StatCard label="Sessiyalar" value={child.stats?.total_sessions ?? 0} unit="ta" color="indigo" />
          <StatCard label="Bajarilgan" value={child.stats?.completed_sessions ?? 0} unit="ta" color="teal" />
          <StatCard label="O'yinlar" value={child.stats?.total_games ?? 0} unit="ta" color="purple" />
          <StatCard label="O'rtacha ball" value={child.stats?.avg_game_score ?? '—'} unit="%" color="orange" />
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

const STAT_COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
}

function StatCard({ label, value, unit, color }: { label: string; value: any; unit: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${STAT_COLORS[color] || STAT_COLORS.blue}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}<span className="text-sm font-normal ml-1">{unit}</span></p>
    </div>
  )
}

// ─── Add Child Form ──────────────────────────────────────────────────────────

type FormData = {
  child_full_name: string
  birth_date: string
  child_display_name: string
  diagnosis: string
  icd_code: string
  notes: string
  parent_full_name: string
  parent_email: string
  parent_phone: string
  parent_password: string
  parent_password_confirm: string
  child_email: string
  child_password: string
  child_password_confirm: string
}

const EMPTY_FORM: FormData = {
  child_full_name: '',
  birth_date: '',
  child_display_name: '',
  diagnosis: '',
  icd_code: '',
  notes: '',
  parent_full_name: '',
  parent_email: '',
  parent_phone: '',
  parent_password: '',
  parent_password_confirm: '',
  child_email: '',
  child_password: '',
  child_password_confirm: '',
}

function AddChildForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [showParentPwd, setShowParentPwd] = useState(false)
  const [showChildPwd, setShowChildPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}

    if (!form.child_full_name.trim()) e.child_full_name = "To'liq ism kiritilmadi"
    if (!form.birth_date) e.birth_date = "Tug'ilgan sana kiritilmadi"
    if (!form.child_display_name.trim()) e.child_display_name = "Ko'rsatiladigan ism kiritilmadi"
    if (!form.diagnosis) e.diagnosis = 'Tashxis tanlanmadi'

    if (!form.parent_full_name.trim()) e.parent_full_name = "To'liq ism kiritilmadi"
    if (!form.parent_email.trim()) {
      e.parent_email = 'Email kiritilmadi'
    } else if (!isValidEmail(form.parent_email)) {
      e.parent_email = 'Email format noto\'g\'ri'
    }
    if (!form.parent_password) {
      e.parent_password = 'Parol kiritilmadi'
    } else if (form.parent_password.length < 6) {
      e.parent_password = 'Parol kamida 6 belgi'
    }
    if (form.parent_password !== form.parent_password_confirm) {
      e.parent_password_confirm = 'Parollar mos kelmadi'
    }

    if (!form.child_email.trim()) {
      e.child_email = 'Email kiritilmadi'
    } else if (!isValidEmail(form.child_email)) {
      e.child_email = "Email format noto'g'ri"
    } else if (form.child_email === form.parent_email) {
      e.child_email = "Ota-ona emaili bilan bir xil bo'lmasin"
    }
    if (!form.child_password) {
      e.child_password = 'Parol kiritilmadi'
    } else if (form.child_password.length < 6) {
      e.child_password = 'Parol kamida 6 belgi'
    }
    if (form.child_password !== form.child_password_confirm) {
      e.child_password_confirm = 'Parollar mos kelmadi'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit({
        child_full_name: form.child_full_name.trim(),
        birth_date: form.birth_date,
        child_display_name: form.child_display_name.trim(),
        diagnosis: form.diagnosis,
        icd_code: form.icd_code.trim() || undefined,
        notes: form.notes.trim() || undefined,
        parent_full_name: form.parent_full_name.trim(),
        parent_email: form.parent_email.trim(),
        parent_phone: form.parent_phone.trim() || undefined,
        parent_password: form.parent_password,
        child_email: form.child_email.trim(),
        child_password: form.child_password,
      })
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi")
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = (field: keyof FormData) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  const fieldErr = (field: keyof FormData) =>
    errors[field] ? (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    ) : null

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">

        {/* ── Section 1: Bola ma'lumotlari ── */}
        <div className="bg-blue-50 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            👶 Bola ma'lumotlari
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To'liq ism <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.child_full_name}
                onChange={(e) => set('child_full_name', e.target.value)}
                placeholder="Karimov Aziz Bahodirovich"
                className={inputCls('child_full_name')}
              />
              {fieldErr('child_full_name')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tug'ilgan sana <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => set('birth_date', e.target.value)}
                className={inputCls('birth_date')}
              />
              {fieldErr('birth_date')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ko'rsatiladigan ism <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.child_display_name}
                onChange={(e) => set('child_display_name', e.target.value)}
                placeholder="Aziz (o'yinda ko'rinadi)"
                className={inputCls('child_display_name')}
              />
              {fieldErr('child_display_name')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tashxis <span className="text-red-500">*</span>
              </label>
              <select
                value={form.diagnosis}
                onChange={(e) => set('diagnosis', e.target.value)}
                className={inputCls('diagnosis')}
              >
                <option value="">Tanlang...</option>
                {DIAGNOSIS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErr('diagnosis')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ICD kodi
              </label>
              <input
                type="text"
                value={form.icd_code}
                onChange={(e) => set('icd_code', e.target.value)}
                placeholder="F84.0"
                className={inputCls('icd_code')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Izohlar
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Qo'shimcha ma'lumotlar..."
              rows={2}
              className={`${inputCls('notes')} resize-none`}
            />
          </div>
        </div>

        {/* ── Section 2: Ota-ona login ── */}
        <div className="bg-green-50 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              👨‍👩‍👧 Ota-ona login ma'lumotlari
            </h3>
            <p className="text-green-700 text-xs mt-0.5">
              Ota-ona bu ma'lumotlar bilan tizimga kiradi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To'liq ism <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.parent_full_name}
                onChange={(e) => set('parent_full_name', e.target.value)}
                placeholder="Karimova Malika"
                className={inputCls('parent_full_name')}
              />
              {fieldErr('parent_full_name')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={form.parent_phone}
                onChange={(e) => set('parent_phone', e.target.value)}
                placeholder="+998901234567"
                className={inputCls('parent_phone')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.parent_email}
                onChange={(e) => set('parent_email', e.target.value)}
                placeholder="malika@email.com"
                className={inputCls('parent_email')}
              />
              {fieldErr('parent_email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parol <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showParentPwd ? 'text' : 'password'}
                  value={form.parent_password}
                  onChange={(e) => set('parent_password', e.target.value)}
                  placeholder="Kamida 6 belgi"
                  className={inputCls('parent_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowParentPwd(!showParentPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showParentPwd ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErr('parent_password')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parolni tasdiqlash <span className="text-red-500">*</span>
              </label>
              <input
                type={showParentPwd ? 'text' : 'password'}
                value={form.parent_password_confirm}
                onChange={(e) => set('parent_password_confirm', e.target.value)}
                placeholder="Parolni qayta kiriting"
                className={inputCls('parent_password_confirm')}
              />
              {fieldErr('parent_password_confirm')}
            </div>
          </div>
        </div>

        {/* ── Section 3: Bola login ── */}
        <div className="bg-purple-50 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-purple-900 flex items-center gap-2">
              🎮 Bola login ma'lumotlari
            </h3>
            <p className="text-purple-700 text-xs mt-0.5">
              Bola o'yin ilovasiga shu ma'lumotlar bilan kiradi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.child_email}
                onChange={(e) => set('child_email', e.target.value)}
                placeholder="aziz@neurocare.uz"
                className={inputCls('child_email')}
              />
              {fieldErr('child_email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parol <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showChildPwd ? 'text' : 'password'}
                  value={form.child_password}
                  onChange={(e) => set('child_password', e.target.value)}
                  placeholder="Oddiy parol (aziz2020)"
                  className={inputCls('child_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowChildPwd(!showChildPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showChildPwd ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErr('child_password')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parolni tasdiqlash <span className="text-red-500">*</span>
              </label>
              <input
                type={showChildPwd ? 'text' : 'password'}
                value={form.child_password_confirm}
                onChange={(e) => set('child_password_confirm', e.target.value)}
                placeholder="Parolni qayta kiriting"
                className={inputCls('child_password_confirm')}
              />
              {fieldErr('child_password_confirm')}
            </div>
          </div>
        </div>

        {/* ── Buttons ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Akkauntlar yaratilmoqda...
              </>
            ) : (
              "Yaratish"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Credentials Modal ───────────────────────────────────────────────────────

function CredentialsModal({
  credentials,
  onClose,
}: {
  credentials: CreatedCredentials
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const frontendUrl =
    (import.meta as any).env?.VITE_FRONTEND_URL ||
    'https://neurocere-mvp.vercel.app'

  const clipboardText = `NeuroCare Login Ma'lumotlari
━━━━━━━━━━━━━━━━━━━━━
Bola: ${credentials.child.full_name}

OTA-ONA:
Email: ${credentials.parent_credentials.email}
Parol: ${credentials.parent_credentials.password}

BOLA:
Email: ${credentials.child_credentials.email}
Parol: ${credentials.child_credentials.password}

Kirish: ${frontendUrl}/login
━━━━━━━━━━━━━━━━━━━━━`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clipboardText)
      setCopied(true)
      toast.success("Nusxa olindi!")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Nusxa olishda xatolik")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b text-center">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="text-xl font-bold text-gray-800">
            Muvaffaqiyatli yaratildi!
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {credentials.child.full_name} ({credentials.child.diagnosis})
          </p>
        </div>

        {/* Credentials */}
        <div className="p-6 space-y-4">
          {/* Parent */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-3">
              👨‍👩‍👧 OTA-ONA LOGIN
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">📧</span>
                <span className="text-sm font-mono text-gray-800 select-all">
                  {credentials.parent_credentials.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">🔑</span>
                <span className="text-sm font-mono text-gray-800 select-all">
                  {credentials.parent_credentials.password}
                </span>
              </div>
            </div>
          </div>

          {/* Child */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-purple-800 mb-3">
              🎮 BOLA LOGIN
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-purple-600">📧</span>
                <span className="text-sm font-mono text-gray-800 select-all">
                  {credentials.child_credentials.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600">🔑</span>
                <span className="text-sm font-mono text-gray-800 select-all">
                  {credentials.child_credentials.password}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <span className="text-amber-500 text-base mt-0.5">⚠️</span>
            <p className="text-amber-800 text-sm">
              Bu ma'lumotlarni ota-onaga bering! Keyinchalik ko'rish uchun
              "Invite" bo'limiga o'ting.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? '✓ Nusxa olindi' : '📋 Nusxa olish'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}
