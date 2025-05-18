/**
 * Network utility functions for handling online/offline modes
 * and network status detection
 */
import logger from './logger';

const networkUtils = {
  /**
   * Check if the application is currently in offline mode
   * @returns {boolean} True if in offline mode
   */
  isOfflineMode() {
    return localStorage.getItem('offline_mode') === 'true';
  },

  /**
   * Set the application's offline mode state
   * @param {boolean} isOffline - Whether to enable offline mode
   */
  setOfflineMode(isOffline) {
    if (isOffline) {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem('bypass_auth_check', 'true');
      logger.debug('[networkUtils] Offline mode enabled');
    } else {
      localStorage.removeItem('offline_mode');
      localStorage.removeItem('bypass_auth_check');
      logger.debug('[networkUtils] Offline mode disabled');
    }
    
    // Dispatch event for components to respond
    window.dispatchEvent(new CustomEvent('offlineStatusChanged', { 
      detail: { offline: isOffline }
    }));
  },

  /**
   * Force online mode, clearing all offline-related flags
   */
  forceOnlineMode() {
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('bypass_auth_check');
    localStorage.setItem('force_online', 'true');
    logger.debug('[networkUtils] Forced online mode');
    
    // Dispatch event for components to respond
    window.dispatchEvent(new CustomEvent('offlineStatusChanged', { 
      detail: { offline: false, forced: true }
    }));
  },
  
  /**
   * Check if the browser has internet connectivity
   * @returns {boolean} True if online
   */
  isOnline() {
    return navigator.onLine;
  },
  
  /**
   * Add event listeners for online/offline events
   * @param {Function} onOnline - Callback for when device goes online
   * @param {Function} onOffline - Callback for when device goes offline
   * @returns {Function} Cleanup function to remove event listeners
   */
  addConnectivityListeners(onOnline, onOffline) {
    if (typeof onOnline === 'function') {
      window.addEventListener('online', onOnline);
    }
    
    if (typeof onOffline === 'function') {
      window.addEventListener('offline', onOffline);
    }
    
    return () => {
      if (typeof onOnline === 'function') {
        window.removeEventListener('online', onOnline);
      }
      
      if (typeof onOffline === 'function') {
        window.removeEventListener('offline', onOffline);
      }
    };
  }
};

export default networkUtils; 