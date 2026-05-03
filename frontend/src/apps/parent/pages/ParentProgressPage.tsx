import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../services/api'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

type ProgressData = {
  child_id: string
  period_days: number
  from_date: string
  to_date: string
  stats: {
    reports_count: number
    avg_mood: number
    avg_sleep_hours: number
    most_common_appetite: string
    appetite_distribution: Record<string, number>
    tasks_trend: 'up' | 'down' | 'stable'
  }
}

export default function ParentProgressPage() {
  const { user } = useAuthStore()
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      fetchProgress()
    }
  }, [selectedChildId])

  useEffect(() => {
    document.title = 'NeuroCare — Rivojlanish grafigi'
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await api.get('/api/children')
      const childrenData = res.data?.data?.children || []
      setChildren(childrenData)
      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch children:', err)
      setError('Bolalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    if (!selectedChildId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/children/${selectedChildId}/progress`)
      setProgress(res.data?.data || null)
    } catch (err: any) {
      console.error('Failed to fetch progress:', err)
      if (err.response?.status === 404) {
        setProgress(null)
      } else {
        setError('Progress ma\'lumotlarini yuklashda xatolik')
      }
    } finally {
      setLoading(false)
    }
  }

  const getAppetiteLabel = (value: string) => {
    switch (value) {
      case 'poor': return 'Yomon'
      case 'fair': return 'O\'rtacha'
      case 'good': return 'Yaxshi'
      case 'excellent': return 'Ajoyib'
      default: return value
    }
  }

  const getAppetiteEmoji = (value: string) => {
    switch (value) {
      case 'poor': return '😟'
      case 'fair': return '😐'
      case 'good': return '🙂'
      case 'excellent': return '😋'
      default: return ''
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '📈'
    if (trend === 'down') return '📉'
    return '➖'
  }

  if (loading && !progress) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchProgress} className="text-blue-600 hover:underline">
          Qayta urinish
        </button>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-4xl mb-3">👶</p>
        <p>Bolalar ro'yxati bo'sh</p>
      </div>
    )
  }

  const selectedChild = children.find(c => c.id === selectedChildId)
  const stats = progress?.stats

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rivojlanish grafigi</h1>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="max-w-xs">
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Child Name */}
      {selectedChild && (
        <p className="text-gray-600">
          <span className="font-medium">{selectedChild.full_name}</span> — oxirgi 30 kun
        </p>
      )}

      {!progress ? (
        <div className="text-center py-12 text-gray-500">
          <p>Progress ma'lumotlari yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Reports Count */}
          <Card title="Hisobotlar" subtitle="Oxirgi 30 kun" className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {stats?.reports_count || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">ta hisobot</p>
          </Card>

          {/* Average Mood */}
          <Card title="O'rtacha kayfiyat" subtitle="1-10 ballda" className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {stats?.avg_mood?.toFixed(1) || '0.0'}
            </div>
            <p className="text-sm text-gray-500 mt-2">/ 10</p>
          </Card>

          {/* Average Sleep */}
          <Card title="O'rtacha uyqu" subtitle="Soatda" className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {stats?.avg_sleep_hours?.toFixed(1) || '0.0'}
            </div>
            <p className="text-sm text-gray-500 mt-2">soat</p>
          </Card>

          {/* Tasks Trend */}
          <Card title="Vazifalar trendi" subtitle="Progress" className="text-center">
            <div className="text-4xl">
              {getTrendIcon(stats?.tasks_trend || 'stable')}
            </div>
            <p className="text-sm text-gray-500 mt-2 capitalize">
              {stats?.tasks_trend === 'up' ? 'Oshiyapti' :
               stats?.tasks_trend === 'down' ? 'Kamayiyapti' : 'O'zgarmagan'}
            </p>
          </Card>
        </div>
      )}

      {/* Appetite Distribution */}
      {progress && stats?.appetite_distribution && (
        <Card title="Ishtaha taqsimoti" subtitle="Oxirgi 30 kun">
          <div className="space-y-3">
            {Object.entries(stats.appetite_distribution).map(([level, count]) => (
              <div key={level} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600 flex items-center gap-2">
                  <span>{getAppetiteEmoji(level)}</span>
                  <span>{getAppetiteLabel(level)}</span>
                </div>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${stats.reports_count > 0 ? (count / stats.reports_count) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-8 text-sm font-medium text-right">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Most Common Appetite */}
      {progress && stats?.most_common_appetite && (
        <Card title="Eng ko'p ishtaha" subtitle="So'nggi 30 kun">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {getAppetiteEmoji(stats.most_common_appetite)}
            </span>
            <span className="text-xl font-semibold text-gray-800">
              {getAppetiteLabel(stats.most_common_appetite)}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
