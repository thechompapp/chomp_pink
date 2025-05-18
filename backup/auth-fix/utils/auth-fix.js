/**
 * Authentication Fix Utility
 * 
 * This utility helps ensure that admin authentication is properly synchronized
 * with the auth store state, especially in development mode.
 */

import { logInfo, logDebug, logWarn } from './logger';
import { initializeAdminAuth, syncAdminAuthWithStore } from './adminAuth';
import useAuthStore from '@/stores/useAuthStore';
import { isAdminAuthInconsistent, shouldHaveAdminPrivileges } from './admin-refresh';

/**
 * Object to track fix attempts to prevent infinite loops
 */
const fixAttempts = {
  count: 0,
  lastFix: 0,
  MAX_ATTEMPTS: 3,
  COOLDOWN_MS: 5000, // 5 seconds
};

/**
 * Checks and fixes admin authentication if needed
 * @param {boolean} force - Whether to force a fix even if it doesn't appear necessary
 * @returns {boolean} - True if a fix was applied, false otherwise
 */
export function checkAndFixAdminAuth(force = false) {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Prevent infinite loops by limiting fix attempts
  const now = Date.now();
  if (now - fixAttempts.lastFix < fixAttempts.COOLDOWN_MS) {
    if (fixAttempts.count > fixAttempts.MAX_ATTEMPTS) {
      logWarn('[Auth Fix] Too many fix attempts in a short period, skipping');
      return false;
    }
  } else {
    // Reset counter if we're outside the cooldown period
    fixAttempts.count = 0;
  }

  const needsFix = force || isAdminAuthInconsistent();
  
  if (!needsFix) {
    logDebug('[Auth Fix] Admin authentication appears to be correctly set');
    return false;
  }
  
  try {
    // Increment fix attempts
    fixAttempts.count += 1;
    fixAttempts.lastFix = now;
    
    // Get current auth state
    const authState = useAuthStore.getState();
    
    if (shouldHaveAdminPrivileges()) {
      // User should have admin privileges but doesn't have proper admin auth
      logInfo('[Auth Fix] Fixing missing admin authentication for superuser');
      
      // Initialize admin auth
      initializeAdminAuth();
      
      // Sync with auth store
      syncAdminAuthWithStore(useAuthStore);
      
      // Force navbar update by triggering a state change
      useAuthStore.setState({
        isSuperuser: true,
        isAuthenticated: true
      });
      
      return true;
    } else if (localStorage.getItem('admin_access_enabled') === 'true') {
      // User shouldn't have admin privileges but has admin auth
      logInfo('[Auth Fix] Removing admin authentication for non-superuser');
      
      // Remove admin auth
      localStorage.removeItem('admin_api_key');
      localStorage.removeItem('bypass_auth_check');
      localStorage.removeItem('superuser_override');
      localStorage.removeItem('admin_access_enabled');
      
      return true;
    }
    
    return false;
  } catch (error) {
    logWarn('[Auth Fix] Error fixing admin authentication:', error);
    return false;
  }
}

/**
 * Configures authentication headers for all API requests
 * This helps ensure that admin access headers are included when applicable
 */
export function configureAuthHeaders() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Check if admin authentication is already enabled
  if (localStorage.getItem('admin_access_enabled') === 'true') {
    logInfo('[Auth Fix] Admin authentication is already enabled');
  } else if (shouldHaveAdminPrivileges()) {
    // Enable admin authentication if needed
    checkAndFixAdminAuth(true);
  }
  
  logInfo('[Auth Fix] Authentication headers configured for all API requests');
}

// Auto-run on import in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Small delay to ensure auth store is initialized
  setTimeout(() => {
    configureAuthHeaders();
    
    // Set up periodic checks to ensure admin auth stays in sync
    setInterval(() => {
      checkAndFixAdminAuth();
    }, 30000); // Every 30 seconds
  }, 2000);
}

export default {
  checkAndFixAdminAuth,
  configureAuthHeaders
}; 