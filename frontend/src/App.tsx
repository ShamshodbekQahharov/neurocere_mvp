import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DoctorApp from './apps/doctor/DoctorApp'
import { ParentApp } from './apps/parent/ParentApp'
import { ChildApp } from './apps/child/ChildApp'
import NotFoundPage from './pages/NotFoundPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function ProtectedRoute({ 
  children, 
  allowedRole 
}: { 
  children: JSX.Element
  allowedRole: string 
}) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role !== allowedRole) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorApp />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute allowedRole="parent">
            <ParentApp />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/child/*"
        element={
          <ProtectedRoute allowedRole="child">
            <ChildApp />
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
