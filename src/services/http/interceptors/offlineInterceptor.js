import { CONFIG } from '../utils/config';
import { getCachedValue, setCachedValue } from '../utils/cache';
import { logDebug, logWarn } from '../utils/logger';

// Cache for offline mode state
let _offlineMode = false;
let _lastOfflineCheck = 0;

/**
 * Check if the app is in offline mode
 * @param {boolean} [forceCheck=false] - Force a fresh check
 * @returns {boolean} True if in offline mode
 */
export const checkOfflineMode = (forceCheck = false) => {
  const now = Date.now();
  
  // Return cached value if still valid
  if (!forceCheck && now - _lastOfflineCheck < CONFIG.OFFLINE_MODE_CACHE_TTL) {
    return _offlineMode;
  }
  
  // Check browser online status
  const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  
  // Check stored offline mode preference
  let storedOfflineMode = false;
  try {
    storedOfflineMode = localStorage.getItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE) === 'true';
  } catch (error) {
    logWarn('Error reading offline mode from storage', error);
  }
  
  // Update the cached value
  _offlineMode = isBrowserOffline || storedOfflineMode;
  _lastOfflineCheck = now;
  
  return _offlineMode;
};

/**
 * Set the offline mode state
 * @param {boolean} offline - Whether to enable offline mode
 * @param {boolean} [persistent=false] - Whether to persist the setting
 */
export const setOfflineMode = (offline, persistent = false) => {
  _offlineMode = Boolean(offline);
  _lastOfflineCheck = Date.now();
  
  if (persistent) {
    try {
      if (offline) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE, 'true');
      } else {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      }
    } catch (error) {
      logWarn('Error updating offline mode in storage', error);
    }
  }
  
  logDebug(`Offline mode ${offline ? 'enabled' : 'disabled'}`);
};

/**
 * Check if a request should be allowed in offline mode
 * @param {Object} config - Axios request config
 * @returns {boolean} True if the request should be allowed
 */
const shouldAllowInOfflineMode = (config) => {
  // Allow GET requests by default in offline mode
  const method = config.method?.toLowerCase();
  if (method === 'get') return true;
  
  // Allow certain endpoints that are safe for offline
  const { url } = config;
  const allowedEndpoints = [
    '/auth/refresh-token',
    '/sync/queue',
    // Add other endpoints that should work offline
  ];
  
  return allowedEndpoints.some(endpoint => url.includes(endpoint));
};

/**
 * Handle offline request
 * @param {Object} config - Axios request config
 * @returns {Promise} Rejected promise with offline error
 */
const handleOfflineRequest = (config) => {
  const { url, method } = config;
  
  // Create offline error
  const error = new Error(CONFIG.ERROR_MESSAGES.OFFLINE_MODE);
  error.isOfflineError = true;
  error.config = config;
  
  logWarn(`Blocked ${method?.toUpperCase()} ${url} - Offline mode`);
  
  // Show toast notification
  if (typeof window !== 'undefined' && window.toast) {
    window.toast.error(CONFIG.ERROR_MESSAGES.OFFLINE_MODE, {
      id: 'offline-mode-error'
    });
  }
  
  return Promise.reject(error);
};

/**
 * Setup offline interceptors
 * @param {Object} axiosInstance - Axios instance
 * @returns {Function} Cleanup function to eject interceptors
 */
export const setupOfflineInterceptors = (axiosInstance) => {
  // Request interceptor to check offline mode
  const requestInterceptor = axiosInstance.interceptors.request.use(
    (config) => {
      const isOffline = checkOfflineMode();
      
      // Block non-GET requests in offline mode
      if (isOffline && !shouldAllowInOfflineMode(config)) {
        return handleOfflineRequest(config);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor to handle network errors
  const responseInterceptor = axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle network errors that might indicate we're offline
      if (
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error'
      ) {
        setOfflineMode(true);
        
        // If this was a GET request, try to return cached data if available
        const { config, response } = error;
        if (config?.method?.toLowerCase() === 'get') {
          const cacheKey = `cache:${config.url}`;
          const cachedData = getCachedValue(cacheKey);
          
          if (cachedData) {
            logDebug(`Returning cached data for ${config.url}`);
            return Promise.resolve({
              ...response,
              data: cachedData,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config,
              isFromCache: true
            });
          }
        }
        
        // Otherwise, return the original error
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );
  
  // Return cleanup function
  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptor);
    axiosInstance.interceptors.response.eject(responseInterceptor);
  };
};

// Initialize offline mode check when the module loads
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logDebug('Browser went online');
    // Force refresh offline mode cache
    checkOfflineMode(true);
  });
  
  window.addEventListener('offline', () => {
    logDebug('Browser went offline');
    setOfflineMode(true);
  });
}
