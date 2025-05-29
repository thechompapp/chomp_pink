/**
 * Authentication State Utilities
 * 
 * Handles authentication state management utilities including:
 * - State throttling and optimization
 * - Error handling for auth operations
 * - State validation and normalization
 * - Cache management for auth checks
 */

import { logInfo, logWarn, logError } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { AUTH_CONFIG } from './authConfig';

// Track last state update for throttling
let lastStateUpdate = 0;

/**
 * Centralized error handler for auth operations
 * @param {Error} error - The error object
 * @param {string} operation - Name of the operation (login, logout, etc.)
 * @param {Function} setFn - State setter function
 * @returns {string} Error message for return value
 */
export function handleAuthError(error, operation, setFn) {
  const errorInfo = ErrorHandler.handle(error, `AuthenticationStore.${operation}`, {
    showToast: true,
    includeStack: process.env.NODE_ENV === 'development'
  });
  
  if (setFn) {
    setFn({ 
      isLoading: false, 
      error: errorInfo.message
    });
  }
  
  return errorInfo.message;
}

/**
 * Create a throttled state setter to prevent excessive re-renders
 * @param {Function} originalSet - Original Zustand set function
 * @returns {Function} Throttled set function
 */
export function createThrottledSetter(originalSet) {
  return (newState) => {
    const now = Date.now();
    
    // Only throttle in development mode
    if (process.env.NODE_ENV === 'development' && 
        now - lastStateUpdate < AUTH_CONFIG.THROTTLE_INTERVAL) {
      return;
    }
    
    lastStateUpdate = now;
    originalSet(newState);
  };
}

/**
 * Check if authentication check should be cached
 * @param {Object} currentState - Current authentication state
 * @param {boolean} forceCheck - Whether to force a fresh check
 * @returns {boolean} Whether to use cached result
 */
export function shouldUseCachedAuth(currentState, forceCheck = false) {
  if (forceCheck) return false;
  
  const now = Date.now();
  const lastCheck = currentState.lastAuthCheck || 0;
  const timeSinceLastCheck = now - lastCheck;
  
  return currentState.isAuthenticated && 
         currentState.user && 
         timeSinceLastCheck < AUTH_CONFIG.SESSION_CACHE_DURATION;
}

/**
 * Validate login form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result
 */
export function validateLoginData(formData) {
  const errors = [];
  
  if (!formData || typeof formData !== 'object') {
    errors.push('Form data must be an object');
  } else {
    if (typeof formData.email !== 'string') {
      errors.push('Email must be a string');
    }
    if (typeof formData.password !== 'string') {
      errors.push('Password must be a string');
    }
    if (formData.email && !formData.email.includes('@')) {
      errors.push('Email must be a valid email address');
    }
    if (formData.password && formData.password.length < 1) {
      errors.push('Password cannot be empty');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if login attempt is for admin in development
 * @param {Object} formData - Login form data
 * @returns {boolean} Whether this is an admin login attempt
 */
export function isAdminLoginAttempt(formData) {
  if (process.env.NODE_ENV !== 'development') return false;
  
  return formData.email === AUTH_CONFIG.DEV_MODE.ADMIN_EMAIL || 
         formData.email.includes('admin');
}

/**
 * Create authentication state object
 * @param {Object} options - State options
 * @returns {Object} Authentication state
 */
export function createAuthState(options = {}) {
  const {
    isAuthenticated = false,
    user = null,
    token = null,
    isLoading = false,
    error = null,
    lastAuthCheck = null
  } = options;
  
  return {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    lastAuthCheck
  };
}

/**
 * Create successful login state
 * @param {Object} userData - User data
 * @param {string} token - Authentication token
 * @returns {Object} Login success state
 */
export function createLoginSuccessState(userData, token) {
  return createAuthState({
    isAuthenticated: true,
    user: userData,
    token,
    isLoading: false,
    error: null,
    lastAuthCheck: Date.now()
  });
}

/**
 * Create login error state
 * @param {string} errorMessage - Error message
 * @returns {Object} Login error state
 */
export function createLoginErrorState(errorMessage) {
  return createAuthState({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: errorMessage
  });
}

/**
 * Create logout state
 * @returns {Object} Logout state
 */
export function createLogoutState() {
  return createAuthState({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null
  });
}

/**
 * Create development mode authentication state
 * @returns {Object} Development auth state
 */
export function createDevModeAuthState() {
  const adminToken = AUTH_CONFIG.DEV_MODE.generateAdminToken();
  
  return createAuthState({
    isAuthenticated: true,
    user: AUTH_CONFIG.DEV_MODE.MOCK_ADMIN_USER,
    token: adminToken,
    isLoading: false,
    error: null,
    lastAuthCheck: Date.now()
  });
}

/**
 * Normalize API response data
 * @param {Object} response - API response
 * @returns {Object} Normalized response data
 */
export function normalizeAuthResponse(response) {
  if (!response?.data) {
    throw new Error('Invalid API response: No data field');
  }
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'API request failed');
  }
  
  if (!response.data.data) {
    throw new Error('Invalid API response: No user data');
  }
  
  return {
    userData: response.data.data,
    token: response.data.token || response.data.data.token || null,
    message: response.data.message
  };
}

/**
 * Create timeout promise for API calls
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} operation - Operation name for error message
 * @returns {Promise} Timeout promise
 */
export function createTimeoutPromise(timeout, operation) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`${operation} timed out`)), timeout)
  );
}

/**
 * Validate authentication state
 * @param {Object} state - State to validate
 * @returns {Object} Validation result
 */
export function validateAuthState(state) {
  const warnings = [];
  
  if (state.isAuthenticated && !state.user) {
    warnings.push('User is authenticated but user data is missing');
  }
  
  if (state.isAuthenticated && !state.token) {
    warnings.push('User is authenticated but token is missing');
  }
  
  if (!state.isAuthenticated && (state.user || state.token)) {
    warnings.push('User is not authenticated but user data or token exists');
  }
  
  if (state.isLoading && state.error) {
    warnings.push('State is loading but has error');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Get time since last auth check in human readable format
 * @param {number} lastAuthCheck - Timestamp of last check
 * @returns {string} Human readable time difference
 */
export function getTimeSinceLastCheck(lastAuthCheck) {
  if (!lastAuthCheck) return 'never';
  
  const now = Date.now();
  const diffMs = now - lastAuthCheck;
  const diffSeconds = Math.round(diffMs / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)}m ago`;
  return `${Math.round(diffSeconds / 3600)}h ago`;
} 