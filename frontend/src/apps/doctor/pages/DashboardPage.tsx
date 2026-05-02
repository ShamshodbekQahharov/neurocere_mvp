import { useEffect, useState } from 'react'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import { doctorApi } from '../../../services/api'

type Report = {
  id: string
  childName: string
  report_date: string
  condition: number
  tasks_completed: number
  ai_summary: string
}

export default function DashboardPage() {
  // Stats
  const [childrenCount, setChildrenCount] = useState<number>(0)
  const [recentReports, setRecentReports] = useState<number>(0)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Data
  const [reports, setReports] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])

  // Loading
  const [loading, setLoading] = useState(true)

  // Error
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setError(null)
    setLoading(true)
    try {
      // Fetch children, reports, unread messages concurrently
      const [
        childrenRes,
        reportsRes,
        unreadRes,
      ] = await Promise.allSettled([
        doctorApi.getChildrenCount(),
        doctorApi.getRecentReports(5),
        doctorApi.getUnreadMessages(),
      ])

      // Children count
      if (childrenRes.status === 'fulfilled') {
        const d = childrenRes.value.data.data
        setChildrenCount(d?.total || d?.children?.length || 0)
      } else {
        console.error('Children fetch error:', childrenRes.reason)
      }

      // Reports
      if (reportsRes.status === 'fulfilled') {
        const d = reportsRes.value.data.data
        setRecentReports(d?.reports?.length || 0)
        setReports(Array.isArray(d?.reports) ? d.reports.slice(0, 5) : [])
      } else {
        console.error('Reports fetch error:', reportsRes.reason)
      }

      // Unread messages
      if (unreadRes.status === 'fulfilled') {
        const d = unreadRes.value.data.data
        setUnreadCount(d?.total_unread || 0)
      } else {
        console.error('Unread messages fetch error:', unreadRes.reason)
      }

      // Fetch upcoming sessions separately (don't fail dashboard if this fails)
      try {
        const sessionsRes = await doctorApi.getUpcomingSessions()
        const d = sessionsRes.data.data
        setUpcomingSessions(d?.sessions || d || [])
      } catch (e) {
        console.error('Upcoming sessions fetch error:', e)
        setUpcomingSessions([])
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setError('Ma\'lumot yuklanmadi. Qayta urinish tilimaydi.')
    } finally {
      setLoading(false)
    }
  }

  const getConditionBadge = (condition: number) => {
    if (condition <= 3) return { variant: 'danger' as const, label: `${condition}/10 - Katta bezovta` }
    if (condition <= 6) return { variant: 'warning' as const, label: `${condition}/10 - O'rta` }
    return { variant: 'success' as const, label: `${condition}/10 - Yaxshi` }
  }

  const formatRelativeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'hozir';
      if (diffMins < 60) return `${diffMins} daqiqa oldin`;
      if (diffHours < 24) return `${diffHours} soat oldin`;
      return date.toLocaleDateString('uz-UZ');
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jami bemorlar"
          value={childrenCount}
          icon="👶"
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Yangi hisobotlar"
          value={recentReports}
          icon="📋"
          color="yellow"
          loading={loading}
        />
        <StatCard
          title="O'qilmagan xabarlar"
          value={unreadCount}
          icon="💬"
          color="red"
          loading={loading}
        />
      </div>

      {/* Error Row */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700 font-medium">{error}</span>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports - 60% */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">So'nggi hisobotlar</h2>
              <a
                href="/doctor/reports"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Barcha hisobotlar →
              </a>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <SkeletonLoader width="120px" height="16px" />
                    <SkeletonLoader width="80px" height="16px" />
                    <SkeletonLoader width="60px" height="16px" />
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Hisobot yo'q</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-gray-500 font-medium">Bola ismi</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium">Sana</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium">Kayfiyat</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium">Vazifalar</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium">AI tahlil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r: any) => {
                      const badge = r.condition <= 3 ? { variant: 'danger' as const, label: `${r.condition}/10 - Katta bezovta` }
                        : r.condition <= 6 ? { variant: 'warning' as const, label: `${r.condition}/10 - O'rta` }
                        : { variant: 'success' as const, label: `${r.condition}/10 - Yaxshi` };
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <span className="font-medium text-gray-800">{r.childName}</span>
                          </td>
                          <td className="py-3 px-2 text-gray-500">
                            {new Date(r.report_date).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-2">
                            <Badge label={badge.label} variant={badge.variant} />
                          </td>
                          <td className="py-3 px-2">
                            <div className="w-24">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{width: `${r.tasks_completed}%`}} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition-colors">
                              Ko'rish
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions - 40% */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Kelayotgan sessiyalar
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonLoader />
                    <SkeletonLoader width="60%" />
                  </div>
                ))}
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">📅</div>
                <p>Kelayotgan sessiyalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">
                      {s.child?.full_name || s.childName || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <span>Terapiya</span>
                      <span>•</span>
                      <span>
                        {new Date(s.scheduled_at).toLocaleDateString('uz-UZ')}{' '}
                        {new Date(s.scheduled_at).toLocaleTimeString('uz-UZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>⏱️ {s.duration_minutes || 60} daq</span>
                    </div>
                    <Badge
                      label={s.status === 'scheduled' ? 'Rejalashtrildi' : s.status}
                      variant={s.status === 'scheduled' ? 'info' : 'success'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}