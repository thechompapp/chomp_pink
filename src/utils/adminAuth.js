/**
 * Admin authentication utilities
 * 
 * This file provides utilities to help with admin authentication,
 * especially in development mode.
 */

import { logInfo, logDebug } from './logger.js';

/**
 * Synchronizes admin authentication with the auth store
 * @param {Object} authStore - The auth store instance
 * @returns {boolean} - Whether the sync was successful
 */
export function syncAdminAuthWithStore(authStore) {
  if (!authStore || process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Get current state directly from the store
  const state = authStore.getState();
  
  // If authenticated, ensure admin keys are set
  if (state.isAuthenticated) {
    logInfo('[AdminAuth] Synchronizing admin access for user');
    
    // Check if localStorage already has these values to prevent redundant updates
    const needsLocalStorageUpdate = (
      localStorage.getItem('admin_api_key') !== 'doof-admin-secret-key-dev' ||
      localStorage.getItem('bypass_auth_check') !== 'true' ||
      localStorage.getItem('superuser_override') !== 'true' ||
      localStorage.getItem('admin_access_enabled') !== 'true'
    );
    
    // Only update localStorage if needed to prevent unnecessary events
    if (needsLocalStorageUpdate) {
      // Set all required flags in a single batch
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
      localStorage.setItem('bypass_auth_check', 'true');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('admin_access_enabled', 'true');
      logDebug('[AdminAuth] Updated localStorage admin flags');
    }
    
    // Check if we need to update the auth store
    const needsStoreUpdate = (
      !state.isSuperuser || 
      state.user?.account_type !== 'superuser' ||
      !state.user?.role?.includes('admin') ||
      !state.user?.permissions?.includes('superuser')
    );
    
    // Only update store if needed
    if (needsStoreUpdate) {
      logInfo('[AdminAuth] Updating auth store to set superuser status');
      
      // Create an enhanced user object with admin privileges
      const enhancedUser = {
        ...state.user,
        account_type: 'superuser',
        role: 'admin',
        permissions: [...new Set([
          ...(state.user?.permissions || []), 
          'admin', 
          'superuser'
        ])]
      };
      
      // Use the setState method directly to bypass throttling
      // This ensures immediate synchronous state update
      authStore.setState({
        isSuperuser: true,
        user: enhancedUser
      });
      
      // Update the auth storage directly to ensure persistence
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          if (parsed.state) {
            parsed.state.isSuperuser = true;
            parsed.state.user = enhancedUser;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
            logDebug('[AdminAuth] Updated persisted auth state');
          }
        }
      } catch (e) {
        logWarn('[AdminAuth] Failed to update persisted auth state:', e);
      }
      
      // Dispatch a custom event to notify components of admin login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
          detail: { isSuperuser: true } 
        }));
      }
      
      return true; // Sync resulted in state change
    }
    return true; // Already synced
  }
  return false; // Not authenticated
}

/**
 * Initializes admin authentication for development mode
 * - Sets localStorage values needed for admin authentication
 * - Only applies in development mode
 */
export function initializeAdminAuth() {
  // Only apply in development mode
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Set all required flags
  localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
  localStorage.setItem('bypass_auth_check', 'true');
  localStorage.setItem('superuser_override', 'true');
  localStorage.setItem('admin_access_enabled', 'true');
  
  // Create a stronger token with admin privileges embedded
  const adminToken = 'admin-mock-token-with-superuser-privileges-' + Date.now();
  
  // Store the token in localStorage directly for API client access
  localStorage.setItem('auth-token', adminToken);
  
  // Create a mock admin user for authentication store
  const mockUser = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    account_type: 'superuser',
    role: 'admin',
    permissions: ['admin', 'superuser']
  };
  
  // Store auth state in localStorage for persistence
  const authState = {
    token: adminToken,
    isAuthenticated: true,
    user: mockUser,
    isSuperuser: true,
    lastAuthCheck: Date.now(),
    isLoading: false,
    error: null
  };
  
  // Save the auth state to localStorage
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state = authState;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    } else {
      // If no auth storage exists, create one
      localStorage.setItem('auth-storage', JSON.stringify({
        state: authState,
        version: 0
      }));
    }
    
    logInfo('[AdminAuth] Development mode: Using mock authentication with admin privileges');
    logDebug('[AdminAuth] Auth state stored in localStorage', authState);
    return true;
  } catch (error) {
    console.error('[AdminAuth] Failed to initialize admin auth:', error);
    return false;
  }
}

/**
 * Checks if admin authentication is enabled
 * @returns {boolean} True if admin auth is enabled
 */
export function isAdminAuthEnabled() {
  return localStorage.getItem('admin_access_enabled') === 'true';
}

/**
 * Clears admin authentication
 */
export function clearAdminAuth() {
  localStorage.removeItem('admin_api_key');
  localStorage.removeItem('bypass_auth_check');
  localStorage.removeItem('superuser_override');
  localStorage.removeItem('admin_access_enabled');
  logInfo('[AdminAuth] Admin authentication cleared');
}

// Auto-initialize on import in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after the DOM is loaded
  setTimeout(() => {
    initializeAdminAuth();
    
    // Also setup a mutation observer to watch for auth-storage changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Check if auth-storage has changed
          try {
            const authData = JSON.parse(localStorage.getItem('auth-storage'));
            if (authData?.state?.isAuthenticated) {
              logInfo('[AdminAuth] Auth storage changed, ensuring admin status');
              // Ensure admin status is set
              localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
              localStorage.setItem('bypass_auth_check', 'true');
              localStorage.setItem('superuser_override', 'true');
              localStorage.setItem('admin_access_enabled', 'true');
              
              // Update the auth state to include superuser
              if (!authData.state.isSuperuser) {
                authData.state.isSuperuser = true;
                if (authData.state.user) {
                  authData.state.user.account_type = 'superuser';
                  authData.state.user.role = 'admin';
                  authData.state.user.permissions = [...(authData.state.user.permissions || []), 'admin', 'superuser'];
                }
                localStorage.setItem('auth-storage', JSON.stringify(authData));
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
    });
    
    // Start observing localStorage changes
    observer.observe(document, { subtree: true, attributes: true, childList: true });
  }, 500);
}

/**
 * Setup synchronization with auth store
 * This should be called in the main app component
 */
export function setupAdminAuthSync() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return () => {}; // No-op cleanup function
  }
  
  // Dynamically import to avoid circular dependencies
  const setupSync = async () => {
    try {
      // Use dynamic import to avoid circular dependency
      const authStoreModule = await import('@/stores/useAuthStore');
      const authStore = authStoreModule.default;
      
      // Initial sync
      syncAdminAuthWithStore(authStore);
      
      // Setup subscription to auth store changes
      const unsubscribe = authStore.subscribe(
        (state) => ({ isAuthenticated: state.isAuthenticated, isSuperuser: state.isSuperuser }),
        () => {
          syncAdminAuthWithStore(authStore);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('[AdminAuth] Failed to setup auth store sync:', error);
      return () => {}; // No-op cleanup function
    }
  };
  
  // Start the setup process
  let unsubscribe = () => {};
  setupSync().then(cleanup => {
    unsubscribe = cleanup;
  });
  
  // Return cleanup function
  return () => unsubscribe();
}

export default {
  initializeAdminAuth,
  isAdminAuthEnabled,
  clearAdminAuth,
  syncAdminAuthWithStore,
  setupAdminAuthSync
}; 