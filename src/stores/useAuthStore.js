// src/stores/useAuthStore.js
/**
 * Authentication store using Zustand with enhanced error handling
 * Updated to support both default and named exports for API standardization
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Remove the circular dependency by importing only the default export
import apiClient from '@/services/apiClient';
import { logInfo, logWarn, logError, logDebug } from '@/utils/logger.js';
import ErrorHandler from '@/utils/ErrorHandler';

const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
};

// Create a render limiter to prevent excessive re-renders in development mode
let lastStateUpdate = 0;
const THROTTLE_INTERVAL = 500; // ms

// Function to throttle state updates
const throttledSet = (originalSet) => (newState) => {
  const now = Date.now();
  
  // In development, throttle state updates to prevent flickering
  if (process.env.NODE_ENV === 'development' && 
      now - lastStateUpdate < THROTTLE_INTERVAL) {
    // Skip this update if it's too soon after the last one
    return;
  }
  
  // Update the timestamp and apply the state update
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
  
  // Update store state with error
  setFn({ 
    isLoading: false, 
    error: errorInfo.message
  });
  
  return errorInfo.message;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Use throttled set to prevent rapid state changes
      set: throttledSet(set),
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false, // Changed initial loading to false to prevent immediate loading state on refresh
      error: null,
      isSuperuser: false,
      lastAuthCheck: null, // Add timestamp to track last auth check

      /**
       * Checks the authentication status of the user
       * Now with emergency dev mode option for offline testing
       * @param {boolean} forceCheck - Force a fresh check bypassing cache
       * @returns {Promise<boolean>} Authentication success status
       */
      checkAuthStatus: async (forceCheck = false) => {
        const currentState = get();
        logger.debug('[AuthStore checkAuthStatus] Initializing, current state:', currentState);
        
        // Check if the user has explicitly logged out
        const hasExplicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out') === 'true';
        
        // EMERGENCY FIX: Force authentication in development mode, but only if not explicitly logged out
        if (process.env.NODE_ENV === 'development' && 
            window.location.hostname === 'localhost' && 
            !hasExplicitlyLoggedOut) {
          
          logger.info('[AuthStore] Development mode: Using mock authentication for localhost only');
          
          // Set localStorage flags to ensure consistent superuser access
          localStorage.setItem('bypass_auth_check', 'true');
          localStorage.setItem('superuser_override', 'true');
          localStorage.setItem('admin_access_enabled', 'true');
          localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
          
          // Create a stronger token with admin privileges embedded
          const adminToken = 'admin-mock-token-with-superuser-privileges-' + Date.now();
          
          // Store the token in localStorage directly for API client access
          localStorage.setItem('auth-token', adminToken);
          
          // Dispatch a custom event to notify components of admin status
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
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
            lastAuthCheck: Date.now(),
            isLoading: false,
            error: null
          });
          return true;
        } else if (hasExplicitlyLoggedOut) {
          logger.info('[AuthStore] User has explicitly logged out, not auto-authenticating');
        }
        
        // Start with default error state = null to clear any previous errors
        set({ error: null });
        
        // Check local storage for token presence independent of state
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
          // No need to set error state here as this is just a recovery mechanism
        }
        
        // If we have a token in localStorage but not in state, restore it
        if (localAuthData?.state?.token && !currentState.token) {
          logger.debug('[AuthStore] Found token in localStorage but not in state, restoring session');
          
          try {
            set({
              token: localAuthData.state.token,
              user: localAuthData.state.user,
              isAuthenticated: true,
              lastAuthCheck: Date.now() - 70000, // Set to force a fresh check
              error: null // Clear any errors when restoring session
            });
            
            // Update the current state to use the restored values
            currentState.token = localAuthData.state.token;
            currentState.user = localAuthData.state.user;
            currentState.isAuthenticated = true;
            forceCheck = true; // Force validation of the restored token
            
            logger.info('[AuthStore] Successfully restored session from localStorage');
          } catch (restoreErr) {
            ErrorHandler.handle(restoreErr, 'AuthStore.restoreSession', {
              showToast: false,
              logLevel: 'error'
            });
          }
        }
        
        // Check if we've recently verified auth status (within last 5 minutes)
        // and if user is already authenticated, skip new API call unless forced
        const now = Date.now();
        const lastCheck = currentState.lastAuthCheck || 0;
        const timeSinceLastCheck = now - lastCheck;
        const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        if (!forceCheck && currentState.isAuthenticated && currentState.user && timeSinceLastCheck < SESSION_CACHE_DURATION) {
          logger.debug(`[AuthStore checkAuthStatus] Using cached auth status (${Math.round(timeSinceLastCheck/1000)}s old)`);
          return true; // Return true immediately if we have recent authentication
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Check for a development flag that can bypass actual API calls
          const bypassAuthCheck = localStorage.getItem('bypass_auth_check') === 'true';
          
          // First see if we have localStorage session data we can use
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
          
          // If server is unavailable and we have stored auth data, use it in dev mode
          if (process.env.NODE_ENV !== 'production' && 
              (bypassAuthCheck || forceCheck && currentState.isAuthenticated)) {
            
            // Set a very short timeout for dev scenarios (100ms)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth check bypassed in development')), 100)
            );
            
            try {
              // Try the real API but with very short timeout
              const response = await Promise.race([
                apiClient.get('/auth/status'),
                timeoutPromise
              ]);
              
              // If we get here, API responded quickly - continue normal path
              logger.debug('[AuthStore checkAuthStatus] API responded quickly, using actual response');
              return response;
            } catch (e) {
              // If we have stored auth data, use it
              if (parsedAuthData?.state?.user && parsedAuthData?.state?.token) {
                logger.warn('[AuthStore checkAuthStatus] Using cached auth data in DEV mode');
                
                // Enable development fallback mode
                if (!localStorage.getItem('bypass_auth_check')) {
                  localStorage.setItem('bypass_auth_check', 'true');
                  logger.info('[AuthStore checkAuthStatus] Enabled auth bypass mode for development');
                }
                
                // Simulate successful response
                return {
                  data: {
                    success: true,
                    data: parsedAuthData.state.user
                  }
                };
              }
            }
          }
          
          // Normal path - set a timeout to prevent hanging indefinitely
          // Increased timeout for better reliability
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Authentication check timed out')), 15000)
          );
          
          // Race the API call against the timeout
          const response = await Promise.race([
            apiClient.get('/auth/status'),
            timeoutPromise
          ]);
          
          logger.debug('[AuthStore checkAuthStatus] API Response:', response);
          
          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: userData.token || 'token_from_cookie',
              isSuperuser: userData.account_type === 'superuser',
              error: null,
              lastAuthCheck: Date.now()
            });
            return true;
          } else {
            // No user found or invalid response
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
              error: errorMsg,
              lastAuthCheck: Date.now()
            });
            return false;
          }
        } catch (error) {
          // If there's a network error but we have existing auth data, don't immediately log out
          if (ErrorHandler.isNetworkError(error) && currentState.isAuthenticated && currentState.user) {
            logger.warn('[AuthStore checkAuthStatus] Network error but keeping existing session active');
            
            // Use standardized error handling but keep the user logged in
            ErrorHandler.handle(error, 'AuthStore.checkAuthStatus', {
              showToast: true,
              logLevel: 'warn',
              defaultMessage: 'Network error checking authentication status. Using cached session data.'
            });
            
            set({
              isLoading: false,
              error: 'Network error checking authentication status. Using cached session data.',
              lastAuthCheck: Date.now() - (4 * 60 * 1000) // Set to retry in 1 minute
            });
            return true; // Return true to keep user authenticated
          }
          
          // If there's a network error but we were previously authenticated,
          // maintain auth state instead of immediately logging out
          if (!error.response && currentState.isAuthenticated) {
            // Log the error but maintain auth state
            ErrorHandler.handle(error, 'AuthStore.checkAuthStatus', {
              showToast: false,
              logLevel: 'info'
            });
            
            set({ isLoading: false });
            return true;
          } else {
            // Full error handling for auth failures
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
              error: errorInfo.message,
              lastAuthCheck: now, // Update timestamp even for errors
            });
            return false;
          }
        }
      },

      /**
       * Log in a user with email and password
       * @param {Object} formData - Login credentials {email, password}
       * @returns {Promise<boolean>} Login success status
       */
      login: async (formData) => {
        // Clear previous errors first
        set({ isLoading: true, error: null });
        
        try {
          logger.debug('[AuthStore login] Attempting login with formData:', formData);
          
          if (!formData || typeof formData.email !== 'string' || typeof formData.password !== 'string') {
            throw new Error('Invalid formData format: Email and password must be strings.');
          }

          // Check if this is an admin login in development mode
          const isAdminLogin = process.env.NODE_ENV === 'development' && 
                              (formData.email === 'admin@example.com' || 
                               formData.email.includes('admin'));
          
          // In development mode, always set admin flags immediately upon login attempt
          if (process.env.NODE_ENV === 'development') {
            logger.info('[AuthStore login] Development mode: Setting admin flags immediately');
            
            // Clear the explicit logout flag
            localStorage.removeItem('user_explicitly_logged_out');
            
            // Set admin flags
            localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
            localStorage.setItem('bypass_auth_check', 'true');
            localStorage.setItem('superuser_override', 'true');
            localStorage.setItem('admin_access_enabled', 'true');
          }

          const response = await apiClient.post('/auth/login', formData);
          
          logger.debug('[AuthStore login] Full API Response:', response);
          logger.debug('[AuthStore login] Response.data:', response.data);

          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            
            // Ensure admin status is set correctly
            const isSuperuser = process.env.NODE_ENV === 'development' || 
                               userData.account_type === 'superuser' || 
                               userData.role === 'admin' || 
                               isAdminLogin;
            
            // In development mode or for admin logins, enhance user data
            if (process.env.NODE_ENV === 'development' || isAdminLogin) {
              userData.account_type = 'superuser';
              userData.role = 'admin';
              userData.permissions = [...new Set([...(userData.permissions || []), 'admin', 'superuser'])];
            }
            
            // Log the state we're about to set
            logger.info('[AuthStore login] Setting auth state with superuser:', isSuperuser);
            
            // Update state synchronously
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              token: response.data.token || userData.token || null,
              isSuperuser: isSuperuser, // Explicitly set based on our determination
              error: null,
              lastAuthCheck: Date.now() // Update the last check time
            });
            
            // Update the persisted auth state directly to ensure consistency
            try {
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const parsed = JSON.parse(authStorage);
                if (parsed.state) {
                  parsed.state.isAuthenticated = true;
                  parsed.state.user = userData;
                  parsed.state.isSuperuser = isSuperuser;
                  parsed.state.token = response.data.token || userData.token || null;
                  parsed.state.lastAuthCheck = Date.now();
                  localStorage.setItem('auth-storage', JSON.stringify(parsed));
                  logger.debug('[AuthStore login] Updated persisted auth state with superuser:', isSuperuser);
                }
              }
            } catch (e) {
              logger.warn('[AuthStore login] Failed to update persisted auth state:', e);
            }
            
            // Dispatch a custom event to notify components of login with admin status
            if (typeof window !== 'undefined') {
              logger.info('[AuthStore login] Dispatching adminLoginComplete event');
              window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
                detail: { isSuperuser: isSuperuser } 
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

      /**
       * Log out the current user
       * @returns {Promise<void>}
       */
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
          // Even if the logout API fails, we should still clear client-side state
          ErrorHandler.handle(error, 'AuthStore.logout', {
            showToast: true,
            logLevel: 'error',
            defaultMessage: 'Logout API call failed, but your session has been cleared locally.'
          });
          
          set({ token: null, isAuthenticated: false, user: null, isLoading: false, isSuperuser: false, error: null });
        }
        
        // Clear any stored credentials from localStorage and sessionStorage
        try {
          // Set explicit logout flag to prevent auto-login on refresh
          localStorage.setItem('user_explicitly_logged_out', 'true');
          
          // First, explicitly clear all admin-related flags
          logger.info('[AuthStore logout] Clearing all admin-related flags');
          localStorage.removeItem('admin_api_key');
          localStorage.removeItem('bypass_auth_check');
          localStorage.removeItem('superuser_override');
          localStorage.removeItem('admin_access_enabled');
          localStorage.removeItem('admin-access-enabled');
          localStorage.removeItem('admin_access');
          localStorage.removeItem('admin-access');
          localStorage.removeItem('force_admin');
          localStorage.removeItem('force-admin');
          localStorage.removeItem('auth-token');
          
          // Clear auth storage
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('auth-storage');
          
          // Also clear any other auth-related items that might be in storage
          const authKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('auth') || key.includes('token') || key.includes('user') || 
                key.includes('admin') || key.includes('super')) {
              authKeys.push(key);
            }
          }
          
          // Remove each found auth key
          authKeys.forEach(key => {
            try {
              localStorage.removeItem(key);
              logger.debug(`[AuthStore logout] Removed additional auth key: ${key}`);
            } catch (err) {}
          });
          
          // Same for sessionStorage
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.includes('auth') || key.includes('token') || key.includes('user') || 
                key.includes('admin') || key.includes('super')) {
              try {
                sessionStorage.removeItem(key);
                logger.debug(`[AuthStore logout] Removed sessionStorage key: ${key}`);
              } catch (err) {}
            }
          }
          
          // Clear any auth cookies by setting them to expire
          document.cookie.split(';').forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            if (cookieName.includes('auth') || cookieName.includes('token') || 
                cookieName.includes('user') || cookieName.includes('admin')) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
          
          // Dispatch an event to notify components that admin status is cleared
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('adminLogoutComplete', { 
              detail: { cleared: true } 
            }));
          }
          
          logger.debug('[AuthStore logout] All auth storage and cookies cleared');
        } catch (e) {
          ErrorHandler.handle(e, 'AuthStore.clearStorage', {
            showToast: false,
            logLevel: 'warn'
          });
        }
        
        // Force a small delay to ensure state updates propagate before redirect
        return new Promise(resolve => {
          setTimeout(() => {
            // One final check to make sure state is cleared
            const state = get();
            if (state.token || state.isAuthenticated || state.user) {
              logger.warn('[AuthStore logout] Auth state not properly cleared, forcing final cleanup');
              set({
                token: null,
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: null,
                isSuperuser: false,
                lastAuthCheck: null
              });
            }
            resolve();
          }, 100);
        });
      },

      /**
       * Register a new user
       * @param {Object} userData - User registration data
       * @returns {Promise<Object>} Registration result
       */
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', userData);
          if (response.data && response.data.success && response.data.data) {
            const user = response.data.data;
            set({ 
              isAuthenticated: true, 
              user: user, 
              isLoading: false, 
              token: response.data.token || user.token || null, 
              isSuperuser: user.account_type === 'superuser', 
              error: null 
            });
            logger.info('[AuthStore register] Registration successful, user set:', user);
            return { success: true, data: user };
          } else {
            throw new Error(response.data?.message || 'Registration failed: Unexpected response structure.');
          }
        } catch (error) {
          // Handle the error but allow it to be caught by the calling component
          const errorMessage = handleAuthError(error, 'register', set);
          return { success: false, message: errorMessage };
        }
      },

      // Getter methods
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

// Instead of setting the store reference immediately, do it after the store is created
// This avoids the circular dependency
setTimeout(() => {
  try {
    // Dynamically import to avoid circular dependency
    import('@/services/apiClient').then(apiClientModule => {
      if (apiClientModule.setAuthStoreRef) {
        apiClientModule.setAuthStoreRef(useAuthStore);
        console.debug('[AuthStore] Successfully registered with apiClient');
      }
    });
  } catch (err) {
    console.error('[AuthStore] Failed to register with apiClient:', err);
  }
}, 0);

// Support both default and named exports for backward compatibility
export default useAuthStore;
export { useAuthStore };
