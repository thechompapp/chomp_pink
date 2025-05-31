/**
 * Optimized Authentication Store Module
 * 
 * Streamlined authentication with consolidated state management
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import authService from '@/services/auth/authService';

// Constants
const STORAGE_KEY = 'auth-authentication-storage';
const SESSION_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Initial state factory
 */
const createInitialState = () => ({
  token: null,
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  lastAuthCheck: null
});

/**
 * Optimized Authentication Store
 */
const useAuthenticationStore = create(
  persist(
    (set, get) => ({
      // Initial state
      ...createInitialState(),

      /**
       * Set authentication token
       */
      setToken: (token) => {
        set({ token });
        // Sync with other storage systems
        if (token) {
          localStorage.setItem('auth-token', token);
        } else {
          localStorage.removeItem('auth-token');
        }
      },

      /**
       * Set error state
       */
      setError: (error) => set({ error }),

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Set user and authentication state
       */
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),

      /**
       * Optimized authentication status check
       */
      checkAuthStatus: async (forceCheck = false) => {
        // Check if user has explicitly logged out - if so, don't check auth status
        const hasExplicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out') === 'true';
        const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
        const isLogoutInProgress = localStorage.getItem('logout_in_progress') === 'true';
        
        if (hasExplicitlyLoggedOut || isE2ETesting || isLogoutInProgress) {
          logInfo('[AuthStore] User explicitly logged out or testing mode - not checking auth status');
          
          // Force logout state
          set({
            ...createInitialState(),
            lastAuthCheck: Date.now()
          });
          
          // Clear any stale tokens
          localStorage.removeItem('auth-token');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          
          return false;
        }
        
        const state = get();
        const now = Date.now();
        
        // Use cache if available and not forced
        if (!forceCheck && 
            state.isAuthenticated && 
            state.user && 
            state.lastAuthCheck &&
            (now - state.lastAuthCheck) < SESSION_CACHE_DURATION) {
          
          // But still validate the token exists and is valid
          const isValid = authService.isTokenValid();
          if (isValid) {
            logInfo('[AuthStore] Using cached auth status');
            return true;
          } else {
            // Token is invalid, force a fresh check
            logWarn('[AuthStore] Cached token invalid, forcing fresh check');
          }
        }

        // Remove development mode bypass to ensure proper authentication
        // This was causing security issues in E2E tests
        
        set({ isLoading: true, error: null });

        try {
          // Use consolidated auth service for proper token validation
          const isValid = authService.isTokenValid();
          
          if (isValid) {
            const user = authService.getCurrentUser();
            if (user) {
              // Verify token is actually valid by checking localStorage
              const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
              if (token && token !== 'null' && token !== 'undefined') {
                set({
                  isAuthenticated: true,
                  user,
                  token,
                  lastAuthCheck: now,
                  isLoading: false,
                  error: null
                });
                return true;
              }
            }
          }

          // Token invalid or missing, clear state
          logInfo('[AuthStore] No valid authentication found, clearing state');
          set({
            ...createInitialState(),
            lastAuthCheck: now
          });
          
          // Clear any stale tokens
          localStorage.removeItem('auth-token');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          
          return false;
        } catch (error) {
          logError('[AuthStore] Auth check failed:', error);
          set({
            isLoading: false,
            error: error.message,
            lastAuthCheck: now
          });
          return false;
        }
      },

      /**
       * Optimized login function
       */
      login: async (formData) => {
        set({ isLoading: true, error: null });
        
        // Clear explicit logout flag
        localStorage.removeItem('user_explicitly_logged_out');
        
        try {
          logInfo('[AuthStore] Attempting login');
          
          const result = await authService.login(formData);
          
          if (result.success) {
            const newState = {
              isAuthenticated: true,
              user: result.data.user,
              token: result.data.token,
              isLoading: false,
              error: null,
              lastAuthCheck: Date.now()
            };
            
            set(newState);
            
            // Notify other systems
            window.dispatchEvent(new CustomEvent('auth:login_complete', {
              detail: { isAuthenticated: true, user: result.data.user }
            }));
            
            logInfo('[AuthStore] Login successful');
            return true;
          } else {
            throw new Error(result.message || 'Login failed');
          }
        } catch (error) {
          logError('[AuthStore] Login error:', error);
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: error.message || 'Login failed'
          });
          return false;
        }
      },

      /**
       * Optimized logout function
       */
      logout: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Step 1: Get current token before clearing
          const currentToken = get().token || localStorage.getItem('auth-token') || localStorage.getItem('token');
          
          // Step 2: Set explicit logout flag FIRST to prevent auto-login attempts
          localStorage.setItem('user_explicitly_logged_out', 'true');
          
          // Step 3: Call auth service logout (this clears tokens and calls API)
          await authService.logout();
          
          // Step 4: Clear ALL possible token storage locations
          const tokenKeys = [
            'auth-token', 'token', 'refreshToken', 'auth_access_token', 
            'auth_refresh_token', 'auth_token_expiry', 'userData', 'current_user',
            'admin_api_key', 'admin_access_enabled', 'superuser_override'
          ];
          
          tokenKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          // Step 5: Clear Zustand persisted storage
          localStorage.removeItem('auth-authentication-storage');
          sessionStorage.removeItem('auth-authentication-storage');
          
          // Step 6: Reset store state to initial state
          set(createInitialState());
          
          // Step 7: Clear HTTP client auth headers
          if (window.axios && window.axios.defaults) {
            delete window.axios.defaults.headers.common['Authorization'];
          }
          
          // Step 8: Clear any cookies
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
          
          // Step 9: Notify all systems of logout
          window.dispatchEvent(new CustomEvent('auth:logout_complete', {
            detail: { cleared: true, timestamp: Date.now() }
          }));
          
          // Step 10: Force UI refresh
          window.dispatchEvent(new CustomEvent('forceUiRefresh', {
            detail: { timestamp: Date.now() }
          }));
          
          logInfo('[AuthStore] Complete logout successful - all tokens and state cleared');
          
        } catch (error) {
          logError('[AuthStore] Logout error:', error);
          
          // CRITICAL: Even on error, ensure complete state clearing
          // Clear all possible storage locations
          const allStorageKeys = [
            'auth-token', 'token', 'refreshToken', 'auth_access_token', 
            'auth_refresh_token', 'auth_token_expiry', 'userData', 'current_user',
            'admin_api_key', 'admin_access_enabled', 'superuser_override',
            'auth-authentication-storage'
          ];
          
          allStorageKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          // Force state reset
          set(createInitialState());
          localStorage.setItem('user_explicitly_logged_out', 'true');
          
          // Clear HTTP headers
          if (window.axios && window.axios.defaults) {
            delete window.axios.defaults.headers.common['Authorization'];
          }
          
          // Notify systems even on error
          window.dispatchEvent(new CustomEvent('auth:logout_complete', {
            detail: { cleared: true, error: true, timestamp: Date.now() }
          }));
          
          logInfo('[AuthStore] Forced logout completed despite error');
        }
      },

      /**
       * Get current user
       */
      getCurrentUser: () => get().user,

      /**
       * Check if user is admin/superuser
       */
      isAdmin: () => {
        const user = get().user;
        return user && (user.role === 'admin' || user.role === 'superuser' || user.account_type === 'superuser');
      },

      /**
       * Reset store to initial state
       */
      reset: () => set(createInitialState())
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastAuthCheck: state.lastAuthCheck
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          logError('[AuthStore] Error rehydrating auth state:', error);
          return;
        }
        
        // Check if user has explicitly logged out - if so, don't restore auth state
        const hasExplicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out') === 'true';
        const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
        const isLogoutInProgress = localStorage.getItem('logout_in_progress') === 'true';
        
        if (hasExplicitlyLoggedOut || isE2ETesting || isLogoutInProgress) {
          logInfo('[AuthStore] User explicitly logged out or testing mode - not restoring auth state');
          
          // Clear the persisted auth state and reset to initial state
          localStorage.removeItem(STORAGE_KEY);
          
          // Return initial state instead of persisted state
          return createInitialState();
        }
        
        if (state) {
          logInfo('[AuthStore] Rehydrating auth state from storage');
        }
      }
    }
  )
);

export default useAuthenticationStore;
