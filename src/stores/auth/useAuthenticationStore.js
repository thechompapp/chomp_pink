/**
 * Authentication Store Module
 * 
 * Handles core authentication functionality (login/logout/tokens)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultApiClient } from '@/services/http';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import ErrorHandler from '@/utils/ErrorHandler';

// Constants
const STORAGE_KEY = 'auth-authentication-storage';
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create a render limiter to prevent excessive re-renders in development mode
let lastStateUpdate = 0;
const THROTTLE_INTERVAL = 500; // ms

/**
 * Centralized error handler for auth operations
 * 
 * @param {Error} error - The error object
 * @param {string} operation - Name of the operation (login, logout, etc.)
 * @param {Function} setFn - State setter function
 * @returns {string} - Error message for return value
 */
const handleAuthError = (error, operation, setFn) => {
  const errorInfo = ErrorHandler.handle(error, `AuthenticationStore.${operation}`, {
    showToast: true,
    includeStack: process.env.NODE_ENV === 'development'
  });
  
  setFn({ 
    isLoading: false, 
    error: errorInfo.message
  });
  
  return errorInfo.message;
};

// Function to throttle state updates
const throttledSet = (originalSet) => (newState) => {
  const now = Date.now();
  if (process.env.NODE_ENV === 'development' && 
      now - lastStateUpdate < THROTTLE_INTERVAL) {
    return;
  }
  lastStateUpdate = now;
  originalSet(newState);
};

// Initialize with window.__INITIAL_AUTH_STATE__ if available (for early hydration)
const getInitialState = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastAuthCheck: null
    };
  }
  const windowState = typeof window !== 'undefined' && window.__INITIAL_AUTH_STATE__;
  
  if (windowState) {
    return {
      token: windowState.token || null,
      isAuthenticated: windowState.isAuthenticated || false,
      user: windowState.user || null,
      isLoading: false,
      error: null,
      lastAuthCheck: windowState.lastAuthCheck || null,
    };
  }
  
  return {
    token: null,
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    lastAuthCheck: null,
  };
};

/**
 * Authentication Store
 * 
 * Handles core authentication functionality (login/logout/tokens)
 */
