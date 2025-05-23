/**
 * DevModeManager
 * 
 * Manages development mode specific features, particularly focusing on
 * authentication and admin access to provide a seamless development experience.
 * 
 * This manager is designed to be initialized very early in the application
 * lifecycle, even before React components mount, to prevent flickering of
 * admin UI elements.
 */

import { logInfo, logDebug } from './logger';

class DevModeManager {
  static initialized = false;
  
  /**
   * Early initialization to be called before React components mount
   * Sets up the development environment for authentication
   */
  static earlyInitialize() {
    if (process.env.NODE_ENV !== 'development') return false;
    if (this.initialized) return true;
    
    try {
      logInfo('[DevModeManager] Performing early initialization for development mode');
      
      // Set development mode flags in localStorage
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
      localStorage.setItem('bypass_auth_check', 'true');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.removeItem('user_explicitly_logged_out');
      
      // Pre-populate auth storage with admin user to ensure immediate access
      this.setupInitialAuthState();
      
      // Make initial auth state available to React before hydration
      if (typeof window !== 'undefined') {
        window.__INITIAL_AUTH_STATE__ = {
          isAuthenticated: true,
          isSuperuser: true,
          superuserStatusReady: true,
          user: this.getMockAdminUser()
        };
      }
      
      this.initialized = true;
      logInfo('[DevModeManager] Development mode initialized successfully');
      return true;
    } catch (error) {
      console.error('[DevModeManager] Error during early initialization:', error);
      return false;
    }
  }
  
  /**
   * Setup initial auth state in localStorage
   */
  static setupInitialAuthState() {
    try {
      const mockUser = this.getMockAdminUser();
      const adminToken = 'dev-admin-token-' + Date.now();
      
      const initialAuthState = {
        isAuthenticated: true,
        user: mockUser,
        isSuperuser: true,
        superuserStatusReady: true,
        token: adminToken,
        lastAuthCheck: Date.now(),
        isLoading: false,
        error: null
      };
      
      // Check for existing auth storage
      const existingAuthStorage = localStorage.getItem('auth-storage');
      
      if (existingAuthStorage) {
        try {
          const parsed = JSON.parse(existingAuthStorage);
          // Only update if not already authenticated or not a superuser
          if (!parsed.state?.isAuthenticated || !parsed.state?.isSuperuser) {
            parsed.state = initialAuthState;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
            logDebug('[DevModeManager] Updated existing auth storage with admin user');
          }
        } catch (e) {
          // If parsing fails, set new auth storage
          this.createNewAuthStorage(initialAuthState);
        }
      } else {
        // No existing auth storage, create new
        this.createNewAuthStorage(initialAuthState);
      }
      
      // Set auth token for legacy support
      localStorage.setItem('auth-token', adminToken);
      
    } catch (error) {
      console.error('[DevModeManager] Error setting up initial auth state:', error);
    }
  }
  
  /**
   * Create new auth storage with initial state
   * @param {Object} initialState - Initial auth state
   */
  static createNewAuthStorage(initialState) {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: initialState,
      version: 0
    }));
    logDebug('[DevModeManager] Created new auth storage with admin user');
  }
  
  /**
   * Get a mock admin user object
   * @returns {Object} Mock admin user
   */
  static getMockAdminUser() {
    return {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      account_type: 'superuser',
      role: 'admin',
      permissions: ['admin', 'superuser', 'manage_users', 'manage_content'],
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Force admin status in the current session
   * @returns {boolean} Success status
   */
  static forceAdminStatus() {
    if (process.env.NODE_ENV !== 'development') return false;
    
    try {
      logInfo('[DevModeManager] Forcing admin status');
      
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
            parsed.state.superuserStatusReady = true;
            
            if (parsed.state.user) {
              parsed.state.user.account_type = 'superuser';
              parsed.state.user.role = 'admin';
              parsed.state.user.permissions = [...new Set([
                ...(parsed.state.user.permissions || []), 
                'admin', 
                'superuser'
              ])];
            } else {
              parsed.state.user = this.getMockAdminUser();
            }
            
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        } else {
          // No existing auth storage, create new with admin status
          this.setupInitialAuthState();
        }
      } catch (e) {
        console.error('[DevModeManager] Error updating auth storage:', e);
      }
      
      // Dispatch event to notify components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adminLoginComplete', { 
          detail: { isSuperuser: true } 
        }));
        
        // Also dispatch the new event for components using the new system
        window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
          detail: { isSuperuser: true }
        }));
      }
      
      return true;
    } catch (error) {
      console.error('[DevModeManager] Error forcing admin status:', error);
      return false;
    }
  }
  
  /**
   * Clear admin status
   * @returns {boolean} Success status
   */
  static clearAdminStatus() {
    if (process.env.NODE_ENV !== 'development') return false;
    
    try {
      logInfo('[DevModeManager] Clearing admin status');
      
      // Remove admin flags
      localStorage.removeItem('admin_api_key');
      localStorage.removeItem('bypass_auth_check');
      localStorage.removeItem('superuser_override');
      localStorage.removeItem('admin_access_enabled');
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      // Update auth storage directly
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          if (parsed.state) {
            // Update superuser status
            parsed.state.isSuperuser = false;
            parsed.state.superuserStatusReady = true;
            
            if (parsed.state.user) {
              parsed.state.user.account_type = 'user';
              parsed.state.user.role = 'user';
              parsed.state.user.permissions = parsed.state.user.permissions?.filter(
                p => p !== 'admin' && p !== 'superuser'
              ) || [];
            }
            
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error('[DevModeManager] Error updating auth storage:', e);
      }
      
      // Dispatch event to notify components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adminLogoutComplete', { 
          detail: { cleared: true } 
        }));
        
        // Also dispatch the new event for components using the new system
        window.dispatchEvent(new CustomEvent('auth:superuser_status_changed', {
          detail: { isSuperuser: false }
        }));
      }
      
      return true;
    } catch (error) {
      console.error('[DevModeManager] Error clearing admin status:', error);
      return false;
    }
  }
}

// Automatically perform early initialization in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  DevModeManager.earlyInitialize();
}

export default DevModeManager; 