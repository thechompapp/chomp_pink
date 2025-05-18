/**
 * Development Mode Helper Utility
 * 
 * This module provides helper functions for managing development mode settings,
 * including offline mode and admin access.
 * 
 * Usage:
 * 1. Import this module in your application
 * 2. Call the appropriate functions to manage development settings
 * 3. Or run the functions directly in the browser console
 */

import { disableOfflineMode, enableOfflineMode } from './offlineMode';
import { enableAdminAccess, disableAdminAccess, refreshAuthState } from './authUtils';

/**
 * Fix common development mode issues
 * - Disables offline mode
 * - Enables admin access
 * - Refreshes authentication state
 * 
 * @param {Function} [checkAuthStatus] - Optional auth store checkAuthStatus function
 * @returns {Promise<Object>} - Status of operations
 */
export async function fixDevMode(checkAuthStatus) {
  console.info('[DevModeHelper] Fixing development mode settings...');
  
  // Disable offline mode
  const offlineStatus = disableOfflineMode();
  console.info(`[DevModeHelper] Offline mode disabled: ${offlineStatus}`);
  
  // Enable admin access
  const adminStatus = enableAdminAccess();
  console.info(`[DevModeHelper] Admin access enabled: ${adminStatus}`);
  
  // Refresh auth state if possible
  let authStatus = false;
  if (typeof checkAuthStatus === 'function') {
    authStatus = await refreshAuthState(checkAuthStatus);
    console.info(`[DevModeHelper] Auth state refreshed: ${authStatus}`);
  }
  
  // Force reload if requested
  if (arguments.length > 1 && arguments[1] === true) {
    console.info('[DevModeHelper] Reloading page in 2 seconds...');
    setTimeout(() => window.location.reload(), 2000);
  }
  
  return {
    offlineMode: !offlineStatus,
    adminAccess: adminStatus,
    authRefreshed: authStatus
  };
}

/**
 * Reset development mode settings to defaults
 * 
 * @param {Function} [checkAuthStatus] - Optional auth store checkAuthStatus function
 * @returns {Promise<Object>} - Status of operations
 */
export async function resetDevMode(checkAuthStatus) {
  console.info('[DevModeHelper] Resetting development mode settings...');
  
  // Enable offline mode (session only)
  const offlineStatus = enableOfflineMode(false);
  console.info(`[DevModeHelper] Offline mode enabled: ${offlineStatus}`);
  
  // Disable admin access
  const adminStatus = disableAdminAccess();
  console.info(`[DevModeHelper] Admin access disabled: ${adminStatus}`);
  
  // Refresh auth state if possible
  let authStatus = false;
  if (typeof checkAuthStatus === 'function') {
    authStatus = await refreshAuthState(checkAuthStatus);
    console.info(`[DevModeHelper] Auth state refreshed: ${authStatus}`);
  }
  
  return {
    offlineMode: offlineStatus,
    adminAccess: !adminStatus,
    authRefreshed: authStatus
  };
}

// Export a default object with all functions
export default {
  fixDevMode,
  resetDevMode,
  disableOfflineMode,
  enableOfflineMode,
  enableAdminAccess,
  disableAdminAccess,
  refreshAuthState
};

// Make functions available on window for console access in development
if (process.env.NODE_ENV === 'development') {
  window.__devModeHelper = {
    fixDevMode,
    resetDevMode,
    disableOfflineMode,
    enableOfflineMode,
    enableAdminAccess,
    disableAdminAccess
  };
  
  console.info('[DevModeHelper] Development utilities available at window.__devModeHelper');
}
