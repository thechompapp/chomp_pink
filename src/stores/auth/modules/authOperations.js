/**
 * Authentication Operations
 * 
 * Handles core authentication operations including:
 * - Login and logout operations
 * - Authentication status checks
 * - Development mode handling
 * - API communication for auth
 */

import { logInfo, logWarn, logError } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { getDefaultApiClient } from '@/services/http';
import { AUTH_CONFIG, isDevModeLocalhost, hasExplicitlyLoggedOut, generateAdminToken } from './authConfig';
import { 
  clearOfflineFlags, 
  getStoredAuthData, 
  setDevModeFlags, 
  clearDevModeFlags,
  isAuthBypassEnabled,
  clearAllAuthStorage,
  restoreSessionFromStorage,
  updateStoredToken
} from './authStorage';
import { dispatchLoginEvents, dispatchLogoutEvents, dispatchOfflineStatusChange } from './authEvents';
import { 
  handleAuthError, 
  shouldUseCachedAuth,
  validateLoginData,
  isAdminLoginAttempt,
  createLoginSuccessState,
  createLoginErrorState,
  createLogoutState,
  createDevModeAuthState,
  normalizeAuthResponse,
  createTimeoutPromise
} from './authStateUtils';

/**
 * Check authentication status
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @param {boolean} forceCheck - Force a fresh check ignoring cache
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export async function checkAuthStatus(set, get, forceCheck = false) {
  const currentState = get();
  logInfo('[AuthOperations checkAuthStatus] Initializing, current state:', currentState);
  
  // Clear offline flags aggressively
  clearOfflineFlags();
  dispatchOfflineStatusChange(false);
  
  const hasLoggedOut = hasExplicitlyLoggedOut();
  const isLogoutInProgress = localStorage.getItem('logout_in_progress') === 'true';
  
  // Handle development mode on localhost - but ONLY if user hasn't explicitly logged out
  if (isDevModeLocalhost() && !hasLoggedOut && !isLogoutInProgress) {
    logInfo('[AuthOperations] Development mode: Using mock authentication for localhost');
    
    const adminToken = generateAdminToken();
    updateStoredToken(adminToken);
    setDevModeFlags();
    
    const devState = createDevModeAuthState();
    set(devState);
    
    dispatchLoginEvents(devState.user);
    return true;
  } else if (hasLoggedOut || isLogoutInProgress) {
    logInfo('[AuthOperations] User has explicitly logged out or logout in progress, not auto-authenticating');
    
    // Clear the logout in progress flag after a short delay
    if (isLogoutInProgress) {
      setTimeout(() => {
        localStorage.removeItem('logout_in_progress');
      }, 2000);
    }
    
    // Ensure we're in a logged out state
    const logoutState = createLogoutState();
    set(logoutState);
    return false;
  }
  
  set({ error: null });
  
  // Try to restore session from storage
  const restoredSession = restoreSessionFromStorage();
  if (restoredSession && !currentState.token) {
    logInfo('[AuthOperations] Restoring session from localStorage');
    set(restoredSession);
    Object.assign(currentState, restoredSession);
    forceCheck = true;
  }
  
  // Check if we can use cached authentication
  if (shouldUseCachedAuth(currentState, forceCheck)) {
    const timeSinceLastCheck = Date.now() - currentState.lastAuthCheck;
    logInfo(`[AuthOperations checkAuthStatus] Using cached auth status (${Math.round(timeSinceLastCheck/1000)}s old)`);
    return true;
  }
  
  set({ isLoading: true, error: null });
  
  try {
    const bypassAuthCheck = isAuthBypassEnabled();
    const storedAuthData = getStoredAuthData();
    
    // Handle development mode bypass
    if (process.env.NODE_ENV !== 'production' && 
        (bypassAuthCheck || (forceCheck && currentState.isAuthenticated))) {
      
      const timeoutPromise = createTimeoutPromise(AUTH_CONFIG.DEV_MODE_TIMEOUT, 'Auth check bypassed in development');
      
      try {
        const response = await Promise.race([
          apiClient.get('/auth/status'),
          timeoutPromise
        ]);
        
        logInfo('[AuthOperations checkAuthStatus] API responded quickly, using actual response');
        return handleAuthStatusResponse(response, set);
      } catch (e) {
        if (storedAuthData?.state?.user && storedAuthData?.state?.token) {
          logWarn('[AuthOperations checkAuthStatus] Using cached auth data in DEV mode');
          
          setDevModeFlags();
          
          const cachedState = createLoginSuccessState(
            storedAuthData.state.user,
            storedAuthData.state.token
          );
          set(cachedState);
          
          dispatchLoginEvents(cachedState.user);
          return true;
        }
      }
    }
    
    // Make actual API call
    const timeoutPromise = createTimeoutPromise(AUTH_CONFIG.AUTH_CHECK_TIMEOUT, 'Authentication check timed out');
    
    const response = await Promise.race([
      apiClient.get('/auth/status'),
      timeoutPromise
    ]);
    
    logInfo('[AuthOperations checkAuthStatus] API Response:', response);
    return handleAuthStatusResponse(response, set);
    
  } catch (error) {
    return handleAuthStatusError(error, currentState, set);
  }
}

/**
 * Handle successful auth status response
 * @param {Object} response - API response
 * @param {Function} set - State setter
 * @returns {boolean} Authentication success
 */
