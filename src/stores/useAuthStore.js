// src/stores/useAuthStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { queryClient } from '@/queryClient';
import { authService } from '@/services/authService';
import apiClient from '@/services/apiClient';

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    console.error("[AuthStore isTokenValid] Error decoding token:", error);
    return false;
  }
};

const authStore = (set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  isSuperuser: () => get().user?.account_type === 'superuser',

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      if (!data || !data.token || !data.user) throw new Error("Login failed: Invalid server response.");
      set({ token: data.token, user: { ...data.user, account_type: data.user.account_type || 'user' }, isAuthenticated: true, isLoading: false, error: null });
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      queryClient.invalidateQueries({ queryKey: ['listDetails'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      return true;
    } catch (error) {
      console.error('[AuthStore Login] Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please check your credentials.';
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(username, email, password);
      if (!data || !data.token || !data.user) throw new Error("Registration failed: Invalid server response.");
      set({ token: data.token, user: { ...data.user, account_type: 'user' }, isAuthenticated: true, isLoading: false, error: null });
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      return true;
    } catch (error) {
      console.error('[AuthStore Register] Error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Registration failed. Please try again.';
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage });
      return false;
    }
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
    queryClient.removeQueries({ queryKey: ['userLists'] });
    queryClient.removeQueries({ queryKey: ['listDetails'] });
    queryClient.removeQueries({ queryKey: ['pendingSubmissions'] });
    queryClient.removeQueries({ queryKey: ['adminData'] });
    console.log('[AuthStore] User logged out, state reset, relevant caches cleared.');
  },

  clearError: () => set({ error: null }),

  checkAuthStatus: () => {
    const token = get().token;
    if (token && isTokenValid(token)) {
      try {
        if (!get().user) {
          const decoded = jwtDecode(token);
          if (decoded.user) {
            set({ user: { ...decoded.user, account_type: decoded.user.account_type || 'user' }, isAuthenticated: true, isLoading: false });
          } else {
            console.warn("[AuthStore checkAuthStatus] Token valid but user data missing in store/token payload.");
            get().logout();
          }
        } else {
          set({ isAuthenticated: true, isLoading: false });
        }
      } catch (error) {
        console.error("[AuthStore checkAuthStatus] Error processing valid token:", error);
        get().logout();
      }
    } else {
      if (get().isAuthenticated) get().logout();
      else set({ isLoading: false });
    }
  },

  updateAccountType: async (userId, accountType) => {
    if (!['user', 'contributor', 'superuser'].includes(accountType)) {
      set({ error: 'Invalid account type' });
      return false;
    }
    if (!get().isSuperuser()) {
      set({ error: 'Only superusers can update account types' });
      return false;
    }
    try {
      const response = await apiClient(`/api/auth/update-account-type/${userId}`, 'Update Account Type', {
        method: 'PUT',
        body: JSON.stringify({ account_type: accountType }),
      });
      if (get().user?.id === userId) {
        set({ user: { ...get().user, account_type: accountType } });
      }
      return true;
    } catch (error) {
      console.error('[AuthStore UpdateAccountType] Error:', error);
      set({ error: error.message || 'Failed to update account type' });
      return false;
    }
  },
});

const persistOptions = {
  name: 'auth-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ token: state.token, user: state.user }),
};

const useAuthStore = create(
  devtools(
    persist(authStore, persistOptions),
    { name: 'AuthStore' }
  )
);

useAuthStore.getState().checkAuthStatus();

export default useAuthStore;