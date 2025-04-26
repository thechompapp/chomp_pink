/* src/stores/useAuthStore.js */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '@/services/apiClient';

const useAuthStore = create()(
  devtools(
    (set) => ({
      token: localStorage.getItem('auth_token') || null,
      isAuthenticated: false,
      user: null,
      isLoading: true,
      error: null,

      checkAuthStatus: async () => {
        console.log('[AuthStore checkAuthStatus] Current state:', {
          token: useAuthStore.getState().token || 'Not Present',
          isAuthenticated: useAuthStore.getState().isAuthenticated,
          user: useAuthStore.getState().user,
          isLoading: useAuthStore.getState().isLoading,
        });

        const token = useAuthStore.getState().token;
        if (!token) {
          console.log('[AuthStore checkAuthStatus] Token invalid or missing.');
          set({ isAuthenticated: false, user: null, isLoading: false, error: null });
          return false;
        }

        try {
          const response = await apiClient('/api/auth/status', 'Check Auth Status', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            token,
          });

          console.log('[AuthStore checkAuthStatus] Response:', response);

          // Adjust to match the response structure: response.data.data.user
          if (response.success && response.data?.data?.user) {
            set({ isAuthenticated: true, user: response.data.data.user, isLoading: false, error: null });
            return true;
          } else {
            throw new Error('Invalid auth status response: user data missing');
          }
        } catch (error) {
          console.error('[AuthStore checkAuthStatus] Error:', error.message);
          set({ token: null, isAuthenticated: false, user: null, isLoading: false, error: error.message });
          localStorage.removeItem('auth_token');
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient('/api/auth/login', 'Login', {
            method: 'POST',
            body: { email, password }
          });

          console.log('[AuthStore login] Full Response:', response);
          console.log('[AuthStore login] Response.data:', response.data);

          if (response.success && response.data && response.data.data && response.data.data.token) {
            const token = response.data.data.token;
            console.log('[AuthStore login] Setting token:', token);
            localStorage.setItem('auth_token', token);
            set({ 
              token: token, 
              isAuthenticated: true, 
              user: response.data.data.user || null, 
              isLoading: false,
              error: null
            });
            console.log('[AuthStore login] State after set:', {
              token: token,
              isAuthenticated: true,
              user: response.data.data.user,
              isLoading: false
            });
            return response.data.data;
          } else {
            throw new Error('Login failed: No token received in response');
          }
        } catch (error) {
          console.error('[AuthStore login] Error:', error);
          set({ isLoading: false, error: error.message || 'Login failed' });
          throw error;
        }
      },

      logout: () => {
        console.log('[AuthStore logout] Clearing state and localStorage');
        set({ token: null, isAuthenticated: false, user: null, isLoading: false, error: null });
        localStorage.removeItem('auth_token');
      }
    }),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;