function handleAuthStatusResponse(response, set) {
  try {
    const { userData, token } = normalizeAuthResponse(response);
    
    const successState = createLoginSuccessState(userData, token || 'token_from_cookie');
    set(successState);
    
    dispatchLoginEvents(userData);
    return true;
    
  } catch (error) {
    logWarn('[AuthOperations] Auth status response error:', error.message);
    
    const errorState = createLoginErrorState(error.message);
    set(errorState);
    
    dispatchLogoutEvents();
    return false;
  }
}

/**
 * Handle auth status check errors
 * @param {Error} error - Error object
 * @param {Object} currentState - Current auth state
 * @param {Function} set - State setter
 * @returns {boolean} Authentication result
 */
function handleAuthStatusError(error, currentState, set) {
  // Handle network errors gracefully if user is already authenticated
  if (ErrorHandler.isNetworkError(error) && currentState.isAuthenticated && currentState.user) {
    logWarn('[AuthOperations checkAuthStatus] Network error but keeping existing session active');
    
    handleAuthError(error, 'checkAuthStatus', (errorState) => {
      set({
        ...errorState,
        error: 'Network error checking authentication status. Using cached session data.',
        lastAuthCheck: Date.now() - (4 * 60 * 1000) // Reduce cache time
      });
    });
    
    return true;
  }
  
  // Handle other errors
  if (!error.response && currentState.isAuthenticated) {
    handleAuthError(error, 'checkAuthStatus', null);
    set({ isLoading: false });
    return true;
  } else {
    const errorMessage = handleAuthError(error, 'checkAuthStatus', set);
    
    const errorState = createLoginErrorState(errorMessage);
    set({ ...errorState, lastAuthCheck: Date.now() });
    
    dispatchLogoutEvents();
    return false;
  }
}

/**
 * Login with email and password
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @param {Object} formData - User credentials
 * @returns {Promise<boolean>} Whether login was successful
 */
export async function login(set, get, formData) {
  set({ isLoading: true, error: null });
  
  logInfo('[AuthOperations login] Attempting login with formData:', formData);
  
  // Validate form data
  const validation = validateLoginData(formData);
  if (!validation.isValid) {
    const errorMessage = `Invalid form data: ${validation.errors.join(', ')}`;
    logError('[AuthOperations login] Validation error:', errorMessage);
    set(createLoginErrorState(errorMessage));
    return false;
  }
  
  // Clear offline flags
  clearOfflineFlags();
  clearDevModeFlags();
  
  try {
    // Handle development mode
    if (isAdminLoginAttempt(formData)) {
      logInfo('[AuthOperations login] Development mode: Setting admin flags immediately');
      setDevModeFlags();
    }
    
    logInfo('[AuthOperations login] Making API call to /auth/login');
    const response = await apiClient.post('/auth/login', formData);
    logInfo('[AuthOperations login] API Response received:', response.data);
    
    // Normalize and validate response
    const { userData, token } = normalizeAuthResponse(response);
    
    // Clear offline flags again before setting state
    clearOfflineFlags();
    clearDevModeFlags();
    
    // Create success state
    const successState = createLoginSuccessState(userData, token);
    set(successState);
    
    // Dispatch events
    dispatchLoginEvents(userData);
    
    logInfo('[AuthOperations login] Login successful');
    return true;
    
  } catch (error) {
    logError('[AuthOperations login] Error during login:', error);
    
    const errorMessage = error.message || 'Login failed';
    const errorState = createLoginErrorState(errorMessage);
    set(errorState);
    
    return false;
  }
}

/**
 * Logout the current user
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {Promise<void>}
 */
export async function logout(set, get) {
  const apiUrl = (typeof window !== 'undefined' && window.__API_BASE_URL__) || 
                 (global && global.API_BASE_URL) || 'NOT_SET';
  logInfo('[AuthOperations logout] Starting logout process. API URL:', apiUrl);
  
  set({ isLoading: true, error: null });
  
  try {
    // Skip API call in development mode if bypass is enabled
    if (process.env.NODE_ENV === 'development' && isAuthBypassEnabled()) {
      logInfo('[AuthOperations logout] Skipping logout API call in development mode');
    } else {
      try {
        const { authService } = await import('@/services/authService.js');
        await authService.logout();
      } catch (importError) {
        logWarn('[AuthOperations logout] Could not import authService, continuing with local logout');
      }
    }
    
    // Clear state
    const logoutState = createLogoutState();
    set(logoutState);
    
    logInfo('[AuthOperations logout] Logout successful.');
    
  } catch (error) {
    handleAuthError(error, 'logout', (errorState) => {
      ErrorHandler.handle(error, 'AuthOperations.logout', {
        showToast: true,
        logLevel: 'error',
        defaultMessage: 'Logout API call failed, but your session has been cleared locally.'
      });
      
      // Still clear state even on error
      set(createLogoutState());
    });
  }
  
  try {
    // Clear all authentication storage
    clearAllAuthStorage();
    
    // Dispatch logout events
    dispatchLogoutEvents({ cleared: true });
    
    logInfo('[AuthOperations logout] All auth storage and cookies cleared');
  } catch (e) {
    handleAuthError(e, 'clearStorage', null);
  }
} 