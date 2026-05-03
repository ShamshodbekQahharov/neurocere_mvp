import { useEffect, useState } from 'react'
import { doctorApi } from '../../../services/api'
import Modal from '../../../components/ui/Modal'
import toast from 'react-hot-toast'

type Child = {
  id: string
  full_name: string
  birth_date: string
  diagnosis: string
  icd_code?: string
  notes?: string
};

const DIAGNOSIS_OPTIONS = [
  { value: 'ZRR', label: 'ZRR (Ziddiyatli Ritmik Reaktsiya)' },
  { value: 'ZPRR', label: 'ZPRR (Ziddiyatli Psixomotorik Reaktsiya)' },
  { value: 'ASD', label: 'ASD (Autizm Spektri Bo\'limlari)' },
  { value: 'SDVG', label: 'SDVG (Sindromlar, Deformatsiyalar, Vaqtinchalik G\'ayrat)' },
  { value: 'other', label: 'Boshqa' },
] as const;

const DIAGNOSIS_COLORS: Record<string, string> = {
  ZRR: 'bg-blue-100 text-blue-700',
  ZPRR: 'bg-purple-100 text-purple-700',
  ASD: 'bg-orange-100 text-orange-700',
  SDVG: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    document.title = 'NeuroCare — Bemorlar'
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await doctorApi.getChildrenCount()
      setChildren(res.data?.data?.children || [])
    } catch (err) {
      console.error('Failed to fetch children:', err)
      toast.error('Bolalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleAddChild = async (formData: any) => {
    try {
      await doctorApi.createChild(formData)
      toast.success('Bemor muvaffaqiyatli qo\'shildi!')
      setShowAddModal(false)
      fetchChildren()
   } catch (err: any) {
     toast.error(err.response?.data?.error || 'Qo\'shishda xatolik')
   }
 }

 const filteredChildren = children.filter(child =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (child.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years > 0) return `${years} yosh`
    return `${remainingMonths} oy`
  }

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

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👶</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery ? 'Qidiruv natijasi yo\'q' : 'Hali bemor qo\'shilmagan'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Boshqa so\'rov bilan sinab ko\'ring' : 'Birinchi bemorni qo\'shish uchun tugmani bosing'}
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
          {filteredChildren.map(child => (
            <div
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">👶</div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${DIAGNOSIS_COLORS[child.diagnosis as keyof typeof DIAGNOSIS_COLORS] || DIAGNOSIS_COLORS.other}`}>
                  {child.diagnosis || 'Boshqa'}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-800 text-base mb-1">
                {child.full_name}
              </h3>
              <p className="text-gray-500 text-sm mb-3">
                {formatAge(child.birth_date)} • {child.birth_date?.split('-')[0] || ''}
              </p>
              
              <div className="text-xs text-gray-400 mb-4">
                Dr. Alisher Karimov
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-3">
                  <span>
                    <span className="font-medium">12</span> hisobot
                  </span>
                  <span>
                    <span className="font-medium">8</span> sessiya
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedChild(child) }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors text-center"
                >
                  Batafsil
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors text-center"
                >
                  Hisobotlar
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
        <AddChildForm onSubmit={handleAddChild} onCancel={() => setShowAddModal(false)} />
      </Modal>

      {/* Child Detail Modal */}
      <Modal
        isOpen={!!selectedChild}
        onClose={() => setSelectedChild(null)}
        title={selectedChild?.full_name || 'Bema\'lumotlar'}
        size="lg"
      >
        {selectedChild && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tug'ilgan sana</p>
                <p className="font-medium">{selectedChild.birth_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Yosh</p>
                <p className="font-medium">{formatAge(selectedChild.birth_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tashxis</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${DIAGNOSIS_COLORS[selectedChild.diagnosis as keyof typeof DIAGNOSIS_COLORS] || DIAGNOSIS_COLORS.other}`}>
                  {selectedChild.diagnosis || 'Boshqa'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">ICD kod</p>
                <p className="font-medium">{selectedChild.icd_code || '-'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Izoh</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {selectedChild.notes || 'Izoh yo\'q'}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-400">
                ID: {selectedChild.id}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// Add Child Form Component
function AddChildForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    diagnosis: '',
    icd_code: '',
    notes: '',
    parent_email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism *</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Bola to'liq ismi"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana *</label>
        <input
          type="date"
          value={formData.birth_date}
          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tashxis *</label>
        <select
          value={formData.diagnosis}
          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tanlang...</option>
          {DIAGNOSIS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ICD kod (ixtiyoriy)</label>
        <input
          type="text"
          value={formData.icd_code}
          onChange={(e) => setFormData({ ...formData, icd_code: e.target.value })}
          placeholder="Masalan: F84.0"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Qo'shimcha ma'lumotlar..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ota-ona email (ixtiyoriy)</label>
        <input
          type="email"
          value={formData.parent_email}
          onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
          placeholder="ota-ona@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          Qo'shish
        </button>
      </div>
    </form>
  )
}
