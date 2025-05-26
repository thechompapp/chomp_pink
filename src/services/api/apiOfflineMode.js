/**
 * API Offline Mode
 *
 * Handles offline mode functionality:
 * - Detecting network status
 * - Managing offline mode state
 * - Providing offline fallbacks
 */

import { logDebug, logWarn, logError } from '@/utils/logger';
import { toast } from 'react-hot-toast';

// Constants
const STORAGE_KEYS = {
  OFFLINE_MODE: 'offline-mode',
  OFFLINE_MODE_TIMESTAMP: 'offline-mode-timestamp'
};

// Cache for offline mode state to reduce localStorage reads
let _offlineModeCache = null;
let _lastOfflineModeCheck = 0;
const OFFLINE_MODE_CACHE_TTL = 2000; // 2 seconds

/**
 * Check if the app is in offline mode
 * 
 * @param {boolean} forceCheck - Force a fresh check ignoring cache
 * @returns {boolean} Whether the app is in offline mode
 */
export function isOfflineMode(forceCheck = false) {
  const now = Date.now();
  
  // Use cached value if available and not expired
  if (!forceCheck && _offlineModeCache !== null && (now - _lastOfflineModeCheck) < OFFLINE_MODE_CACHE_TTL) {
    return _offlineModeCache;
  }
  
  try {
    // Check localStorage for offline mode flag
    const offlineMode = localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true';
    
    // Update cache
    _offlineModeCache = offlineMode;
    _lastOfflineModeCheck = now;
    
    return offlineMode;
  } catch (error) {
    // If localStorage is not available, assume we're not in offline mode
    logError('[ApiOfflineMode] Error checking offline mode:', error);
    return false;
  }
}

/**
 * Set the offline mode state
 * 
 * @param {boolean} enabled - Whether to enable offline mode
 * @param {boolean} persistent - Whether to persist the setting
 * @returns {boolean} Whether the operation was successful
 */
export function setOfflineMode(enabled, persistent = false) {
  try {
    // Update cache
    _offlineModeCache = enabled;
    _lastOfflineModeCheck = Date.now();
    
    // Update localStorage if persistent
    if (persistent) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, enabled ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE_TIMESTAMP, Date.now().toString());
    }
    
    // Log the change
    if (enabled) {
      logWarn('[ApiOfflineMode] Entering offline mode');
      
      // Show toast notification
      toast.error('You are now in offline mode. Some features may be limited.', {
        id: 'offline-mode-toast',
        duration: 5000
      });
    } else {
      logDebug('[ApiOfflineMode] Exiting offline mode');
      
      // Show toast notification
      toast.success('You are back online!', {
        id: 'online-mode-toast',
        duration: 3000
      });
    }
    
    return true;
  } catch (error) {
    logError('[ApiOfflineMode] Error setting offline mode:', error);
    return false;
  }
}

/**
 * Check network connectivity
 * 
 * @returns {Promise<boolean>} Whether the network is available
 */
export async function checkNetworkConnectivity() {
  // First check navigator.onLine if available
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    if (!navigator.onLine) {
      return false;
    }
  }
  
  // For more reliable check, try to fetch a small resource
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Network error or timeout
    return false;
  }
}

/**
 * Setup network status listeners
 */
export function setupNetworkListeners() {
  if (typeof window === 'undefined') return;
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    // Double check with a real request before switching mode
    checkNetworkConnectivity().then(isOnline => {
      if (isOnline && isOfflineMode()) {
        setOfflineMode(false, true);
      }
    });
  });
  
  window.addEventListener('offline', () => {
    if (!isOfflineMode()) {
      setOfflineMode(true, true);
    }
  });
  
  // Initial check
  checkNetworkConnectivity().then(isOnline => {
    if (!isOnline && !isOfflineMode()) {
      setOfflineMode(true, true);
    } else if (isOnline && isOfflineMode()) {
      setOfflineMode(false, true);
    }
  });
}

export default {
  isOfflineMode,
  setOfflineMode,
  checkNetworkConnectivity,
  setupNetworkListeners
};