// Export the store initializer separately for vanilla (non-React) testing
export function authStoreInitializer(set, get) {
  return {
      // Initial state
      ...getInitialState(),
      
      // Use throttled set to prevent excessive re-renders
      set: throttledSet(set),

      /**
       * Set the authentication token
       * @param {string|null} token
       */
      setToken: (token) => {
        set({ token });
        if (typeof localStorage !== 'undefined') {
          try {
            const storage = localStorage.getItem(STORAGE_KEY);
            const parsed = storage ? JSON.parse(storage) : { state: {} };
            parsed.state.token = token;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
      },

      /**
       * Set an error message in state
       * @param {string|null} error
       */
      setError: (error) => set({ error }),

      /**
       * Clear any error message in state
       */
      clearError: () => set({ error: null }),

      /**
       * Set the current user in state
       * @param {object|null} user
       */
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      /**
       * Check authentication status
       * @param {boolean} forceCheck - Force a fresh check ignoring cache
       * @returns {Promise<boolean>} - Whether the user is authenticated
       */
      checkAuthStatus: async (forceCheck = false) => {
        const currentState = get();
        logInfo('[AuthenticationStore checkAuthStatus] Initializing, current state:', currentState);
        
        // CRITICAL: Aggressively clear ALL offline mode flags
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        // Dispatch event to notify components that offline mode has changed
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
            detail: { isOffline: false }
          }));
        }
        
        const hasExplicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out') === 'true';
        
        if (process.env.NODE_ENV === 'development' && 
            window.location.hostname === 'localhost' && 
            !hasExplicitlyLoggedOut) {
          
          logInfo('[AuthenticationStore] Development mode: Using mock authentication for localhost only');
          
          localStorage.setItem('bypass_auth_check', 'true');
          
          const adminToken = 'admin-mock-token-with-superuser-privileges-' + Date.now();
          localStorage.setItem('auth-token', adminToken);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:login_complete', { 
              detail: { isAuthenticated: true } 
            }));
          }
          
          set({
            isAuthenticated: true,
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
              account_type: 'superuser',
              role: 'admin',
              permissions: ['admin', 'superuser']
            },
            token: adminToken,
            lastAuthCheck: Date.now(),
            isLoading: false,
            error: null
          });
          return true;
        } else if (hasExplicitlyLoggedOut) {
          logInfo('[AuthenticationStore] User has explicitly logged out, not auto-authenticating');
        }
        
        set({ error: null });
        
        const localStorageAuth = localStorage.getItem(STORAGE_KEY);
        let localAuthData = null;
        
        try {
          if (localStorageAuth) {
            localAuthData = JSON.parse(localStorageAuth);
          }
        } catch (err) {
          ErrorHandler.handle(err, 'AuthenticationStore.parseLocalStorage', {
            showToast: false,
            logLevel: 'warn'
          });
        }
        
        if (localAuthData?.state?.token && !currentState.token) {
          logInfo('[AuthenticationStore] Found token in localStorage but not in state, restoring session');
          
          try {
            set({
              token: localAuthData.state.token,
              user: localAuthData.state.user,
              isAuthenticated: true,
              lastAuthCheck: Date.now() - 70000,
              error: null
            });
            
            currentState.token = localAuthData.state.token;
            currentState.user = localAuthData.state.user;
            currentState.isAuthenticated = true;
            forceCheck = true;
            
            logInfo('[AuthenticationStore] Successfully restored session from localStorage');
          } catch (restoreErr) {
            ErrorHandler.handle(restoreErr, 'AuthenticationStore.restoreSession', {
              showToast: false,
              logLevel: 'error'
            });
          }
        }
        
        const now = Date.now();
        const lastCheck = currentState.lastAuthCheck || 0;
        const timeSinceLastCheck = now - lastCheck;
        
        if (!forceCheck && currentState.isAuthenticated && currentState.user && timeSinceLastCheck < SESSION_CACHE_DURATION) {
          logInfo(`[AuthenticationStore checkAuthStatus] Using cached auth status (${Math.round(timeSinceLastCheck/1000)}s old)`);
          return true;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const bypassAuthCheck = localStorage.getItem('bypass_auth_check') === 'true';
          
          const storedAuthData = localStorage.getItem(STORAGE_KEY);
          let parsedAuthData = null;
          
          try {
            if (storedAuthData) {
              parsedAuthData = JSON.parse(storedAuthData);
            }
          } catch (e) {
            ErrorHandler.handle(e, 'AuthenticationStore.parseStoredAuth', {
              showToast: false,
              logLevel: 'warn'
            });
          }
          
          if (process.env.NODE_ENV !== 'production' && 
              (bypassAuthCheck || forceCheck && currentState.isAuthenticated)) {
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth check bypassed in development')), 100)
            );
            
            try {
              const response = await Promise.race([
                getDefaultApiClient().get('/auth/status'),
                timeoutPromise
              ]);
              
              logInfo('[AuthenticationStore checkAuthStatus] API response:', response.data);
              
              if (response.data.isAuthenticated && response.data.user) {
                set({
                  isAuthenticated: true,
                  user: response.data.user,
                  lastAuthCheck: Date.now(),
                  isLoading: false,
                  error: null
                });
                return true;
              }
            } catch (e) {
              if (parsedAuthData?.state?.user && parsedAuthData?.state?.token) {
                logWarn('[AuthenticationStore checkAuthStatus] Using cached auth data in DEV mode');
                
                if (!localStorage.getItem('bypass_auth_check')) {
                  localStorage.setItem('bypass_auth_check', 'true');
                  logInfo('[AuthenticationStore checkAuthStatus] Enabled auth bypass mode for development');
                }
                
                return {
                  data: {
                    success: true,
                    data: parsedAuthData.state.user
                  }
                };
              }
            }
          }
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Authentication check timed out')), 15000)
          );
          
          const response = await Promise.race([
            getDefaultApiClient().get('/auth/status'),
            timeoutPromise
          ]);
          
          logInfo('[AuthenticationStore checkAuthStatus] API Response:', response);
          
          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: userData.token || 'token_from_cookie',
              error: null,
              lastAuthCheck: Date.now()
            });
            
            // Dispatch event for other modules to update
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:login_complete', {
                detail: { isAuthenticated: true, user: userData }
              }));
            }
            
            return true;
          } else {
            const errorMsg = response.data?.message || 'Authentication check failed: Invalid response';
            
            ErrorHandler.handle({
              message: errorMsg,
              response: response
            }, 'AuthenticationStore.checkAuthStatus', {
              showToast: false,
              logLevel: 'warn'
            });
            
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              token: null,
              error: errorMsg,
              lastAuthCheck: Date.now()
            });
            
            // Dispatch event for other modules to update
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:logout_complete', {
                detail: { isAuthenticated: false }
              }));
            }
            
            return false;
          }
        } catch (error) {
          if (ErrorHandler.isNetworkError(error) && currentState.isAuthenticated && currentState.user) {
            logWarn('[AuthenticationStore checkAuthStatus] Network error but keeping existing session active');
            
            ErrorHandler.handle(error, 'AuthenticationStore.checkAuthStatus', {
              showToast: true,
              logLevel: 'warn',
              defaultMessage: 'Network error checking authentication status. Using cached session data.'
            });
            
            set({
              isLoading: false,
              error: 'Network error checking authentication status. Using cached session data.',
              lastAuthCheck: Date.now() - (4 * 60 * 1000)
            });
            return true;
          }
          
          if (!error.response && currentState.isAuthenticated) {
            ErrorHandler.handle(error, 'AuthenticationStore.checkAuthStatus', {
              showToast: false,
              logLevel: 'info'
            });
            
            set({ isLoading: false });
            return true;
          } else {
            const errorInfo = ErrorHandler.handle(error, 'AuthenticationStore.checkAuthStatus', {
              showToast: true,
              includeStack: process.env.NODE_ENV === 'development'
            });
            
            set({ 
              isAuthenticated: false, 
              user: null, 
              isLoading: false, 
              token: null, 
              error: errorInfo.message,
              lastAuthCheck: now,
            });
            
            // Dispatch event for other modules to update
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:logout_complete', {
                detail: { isAuthenticated: false }
              }));
            }
            
            return false;
          }
        }
      },

      /**
       * Login with email and password
       * @param {{email: string, password: string}} formData - User credentials
       * @returns {Promise<boolean>} - Whether login was successful
       */
      login: async (formData) => {
        set({ isLoading: true, error: null });
        
        // DEBUG: Log login call and credentials
        console.log('[DEBUG][AuthStore] login() called with:', formData);
        
        // CRITICAL: Aggressively clear ALL offline mode flags
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
          localStorage.removeItem('user_explicitly_logged_out');
          localStorage.removeItem('bypass_auth_check');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        try {
          logInfo('[AuthenticationStore login] Attempting login with formData:', formData);
          
          if (!formData || typeof formData.email !== 'string' || typeof formData.password !== 'string') {
            const error = new Error('Invalid formData format: Email and password must be strings.');
            logError('[AuthenticationStore login] Validation error:', error);
            throw error;
          }

          const isAdminLogin = process.env.NODE_ENV === 'development' && 
                              (formData.email === 'admin@example.com' || 
                               formData.email.includes('admin'));
          
          if (process.env.NODE_ENV === 'development') {
            logInfo('[AuthenticationStore login] Development mode: Setting admin flags immediately');
            localStorage.removeItem('user_explicitly_logged_out');
            localStorage.setItem('bypass_auth_check', 'true');
          }

          logInfo('[AuthenticationStore login] Making API call to /auth/login');
          const response = await getDefaultApiClient().post('/auth/login', formData);
          logInfo('[AuthenticationStore login] API Response received:', response.data);

          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            
            // CRITICAL: Clear offline mode flags again before setting state
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('offline-mode');
              localStorage.removeItem('offline_mode');
              localStorage.setItem('force_online', 'true');
              localStorage.removeItem('user_explicitly_logged_out');
              localStorage.removeItem('bypass_auth_check');
            }
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('offline-mode');
              sessionStorage.removeItem('offline_mode');
            }
            
            // Set authentication state
            const newState = {
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: response.data.token || userData.token || null,
              error: null,
              lastAuthCheck: Date.now()
            };
            
            logInfo('[AuthenticationStore login] Updating state with:', newState);
            set(newState);
            
            // Dispatch events to notify components of login completion
            if (typeof window !== 'undefined') {
              // New system events
              window.dispatchEvent(new CustomEvent('auth:login_complete', {
                detail: { isAuthenticated: true, user: userData }
              }));
              
              // Force UI refresh event
              window.dispatchEvent(new CustomEvent('forceUiRefresh', {
                detail: { timestamp: Date.now() }
              }));
            }
            
            logInfo('[AuthenticationStore login] Login successful');
            return true;
          } else {
            const errorMsg = response.data?.message || 'Login failed: Unexpected response from server.';
            logError('[AuthenticationStore login] Login failed:', errorMsg);
            throw new Error(errorMsg);
          }
        } catch (error) {
          logError('[AuthenticationStore login] Error during login:', error);
          const errorState = {
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: error.message || 'Login failed'
          };
          logError('[AuthenticationStore login] Setting error state:', errorState);
          set(errorState);
          
          // Still return a boolean from the login function
          return false;
        }
      },

      /**
       * Logout the current user
       * @returns {Promise<void>}
       */
      logout: async () => {
  const apiUrl = (typeof window !== 'undefined' && window.__API_BASE_URL__) || (global && global.API_BASE_URL) || 'NOT_SET';
  console.log('[DEBUG][AuthStore] logout() called. API URL:', apiUrl);

        set({ isLoading: true, error: null });
        try {
          // Skip API call in development mode if bypass_auth_check is enabled
          if (process.env.NODE_ENV === 'development' && localStorage.getItem('bypass_auth_check') === 'true') {
            logInfo('[AuthenticationStore logout] Skipping logout API call in development mode');
          } else {
            const { authService } = await import('@/services/authService.js');
            await authService.logout();
          }
          
          // Clear state
          set({ 
            token: null, 
            isAuthenticated: false, 
            user: null, 
            isLoading: false, 
            error: null 
          });
          // Debug: Log the state after clearing
          console.log('[DEBUG] State after clearing in logout:', get());
          
          logInfo('[AuthenticationStore logout] Logout successful.');
        } catch (error) {
          ErrorHandler.handle(error, 'AuthenticationStore.logout', {
            showToast: true,
            logLevel: 'error',
            defaultMessage: 'Logout API call failed, but your session has been cleared locally.'
          });
          
          // Still clear state even on error
          set({ 
            token: null, 
            isAuthenticated: false, 
            user: null, 
            isLoading: false, 
            error: null 
          });
        }
        
        try {
          // Set explicit logout flag
          localStorage.setItem('user_explicitly_logged_out', 'true');
          
          // Clear all auth-related storage
          logInfo('[AuthenticationStore logout] Clearing all auth storage and cookies');
          localStorage.clear();
          sessionStorage.clear();
          
          // Restore explicit logout flag
          localStorage.setItem('user_explicitly_logged_out', 'true');
          
          // Clear specific auth cookies
          const authCookies = ['auth', 'token', 'user', 'admin'];
          document.cookie.split(';').forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            if (authCookies.some(prefix => cookieName.includes(prefix))) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
          
          // Dispatch logout events
          if (typeof window !== 'undefined') {
            // New system event
            window.dispatchEvent(new CustomEvent('auth:logout_complete', {
              detail: { cleared: true }
            }));
          }
          
          logInfo('[AuthenticationStore logout] All auth storage and cookies cleared');
        } catch (e) {
          ErrorHandler.handle(e, 'AuthenticationStore.clearStorage', {
            showToast: false,
            logLevel: 'warn'
          });
        }
      },

      /**
       * Get the current user
       * @returns {Object|null} - Current user or null if not authenticated
       */
      getCurrentUser: () => get().user,

      /**
       * Check if the user is authenticated
       * @returns {boolean} - Whether the user is authenticated
       */
      getIsAuthenticated: () => get().isAuthenticated,

      /**
       * Check if authentication is loading
       * @returns {boolean} - Whether authentication is loading
       */
      getIsLoading: () => get().isLoading,

      /**
       * Get the authentication token
       * @returns {string|null} - Authentication token or null if not authenticated
       */
      getToken: () => get().token,
    };
}

const useAuthenticationStore = create(
  persist(authStoreInitializer, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      lastAuthCheck: state.lastAuthCheck
    }),
  })
);

export default useAuthenticationStore;
export const getIsAuthenticated = () => useAuthenticationStore.getState().getIsAuthenticated();
export const getCurrentUser = () => useAuthenticationStore.getState().getCurrentUser();
export const getToken = () => useAuthenticationStore.getState().getToken();
