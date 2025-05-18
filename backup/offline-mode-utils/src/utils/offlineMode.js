/**
 * Utility functions for managing offline mode
 * 
 * This module provides a centralized way to manage offline mode settings
 * across localStorage and sessionStorage to ensure consistent behavior.
 */

// Storage keys used for offline mode settings
const STORAGE_KEYS = {
  OFFLINE_MODE: 'offline_mode',
  OLD_OFFLINE_MODE: 'OFFLINE_MODE',
  DEV_MODE_NO_BACKEND: 'dev_mode_no_backend',
  OLD_DEV_MODE_NO_BACKEND: 'DEV_MODE_NO_BACKEND',
  BYPASS_AUTH_CHECK: 'bypass_auth_check',
  OLD_BYPASS_AUTH_CHECK: 'bypass-auth-check',
  FORCE_ONLINE: 'force_online',
  OLD_FORCE_ONLINE: 'FORCE_ONLINE',
  MOCK_RESPONSES: 'mock_responses'
};

/**
 * Disable offline mode by removing all related flags
 * 
 * @returns {boolean} - Success status
 */
export function disableOfflineMode() {
  try {
    // Remove all offline mode flags from localStorage
    localStorage.removeItem(STORAGE_KEYS.OLD_OFFLINE_MODE);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_MODE);
    localStorage.removeItem(STORAGE_KEYS.OLD_BYPASS_AUTH_CHECK);
    localStorage.removeItem(STORAGE_KEYS.BYPASS_AUTH_CHECK);
    
    // Remove all offline mode flags from sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.OLD_DEV_MODE_NO_BACKEND);
    sessionStorage.removeItem(STORAGE_KEYS.DEV_MODE_NO_BACKEND);
    sessionStorage.removeItem(STORAGE_KEYS.OFFLINE_MODE);
    
    // Force online mode
    localStorage.setItem(STORAGE_KEYS.FORCE_ONLINE, 'true');
    localStorage.setItem(STORAGE_KEYS.OLD_FORCE_ONLINE, 'true');
    
    // Dispatch an event for components to respond
    window.dispatchEvent(new CustomEvent('offlineStatusChanged', { 
      detail: { offline: false }
    }));
    
    console.info('[OfflineMode] Offline mode disabled successfully');
    return true;
  } catch (error) {
    console.error('[OfflineMode] Error disabling offline mode:', error);
    return false;
  }
}

/**
 * Enable offline mode by setting all required flags
 * 
 * @param {boolean} [persistent=false] - Whether to persist the setting across sessions
 * @returns {boolean} - Success status
 */
export function enableOfflineMode(persistent = false) {
  try {
    const storage = persistent ? localStorage : sessionStorage;
    
    // Set offline mode flags
    storage.setItem(STORAGE_KEYS.OFFLINE_MODE, 'true');
    
    // Remove any force online flags
    localStorage.removeItem(STORAGE_KEYS.FORCE_ONLINE);
    localStorage.removeItem(STORAGE_KEYS.OLD_FORCE_ONLINE);
    
    // Dispatch an event for components to respond
    window.dispatchEvent(new CustomEvent('offlineStatusChanged', { 
      detail: { offline: true }
    }));
    
    console.info(`[OfflineMode] Offline mode enabled ${persistent ? '(persistent)' : '(session)'}`);
    return true;
  } catch (error) {
    console.error('[OfflineMode] Error enabling offline mode:', error);
    return false;
  }
}

/**
 * Check if the app is in offline mode
 * 
 * @returns {boolean} - Whether the app is in offline mode
 */
export function isOfflineMode() {
  try {
    // Check for force online flag first (highest priority)
    if (localStorage.getItem(STORAGE_KEYS.FORCE_ONLINE) === 'true' || 
        localStorage.getItem(STORAGE_KEYS.OLD_FORCE_ONLINE) === 'true') {
      return false;
    }
    
    // Check browser online status
    const browserOffline = typeof navigator !== 'undefined' && 
                           typeof navigator.onLine === 'boolean' && 
                           !navigator.onLine;
    
    // Check localStorage and sessionStorage settings
    const userPreferenceOffline = localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true' || 
                                 localStorage.getItem(STORAGE_KEYS.OLD_OFFLINE_MODE) === 'true';
    
    const sessionOffline = sessionStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true';
    
    const devModeNoBackend = sessionStorage.getItem(STORAGE_KEYS.DEV_MODE_NO_BACKEND) === 'true' || 
                            sessionStorage.getItem(STORAGE_KEYS.OLD_DEV_MODE_NO_BACKEND) === 'true';
    
    return browserOffline || userPreferenceOffline || sessionOffline || devModeNoBackend;
  } catch (error) {
    console.error('[OfflineMode] Error checking offline mode:', error);
    return false;
  }
}

// Export a default object with all functions
export default {
  disableOfflineMode,
  enableOfflineMode,
  isOfflineMode,
  STORAGE_KEYS
};
