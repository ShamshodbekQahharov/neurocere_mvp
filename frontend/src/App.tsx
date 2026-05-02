import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DoctorApp from './apps/doctor/DoctorApp'
import ParentApp from './apps/parent/ParentApp'
import ChildApp from './apps/child/ChildApp'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { 
    checkAuth, 
    isLoading, 
    isAuthenticated, 
    user 
  } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center 
                      justify-center bg-gray-50">
        <div className="animate-spin rounded-full 
                        h-12 w-12 border-b-2 
                        border-blue-900" />
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<LoginPage />} 
      />

      <Route
        path="/doctor/*"
        element={
          isAuthenticated && user?.role === 'doctor'
            ? <DoctorApp />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/parent/*"
        element={
          isAuthenticated && user?.role === 'parent'
            ? <ParentApp />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/child/*"
        element={
          isAuthenticated && user?.role === 'child'
            ? <ChildApp />
            : <Navigate to="/login" replace />
        }
      />

      <Route 
        path="/" 
        element={<Navigate to="/login" replace />} 
      />
      
      <Route 
        path="*" 
        element={<NotFoundPage />} 
      />
    </Routes>
  )
}

export default App
