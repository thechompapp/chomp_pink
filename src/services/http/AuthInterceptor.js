/**
 * Authentication Interceptor
 * 
 * Handles authentication headers and token management for API requests.
 */
import { logDebug, logError, logWarn } from '@/utils/logger';
import { API_BASE_URL } from '@/config';

// Constants for configuration
const CONFIG = {
  // Token cache TTL
  TOKEN_CACHE_TTL: 5000, // 5 seconds TTL for auth token cache
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth-token',
    AUTH_STORAGE: 'auth-storage'
  },
  
  // Error messages
  ERROR_MESSAGES: {
    AUTH_ERROR: 'Authentication error. Please log in again.'
  }
};

// Cache auth token to reduce localStorage reads
let _cachedAuthToken = null;
let _lastTokenCheck = 0;

/**
 * Authentication Interceptor class
 */
class AuthInterceptor {
  /**
   * Get the current authentication token
   * @param {boolean} [forceRefresh=false] - Force a refresh from storage
   * @returns {string|null} - The authentication token or null if not authenticated
   */
  getAuthToken(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached token if it's still valid and refresh is not forced
    if (!forceRefresh && _cachedAuthToken && (now - _lastTokenCheck < CONFIG.TOKEN_CACHE_TTL)) {
      return _cachedAuthToken;
    }
    
    try {
      // Try to get token from localStorage
      const authStorage = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_STORAGE);
      
      if (!authStorage) {
        _cachedAuthToken = null;
        _lastTokenCheck = now;
        return null;
      }
      
      const authData = JSON.parse(authStorage);
      
      if (!authData || !authData.token) {
        _cachedAuthToken = null;
        _lastTokenCheck = now;
        return null;
      }
      
      // Update cache
      _cachedAuthToken = authData.token;
      _lastTokenCheck = now;
      
      return _cachedAuthToken;
    } catch (error) {
      logError('[AuthInterceptor] Error getting auth token:', error);
      _cachedAuthToken = null;
      _lastTokenCheck = now;
      return null;
    }
  }
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} - Whether the user is authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  }
  
  /**
   * Add authentication headers to request config
   * @param {Object} config - Axios request config
   * @returns {Object} - Updated config with auth headers
   */
  addAuthHeaders(config) {
    if (!config) {
      return config;
    }
    
    const token = this.getAuthToken();
    
    if (!token) {
      return config;
    }
    
    // Initialize headers if they don't exist
    if (!config.headers) {
      config.headers = {};
    }
    
    // Add auth token to headers
    config.headers['Authorization'] = `Bearer ${token}`;
    
    return config;
  }
  
  /**
   * Clear the authentication token cache
   */
  clearTokenCache() {
    _cachedAuthToken = null;
    _lastTokenCheck = 0;
  }
  
  /**
   * Setup authentication request interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupRequestInterceptor(axiosInstance) {
    return axiosInstance.interceptors.request.use(
      (config) => {
        return this.addAuthHeaders(config);
      },
      (error) => {
        logError('[AuthInterceptor] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Setup authentication response interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupResponseInterceptor(axiosInstance) {
    return axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle authentication errors (401, 403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          logWarn('[AuthInterceptor] Authentication error:', error.response.status);
          this.clearTokenCache();
          
          // Dispatch authentication error event
          const authErrorEvent = new CustomEvent('auth:error', {
            detail: {
              status: error.response.status,
              message: error.response.data?.message || CONFIG.ERROR_MESSAGES.AUTH_ERROR
            }
          });
          
          window.dispatchEvent(authErrorEvent);
        }
        
        return Promise.reject(error);
      }
    );
  }
}

// Create and export singleton instance
const authInterceptor = new AuthInterceptor();

export default authInterceptor;
