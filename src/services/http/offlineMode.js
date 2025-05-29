/**
 * Offline Mode Manager
 * 
 * Handles offline mode detection and management including:
 * - Browser offline detection
 * - Development mode handling
 * - Offline state caching
 * - Online/offline event handling
 */

import { logDebug, logInfo, logError } from '@/utils/logger';
import { HTTP_CONFIG } from './httpConfig';

// Cache for various states to reduce localStorage reads
const stateCache = {
  offlineMode: {
    value: null,
    timestamp: 0
  },
  developmentModeNoBackend: false,
  initialized: false
};

/**
 * Safe environment variable access for browser compatibility
 * @param {string} key - Environment variable key
 * @returns {string|undefined} Environment variable value
 */
function getEnvVar(key) {
  // Check Vite environment variables first (import.meta is always available in ES modules)
  if (import.meta && import.meta.env) {
    return import.meta.env[key];
  }
  
  // Check process.env if available (Node.js/webpack environments)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  // Check window environment variables as fallback
  if (typeof window !== 'undefined' && window.__ENV__) {
    return window.__ENV__[key];
  }
  
  return undefined;
}

/**
 * Check if we're in development mode
 * @returns {boolean} Whether we're in development mode
 */
function isDevelopmentMode() {
  const nodeEnv = getEnvVar('NODE_ENV') || getEnvVar('VITE_MODE') || 'development';
  return nodeEnv === 'development';
}

/**
 * Check if online mode is forced
 * @returns {boolean} Whether online mode is forced
 */
function isOnlineModeForced() {
  try {
    // Check for force online flags
    const forceOnline = localStorage.getItem('force_online') === 'true' ||
                       sessionStorage.getItem('force_online') === 'true' ||
                       localStorage.getItem('network_override') === 'online';
    
    // In development mode, always prefer online unless explicitly set offline
    const isDev = isDevelopmentMode();
    
    return forceOnline || isDev;
  } catch (error) {
    logError('[OfflineMode] Error checking force online flags:', error);
    return isDevelopmentMode(); // Default to development mode check
  }
}

/**
 * Initialize offline mode detection
 * Sets up event listeners and checks initial state
 */
export function initializeOfflineMode() {
  if (stateCache.initialized) return;
  
  // Check if we've previously detected development mode with no backend
  if (isDevelopmentMode()) {
    const devModeNoBackendKey = HTTP_CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND;
    const devModeNoBackend = sessionStorage.getItem(devModeNoBackendKey) === 'true';
    stateCache.developmentModeNoBackend = devModeNoBackend;
    
    if (devModeNoBackend) {
      logDebug('[OfflineMode] Development mode with no backend detected from session storage');
    }
  }
  
  // Check initial offline mode
  checkOfflineMode(true);
  
  // Add event listeners for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);
    
    // Listen for forced online events
    window.addEventListener('app:force_online', handleForceOnlineEvent);
  }
  
  stateCache.initialized = true;
  logInfo('[OfflineMode] Offline mode detection initialized');
}

/**
 * Handle browser online event
 */
function handleOnlineEvent() {
  logInfo('[OfflineMode] Browser went online');
  // Force refresh offline mode cache
  checkOfflineMode(true);
  // Notify listeners of potential state change
  notifyOfflineListeners();
}

/**
 * Handle browser offline event
 */
function handleOfflineEvent() {
  logInfo('[OfflineMode] Browser went offline');
  // Force refresh offline mode cache
  checkOfflineMode(true);
  // Notify listeners of potential state change
  notifyOfflineListeners();
}

/**
 * Handle forced online event
 */
function handleForceOnlineEvent() {
  logInfo('[OfflineMode] Received force online event');
  // Clear offline mode cache and force online
  stateCache.offlineMode.value = false;
  stateCache.offlineMode.timestamp = Date.now();
  stateCache.developmentModeNoBackend = false;
  
  // Notify listeners
  notifyOfflineListeners();
}

/**
 * Check if the app is in development mode with no backend available
 * @returns {boolean} Whether we're in development mode with no backend
 */
export function isDevelopmentModeNoBackend() {
  // In development, always prefer online mode unless explicitly offline
  if (isOnlineModeForced()) {
    return false;
  }
  
  return stateCache.developmentModeNoBackend;
}

/**
 * Set the development mode no backend flag
 * @param {boolean} value - Whether we're in development mode with no backend
 */
export function setDevelopmentModeNoBackend(value) {
  if (value === stateCache.developmentModeNoBackend) return;
  
  stateCache.developmentModeNoBackend = value;
  
  const storageKey = HTTP_CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND;
  
  if (value) {
    logDebug('[OfflineMode] Development mode with no backend detected');
    // Store in session storage to persist across page reloads
    sessionStorage.setItem(storageKey, 'true');
  } else {
    sessionStorage.removeItem(storageKey);
  }
}

