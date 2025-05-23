/* src/stores/useAuthStore.js */
/**
 * Authentication store using Zustand with enhanced error handling
 * Updated to support both default and named exports for API standardization
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/services/apiClient';
import { logInfo, logWarn, logError } from '@/utils/logger.js'; // Removed logDebug
import ErrorHandler from '@/utils/ErrorHandler';

const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError,
};

// Create a render limiter to prevent excessive re-renders in development mode
let lastStateUpdate = 0;
const THROTTLE_INTERVAL = 500; // ms

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

/**
 * Centralized error handler for auth operations
 * 
 * @param {Error} error - The error object
 * @param {string} operation - Name of the operation (login, logout, etc.)
 * @param {Function} setFn - State setter function
 * @returns {string} - Error message for return value
 */
const handleAuthError = (error, operation, setFn) => {
  const errorInfo = ErrorHandler.handle(error, `AuthStore.${operation}`, {
    showToast: true,
    includeStack: process.env.NODE_ENV === 'development'
  });
  
  setFn({ 
    isLoading: false, 
    error: errorInfo.message
  });
  
  return errorInfo.message;
};

// Initialize with window.__INITIAL_AUTH_STATE__ if available (for early hydration)
const initialAuthState = typeof window !== 'undefined' && window.__INITIAL_AUTH_STATE__ 
  ? window.__INITIAL_AUTH_STATE__
  : {
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      isSuperuser: false,
      superuserStatusReady: false, // New flag to track superuser status readiness
      lastAuthCheck: null,
    };

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Initial state with superuserStatusReady flag
      ...initialAuthState, 
      
      // Use throttled set to prevent excessive re-renders
      set: throttledSet(set),

      checkAuthStatus: async (forceCheck = false) => {
        const currentState = get();
        logger.info('[AuthStore checkAuthStatus] Initializing, current state:', currentState);
        
        // CRITICAL: Aggressively clear ALL offline mode flags
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
          
          // In development mode, set admin flags
          if (process.env.NODE_ENV === 'development' && currentState.isAuthenticated) {
            localStorage.setItem('admin_access_enabled', 'true');
            localStorage.setItem('superuser_override', 'true');
            localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
          }
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
          
          logger.info('[AuthStore] Development mode: Using mock authentication for localhost only');
          
          localStorage.setItem('bypass_auth_check', 'true');
          localStorage.setItem('superuser_override', 'true');
          localStorage.setItem('admin_access_enabled', 'true');
          localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
          
          const adminToken = 'admin-mock-token-with-superuser-privileges-' + Date.now();
          localStorage.setItem('auth-token', adminToken);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
              detail: { isSuperuser: true } 
            }));
            
            // Also dispatch new event for components using the new system
            window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
              detail: { isSuperuser: true }
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
            isSuperuser: true,
            superuserStatusReady: true, // Mark as ready
            lastAuthCheck: Date.now(),
            isLoading: false,
            error: null
          });
          return true;
        } else if (hasExplicitlyLoggedOut) {
          logger.info('[AuthStore] User has explicitly logged out, not auto-authenticating');
        }
        
        set({ error: null });
        
        const localStorageAuth = localStorage.getItem('auth-storage');
        let localAuthData = null;
        
        try {
          if (localStorageAuth) {
            localAuthData = JSON.parse(localStorageAuth);
          }
        } catch (err) {
          ErrorHandler.handle(err, 'AuthStore.parseLocalStorage', {
            showToast: false,
            logLevel: 'warn'
          });
        }
        
        if (localAuthData?.state?.token && !currentState.token) {
          logger.info('[AuthStore] Found token in localStorage but not in state, restoring session');
          
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
            
            logger.info('[AuthStore] Successfully restored session from localStorage');
          } catch (restoreErr) {
            ErrorHandler.handle(restoreErr, 'AuthStore.restoreSession', {
              showToast: false,
              logLevel: 'error'
            });
          }
        }
        
        const now = Date.now();
        const lastCheck = currentState.lastAuthCheck || 0;
        const timeSinceLastCheck = now - lastCheck;
        const SESSION_CACHE_DURATION = 5 * 60 * 1000;
        
        if (!forceCheck && currentState.isAuthenticated && currentState.user && timeSinceLastCheck < SESSION_CACHE_DURATION) {
          logger.info(`[AuthStore checkAuthStatus] Using cached auth status (${Math.round(timeSinceLastCheck/1000)}s old)`);
          return true;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const bypassAuthCheck = localStorage.getItem('bypass_auth_check') === 'true';
          
          const storedAuthData = localStorage.getItem('auth-storage');
          let parsedAuthData = null;
          
          try {
            if (storedAuthData) {
              parsedAuthData = JSON.parse(storedAuthData);
            }
          } catch (e) {
            ErrorHandler.handle(e, 'AuthStore.parseStoredAuth', {
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
                apiClient.get('/auth/status'),
                timeoutPromise
              ]);
              
              logger.info('[AuthStore checkAuthStatus] API responded quickly, using actual response');
              return response;
            } catch (e) {
              if (parsedAuthData?.state?.user && parsedAuthData?.state?.token) {
                logger.warn('[AuthStore checkAuthStatus] Using cached auth data in DEV mode');
                
                if (!localStorage.getItem('bypass_auth_check')) {
                  localStorage.setItem('bypass_auth_check', 'true');
                  logger.info('[AuthStore checkAuthStatus] Enabled auth bypass mode for development');
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
            apiClient.get('/auth/status'),
            timeoutPromise
          ]);
          
          logger.info('[AuthStore checkAuthStatus] API Response:', response);
          
          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: userData.token || 'token_from_cookie',
              isSuperuser: userData.account_type === 'superuser',
              superuserStatusReady: true, // Set superuser status ready on login
              error: null,
              lastAuthCheck: Date.now()
            });
            return true;
          } else {
            const errorMsg = response.data?.message || 'Authentication check failed: Invalid response';
            
            ErrorHandler.handle({
              message: errorMsg,
              response: response
            }, 'AuthStore.checkAuthStatus', {
              showToast: false,
              logLevel: 'warn'
            });
            
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              token: null,
              isSuperuser: false,
              superuserStatusReady: false, // Reset on logout
              error: errorMsg,
              lastAuthCheck: Date.now()
            });
            return false;
          }
        } catch (error) {
          if (ErrorHandler.isNetworkError(error) && currentState.isAuthenticated && currentState.user) {
            logger.warn('[AuthStore checkAuthStatus] Network error but keeping existing session active');
            
            ErrorHandler.handle(error, 'AuthStore.checkAuthStatus', {
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
            ErrorHandler.handle(error, 'AuthStore.checkAuthStatus', {
              showToast: false,
              logLevel: 'info'
            });
            
            set({ isLoading: false });
            return true;
          } else {
            const errorInfo = ErrorHandler.handle(error, 'AuthStore.checkAuthStatus', {
              showToast: true,
              includeStack: process.env.NODE_ENV === 'development'
            });
            
            set({ 
              isAuthenticated: false, 
              user: null, 
              isLoading: false, 
              token: null, 
              isSuperuser: false, 
              superuserStatusReady: false, // Reset on logout
              error: errorInfo.message,
              lastAuthCheck: now,
            });
            return false;
          }
        }
      },

      login: async (formData) => {
        set({ isLoading: true, error: null });
        
        // CRITICAL: Aggressively clear ALL offline mode flags to ensure admin features are visible
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
          localStorage.removeItem('user_explicitly_logged_out');
          localStorage.removeItem('bypass_auth_check');
          
          // Force admin flags in development mode
          if (process.env.NODE_ENV === 'development') {
            localStorage.setItem('admin_access_enabled', 'true');
            localStorage.setItem('superuser_override', 'true');
            localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
          }
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        try {
          logger.info('[AuthStore login] Attempting login with formData:', formData);
          
          if (!formData || typeof formData.email !== 'string' || typeof formData.password !== 'string') {
            throw new Error('Invalid formData format: Email and password must be strings.');
          }

          const isAdminLogin = process.env.NODE_ENV === 'development' && 
                              (formData.email === 'admin@example.com' || 
                               formData.email.includes('admin'));
          
          if (process.env.NODE_ENV === 'development') {
            logger.info('[AuthStore login] Development mode: Setting admin flags immediately');
            
            localStorage.removeItem('user_explicitly_logged_out');
            
            localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
            localStorage.setItem('bypass_auth_check', 'true');
            localStorage.setItem('superuser_override', 'true');
            localStorage.setItem('admin_access_enabled', 'true');
          }

          const response = await apiClient.post('/auth/login', formData);
          
          logger.info('[AuthStore login] Response.data:', response.data);

          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            
            const isSuperuser = process.env.NODE_ENV === 'development' || 
                               userData.account_type === 'superuser' || 
                               userData.role === 'admin' || 
                               isAdminLogin;
            
            if (process.env.NODE_ENV === 'development' || isAdminLogin) {
              userData.account_type = 'superuser';
              userData.role = 'admin';
              userData.permissions = [...new Set([...(userData.permissions || []), 'admin', 'superuser'])];
            }
            
            logger.info('[AuthStore login] Setting auth state with superuser:', isSuperuser);
            
            // CRITICAL: Clear offline mode flags again before setting state
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('offline-mode');
              localStorage.removeItem('offline_mode');
              localStorage.setItem('force_online', 'true');
              localStorage.removeItem('user_explicitly_logged_out');
              localStorage.removeItem('bypass_auth_check');
              
              // Force admin flags in development mode
              if (process.env.NODE_ENV === 'development') {
                localStorage.setItem('admin_access_enabled', 'true');
                localStorage.setItem('superuser_override', 'true');
                localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
              }
            }
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('offline-mode');
              sessionStorage.removeItem('offline_mode');
            }
            
            // Set authentication state with superuser status
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: response.data.token || userData.token || null,
              isSuperuser: isSuperuser,
              superuserStatusReady: true, // Setting superuser status ready on login
              error: null,
              lastAuthCheck: Date.now()
            });
            
            try {
              // Update persisted auth state in localStorage
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const parsed = JSON.parse(authStorage);
                if (parsed.state) {
                  parsed.state.isAuthenticated = true;
                  parsed.state.user = userData;
                  parsed.state.isSuperuser = isSuperuser;
                  parsed.state.superuserStatusReady = true; // Also update in storage
                  parsed.state.token = response.data.token || userData.token || null;
                  parsed.state.lastAuthCheck = Date.now();
                  localStorage.setItem('auth-storage', JSON.stringify(parsed));
                  logger.info('[AuthStore login] Updated persisted auth state with superuser:', isSuperuser);
                }
              }
            } catch (e) {
              logger.warn('[AuthStore login] Failed to update persisted auth state:', e);
            }
            
            // Dispatch events to notify components of login completion
            if (typeof window !== 'undefined') {
              // Dispatch multiple events to ensure all components are notified
              logger.info('[AuthStore login] Dispatching login events');
              
              // Legacy event
              window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
                detail: { isSuperuser: isSuperuser } 
              }));
              
              // New system events
              window.dispatchEvent(new CustomEvent('auth:login_complete', {
                detail: { isAuthenticated: true, user: userData }
              }));
              
              window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
                detail: { isSuperuser: isSuperuser }
              }));
              
              // Force UI refresh event
              window.dispatchEvent(new CustomEvent('forceUiRefresh', {
                detail: { timestamp: Date.now() }
              }));
            }
            
            logger.info('[AuthStore login] Login successful, user set with superuser status:', isSuperuser);
            return true;
          } else {
            throw new Error(response.data?.message || 'Login failed: Unexpected response from server.');
          }
        } catch (error) {
          return handleAuthError(error, 'login', set);
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          // Skip API call in development mode if bypass_auth_check is enabled
          if (process.env.NODE_ENV === 'development' && localStorage.getItem('bypass_auth_check') === 'true') {
            logger.info('[AuthStore logout] Skipping logout API call in development mode');
          } else {
            const { authService } = await import('@/services/authService.js');
            await authService.logout();
          }
          
          // Clear state with superuserStatusReady set to false
          set({ 
            token: null, 
            isAuthenticated: false, 
            user: null, 
            isLoading: false, 
            isSuperuser: false, 
            superuserStatusReady: false, // Reset on logout
            error: null 
          });
          
          logger.info('[AuthStore logout] Logout successful.');
        } catch (error) {
          ErrorHandler.handle(error, 'AuthStore.logout', {
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
            isSuperuser: false, 
            superuserStatusReady: false, // Reset on logout
            error: null 
          });
        }
        
        try {
          // Set explicit logout flag
          localStorage.setItem('user_explicitly_logged_out', 'true');
          
          // Clear all auth-related storage
          logger.info('[AuthStore logout] Clearing all auth storage and cookies');
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
            window.dispatchEvent(new CustomEvent('adminLogoutComplete', { 
              detail: { cleared: true } 
            }));
            
            // Also dispatch new event for components using the new system
            window.dispatchEvent(new CustomEvent('auth:logout_complete', {
              detail: { cleared: true }
            }));
          }
          
          logger.info('[AuthStore logout] All auth storage and cookies cleared');
        } catch (e) {
          ErrorHandler.handle(e, 'AuthStore.clearStorage', {
            showToast: false,
            logLevel: 'warn'
          });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', userData);
          if (response.data && response.data.success && response.data.data) {
            const user = response.data.data;
            
            // Determine superuser status
            const isSuperuser = user.account_type === 'superuser' || 
                               user.role === 'admin' || 
                               process.env.NODE_ENV === 'development';
            
            set({ 
              isAuthenticated: true, 
              user: user, 
              isLoading: false, 
              token: response.data.token || user.token || null, 
              isSuperuser: isSuperuser,
              superuserStatusReady: true, // Set on register as well
              error: null 
            });
            logger.info('[AuthStore register] Registration successful, user set:', user);
            return { success: true, data: user };
          } else {
            throw new Error(response.data?.message || 'Registration failed: Unexpected response structure.');
          }
        } catch (error) {
          const errorMessage = handleAuthError(error, 'register', set);
          return { success: false, message: errorMessage };
        }
      },

      // Set superuser status and mark as ready
      setSuperuser: (isSuperuser) => {
        set({ 
          isSuperuser, 
          superuserStatusReady: true 
        });
        
        // Update persisted state in localStorage
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            if (parsed.state) {
              parsed.state.isSuperuser = isSuperuser;
              parsed.state.superuserStatusReady = true;
              localStorage.setItem('auth-storage', JSON.stringify(parsed));
            }
          }
        } catch (e) {
          logger.warn('[AuthStore setSuperuser] Failed to update persisted auth state:', e);
        }
      },

      getCurrentUser: () => get().user,
      getIsAuthenticated: () => get().isAuthenticated,
      getIsLoading: () => get().isLoading,
      getIsSuperuser: () => get().isSuperuser,
      getSuperuserStatusReady: () => get().superuserStatusReady,

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isSuperuser: state.isSuperuser,
        superuserStatusReady: state.superuserStatusReady, // Include in persisted state
        token: state.token,
        lastAuthCheck: state.lastAuthCheck
      }),
    }
  )
);

// Add named exports for better IDE support
export const getIsAuthenticated = () => useAuthStore.getState().isAuthenticated;
export const getCurrentUser = () => useAuthStore.getState().user;
export const getIsSuperuser = () => useAuthStore.getState().isSuperuser;
export const getSuperuserStatusReady = () => useAuthStore.getState().superuserStatusReady;

// Register store with apiClient
setTimeout(() => {
  try {
    import('@/services/apiClient').then(apiClientModule => {
      if (apiClientModule.setAuthStoreRef) {
        apiClientModule.setAuthStoreRef(useAuthStore);
        console.info('[AuthStore] Successfully registered with apiClient');
      }
    });
  } catch (err) {
    console.error('[AuthStore] Failed to register with apiClient:', err);
  }
}, 0);

export { useAuthStore };
export default useAuthStore;