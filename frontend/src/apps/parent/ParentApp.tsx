import { Routes, Route } from 'react-router-dom'
import ParentSidebar from '../../components/layout/ParentSidebar'
import ParentHeader from '../../components/layout/ParentHeader'
import ParentDashboardPage from './pages/ParentDashboardPage'
import ParentReportFormPage from './pages/ParentReportFormPage'
import ParentProgressPage from './pages/ParentProgressPage'
import ParentChatPage from './pages/ParentChatPage'

function ParentApp() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ParentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ParentHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<ParentDashboardPage />} />
            <Route path="report" element={<ParentReportFormPage />} />
            <Route path="progress" element={<ParentProgressPage />} />
            <Route path="chat" element={<ParentChatPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default ParentApp