/**
 * Check if the app is in offline mode
 * @param {boolean} forceCheck - Force a fresh check ignoring cache
 * @returns {boolean} Whether the app is in offline mode
 */
export function checkOfflineMode(forceCheck = false) {
  // First check: if online mode is forced, always return false
  if (isOnlineModeForced()) {
    // Update cache to indicate online
    stateCache.offlineMode.value = false;
    stateCache.offlineMode.timestamp = Date.now();
    stateCache.developmentModeNoBackend = false;
    
    // Clear any conflicting offline flags
    try {
      localStorage.removeItem(HTTP_CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      sessionStorage.removeItem(HTTP_CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      sessionStorage.removeItem(HTTP_CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND);
    } catch (error) {
      logError('[OfflineMode] Error clearing offline flags:', error);
    }
    
    return false;
  }
  
  // Check if user is authenticated before considering offline mode
  const authStorageKey = HTTP_CONFIG.STORAGE_KEYS.AUTH_STORAGE;
  let isAuthenticated = false;
  
  try {
    const authStorage = localStorage.getItem(authStorageKey) || 
                       localStorage.getItem('auth-authentication-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      isAuthenticated = authData?.state?.isAuthenticated || false;
    }
  } catch (err) {
    logError('[OfflineMode] Error parsing auth storage:', err);
  }
  
  // If authenticated in development, prefer online mode
  if (isDevelopmentMode() && isAuthenticated) {
    // Update cache to indicate online
    stateCache.offlineMode.value = false;
    stateCache.offlineMode.timestamp = Date.now();
    stateCache.developmentModeNoBackend = false;
    
    return false;
  }
  
  // For production or unauthenticated users, use a simplified check
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
 * @param {boolean} persistent - Whether to persist the setting across sessions
 * @param {boolean} bypassAuth - Whether to bypass authentication checks in offline mode
 */
export function setOfflineMode(offline, persistent = false, bypassAuth = true) {
  const storage = persistent ? localStorage : sessionStorage;
  const storageKey = HTTP_CONFIG.STORAGE_KEYS.OFFLINE_MODE;
  
  if (offline) {
    storage.setItem(storageKey, 'true');
    logInfo('[OfflineMode] Offline mode enabled');
  } else {
    storage.removeItem(storageKey);
    logInfo('[OfflineMode] Offline mode disabled');
  }
  
  // Update cache
  stateCache.offlineMode.value = offline;
  stateCache.offlineMode.timestamp = Date.now();
  
  // Notify listeners
  notifyOfflineListeners();
}

/**
 * Get current offline mode status
 * @returns {Object} Offline mode status
 */
export function getOfflineStatus() {
  return {
    isOffline: checkOfflineMode(),
    browserOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    isDevelopmentMode: isDevelopmentMode(),
    isDevelopmentModeNoBackend: stateCache.developmentModeNoBackend,
    isOnlineModeForced: isOnlineModeForced(),
    lastCheck: stateCache.offlineMode.timestamp
  };
}

/**
 * Check if we can make network requests
 * @returns {boolean} Whether network requests are allowed
 */
export function canMakeNetworkRequests() {
  // Always allow network requests if online mode is forced
  if (isOnlineModeForced()) {
    return true;
  }
  
  // Always allow network requests in development
  if (isDevelopmentMode()) {
    return true;
  }
  
  // Check if we're truly offline
  const isOffline = checkOfflineMode();
  return !isOffline;
}

// Offline state listeners
const offlineListeners = new Set();

/**
 * Subscribe to offline mode changes
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOfflineMode(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  offlineListeners.add(callback);
  
  // Call immediately with current state
  try {
    callback(getOfflineStatus());
  } catch (error) {
    console.error('[OfflineMode] Error in offline callback:', error);
  }
  
  // Return unsubscribe function
  return () => {
    offlineListeners.delete(callback);
  };
}

/**
 * Notify all offline mode listeners
 */
function notifyOfflineListeners() {
  const status = getOfflineStatus();
  offlineListeners.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error('[OfflineMode] Error in offline listener:', error);
    }
  });
}

/**
 * Clean up offline mode (remove event listeners, clear cache)
 */
export function cleanupOfflineMode() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnlineEvent);
    window.removeEventListener('offline', handleOfflineEvent);
    window.removeEventListener('app:force_online', handleForceOnlineEvent);
  }
  
  // Clear cache
  stateCache.offlineMode.value = null;
  stateCache.offlineMode.timestamp = 0;
  stateCache.developmentModeNoBackend = false;
  stateCache.initialized = false;
  
  // Clear listeners
  offlineListeners.clear();
  
  logInfo('[OfflineMode] Offline mode cleaned up');
} 