import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../services/api'
import Card from '../../../components/ui/Card'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function ParentDashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    latestMood: 0,
    weeklyReports: 0,
    nextSession: null as any,
    avgMood: 0
  })
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    document.title = 'NeuroCare — Dashboard'
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      // Get children to find childId
      const childrenRes = await api.get('/api/children')
      const childrenData = childrenRes.data?.data?.children || []
      setChildren(childrenData)
      if (childrenData.length === 0) {
        setLoading(false)
        return
      }

      const childId = childrenData[0].id

      // Get recent reports for this child (parent uses child-specific endpoint)
      if (childrenData.length > 0) {
        const childId = childrenData[0].id
        const reportsRes = await api.get(`/api/reports/child/${childId}`, { params: { limit: 20 } })
        const reports = reportsRes.data?.data?.reports || []
        setRecentReports(reports)
      }

      // Count reports from last 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekly = reports.filter((r: any) => {
        return new Date(r.report_date) >= weekAgo
      }).length

      // Get upcoming sessions
      const sessionsRes = await api.get('/api/sessions/upcoming')
      const upcoming = (sessionsRes.data?.data?.sessions || []).find((s: any) => s.child_id === childId)

      // Get progress stats
      try {
        const progressRes = await api.get(`/api/children/${childId}/progress`)
        setStats(prev => ({
          ...prev,
          avgMood: progressRes.data?.data?.stats?.avg_mood || 0
        }))
      } catch (e) {
        console.log('Progress endpoint not available')
      }

      setStats(prev => ({
        latestMood: reports[0]?.mood_score || 0,
        weeklyReports: weekly,
        nextSession: upcoming || null,
        avgMood: stats.avgMood
      }))
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error)
      setError('Ma\'lumotni yuklashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
        <button onClick={fetchDashboardData} className="text-blue-600 hover:underline">
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
        <p className="text-sm mt-2">Doktor bilan bog'lanish</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Salom, {user?.full_name?.split(' ')[0] || 'Ota-ona'}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Oxirgi Kayfiyat" subtitle="Bemorning so'nggi kayfiyati">
          <div className="flex items-center gap-4">
            <div className="text-4xl">
              {stats.latestMood > 0 ? '🙂' : '😐'}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.latestMood > 0 ? stats.latestMood + '/5' : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Haftalik Hisobotlar" subtitle="So'nggi 7 kun">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📋</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyReports}</p>
              <p className="text-sm text-gray-500">ta hisobot</p>
            </div>
          </div>
        </Card>

        <Card title="Keyingi Sessiya" subtitle="Navbatdagi uchrashuv">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📅</div>
            <div>
              {stats.nextSession ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(stats.nextSession.session_date).toLocaleDateString('uz-UZ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.nextSession.status === 'scheduled' ? 'Navbatda' : stats.nextSession.status}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Sessiya yo'q</p>
              )}
            </div>
          </div>
        </Card>

        <Card title="O'rtacha Kayfiyat" subtitle="Umumiy progress">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgMood > 0 ? stats.avgMood.toFixed(1) + '/5' : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card title="So'nggi Hisobotlar" subtitle="Bemorning so'nggi hisobotlari">
        {recentReports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Hisobotlar mavjud emas</p>
        ) : (
          <div className="space-y-4">
            {recentReports.slice(0, 5).map((report: any) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {report.mood_score >= 4 ? '😊' : report.mood_score >= 3 ? '🙂' : report.mood_score >= 2 ? '😐' : '😢'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Kayfiyat: {report.mood_score}/5
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.report_date).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
                {report.notes && (
                  <p className="text-sm text-gray-600 max-w-xs truncate">
                    {report.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
