/**
 * Authentication and authorization utilities
 * 
 * This module provides helper functions for managing authentication state,
 * checking user roles, and handling admin access.
 */

import { logInfo, logWarn, logError, logDebug } from '@/utils/logger.js';

/**
 * Check if the current user has admin privileges
 * 
 * @param {Object} user - The user object from auth store
 * @returns {boolean} - Whether the user has admin privileges
 */
export function hasAdminAccess(user) {
  if (!user) return false;
  
  // Check for admin role or superuser account type
  const isAdmin = user.role === 'admin' || 
                 user.account_type === 'superuser' || 
                 (user.permissions && 
                  (user.permissions.includes('admin') || 
                   user.permissions.includes('superuser')));
  
  // In development mode, we can enable admin access for testing
  if (process.env.NODE_ENV === 'development' && 
      localStorage.getItem('admin_access_enabled') === 'true') {
    logInfo('[AuthUtils] Development mode: Admin access enabled via localStorage flag');
    return true;
  }
  
  return isAdmin;
}

/**
 * Enable admin access in development mode
 * 
 * @returns {boolean} - Success status
 */
export function enableAdminAccess() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      logWarn('[AuthUtils] Admin access override only available in development mode');
      return false;
    }
    
    localStorage.setItem('admin_access_enabled', 'true');
    localStorage.setItem('superuser_override', 'true');
    
    logInfo('[AuthUtils] Admin access enabled for development');
    return true;
  } catch (error) {
    logError('[AuthUtils] Error enabling admin access:', error);
    return false;
  }
}

/**
 * Disable admin access override in development mode
 * 
 * @returns {boolean} - Success status
 */
export function disableAdminAccess() {
  try {
    localStorage.removeItem('admin_access_enabled');
    localStorage.removeItem('superuser_override');
    
    logInfo('[AuthUtils] Admin access override disabled');
    return true;
  } catch (error) {
    logError('[AuthUtils] Error disabling admin access:', error);
    return false;
  }
}

/**
 * Force refresh the authentication state
 * This is useful when the user's role changes
 * 
 * @param {Function} checkAuthStatus - The auth store's checkAuthStatus function
 * @returns {Promise<boolean>} - Success status
 */
export async function refreshAuthState(checkAuthStatus) {
  try {
    if (typeof checkAuthStatus !== 'function') {
      logError('[AuthUtils] refreshAuthState requires a valid checkAuthStatus function');
      return false;
    }
    
    // Force a fresh auth check
    const result = await checkAuthStatus(true);
    
    logInfo('[AuthUtils] Auth state refreshed successfully');
    return result;
  } catch (error) {
    logError('[AuthUtils] Error refreshing auth state:', error);
    return false;
  }
}

// Export a default object with all functions
export default {
  hasAdminAccess,
  enableAdminAccess,
  disableAdminAccess,
  refreshAuthState
};
