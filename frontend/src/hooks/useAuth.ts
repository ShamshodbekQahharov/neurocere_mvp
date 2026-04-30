import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useAuthStore();

  const isDoctor = user?.role === 'doctor';
  const isParent = user?.role === 'parent';
  const isChild = user?.role === 'child';

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    isDoctor,
    isParent,
    isChild,
  };
};
