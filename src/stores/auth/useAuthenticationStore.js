/**
 * Optimized Authentication Store Module
 * 
 * FIXED: Now properly delegates to AuthenticationCoordinator during initialization
 * This eliminates the race condition that was overriding authenticated state.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import { checkAuthStatus, login, logout } from './modules/authOperations';

// Constants
const STORAGE_KEY = 'auth-authentication-storage';
const SESSION_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get initial state from AuthenticationCoordinator if available
 */
const getInitialStateFromCoordinator = () => {
  try {
    // Check if coordinator is available globally
    if (typeof window !== 'undefined' && window.__authCoordinator) {
      const coordinatorState = window.__authCoordinator.getCurrentState();
      if (coordinatorState.isAuthenticated && coordinatorState.token && coordinatorState.user) {
        logInfo('[AuthStore] Using authenticated state from coordinator during initialization');
        return {
          token: coordinatorState.token,
          isAuthenticated: true,
          user: coordinatorState.user,
          isLoading: false,
          error: null,
          lastAuthCheck: Date.now()
        };
      }
    }
    
    // Check localStorage for existing authentication
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('current_user');
    const logoutFlag = localStorage.getItem('user_explicitly_logged_out');
    
    // If explicitly logged out, return unauthenticated state
    if (logoutFlag === 'true') {
      return {
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        lastAuthCheck: null
      };
    }
    
    // If we have valid token and user data, initialize as authenticated
    if (storedToken && storedToken !== 'null' && storedUser && storedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          logInfo('[AuthStore] Found valid auth data in localStorage, initializing as authenticated');
          return {
            token: storedToken,
            isAuthenticated: true,
            user: parsedUser,
            isLoading: false,
            error: null,
            lastAuthCheck: Date.now()
          };
        }
      } catch (error) {
        logWarn('[AuthStore] Error parsing stored user data:', error);
      }
    }
    
    // Default to unauthenticated
    logInfo('[AuthStore] No valid auth data found, initializing as unauthenticated');
    return {
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastAuthCheck: null
    };
  } catch (error) {
    logError('[AuthStore] Error getting initial state:', error);
    return {
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastAuthCheck: null
    };
  }
};

/**
 * Authentication Store - properly delegates to AuthenticationCoordinator
 */
const useAuthenticationStore = create(
  persist(
    (set, get) => ({
      // Initialize with coordinator state if available
      ...getInitialStateFromCoordinator(),

      /**
       * Set authentication token - syncs with coordinator
       */
      setToken: async (token) => {
        try {
          // Import coordinator lazily to avoid circular deps
          const { default: authCoordinator } = await import('@/utils/AuthenticationCoordinator');
          await authCoordinator.setToken(token);
          
          set({ token });
          logInfo('[AuthStore] Token set and synced with coordinator');
        } catch (error) {
          logError('[AuthStore] Error setting token:', error);
          set({ token, error: error.message });
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
       * Check authentication status - delegates to coordinator
       */
      checkAuthStatus: async (forceCheck = false) => {
        logInfo('[AuthStore] Checking auth status via coordinator');
        
        try {
          const result = await checkAuthStatus(set, get, forceCheck);
          logInfo('[AuthStore] Auth status check result:', result);
          return result;
        } catch (error) {
          logError('[AuthStore] Auth status check failed:', error);
          set({ 
            isAuthenticated: false,
            user: null,
            token: null,
            error: error.message,
            isLoading: false 
          });
          return false;
        }
      },

      /**
       * Login - delegates to coordinator
       */
      login: async (credentials) => {
        logInfo('[AuthStore] Login attempt via coordinator');
        
        try {
          const result = await login(set, get, credentials);
          logInfo('[AuthStore] Login result:', result);
          return result;
        } catch (error) {
          logError('[AuthStore] Login failed:', error);
          set({ 
            isAuthenticated: false,
            user: null,
            token: null,
            error: error.message,
            isLoading: false 
          });
          return false;
        }
      },

      /**
       * Logout - delegates to coordinator
       */
      logout: async () => {
        logInfo('[AuthStore] Logout via coordinator');
        
        try {
          const result = await logout(set, get);
          logInfo('[AuthStore] Logout result:', result);
          
          // Ensure state is cleared regardless of API result
          set({
            token: null,
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
            lastAuthCheck: null
          });
          
          return result;
        } catch (error) {
          logError('[AuthStore] Logout failed:', error);
          
          // Clear state anyway
          set({
            token: null,
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
            lastAuthCheck: null
          });
          return true;
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
      reset: () => set({
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        lastAuthCheck: null
      }),

      /**
       * Sync state from coordinator (called by coordinator)
       */
      syncFromCoordinator: (coordinatorState) => {
        logInfo('[AuthStore] Syncing state from coordinator:', coordinatorState);
        set({
          token: coordinatorState.token,
          isAuthenticated: coordinatorState.isAuthenticated,
          user: coordinatorState.user,
          isLoading: false,
          error: null,
          lastAuthCheck: Date.now()
        });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist essential auth state
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastAuthCheck: state.lastAuthCheck
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          logInfo('[AuthStore] Rehydrating auth state from storage:', {
            hasToken: !!state.token,
            hasUser: !!state.user,
            isAuthenticated: state.isAuthenticated
          });
          
          // CRITICAL FIX: Check coordinator state before trusting persisted state
          setTimeout(async () => {
            try {
              // Import coordinator
              const { default: authCoordinator } = await import('@/utils/AuthenticationCoordinator');
              
              // Check if coordinator has different state
              const coordinatorState = authCoordinator.getCurrentState();
              const store = useAuthenticationStore.getState();
              
              // If coordinator and store states don't match, use coordinator's state
              if (coordinatorState.isAuthenticated !== state.isAuthenticated ||
                  coordinatorState.token !== state.token) {
                logInfo('[AuthStore] Coordinator state differs from persisted state, syncing from coordinator');
                store.syncFromCoordinator(coordinatorState);
              } else if (state.isAuthenticated && (!state.token || !state.user)) {
                logWarn('[AuthStore] Invalid rehydrated state detected, triggering auth check');
                store.checkAuthStatus(true);
              }
            } catch (error) {
              logError('[AuthStore] Error syncing with coordinator during rehydration:', error);
            }
          }, 100);
        }
      }
    }
  )
);

export default useAuthenticationStore;
