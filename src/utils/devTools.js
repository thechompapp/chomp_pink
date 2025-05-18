/**
 * Development Tools Utility
 * 
 * This module provides consolidated utilities for managing development mode
 * settings, including offline mode and admin access.
 * 
 * Features:
 * - Offline mode management
 * - Admin access management
 * - Authentication state management
 * - Development mode helpers
 * - Authentication fixes for development
 */

// Use direct imports to avoid circular dependencies
const logInfo = console.info;
const logWarn = console.warn;
const logError = console.error;
const logDebug = console.debug;

// Auth configuration for development mode
const AUTH_CONFIG = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiYWNjb3VudF90eXBlIjoic3VwZXJ1c2VyIn0sImlhdCI6MTc0NzQzMTkwMCwiZXhwIjoxNzQ3NDM1NTAwfQ.EDcX-C4zG2mZH8nUbBJwExR8cj2h1hqjShIFbFEWLdM",
  user: {
    id: 2, 
    username: "admin",
    email: "admin@example.com",
    account_type: "superuser"
  }
};

// Storage keys used for various settings
const STORAGE_KEYS = {
  // Auth keys
  AUTH_TOKEN: 'auth-token',
  AUTH_STORAGE: 'auth-storage',
  
  // Offline mode keys
  OFFLINE_MODE: 'offline_mode',
  OLD_OFFLINE_MODE: 'OFFLINE_MODE',
  DEV_MODE_NO_BACKEND: 'dev_mode_no_backend',
  OLD_DEV_MODE_NO_BACKEND: 'DEV_MODE_NO_BACKEND',
  BYPASS_AUTH_CHECK: 'bypass_auth_check',
  OLD_BYPASS_AUTH_CHECK: 'bypass-auth-check',
  FORCE_ONLINE: 'force_online',
  OLD_FORCE_ONLINE: 'FORCE_ONLINE',
  ADMIN_ACCESS: 'admin_access_enabled',
  SUPERUSER_OVERRIDE: 'superuser_override',
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
    
    logInfo('[DevTools] Offline mode disabled successfully');
    return true;
  } catch (error) {
    logError('[DevTools] Error disabling offline mode:', error);
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
    
    logInfo(`[DevTools] Offline mode enabled ${persistent ? '(persistent)' : '(session)'}`);
    return true;
  } catch (error) {
    logError('[DevTools] Error enabling offline mode:', error);
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
    logError('[DevTools] Error checking offline mode:', error);
    return false;
  }
}

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
      localStorage.getItem(STORAGE_KEYS.ADMIN_ACCESS) === 'true') {
    logInfo('[DevTools] Development mode: Admin access enabled via localStorage flag');
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
      logWarn('[DevTools] Admin access override only available in development mode');
      return false;
    }
    
    localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, 'true');
    localStorage.setItem(STORAGE_KEYS.SUPERUSER_OVERRIDE, 'true');
    
    logInfo('[DevTools] Admin access enabled for development');
    return true;
  } catch (error) {
    logError('[DevTools] Error enabling admin access:', error);
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
    localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS);
    localStorage.removeItem(STORAGE_KEYS.SUPERUSER_OVERRIDE);
    
    logInfo('[DevTools] Admin access override disabled');
    return true;
  } catch (error) {
    logError('[DevTools] Error disabling admin access:', error);
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
      logError('[DevTools] refreshAuthState requires a valid checkAuthStatus function');
      return false;
    }
    
    // Force a fresh auth check
    const result = await checkAuthStatus(true);
    
    logInfo('[DevTools] Auth state refreshed successfully');
    return result;
  } catch (error) {
    logError('[DevTools] Error refreshing auth state:', error);
    return false;
  }
}

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
  logInfo('[DevTools] Fixing development mode settings...');
  
  // Disable offline mode
  const offlineStatus = disableOfflineMode();
  logInfo(`[DevTools] Offline mode disabled: ${offlineStatus}`);
  
  // Enable admin access
  const adminStatus = enableAdminAccess();
  logInfo(`[DevTools] Admin access enabled: ${adminStatus}`);
  
  // Refresh auth state if possible
  let authStatus = false;
  if (typeof checkAuthStatus === 'function') {
    authStatus = await refreshAuthState(checkAuthStatus);
    logInfo(`[DevTools] Auth state refreshed: ${authStatus}`);
  }
  
  // Force reload if requested
  if (arguments.length > 1 && arguments[1] === true) {
    logInfo('[DevTools] Reloading page in 2 seconds...');
    setTimeout(() => window.location.reload(), 2000);
  }
  
  return {
    offlineMode: !offlineStatus,
    adminAccess: adminStatus,
    authRefreshed: authStatus
  };
}

/**
 * Sets up authentication in local storage for development
 */
export function setupAuthStorage() {
  // Store the authentication token
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, AUTH_CONFIG.token);
  
  // Set up the auth storage state
  const authData = {
    state: {
      token: AUTH_CONFIG.token,
      isAuthenticated: true,
      user: AUTH_CONFIG.user,
      isSuperuser: true,
      error: null,
      isLoading: false,
      lastAuthCheck: Date.now()
    }
  };
  
  // Store auth data in localStorage for persistence
  localStorage.setItem(STORAGE_KEYS.AUTH_STORAGE, JSON.stringify(authData));
  
  // Enable bypass auth check
  localStorage.setItem(STORAGE_KEYS.BYPASS_AUTH_CHECK, 'true');
  
  logInfo('[DevTools] Authentication storage set up for development');
  return true;
}

/**
 * Checks and fixes admin authentication if needed
 * @param {boolean} force - Whether to force a fix even if it doesn't appear necessary
 * @returns {boolean} - True if a fix was applied, false otherwise
 */
