/**
 * Admin Authentication Service
 * 
 * Handles admin-specific authentication operations including
 * role verification and admin-only functionality.
 */
import { apiClient } from '@/services/http';
import { tokenService } from './tokenService';
import { userAuthService } from './userAuthService';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Base URL for admin endpoints
 * @type {string}
 */
const BASE_URL = '/api/admin';

/**
 * Admin Authentication Service
 */
class AdminAuthService {
  /**
   * Verify admin status
   * @returns {Promise<Object>} Verification result
   */
  async verifyAdminStatus() {
    logDebug('[AdminAuthService] Verifying admin status');
    
    // First check if user is authenticated
    const authStatus = await userAuthService.getAuthStatus();
    
    if (!authStatus.isAuthenticated) {
      return { 
        isAdmin: false, 
        message: 'User is not authenticated' 
      };
    }
    
    // Check if user has admin role
    if (authStatus.user?.role !== 'admin') {
      return { 
        isAdmin: false, 
        message: 'User does not have admin role' 
      };
    }
    
    // Verify with server if not in offline mode
    if (!authStatus.offlineMode) {
      try {
        const response = await apiClient.get(`${BASE_URL}/verify`);
        
        if (!response || !response.data || !response.data.isAdmin) {
          return { 
            isAdmin: false, 
            message: 'Server rejected admin status' 
          };
        }
        
        logInfo('[AdminAuthService] Admin status verified');
        
        return { 
          isAdmin: true,
          permissions: response.data.permissions || []
        };
      } catch (error) {
        logError('[AdminAuthService] Admin verification error:', error);
        
        // If network error, fall back to local verification
        if (error.message === 'Network Error' || !navigator.onLine) {
          return { 
            isAdmin: true, 
            offlineMode: true,
            message: 'Using offline admin verification'
          };
        }
        
        return { 
          isAdmin: false, 
          message: error.response?.data?.message || 'Admin verification failed' 
        };
      }
    }
    
    // In offline mode, trust the local role
    return { 
      isAdmin: true, 
      offlineMode: true,
      message: 'Using offline admin verification'
    };
  }
  
  /**
   * Get admin permissions
   * @returns {Promise<Object>} Permissions result
   */
  async getAdminPermissions() {
    logDebug('[AdminAuthService] Getting admin permissions');
    
    // First verify admin status
    const adminStatus = await this.verifyAdminStatus();
    
    if (!adminStatus.isAdmin) {
      return { 
        success: false, 
        message: 'User is not an admin',
        permissions: []
      };
    }
    
    // If we already have permissions from verification, return them
    if (adminStatus.permissions) {
      return {
        success: true,
        permissions: adminStatus.permissions
      };
    }
    
    // If in offline mode, return default permissions
    if (adminStatus.offlineMode) {
      return {
        success: true,
        offlineMode: true,
        permissions: ['view_dashboard', 'view_users', 'view_content']
      };
    }
    
    // Otherwise fetch permissions from server
    try {
      const response = await apiClient.get(`${BASE_URL}/permissions`);
      
      if (!response || !response.data) {
        return { 
          success: false, 
          message: 'Invalid response from server',
          permissions: []
        };
      }
      
      return {
        success: true,
        permissions: response.data.permissions || []
      };
    } catch (error) {
      logError('[AdminAuthService] Error fetching admin permissions:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch permissions',
        permissions: []
      };
    }
  }
  
  /**
   * Check if user has specific admin permission
   * @param {string} permission - Permission to check
   * @returns {Promise<boolean>} Whether user has permission
   */
  async hasPermission(permission) {
    if (!permission) return false;
    
    const permissionsResult = await this.getAdminPermissions();
    
    if (!permissionsResult.success) {
      return false;
    }
    
    return permissionsResult.permissions.includes(permission);
  }
  
  /**
   * Perform admin action
   * @param {string} action - Action to perform
   * @param {Object} data - Action data
   * @returns {Promise<Object>} Action result
   */
  async performAdminAction(action, data = {}) {
    logDebug(`[AdminAuthService] Performing admin action: ${action}`);
    
    // First verify admin status
    const adminStatus = await this.verifyAdminStatus();
    
    if (!adminStatus.isAdmin) {
      return { 
        success: false, 
        message: 'User is not an admin'
      };
    }
    
    try {
      const response = await apiClient.post(`${BASE_URL}/actions/${action}`, data);
      
      if (!response || !response.data) {
        return { 
          success: false, 
          message: 'Invalid response from server'
        };
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logError(`[AdminAuthService] Error performing admin action ${action}:`, error);
      
      return {
        success: false,
        message: error.response?.data?.message || `Failed to perform ${action}`
      };
    }
  }
}

// Create and export a singleton instance
export const adminAuthService = new AdminAuthService();

export default AdminAuthService;
