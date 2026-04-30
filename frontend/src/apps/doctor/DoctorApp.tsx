import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'
import DashboardPage from './pages/DashboardPage'
import ChildrenPage from './pages/ChildrenPage'
import ReportsPage from './pages/ReportsPage'
import SessionsPage from './pages/SessionsPage'
import ChatPage from './pages/ChatPage'

export default function DoctorApp() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-6">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="children" element={<ChildrenPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}