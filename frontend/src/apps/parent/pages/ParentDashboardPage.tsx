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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get children to find childId
      const childrenRes = await api.get('/api/children')
      const children = childrenRes.data?.data?.children || []
      if (children.length === 0) return

      const childId = children[0].id

      // Get recent reports (last 5)
      const reportsRes = await api.get('/api/reports', { params: { limit: 20 } })
      setRecentReports(reportsRes.data?.data?.reports || [])

      // Count reports from last 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekly = (reportsRes.data?.data?.reports || []).filter((r: any) => {
        return new Date(r.report_date) >= weekAgo
      }).length

      // Get upcoming sessions
      const sessionsRes = await api.get('/api/sessions/upcoming')
      const upcoming = (sessionsRes.data?.data?.sessions || []).find((s: any) => s.child_id === childId)

      // Get progress
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
        latestMood: reportsRes.data?.data?.reports?.[0]?.mood_score || 0,
        weeklyReports: weekly,
        nextSession: upcoming || null,
        avgMood: stats.avgMood
      }))
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Salom, {user?.name}</h1>

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
