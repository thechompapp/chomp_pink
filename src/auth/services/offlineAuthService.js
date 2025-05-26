/**
 * Offline Authentication Service
 * 
 * Handles authentication in offline mode.
 * Provides local storage-based authentication when the server is unavailable.
 */
import { logDebug, logError, logInfo } from '@/utils/logger';
import { tokenUtils } from '@/auth/utils/tokenUtils';

/**
 * Storage keys for offline authentication
 * @type {Object}
 */
const OFFLINE_KEYS = {
  AUTH_DATA: 'offline_auth_data',
  PENDING_ACTIONS: 'offline_auth_pending_actions'
};

/**
 * Offline Authentication Service
 */
class OfflineAuthService {
  /**
   * Check if offline authentication data exists
   * @returns {boolean} True if offline auth data exists
   */
  hasOfflineData() {
    return !!localStorage.getItem(OFFLINE_KEYS.AUTH_DATA);
  }
  
  /**
   * Get offline authentication data
   * @returns {Object|null} Offline auth data or null if not found
   */
  getOfflineData() {
    try {
      const data = localStorage.getItem(OFFLINE_KEYS.AUTH_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logError('[OfflineAuthService] Error parsing offline auth data:', error);
      return null;
    }
  }
  
  /**
   * Save authentication data for offline use
   * @param {Object} authData - Authentication data to save
   */
  saveOfflineData(authData) {
    if (!authData) return;
    
    try {
      localStorage.setItem(OFFLINE_KEYS.AUTH_DATA, JSON.stringify(authData));
      logDebug('[OfflineAuthService] Saved auth data for offline use');
    } catch (error) {
      logError('[OfflineAuthService] Error saving offline auth data:', error);
    }
  }
  
  /**
   * Clear offline authentication data
   */
  clearOfflineData() {
    localStorage.removeItem(OFFLINE_KEYS.AUTH_DATA);
    logDebug('[OfflineAuthService] Cleared offline auth data');
  }
  
  /**
   * Verify offline authentication
   * @param {Object} credentials - User credentials
   * @returns {Object} Authentication result
   */
  verifyOfflineAuth(credentials) {
    const offlineData = this.getOfflineData();
    
    if (!offlineData) {
      return { success: false, message: 'No offline authentication data available' };
    }
    
    // In offline mode, we can only verify based on the email
    // (we don't store the password in plain text)
    if (credentials.email === offlineData.user.email) {
      logInfo('[OfflineAuthService] Offline authentication successful');
      
      // Add pending action to sync when online
      this.addPendingAction('login', credentials);
      
      return {
        success: true,
        user: offlineData.user,
        isAdmin: offlineData.user.role === 'admin',
        offlineMode: true
      };
    }
    
    return { success: false, message: 'Invalid credentials' };
  }
  
  /**
   * Get authentication status in offline mode
   * @returns {Object} Authentication status
   */
  getOfflineAuthStatus() {
    const offlineData = this.getOfflineData();
    
    if (!offlineData) {
      return {
        isAuthenticated: false,
        user: null,
        isAdmin: false,
        offlineMode: true
      };
    }
    
    return {
      isAuthenticated: true,
      user: offlineData.user,
      isAdmin: offlineData.user.role === 'admin',
      offlineMode: true
    };
  }
  
  /**
   * Add a pending action to be executed when online
   * @param {string} action - Action type
   * @param {Object} data - Action data
   */
  addPendingAction(action, data) {
    try {
      // Get existing pending actions
      const pendingActionsJson = localStorage.getItem(OFFLINE_KEYS.PENDING_ACTIONS);
      const pendingActions = pendingActionsJson ? JSON.parse(pendingActionsJson) : [];
      
      // Add new action
      pendingActions.push({
        action,
        data,
        timestamp: Date.now()
      });
      
      // Save updated pending actions
      localStorage.setItem(OFFLINE_KEYS.PENDING_ACTIONS, JSON.stringify(pendingActions));
      
      logDebug(`[OfflineAuthService] Added pending action: ${action}`);
    } catch (error) {
      logError('[OfflineAuthService] Error adding pending action:', error);
    }
  }
  
  /**
   * Get all pending actions
   * @returns {Array} Pending actions
   */
  getPendingActions() {
    try {
      const pendingActionsJson = localStorage.getItem(OFFLINE_KEYS.PENDING_ACTIONS);
      return pendingActionsJson ? JSON.parse(pendingActionsJson) : [];
    } catch (error) {
      logError('[OfflineAuthService] Error getting pending actions:', error);
      return [];
    }
  }
  
  /**
   * Clear all pending actions
   */
  clearPendingActions() {
    localStorage.removeItem(OFFLINE_KEYS.PENDING_ACTIONS);
    logDebug('[OfflineAuthService] Cleared pending actions');
  }
  
  /**
   * Process pending actions when coming back online
   * @param {Object} authService - Online auth service
   * @returns {Promise<void>}
   */
  async processPendingActions(authService) {
    const pendingActions = this.getPendingActions();
    
    if (pendingActions.length === 0) {
      return;
    }
    
    logInfo(`[OfflineAuthService] Processing ${pendingActions.length} pending actions`);
    
    // Process each action
    for (const { action, data } of pendingActions) {
      try {
        switch (action) {
          case 'login':
            await authService.login(data);
            break;
          case 'logout':
            await authService.logout();
            break;
          case 'updateProfile':
            await authService.updateProfile(data);
            break;
          default:
            logWarn(`[OfflineAuthService] Unknown pending action: ${action}`);
        }
      } catch (error) {
        logError(`[OfflineAuthService] Error processing pending action ${action}:`, error);
      }
    }
    
    // Clear processed actions
    this.clearPendingActions();
  }
}

// Create and export a singleton instance
export const offlineAuthService = new OfflineAuthService();

export default OfflineAuthService;
