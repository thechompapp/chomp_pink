// src/stores/useAuthStore.js
/**
 * Authentication store using Zustand
 * Updated to support both default and named exports for API standardization
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient, { setAuthStoreRef } from '@/services/apiClient';
import { logInfo, logWarn, logError, logDebug } from '@/utils/logger.js';

const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: true,
      error: null,
      isSuperuser: false,

      checkAuthStatus: async () => {
        logger.debug('[AuthStore checkAuthStatus] Initializing, current state:', get());
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/auth/status');
          logger.debug('[AuthStore checkAuthStatus] API Response:', response);
          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: 'cookie_set',
              isSuperuser: userData.account_type === 'superuser',
              error: null,
            });
            logger.info('[AuthStore checkAuthStatus] User authenticated via API status:', userData);
            return true;
          } else {
            logger.warn('[AuthStore checkAuthStatus] Auth status check returned non-success or no data:', response.data);
            set({ isAuthenticated: false, user: null, isLoading: false, token: null, isSuperuser: false, error: response.data?.message || 'Failed to verify authentication status.' });
            return false;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Authentication check failed';
          const errorStatus = error.response?.status;
          logger.warn(`[AuthStore checkAuthStatus] Error during auth status check: ${errorMessage}`, errorStatus ? `Status: ${errorStatus}` : '');
          set({ isAuthenticated: false, user: null, isLoading: false, token: null, isSuperuser: false, error: null });
          return false;
        }
      },

      login: async (formData) => { // formData is now directly from react-hook-form { email, password }
        set({ isLoading: true, error: null });
        try {
          logger.debug('[AuthStore login] Attempting login with formData:', formData);
          
          if (!formData || typeof formData.email !== 'string' || typeof formData.password !== 'string') {
            const errMessage = 'Invalid formData format: Email and password must be strings.';
            logger.error(errMessage, formData);
            set({ isLoading: false, error: errMessage, isAuthenticated: false, user: null, token: null });
            return false;
          }

          const response = await apiClient.post('/auth/login', formData); // Pass formData directly
          
          logger.debug('[AuthStore login] Full API Response:', response);
          logger.debug('[AuthStore login] Response.data:', response.data);

          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: 'cookie_set',
              isSuperuser: userData.account_type === 'superuser',
              error: null,
            });
            logger.info('[AuthStore login] Login successful, user set:', userData);
            return true;
          } else {
            const errorMessage = response.data?.message || 'Login failed: Unexpected response from server.';
            logger.error('[AuthStore login] Login failed (unexpected response structure):', errorMessage, response.data);
            set({ isAuthenticated: false, user: null, isLoading: false, token: null, isSuperuser: false, error: errorMessage });
            return false;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed due to an unknown error.';
          logger.error('[AuthStore login] Login API error caught:', errorMessage, error.response?.data);
          set({ isAuthenticated: false, user: null, isLoading: false, token: null, isSuperuser: false, error: errorMessage });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          // Import authService directly to avoid circular dependencies
          const { authService } = await import('@/services/authService.js');
          // Use the authService instead of direct API call
          await authService.logout();
          
          // Always clear the state regardless of API response
          set({ token: null, isAuthenticated: false, user: null, isLoading: false, isSuperuser: false, error: null });
          logger.info('[AuthStore logout] Logout successful.');
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Logout failed.';
          logger.error('[AuthStore logout] Logout error:', errorMessage, error.response?.data);
          
          // Even if the logout API fails, we should still clear client-side state
          set({ token: null, isAuthenticated: false, user: null, isLoading: false, isSuperuser: false, error: errorMessage });
        }
        
        // Clear any stored credentials from localStorage
        try {
          localStorage.removeItem('auth-storage');
        } catch (e) {
          logger.warn('[AuthStore logout] Could not clear localStorage:', e);
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', userData);
          if (response.data && response.data.success && response.data.data) {
            const user = response.data.data;
            set({ isAuthenticated: true, user: user, isLoading: false, token: 'cookie_set', isSuperuser: user.account_type === 'superuser', error: null });
            logger.info('[AuthStore register] Registration successful, user set:', user);
            return { success: true, data: user };
          } else {
            const errorMessage = response.data?.message || 'Registration failed: Unexpected response structure.';
            logger.error('[AuthStore register] Registration failed (unexpected response):', errorMessage, response.data);
            set({ isLoading: false, error: errorMessage });
            return { success: false, message: errorMessage};
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed.';
          logger.error('[AuthStore register] Registration API error caught:', errorMessage, error.response?.data);
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      getCurrentUser: () => get().user,
      getIsAuthenticated: () => get().isAuthenticated,
      getIsLoading: () => get().isLoading,
      getIsSuperuser: () => get().isSuperuser,

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isSuperuser: state.isSuperuser,
      }),
    }
  )
);

// Set the store reference in apiClient to avoid circular dependency
setAuthStoreRef(useAuthStore);

// Support both default and named exports for backward compatibility
export default useAuthStore;
export { useAuthStore };
