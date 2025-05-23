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
    
    // Only update localStorage if needed to prevent redundant updates
    const needsLocalStorageUpdate = (
      localStorage.getItem('admin_api_key') !== 'doof-admin-secret-key-dev' ||
      localStorage.getItem('bypass_auth_check') !== 'true' ||
      localStorage.getItem('superuser_override') !== 'true' ||
      localStorage.getItem('admin_access_enabled') !== 'true'
    );
    
    if (needsLocalStorageUpdate) {
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
      state.user?.role !== 'admin' || // Changed to strict equality
      !state.user?.permissions?.includes('superuser')
    );
    
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
      
      // Use setState to bypass throttling
      authStore.setState({
        isSuperuser: true,
        user: enhancedUser
      });
      
      // Update persisted auth state
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
        console.warn('[AdminAuth] Failed to update persisted auth state:', e);
      }
      
      // Dispatch adminLoginComplete event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
          detail: { isSuperuser: true } 
        }));
      }
      
      return true;
    }
    return true;
  }
  return false;
}

/**
 * Initializes admin authentication for development mode
 */
export function initializeAdminAuth() {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
  localStorage.setItem('bypass_auth_check', 'true');
  localStorage.setItem('superuser_override', 'true');
  localStorage.setItem('admin_access_enabled', 'true');
  
  const adminToken = 'admin-mock-token-with-superuser-privileges-' + Date.now();
  localStorage.setItem('auth-token', adminToken);
  
  const mockUser = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    account_type: 'superuser',
    role: 'admin',
    permissions: ['admin', 'superuser']
  };
  
  const authState = {
    token: adminToken,
    isAuthenticated: true,
    user: mockUser,
    isSuperuser: true,
    lastAuthCheck: Date.now(),
    isLoading: false,
    error: null
  };
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state = authState;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    } else {
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
  setTimeout(() => {
    initializeAdminAuth();
  }, 500);
}

/**
 * Setup synchronization with auth store
 */
export function setupAdminAuthSync() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return () => {};
  }
  
  const setupSync = async () => {
    try {
      const authStoreModule = await import('@/stores/useAuthStore');
      const authStore = authStoreModule.default;
      
      syncAdminAuthWithStore(authStore);
      
      const unsubscribe = authStore.subscribe(
        (state) => ({ isAuthenticated: state.isAuthenticated, isSuperuser: state.isSuperuser }),
        () => {
          syncAdminAuthWithStore(authStore);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('[AdminAuth] Failed to setup auth store sync:', error);
      return () => {};
    }
  };
  
  let unsubscribe = () => {};
  setupSync().then(cleanup => {
    unsubscribe = cleanup;
  });
  
  return () => unsubscribe();
}

export default {
  initializeAdminAuth,
  isAdminAuthEnabled,
  clearAdminAuth,
  syncAdminAuthWithStore,
  setupAdminAuthSync
};