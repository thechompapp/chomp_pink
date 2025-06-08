/**
 * Offline Mode Interceptor
 * 
 * Handles offline mode detection and fallback strategies:
 * - Browser online/offline event monitoring
 * - Offline mode state management
 * - Development mode offline handling
 * - User notification for offline scenarios
 */

import { toast } from 'react-hot-toast';
import { logDebug, logError, logInfo, logWarn } from '@/utils/logger';

// Configuration constants
const CONFIG = {
  OFFLINE_MODE_CACHE_TTL: 2000, // 2 seconds TTL for offline mode cache
  STORAGE_KEYS: {
    OFFLINE_MODE: 'offline-mode',
    DEV_MODE_NO_BACKEND: 'dev-mode-no-backend',
    AUTH_STORAGE: 'auth-storage'
  },
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    OFFLINE_MODE: 'You are currently in offline mode.'
  }
};

// Cache for offline mode state to reduce localStorage reads
const stateCache = {
  offlineMode: {
    value: null,
    timestamp: 0
  },
  developmentModeNoBackend: false,
  initialized: false
};

/**
 * Initialize offline mode detection
 */
function initializeOfflineDetection() {
  if (stateCache.initialized) return;
  
  // Check if we've previously detected development mode with no backend
  if (process.env.NODE_ENV === 'development') {
    const devModeNoBackend = sessionStorage.getItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND) === 'true';
    stateCache.developmentModeNoBackend = devModeNoBackend;
    
    if (devModeNoBackend) {
      logDebug('[OfflineInterceptor] Development mode with no backend detected from session storage');
    }
  }
  
  // Check initial offline mode
  checkOfflineMode(true);
  
  // Add event listeners for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      logInfo('[OfflineInterceptor] Browser went online');
      // Force refresh offline mode cache
      checkOfflineMode(true);
    });
    
    window.addEventListener('offline', () => {
      logInfo('[OfflineInterceptor] Browser went offline');
      // Force refresh offline mode cache
      checkOfflineMode(true);
    });
  }
  
  stateCache.initialized = true;
  logDebug('[OfflineInterceptor] Offline detection initialized');
}

/**
 * Check if the app is in development mode with no backend available
 * @returns {boolean} - Whether we're in development mode with no backend
 */
export function isDevelopmentModeNoBackend() {
  // Always return false to ensure we're not in offline mode and allow real API calls
  return false;
}

/**
 * Set the development mode no backend flag
 * @param {boolean} value - Whether we're in development mode with no backend
 */
export function setDevelopmentModeNoBackend(value) {
  if (value === stateCache.developmentModeNoBackend) return;
  
  stateCache.developmentModeNoBackend = value;
  
  if (value) {
    logDebug('[OfflineInterceptor] Development mode with no backend detected');
    // Store in session storage to persist across page reloads
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND, 'true');
  } else {
    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND);
  }
}

/**
 * Check if the app is in offline mode
 * @param {boolean} [forceCheck=false] - Force a fresh check ignoring cache
 * @returns {boolean} - Whether the app is in offline mode
 */
export function checkOfflineMode(forceCheck = false) {
  // Check if user is authenticated before considering offline mode
  const authStorage = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_STORAGE);
  let isAuthenticated = false;
  
  try {
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      isAuthenticated = authData?.state?.isAuthenticated || false;
    }
  } catch (err) {
    logError('[OfflineInterceptor] Error parsing auth storage:', err);
  }
  
  // If authenticated, never force offline mode in development
  if (process.env.NODE_ENV === 'development' || isAuthenticated) {
    // Clear any offline flags in storage to ensure consistent behavior
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      localStorage.setItem('force_online', 'true');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND);
    }
    
    // Update cache to indicate online
    stateCache.offlineMode.value = false;
    stateCache.offlineMode.timestamp = Date.now();
    stateCache.developmentModeNoBackend = false;
    
    return false;
  }
  
  // For production, use a simplified check
  // Only consider the browser's navigator.onLine status
  const browserOffline = typeof navigator !== 'undefined' && 
                       typeof navigator.onLine === 'boolean' && 
                       !navigator.onLine;
  
  // Update cache
  stateCache.offlineMode.value = browserOffline;
  stateCache.offlineMode.timestamp = Date.now();
  
  return browserOffline;
}

