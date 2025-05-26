import { CONFIG, TOKEN_CACHE_TTL } from '../utils/config';
import { getCachedValue, setCachedValue } from '../utils/cache';
import { logDebug, logError } from '../utils/logger';

// Cache auth token to reduce localStorage reads
let _cachedAuthToken = null;
let _lastTokenCheck = 0;

/**
 * Get the current authentication token
 * @returns {string|null} The auth token or null if not available
 */
const getAuthToken = () => {
  const now = Date.now();
  
  // Return cached token if still valid
  if (_cachedAuthToken && now - _lastTokenCheck < TOKEN_CACHE_TTL) {
    return _cachedAuthToken;
  }
  
  // Get token from storage
  try {
    const authStorage = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_STORAGE);
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      _cachedAuthToken = authData?.state?.token || null;
      _lastTokenCheck = now;
      return _cachedAuthToken;
    }
  } catch (error) {
    logError('Error getting auth token', error);
  }
  
  return null;
};

/**
 * Add authentication headers to request config
 * @param {Object} config - Axios request config
 * @returns {Object} Updated request config
 */
export const addAuthHeaders = (config) => {
  // Skip for auth requests to prevent infinite loops
  if (config.url?.includes('/auth/')) {
    return config;
  }
  
  // Get the auth token
  const token = getAuthToken();
  
  // Add authorization header if token exists
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
};

/**
 * Handle authentication errors
 * @param {Error} error - Axios error
 * @returns {Promise<Error>} Rejected promise with error
 */
export const handleAuthError = async (error) => {
  const { response, config } = error;
  
  // Handle 401 Unauthorized
  if (response?.status === 401) {
    logWarn('Authentication error', { 
      status: response.status,
      url: config?.url,
      message: response.data?.message
    });
    
    // Clear auth data on 401
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_STORAGE);
      _cachedAuthToken = null;
      _lastTokenCheck = 0;
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }
  
  return Promise.reject(error);
};

/**
 * Setup authentication interceptors
 * @param {Object} axiosInstance - Axios instance
 * @returns {Function} Cleanup function to eject interceptors
 */
export const setupAuthInterceptors = (axiosInstance) => {
  // Request interceptor to add auth headers
  const requestInterceptor = axiosInstance.interceptors.request.use(
    (config) => addAuthHeaders(config),
    (error) => Promise.reject(error)
  );
  
  // Response interceptor to handle auth errors
  const responseInterceptor = axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => handleAuthError(error)
  );
  
  // Return cleanup function
  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptor);
    axiosInstance.interceptors.response.eject(responseInterceptor);
  };
};
