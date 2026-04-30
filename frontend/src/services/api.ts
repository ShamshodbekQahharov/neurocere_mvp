import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
};

export default api;
export { doctorApi };
