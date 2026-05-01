import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { User, AuthState } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

       login: async (email: string, password: string) => {
         try {
           set({ isLoading: true })
           
           const response = await api.post('/api/auth/login', { email, password });
           console.log('API response:', response.data)
           
           if (response.data.success) {
             const { token, user } = response.data.data;
           
             localStorage.setItem('token', token);
             localStorage.setItem('user', JSON.stringify(user));
             
             set({ user, token, isAuthenticated: true, isLoading: false });
             
             return { success: true, user };
           }
           
           set({ isLoading: false })
           return { 
             success: false, 
             message: response.data.message || 'Xatolik' 
           }
           
         } catch (error: any) {
           console.error('Login error:', error.response?.data)
           set({ isLoading: false })
           return {
             success: false,
             message: error.response?.data?.message 
                      || 'Server bilan ulanishda xatolik'
           }
         }
       },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ isLoading: false });
            return;
          }
          const response = await api.get('/api/auth/me');
          const user: User = response.data.data.user;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'neurocare-auth',
    }
  )
);
