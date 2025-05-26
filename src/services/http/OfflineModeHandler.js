/**
 * Offline Mode Handler
 * 
 * Manages offline detection and strategies for API requests.
 */
import { logDebug, logWarn, logInfo } from '@/utils/logger';

// Constants for configuration
const CONFIG = {
  // Cache TTLs
  OFFLINE_MODE_CACHE_TTL: 2000, // 2 seconds TTL for offline mode cache
  
  // Storage keys
  STORAGE_KEYS: {
    OFFLINE_MODE: 'offline-mode',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    OFFLINE_MODE: 'You are currently in offline mode.'
  }
};

/**
 * Offline Mode Handler class
 */
class OfflineModeHandler {
  constructor() {
    // Cache for offline mode state
    this._offlineMode = null;
    this._lastOfflineCheck = 0;
    
    // Initialize offline detection
    this.initialize();
  }
  
  /**
   * Initialize offline detection
   */
  initialize() {
    // Add event listeners for online/offline events
    window.addEventListener('online', this.handleOnlineEvent.bind(this));
    window.addEventListener('offline', this.handleOfflineEvent.bind(this));
    
    // Check initial offline state
    this.checkOfflineMode(true);
    
    logDebug('[OfflineModeHandler] Initialized');
  }
  
  /**
   * Handle online event
   */
  handleOnlineEvent() {
    logInfo('[OfflineModeHandler] Device is online');
    this.setOfflineMode(false);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app:online'));
  }
  
  /**
   * Handle offline event
   */
  handleOfflineEvent() {
    logWarn('[OfflineModeHandler] Device is offline');
    this.setOfflineMode(true);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app:offline'));
  }
  
  /**
   * Check if the app is in offline mode
   * @param {boolean} [forceCheck=false] - Force a fresh check ignoring cache
   * @returns {boolean} - Whether the app is in offline mode
   */
  checkOfflineMode(forceCheck = false) {
    const now = Date.now();
    
    // Return cached value if it's still valid and refresh is not forced
    if (!forceCheck && this._offlineMode !== null && (now - this._lastOfflineCheck < CONFIG.OFFLINE_MODE_CACHE_TTL)) {
      return this._offlineMode;
    }
    
    // Check if offline mode is manually set in localStorage
    try {
      const storedOfflineMode = localStorage.getItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      
      if (storedOfflineMode !== null) {
        const parsedValue = JSON.parse(storedOfflineMode);
        
        if (typeof parsedValue === 'object' && parsedValue !== null) {
          // Handle stored object format
          this._offlineMode = parsedValue.enabled === true;
          this._lastOfflineCheck = now;
          return this._offlineMode;
        } else if (typeof parsedValue === 'boolean') {
          // Handle stored boolean format
          this._offlineMode = parsedValue;
          this._lastOfflineCheck = now;
          return this._offlineMode;
        }
      }
    } catch (error) {
      logWarn('[OfflineModeHandler] Error reading offline mode from storage:', error);
    }
    
    // If no stored value, check navigator.onLine
    this._offlineMode = !navigator.onLine;
    this._lastOfflineCheck = now;
    
    return this._offlineMode;
  }
  
  /**
   * Set app offline mode state
   * @param {boolean} offline - Whether to enable offline mode
   * @param {boolean} [persistent=false] - Whether to persist the setting across sessions
   * @param {boolean} [bypassAuth=true] - Whether to bypass authentication checks in offline mode
   */
  setOfflineMode(offline, persistent = false, bypassAuth = true) {
    const now = Date.now();
    
    // Update cache
    this._offlineMode = offline;
    this._lastOfflineCheck = now;
    
    // Store in localStorage if persistent
    if (persistent) {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE, JSON.stringify({
          enabled: offline,
          timestamp: now,
          bypassAuth
        }));
        
        logInfo(`[OfflineModeHandler] Offline mode ${offline ? 'enabled' : 'disabled'} (persistent)`);
      } catch (error) {
        logWarn('[OfflineModeHandler] Error storing offline mode in localStorage:', error);
      }
    } else {
      // Remove from localStorage if it exists
      try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      } catch (error) {
        // Ignore errors here
      }
      
      logInfo(`[OfflineModeHandler] Offline mode ${offline ? 'enabled' : 'disabled'} (temporary)`);
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app:offlineChange', {
      detail: {
        offline,
        persistent,
        bypassAuth
      }
    }));
  }
  
  /**
   * Check if a request should be allowed in offline mode
   * @param {Object} config - Axios request config
   * @returns {boolean} - Whether the request should be allowed
   */
  shouldAllowRequestInOfflineMode(config) {
    if (!config) {
      return false;
    }
    
    // Check if the request has the allowOffline flag
    if (config.allowOffline === true) {
      return true;
    }
    
    // Check if it's a GET request (generally safe in offline mode)
    if (config.method && config.method.toUpperCase() === 'GET') {
      return true;
    }
    
    // By default, don't allow non-GET requests in offline mode
    return false;
  }
  
  /**
   * Setup offline mode request interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupRequestInterceptor(axiosInstance) {
    return axiosInstance.interceptors.request.use(
      (config) => {
        // Check if we're in offline mode
        const isOffline = this.checkOfflineMode();
        
        if (isOffline) {
          // Add offline flag to request config
          config.isOffline = true;
          
          // Check if request should be allowed in offline mode
          if (!this.shouldAllowRequestInOfflineMode(config)) {
            // Reject request with offline error
            return Promise.reject({
              config,
              message: CONFIG.ERROR_MESSAGES.OFFLINE_MODE,
              offline: true
            });
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
}

// Create and export singleton instance
const offlineModeHandler = new OfflineModeHandler();

export default offlineModeHandler;