/**
 * Set app offline mode state
 * @param {boolean} offline - Whether to enable offline mode
 * @param {boolean} [persistent=false] - Whether to persist the setting across sessions
 * @param {boolean} [bypassAuth=true] - Whether to bypass authentication checks in offline mode
 */
export function setOfflineMode(offline, persistent = false, bypassAuth = true) {
  const storage = persistent ? localStorage : sessionStorage;
  
  if (offline) {
    storage.setItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE, 'true');
    logInfo('[OfflineInterceptor] Offline mode enabled', { persistent, bypassAuth });
    
    // Show user notification
    if (typeof toast !== 'undefined') {
      toast.error(CONFIG.ERROR_MESSAGES.OFFLINE_MODE, {
        duration: 5000,
        id: 'offline-mode-toast',
        icon: '📶'
      });
    }
  } else {
    storage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
    logInfo('[OfflineInterceptor] Offline mode disabled');
    
    // Dismiss offline notification
    if (typeof toast !== 'undefined') {
      toast.dismiss('offline-mode-toast');
    }
  }
  
  // Update cache
  stateCache.offlineMode.value = offline;
  stateCache.offlineMode.timestamp = Date.now();
}

/**
 * Check if app is currently in offline mode
 * @returns {boolean} - Whether app is in offline mode
 */
export function isOfflineMode() {
  // Check cache first
  const now = Date.now();
  if (stateCache.offlineMode.value !== null && 
      (now - stateCache.offlineMode.timestamp) < CONFIG.OFFLINE_MODE_CACHE_TTL) {
    return stateCache.offlineMode.value;
  }
  
  // Fallback to checking storage
  try {
    const sessionOffline = sessionStorage.getItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE) === 'true';
    const localOffline = localStorage.getItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE) === 'true';
    const isOffline = sessionOffline || localOffline;
    
    // Update cache
    stateCache.offlineMode.value = isOffline;
    stateCache.offlineMode.timestamp = now;
    
    return isOffline;
  } catch (error) {
    logError('[OfflineInterceptor] Error checking offline mode:', error);
    return false;
  }
}

/**
 * Handle network errors and potentially enable offline mode
 * @param {Object} error - Axios error object
 * @returns {boolean} - Whether this was a network error that was handled
 */
export function handleNetworkError(error) {
  const { response, request } = error;
  
  // Check if this is a network error (no response but request was made)
  if (!response && request) {
    logWarn('[OfflineInterceptor] Network error detected', {
      url: error.config?.url,
      message: error.message
    });
    
    // Check if we should enable offline mode
    if (!checkOfflineMode()) {
      setOfflineMode(true, false); // Non-persistent by default
    }
    
    return true;
  }
  
  return false;
}

/**
 * Get offline mode status and information
 * @returns {Object} - Offline mode status
 */
export function getOfflineStatus() {
  return {
    isOffline: isOfflineMode(),
    browserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    developmentModeNoBackend: stateCache.developmentModeNoBackend,
    lastChecked: stateCache.offlineMode.timestamp
  };
}

/**
 * Setup offline interceptor for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 */
export function setupOfflineInterceptor(axiosInstance, options = {}) {
  const { enabled = true } = options;
  
  if (!enabled) {
    logDebug('[OfflineInterceptor] Offline mode handling disabled');
    return;
  }
  
  // Initialize offline detection
  initializeOfflineDetection();
  
  // Response interceptor to handle network errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle network errors
      if (handleNetworkError(error)) {
        // Mark the error as handled by offline interceptor
        error.isOfflineError = true;
      }
      
      return Promise.reject(error);
    }
  );
  
  logDebug('[OfflineInterceptor] Offline mode interceptor configured');
}
