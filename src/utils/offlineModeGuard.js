/**
 * Offline Mode Guard
 * 
 * This utility ensures that offline mode is properly managed and never
 * interferes with authentication state. It forcefully clears offline mode
 * flags when a user is authenticated and ensures admin features are visible
 * in development mode.
 */

import { logInfo, logDebug, logError } from '@/utils/logger';

class OfflineModeGuard {
  constructor() {
    this.initialized = false;
    this.intervalId = null;
  }

  /**
   * Initialize the offline mode guard
   */
  initialize() {
    if (this.initialized) return;
    
    logInfo('[OfflineModeGuard] Initializing');
    
    // Clear offline mode flags immediately
    this.clearOfflineModeFlags();
    
    // Set up less frequent interval to check offline mode flags (every 30 seconds instead of 2)
    this.intervalId = setInterval(() => this.checkAndClearOfflineMode(), 30000);
    
    // Listen for authentication events (these are more important than polling)
    window.addEventListener('auth:login_complete', () => this.clearOfflineModeFlags());
    window.addEventListener('auth:superuser_status_changed', () => this.clearOfflineModeFlags());
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.clearOfflineModeFlags());
    window.addEventListener('offline', () => {
      logInfo('[OfflineModeGuard] Browser went offline');
      // Don't clear flags when going offline
    });
    
    this.initialized = true;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Whether the user is authenticated
   */
  isAuthenticated() {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) return false;
      
      const authData = JSON.parse(authStorage);
      return authData?.state?.isAuthenticated || false;
    } catch (err) {
      console.error('[OfflineModeGuard] Error checking authentication state:', err);
      return false;
    }
  }

  /**
   * Check and clear offline mode flags if needed
   */
  checkAndClearOfflineMode() {
    try {
      // CRITICAL: Always clear offline mode in development
      if (process.env.NODE_ENV === 'development') {
        this.clearOfflineModeFlags();
        
        // Set admin flags in development mode
        if (this.isAuthenticated()) {
          localStorage.setItem('admin_access_enabled', 'true');
          localStorage.setItem('superuser_override', 'true');
          localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
        }
        return;
      }
      
      // Clear offline mode flags if authenticated
      if (this.isAuthenticated()) {
        this.clearOfflineModeFlags();
      }
      
      // Check if admin flags are set - never allow offline mode with admin flags
      if (localStorage.getItem('admin_access_enabled') === 'true' || 
          localStorage.getItem('superuser_override') === 'true' || 
          localStorage.getItem('auth-token')) {
        this.clearOfflineModeFlags();
      }
    } catch (err) {
      logError('[OfflineModeGuard] Error in checkAndClearOfflineMode:', err);
    }
  }

  /**
   * Clear all offline mode flags
   */
  clearOfflineModeFlags() {
    try {
      // Clear localStorage flags
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('offline-mode');
        localStorage.removeItem('offline_mode');
        localStorage.setItem('force_online', 'true');
        localStorage.removeItem('bypass_auth_check');
        localStorage.removeItem('user_explicitly_logged_out');
      }
      
      // Clear sessionStorage flags
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('offline-mode');
        sessionStorage.removeItem('offline_mode');
      }
      
      // Dispatch events to notify components
      if (typeof window !== 'undefined') {
        // Notify about offline status change
        window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
          detail: { isOffline: false }
        }));
        
        // Force UI refresh
        window.dispatchEvent(new CustomEvent('forceUiRefresh', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      logDebug('[OfflineModeGuard] Cleared offline mode flags');
    } catch (err) {
      logError('[OfflineModeGuard] Error clearing offline mode flags:', err);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.initialized = false;
  }
}

// Create singleton instance
const offlineModeGuard = new OfflineModeGuard();

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      offlineModeGuard.initialize();
    });
  } else {
    offlineModeGuard.initialize();
  }
}

export default offlineModeGuard;
