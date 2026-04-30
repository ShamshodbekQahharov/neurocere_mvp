import { useEffect, useState } from 'react'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import ProgressBar from '../../../components/ui/ProgressBar'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import { doctorApi } from '../../../services/api'
import { formatDistanceToNow } from 'date-fns'

type Session = {
  id: string
  childName: string
  type: string
  dateTime: string
  duration: number
  status: 'scheduled' | 'completed'
}

type Report = {
  id: string
  childName: string
  date: string
  condition: number
  tasksCompleted: number
  aiAnalysis: string
}

export default function DashboardPage() {
  // Stats
  const [childrenCount, setChildrenCount] = useState(0)
  const [todaySessions, setTodaySessions] = useState(0)
  const [recentReports, setRecentReports] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Data
  const [reports, setReports] = useState<Report[]>([])
  const [sessions, setSessions] = useState<Session[]>([])

  // Loading
  const [statsLoading, setStatsLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Error
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setError(null)
    try {
      await Promise.all([
        fetchChildrenCount(),
        fetchTodaySessions(),
        fetchRecentReports(),
        fetchUnreadMessages(),
        fetchUpcomingSessions(),
      ])
    } catch (err) {
      setError('Ma\'lumot yuklanmadi. Qayta urinish tilimaydi.')
    }
  }

  const fetchChildrenCount = async () => {
    setStatsLoading(true)
    try {
      const res = await doctorApi.getChildrenCount()
      setChildrenCount(res.data?.data?.total || res.data?.data?.children?.length || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchTodaySessions = async () => {
    setStatsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await doctorApi.getTodaySessions(today, today)
      setTodaySessions(res.data?.data?.sessions?.length || res.data?.data?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRecentReports = async () => {
    setReportsLoading(true)
    try {
      const res = await doctorApi.getRecentReports(5)
      setRecentReports(res.data?.data?.reports?.length || 0)
      setReports(Array.isArray(res.data?.data?.reports) ? res.data.data.reports.slice(0, 5) : [])
    } catch (err) {
      console.error(err)
    } finally {
      setReportsLoading(false)
    }
  }

  const fetchUnreadMessages = async () => {
    setStatsLoading(true)
    try {
      const res = await doctorApi.getUnreadMessages()
      setUnreadMessages(res.data?.data?.count || res.data?.data || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchUpcomingSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await doctorApi.getUpcomingSessions()
      setSessions(Array.isArray(res.data?.data?.sessions) ? res.data.data.sessions.slice(0, 5) : [])
    } catch (err) {
      console.error(err)
    } finally {
      setSessionsLoading(false)
    }
  }

  const getConditionBadge = (condition: number) => {
    if (condition <= 3) return { variant: 'danger' as const, label: `${condition}/10 - Katta bezovta` }
    if (condition <= 6) return { variant: 'warning' as const, label: `${condition}/10 - O'rta` }
    return { variant: 'success' as const, label: `${condition}/10 - Yaxshi` }
  }

  const formatRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
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
          loading={statsLoading}
        />
        <StatCard
          title="Bugungi sessiyalar"
          value={todaySessions}
          icon="📅"
          color="green"
          loading={statsLoading}
        />
        <StatCard
          title="Yangi hisobotlar"
          value={recentReports}
          icon="📋"
          color="yellow"
          loading={statsLoading}
        />
        <StatCard
          title="O'qilmagan xabarlar"
          value={unreadMessages}
          icon="💬"
          color="red"
          loading={statsLoading}
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

            {reportsLoading ? (
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
                    {reports.map((r) => {
                      const badge = getConditionBadge(r.condition)
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <span className="font-medium text-gray-800">{r.childName}</span>
                          </td>
                          <td className="py-3 px-2 text-gray-500">
                            {formatRelativeDate(r.date)}
                          </td>
                          <td className="py-3 px-2">
                            <Badge label={badge.label} variant={badge.variant} />
                          </td>
                          <td className="py-3 px-2">
                            <div className="w-24">
                              <ProgressBar value={r.tasksCompleted} color="bg-blue-600" />
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

            {sessionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonLoader />
                    <SkeletonLoader width="60%" />
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">📅</div>
                <p>Kelayotgan sessiyalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">{s.childName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <span>{s.type}</span>
                      <span>•</span>
                      <span>{formatRelativeDate(s.dateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>⏱️ {s.duration} daq</span>
                    </div>
                    <Badge
                      label={s.status === 'scheduled' ? 'Rejalashtrildi' : 'Tugadi'}
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