export function fixAdminAuth(force = false) {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  try {
    // Check if auth storage exists
    const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);
    if (!authStorage && !force) {
      logDebug('[DevTools] No auth storage found, skipping admin auth fix');
      return false;
    }
    
    // Parse auth storage
    let authData = null;
    try {
      if (authStorage) {
        authData = JSON.parse(authStorage);
      }
    } catch (error) {
      logError('[DevTools] Error parsing auth storage:', error);
    }
    
    // Check if we need to fix auth
    const needsFix = force || 
                    !authData || 
                    !authData.state || 
                    !authData.state.user || 
                    authData.state.user.account_type !== 'superuser';
    
    if (!needsFix) {
      logDebug('[DevTools] Admin authentication appears to be correctly set');
      return false;
    }
    
    // Fix auth storage
    setupAuthStorage();
    
    logInfo('[DevTools] Fixed admin authentication');
    return true;
  } catch (error) {
    logError('[DevTools] Error fixing admin auth:', error);
    return false;
  }
}

/**
 * Force the application into online mode and reload
 * This is a convenience function to fix offline mode issues
 * 
 * @returns {boolean} - Success status
 */
export function forceOnlineMode() {
  try {
    // Clear all offline mode flags
    disableOfflineMode();
    
    // Set force online flags with multiple keys for compatibility
    localStorage.setItem('force_online', 'true');
    localStorage.setItem('FORCE_ONLINE', 'true');
    
    // Remove all offline mode flags with multiple keys for compatibility
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('offline-mode');
    localStorage.removeItem('OFFLINE_MODE');
    sessionStorage.removeItem('offline_mode');
    sessionStorage.removeItem('offline-mode');
    sessionStorage.removeItem('OFFLINE_MODE');
    
    // Remove bypass auth check flags
    localStorage.removeItem('bypass_auth_check');
    localStorage.removeItem('bypass-auth-check');
    
    logInfo('[DevTools] Force online mode enabled, reloading page...');
    
    // Reload the page to apply changes
    setTimeout(() => window.location.reload(), 500);
    
    return true;
  } catch (error) {
    logError('[DevTools] Error forcing online mode:', error);
    return false;
  }
}

/**
 * Force admin status and update the navbar
 * This function ensures admin features are immediately available in the navbar
 * 
 * @returns {boolean} - Success status
 */
function forceAdminStatus() {
  try {
    logInfo('[DevTools] Forcing admin status');
    
    // Set all required flags
    localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
    localStorage.setItem('bypass_auth_check', 'true');
    localStorage.setItem('superuser_override', 'true');
    localStorage.setItem('admin_access_enabled', 'true');
    
    // Update auth storage directly
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state) {
          // Update user and superuser status
          parsed.state.isSuperuser = true;
          if (parsed.state.user) {
            parsed.state.user.account_type = 'superuser';
            parsed.state.user.role = 'admin';
            parsed.state.user.permissions = [...(parsed.state.user.permissions || []), 'admin', 'superuser'];
          }
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error('[DevTools] Error updating auth storage:', e);
    }
    
    // Dispatch event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
        detail: { isSuperuser: true } 
      }));
    }
    
    return true;
  } catch (error) {
    console.error('[DevTools] Error forcing admin status:', error);
    return false;
  }
}

// Export a default object with all functions
const devTools = {
  disableOfflineMode,
  enableOfflineMode,
  forceOnlineMode,
  isOfflineMode,
  hasAdminAccess,
  enableAdminAccess,
  disableAdminAccess,
  refreshAuthState,
  fixDevMode,
  fixAdminAuth,
  setupAuthStorage,
  forceAdminStatus,
  STORAGE_KEYS
};

// Initialize development mode settings - using setTimeout to avoid initialization errors
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Delay initialization to ensure DOM is ready
  setTimeout(() => {
    try {
      logInfo('[DevTools] Initializing development mode utilities...');
      
      // Always force online mode on startup to prevent offline mode issues
      // Clear all offline mode flags
      disableOfflineMode();
      
      // Set force online flags with multiple keys for compatibility
      localStorage.setItem('force_online', 'true');
      localStorage.setItem('FORCE_ONLINE', 'true');
      
      // Remove all offline mode flags with multiple keys for compatibility
      localStorage.removeItem('offline_mode');
      localStorage.removeItem('offline-mode');
      localStorage.removeItem('OFFLINE_MODE');
      sessionStorage.removeItem('offline_mode');
      sessionStorage.removeItem('offline-mode');
      sessionStorage.removeItem('OFFLINE_MODE');
      
      // Remove bypass auth check flags
      localStorage.removeItem('bypass_auth_check');
      localStorage.removeItem('bypass-auth-check');
      
      logInfo('[DevTools] Forced online mode on startup');
      
      // Enable admin access for development
      if (localStorage.getItem(STORAGE_KEYS.ADMIN_ACCESS) !== 'true') {
        enableAdminAccess();
        logInfo('[DevTools] Enabled admin access for development');
      }
      
      // Fix admin authentication if needed
      fixAdminAuth();
      
      // Force admin status to ensure navbar shows admin features
      forceAdminStatus();
      logInfo('[DevTools] Forced admin status on startup');
      
      // Add event listener for offline status changes
      window.addEventListener('offlineStatusChanged', (event) => {
        logInfo(`[DevTools] Offline status changed: ${event.detail.offline ? 'OFFLINE' : 'ONLINE'}`);
      });
      
      // Make functions available on window for console access
      window.__devTools = devTools;
      
      logInfo('[DevTools] Development utilities available at window.__devTools');
    } catch (error) {
      console.error('[DevTools] Error during initialization:', error);
    }
  }, 500);
}

export default devTools;
