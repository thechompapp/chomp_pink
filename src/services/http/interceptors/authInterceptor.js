/**
 * Authentication Interceptor
 * 
 * Handles authentication-related HTTP interception:
 * - Adding authentication headers to requests
 * - Token caching and retrieval
 * - Authentication error handling
 */

import { logDebug, logError, logWarn } from '@/utils/logger';

// Cache for authentication token to reduce localStorage reads
let _cachedAuthToken = null;
let _tokenCacheTimestamp = 0;
const TOKEN_CACHE_TTL = 5000; // 5 seconds

/**
 * Get authentication token from storage with caching
 * @returns {string|null} - Authentication token or null
 */
function getAuthToken() {
  const now = Date.now();
  
  // Return cached token if still valid
  if (_cachedAuthToken && (now - _tokenCacheTimestamp) < TOKEN_CACHE_TTL) {
    return _cachedAuthToken;
  }
  
  try {
    // Try to get token from localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      const token = authData?.state?.token;
      
      if (token) {
        _cachedAuthToken = token;
        _tokenCacheTimestamp = now;
        return token;
      }
    }
    
    // Try alternative storage location
    const directToken = localStorage.getItem('auth-token');
    if (directToken) {
      _cachedAuthToken = directToken;
      _tokenCacheTimestamp = now;
      return directToken;
    }
  } catch (error) {
    logError('[AuthInterceptor] Error reading auth token:', error);
  }
  
  // Clear cache if no token found
  _cachedAuthToken = null;
  _tokenCacheTimestamp = 0;
  return null;
}

/**
 * Clear cached authentication token
 */
export function clearAuthTokenCache() {
  _cachedAuthToken = null;
  _tokenCacheTimestamp = 0;
  logDebug('[AuthInterceptor] Auth token cache cleared');
}

/**
 * Add authentication headers to request config
 * @param {Object} config - Axios request config
 * @returns {Object} - Modified request config
 */
export function addAuthHeaders(config) {
  try {
    const token = getAuthToken();
    
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      
      // Add authorization header
      config.headers.Authorization = `Bearer ${token}`;
      
      logDebug('[AuthInterceptor] Added auth token to request', {
        url: config.url,
        method: config.method,
        hasToken: !!token
      });
    } else {
      logDebug('[AuthInterceptor] No auth token available for request', {
        url: config.url,
        method: config.method
      });
    }
    
    return config;
  } catch (error) {
    logError('[AuthInterceptor] Error adding auth headers:', error);
    return config;
  }
}

/**
 * Handle authentication-related response errors
 * @param {Object} error - Axios error object
 * @returns {boolean} - Whether this was an auth error that was handled
 */
export function handleAuthError(error) {
  const status = error.response?.status;
  
  if (status === 401 || status === 403) {
    logWarn('[AuthInterceptor] Authentication error detected, clearing auth cache', {
      status,
      url: error.config?.url
    });
    
    // Clear cached auth token
    clearAuthTokenCache();
    
    if (status === 401) {
      // Handle session expiration
      handleSessionExpired();
      return true;
    } else if (status === 403) {
      // Handle permission denied
      handlePermissionDenied();
      return true;
    }
  }
  
  return false;
}

/**
 * Handle session expiration (401 errors)
 */
function handleSessionExpired() {
  logWarn('[AuthInterceptor] Session expired');
  
  // Store current path for redirect after login
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    sessionStorage.setItem('redirect_after_login', window.location.pathname);
    
    // Navigate to login page
    if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState({}, '', '/login');
      // Trigger a popstate event to notify React Router
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.href = '/login';
    }
  }
}

/**
 * Handle permission denied (403 errors)
 */
function handlePermissionDenied() {
  logWarn('[AuthInterceptor] Permission denied');
  // Additional handling for 403 errors can be added here
}

/**
 * Check if user is currently authenticated
 * @returns {boolean} - Whether user is authenticated
 */
export function isAuthenticated() {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      return authData?.state?.isAuthenticated || false;
    }
  } catch (error) {
    logError('[AuthInterceptor] Error checking authentication status:', error);
  }
  
  return false;
}

/**
 * Setup authentication interceptor for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 */
export function setupAuthInterceptor(axiosInstance, options = {}) {
  const { enabled = true } = options;
  
  if (!enabled) {
    logDebug('[AuthInterceptor] Authentication interceptor disabled');
    return;
  }
  
  // Request interceptor to add auth headers
  axiosInstance.interceptors.request.use(
    (config) => {
      return addAuthHeaders(config);
    },
    (error) => {
      logError('[AuthInterceptor] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
  
  logDebug('[AuthInterceptor] Authentication interceptor configured');
}
