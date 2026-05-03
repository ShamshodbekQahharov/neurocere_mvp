import { useEffect, useState } from 'react'
import { doctorApi } from '../../../services/api'
import Modal from '../../../components/ui/Modal'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'
import toast from 'react-hot-toast'

type Report = {
  id: string
  child_id: string
  childName?: string
  report_date: string
  mood_score: number
  speech_notes?: string
  behavior_notes?: string
  sleep_hours?: number
  appetite?: 'poor' | 'fair' | 'good' | 'excellent'
  tasks_completed: number
  ai_summary?: string
}

type Child = {
  id: string
  full_name: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    document.title = 'NeuroCare — Hisobotlar'
  }, [])

  useEffect(() => {
    if (children.length > 0 || selectedChild === 'all') {
      fetchReports()
    }
  }, [selectedChild, children])

  const fetchChildren = async () => {
    try {
      const res = await doctorApi.getChildrenCount()
      const childrenList = res.data?.data?.children || []
      setChildren(childrenList)
    } catch (err) {
      console.error('Failed to fetch children:', err)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      let res
      if (selectedChild === 'all') {
        res = await doctorApi.getRecentReports(20)
      } else {
        res = await doctorApi.getReportsByChild(selectedChild)
      }
      const reportsData = res.data?.data?.reports || []
      setReports(reportsData)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      toast.error('Hisobotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const getMoodEmoji = (score: number) => {
    if (score >= 7) return '🟢'
    if (score >= 4) return '🟡'
    return '🔴'
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return dateStr
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return 'Bugun'
      if (diffDays === 1) return 'Kecha'
      return formatDistanceToNow(date, { addSuffix: false })
    } catch {
      return dateStr
    }
  }

  const getAppetiteLabel = (appetite?: string) => {
    switch (appetite) {
      case 'poor': return 'Yomon'
      case 'fair': return 'O\'rtacha'
      case 'good': return 'Yaxshi'
      case 'excellent': return 'A\'lo'
      default: return '-'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hisobotlar</h1>
          <p className="text-gray-500 text-sm mt-1">
            Barcha bemorlar kunlik hisobotlari
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <select
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Barcha bemorlar</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
                <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/6 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/6 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/6 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/6 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Hisobot yo'q</h3>
          <p className="text-gray-500">
            {selectedChild === 'all' 
              ? 'Hali hech qanday hisobot yuborilmagan' 
              : 'Bu bemor uchun hisobot yo\'q'}
          </p>
        </div>
      ) : (
        /* Reports Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Bola</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sana</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kayfiyat</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Uyqu</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vazifalar</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">AI</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => {
                  const child = children.find(c => c.id === report.child_id)
                  return (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-800">
                          {child?.full_name || `Bola ${idx + 1}`}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {formatDate(report.report_date)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span>{getMoodEmoji(report.mood_score)}</span>
                          <span className="font-medium">{report.mood_score}/10</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {report.sleep_hours ? `${report.sleep_hours} soat` : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${report.tasks_completed >= 75 ? 'bg-green-500' : report.tasks_completed >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                              style={{ width: `${report.tasks_completed}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[40px] text-right">
                            {report.tasks_completed}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {report.ai_summary ? (
                          <span className="text-green-600 text-sm">✅</span>
                        ) : (
                          <span className="text-gray-400 text-sm">⏳</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ko'rish"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="Hisobot tafsilotlari"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Bola va sana */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {children.find(c => c.id === selectedReport.child_id)?.full_name || 'Bema\'lum'}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedReport.report_date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedReport.mood_score}/10</p>
                  <p className="text-xs text-gray-500">Kayfiyat</p>
                </div>
                <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedReport.sleep_hours || '-'}h</p>
                  <p className="text-xs text-gray-500">Uyqu</p>
                </div>
                <div className="text-center px-4 py-2 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedReport.tasks_completed}%</p>
                  <p className="text-xs text-gray-500">Vazifalar</p>
                </div>
              </div>
            </div>

            {/* Ishtaha */}
            {selectedReport.appetite && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Ishtaha</p>
                <p className="text-gray-800">{getAppetiteLabel(selectedReport.appetite)}</p>
              </div>
            )}

            {/* Nutq kuzatuvi */}
            {selectedReport.speech_notes && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700 mb-2">🎤 Nutq kuzatuvi</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.speech_notes}</p>
              </div>
            )}

            {/* Xulq-atvor */}
            {selectedReport.behavior_notes && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-700 mb-2">🧠 Xulq-atvor</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.behavior_notes}</p>
              </div>
            )}

            {/* Qo'shimcha */}
            {selectedReport.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">📝 Qo'shimcha</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.notes}</p>
              </div>
            )}

            {/* AI Tahlili */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <p className="text-sm font-semibold text-blue-800">Claude AI tahlili</p>
              </div>
              {selectedReport.ai_summary ? (
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.ai_summary}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  Tahlil hali qo'shilmagan. Bu hisobot uchun AI tahlili tez orada qo'shiladi.
                </div>
              )}
            </div>

            <div className="pt-4 border-t text-xs text-gray-400">
              ID: {selectedReport.id}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
