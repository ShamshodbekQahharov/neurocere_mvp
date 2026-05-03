import axios from 'axios'

console.log('API URL:', import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Doctor Dashboard API functions
const doctorApi = {
  // Dashboard stats
  getChildrenCount: () => api.get('/api/children'),

  getTodaySessions: (from: string, to: string) =>
    api.get(`/api/sessions?from=${from}&to=${to}`),

  getRecentReports: (limit = 5) =>
    api.get(`/api/reports?limit=${limit}`),

  getUnreadMessages: () =>
    api.get('/api/messages/unread-count'),

  getUpcomingSessions: () =>
    api.get('/api/sessions/upcoming'),

  getNotifications: () =>
    api.get('/api/notifications'),

  // Sessions
  getSessions: (status?: string) =>
    api.get(`/api/sessions?status=${status || ''}`),

  createSession: (data: any) =>
    api.post('/api/sessions', data),

  updateSession: (id: string, data: any) =>
    api.put(`/api/sessions/${id}`, data),

  completeSession: (id: string, data: { status: string; session_notes?: string }) =>
    api.put(`/api/sessions/${id}`, data),

  // Children
  createChild: (data: any) =>
    api.post('/api/children', data),

  getChildren: () =>
    api.get('/api/children'),

  getReportsByChild: (childId: string) =>
    api.get(`/api/reports/child/${childId}`),

  // Games
  getGames: () =>
    api.get('/api/games'),

  getGameSessions: () =>
    api.get('/api/games/sessions'),

  // Notifications
  markNotificationRead: (id: string) =>
    api.put(`/api/notifications/${id}/read`),
}

export default api
export { doctorApi }
