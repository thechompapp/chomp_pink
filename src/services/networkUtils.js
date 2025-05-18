/**
 * Network Utilities
 * Handles network connectivity status and offline functionality
 */

import { logDebug, logInfo, logWarn } from '@/utils/logger';

const networkUtils = {
  /**
   * Get current offline status
   * @returns {boolean} Whether the app is in offline mode
   */
  isOfflineMode() {
    return typeof localStorage !== 'undefined' && 
           localStorage.getItem('offline_mode') === 'true';
  },

  /**
   * Set offline mode status
   * @param {boolean} isOffline - Whether to enable offline mode
   */
  setOfflineMode(isOffline) {
    if (isOffline) {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem('bypass_auth_check', 'true');
      logWarn('[NetworkUtils] Offline mode enabled');
    } else {
      localStorage.removeItem('offline_mode');
      localStorage.removeItem('bypass_auth_check');
      logInfo('[NetworkUtils] Offline mode disabled');
    }
    
    // Dispatch event for components to detect
    window.dispatchEvent(new CustomEvent('offlineStatusChanged', { 
      detail: { isOffline } 
    }));
  },

  /**
   * Toggle offline mode
   * @returns {boolean} New offline mode status
   */
  toggleOfflineMode() {
    const currentStatus = this.isOfflineMode();
    this.setOfflineMode(!currentStatus);
    return !currentStatus;
  },

  /**
   * Setup network status detection
   */
  setupNetworkDetection() {
    // Handle online event
    window.addEventListener('online', () => {
      logInfo('[NetworkUtils] Browser reports online status');
      // Don't automatically disable offline mode - let user decide
    });

    // Handle offline event
    window.addEventListener('offline', () => {
      logWarn('[NetworkUtils] Browser reports offline status');
      // Optionally enable offline mode automatically
      // this.setOfflineMode(true);
    });

    // Log initial status
    logDebug(`[NetworkUtils] Initial network status: ${navigator.onLine ? 'online' : 'offline'}`);
    
    // Check if we're already in offline mode
    if (this.isOfflineMode()) {
      logWarn('[NetworkUtils] Started in offline mode');
    }
  }
};

export { networkUtils };
export default networkUtils; 