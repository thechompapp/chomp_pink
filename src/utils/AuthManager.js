/**
 * AuthManager
 * 
 * Centralized authentication management class that handles all auth operations,
 * including superuser detection, permission management, and auth state synchronization.
 * 
 * This manager uses an event-based system for clean subscriptions/unsubscriptions
 * and provides atomic state updates to prevent race conditions.
 */

import { logInfo, logDebug, logWarn, logError } from './logger';
import useAuthenticationStore from '@/stores/auth/useAuthenticationStore';
import useSuperuserStore from '@/stores/auth/useSuperuserStore';

// Safe environment check
const isDevelopmentMode = () => {
  // Check Vite environment variables first (import.meta is always available in ES modules)
  if (import.meta && import.meta.env) {
    return import.meta.env.MODE === 'development' || import.meta.env.DEV;
  }
  // Check process.env if available (Node.js/webpack environments)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  // Default to development if unable to determine
  return true;
};

// AuthManager events
export const AUTH_EVENTS = {
  INITIALIZED: 'auth:initialized',
  LOGIN_COMPLETE: 'auth:login_complete',
  LOGOUT_COMPLETE: 'auth:logout_complete',
  SUPERUSER_STATUS_CHANGED: 'auth:superuser_status_changed',
  AUTH_ERROR: 'auth:error'
};

class AuthManager {
  static events = new EventTarget();
  static initialized = false;
  
  /**
   * Initialize the AuthManager
   * This should be called early in the application lifecycle
   */
  static initialize() {
    if (this.initialized) {
      logDebug('[AuthManager] Already initialized, skipping');
      return;
    }
    
    logInfo('[AuthManager] Initializing authentication manager');
    
    // Clear offline mode flags immediately
    this.clearOfflineMode();
    
    // Setup listeners for auth store changes using the modular stores
    try {
      // Subscribe to authentication store changes
      const authUnsubscribe = useAuthenticationStore.subscribe((state) => {
        // Handle authentication state changes
        this.handleAuthStateChange(state);
      });
      
      // Subscribe to superuser store changes  
      const superuserUnsubscribe = useSuperuserStore.subscribe((state) => {
        // Handle superuser state changes
        this.handleSuperuserStateChange(state);
      });
      
      // Store unsubscribe functions for cleanup
      this.authUnsubscribe = authUnsubscribe;
      this.superuserUnsubscribe = superuserUnsubscribe;
      
    } catch (error) {
      logError('[AuthManager] Error setting up store subscriptions:', error);
    }
    
    // Listen for storage events to sync across tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth-storage' || event.key === 'auth-authentication-storage') {
        this.syncAuthStateAcrossTabs();
      }
      
      // Clear offline mode when force_online is set
      if (event.key === 'force_online' && event.newValue === 'true') {
        this.clearOfflineMode();
      }
    });
    
    // Listen for offline status changes
    window.addEventListener('online', () => {
      logInfo('[AuthManager] Browser went online');
      this.clearOfflineMode();
    });
    
    // Set up interval to periodically check and clear offline mode if authenticated
    this.offlineModeCheckInterval = setInterval(() => {
      try {
        const authState = useAuthenticationStore.getState();
        if (authState && authState.isAuthenticated) {
          this.clearOfflineMode();
        }
      } catch (error) {
        logError('[AuthManager] Error in offline mode check:', error);
      }
    }, 5000); // Check every 5 seconds
    
    this.initialized = true;
    
    // Dispatch initialized event
    this.dispatchAuthEvent(AUTH_EVENTS.INITIALIZED, { initialized: true });
    
    return () => {
      // Cleanup function
      if (this.authUnsubscribe) this.authUnsubscribe();
      if (this.superuserUnsubscribe) this.superuserUnsubscribe();
      if (this.offlineModeCheckInterval) clearInterval(this.offlineModeCheckInterval);
    };
  }
  
  /**
   * Handle authentication state changes
   * @param {Object} authState - New authentication state
   */
  static handleAuthStateChange(authState) {
    try {
      logDebug('[AuthManager] Auth state changed:', authState);
      
      // Clear offline mode when authentication state changes
      this.clearOfflineMode();
      
      if (authState.isAuthenticated && authState.user) {
        this.handleLogin(authState.user);
      } else if (!authState.isAuthenticated) {
        this.handleLogout();
      }
    } catch (error) {
      logError('[AuthManager] Error handling auth state change:', error);
    }
  }
  
  /**
   * Handle superuser state changes
   * @param {Object} superuserState - New superuser state
   */
  static handleSuperuserStateChange(superuserState) {
    try {
      logDebug('[AuthManager] Superuser state changed:', superuserState);
      
      this.handleSuperuserStatusChange(superuserState.isSuperuser);
    } catch (error) {
      logError('[AuthManager] Error handling superuser state change:', error);
    }
  }
  
  /**
   * Clear all offline mode flags
   * This ensures that offline mode is properly disabled when a user is authenticated
   */
  static clearOfflineMode() {
    logDebug('[AuthManager] Clearing offline mode flags');
    
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
      
      // Set admin flags in development mode
      if (isDevelopmentMode()) {
        const isAuthenticated = useAuthenticationStore.getState().isAuthenticated;
        if (isAuthenticated) {
          localStorage.setItem('admin_access_enabled', 'true');
          localStorage.setItem('superuser_override', 'true');
          localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
        }
      }
      
      // Dispatch event to notify components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
          detail: { isOffline: false }
        }));
        
        // Force UI refresh
        window.dispatchEvent(new CustomEvent('forceUiRefresh', {
          detail: { timestamp: Date.now() }
        }));
      }
    } catch (error) {
      logError('[AuthManager] Error clearing offline mode flags:', error);
    }
  }
  
  /**
   * Handle user login
   * @param {Object} user - The logged in user
   */
  static handleLogin(user) {
    logInfo('[AuthManager] Handling login for user');
    
    // Clear offline mode flags
    this.clearOfflineMode();
    
    // Check and apply superuser status
    this.checkAndApplySuperuserStatus(user);
    
    // Dispatch login complete event
    this.dispatchAuthEvent(AUTH_EVENTS.LOGIN_COMPLETE, { 
      user,
      isSuperuser: useAuthenticationStore.getState().isSuperuser 
    });
  }
  
  /**
   * Handle user logout
   */
  static handleLogout() {
    logInfo('[AuthManager] Handling logout');
    
    // Clear admin flags
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('admin_access_enabled');
      localStorage.removeItem('superuser_override');
      localStorage.removeItem('admin_api_key');
      
      // In development mode, set explicit logout flag
      if (isDevelopmentMode()) {
        localStorage.setItem('user_explicitly_logged_out', 'true');
      }
    }
    
    // Dispatch logout complete event
    this.dispatchAuthEvent(AUTH_EVENTS.LOGOUT_COMPLETE, { 
      loggedOut: true 
    });
    
    // Force UI refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('forceUiRefresh', {
        detail: { timestamp: Date.now() }
      }));
    }
  }
  
  /**
   * Handle superuser status change
   * @param {boolean} isSuperuser - The new superuser status
   */
  static handleSuperuserStatusChange(isSuperuser) {
    logInfo('[AuthManager] Handling superuser status change:', isSuperuser);
    
    // Update auth store if needed
    const authState = useAuthenticationStore.getState();
    
    // Check if we need to update the user object to match superuser status
    if (isSuperuser && authState.user && 
        (authState.user.account_type !== 'superuser' || 
         authState.user.role !== 'admin' ||
         !authState.user.permissions?.includes('superuser'))) {
      
      this.updateUserWithSuperuserStatus();
    }
    
    // Update superuserStatusReady flag if not already set
    if (!authState.superuserStatusReady) {
      useAuthenticationStore.setState({ superuserStatusReady: true });
    }
    
    // Dispatch superuser status changed event
    this.dispatchAuthEvent(AUTH_EVENTS.SUPERUSER_STATUS_CHANGED, { isSuperuser });
  }
  
  /**
   * Check and apply superuser status for a user
   * @param {Object} user - The user to check
   * @returns {boolean} - True if the user is a superuser
   */
  static checkAndApplySuperuserStatus(user = null) {
    if (!user) {
      user = useAuthenticationStore.getState().user;
      if (!user) return false;
    }
    
    const authState = useAuthenticationStore.getState();
    
    // Determine if user should have superuser status
    const shouldBeSuperuser = this.shouldHaveSuperuserStatus(user);
    
    // If superuser status needs to be updated, update the auth store
    if (shouldBeSuperuser !== authState.isSuperuser) {
      logInfo('[AuthManager] Updating isSuperuser flag to:', shouldBeSuperuser);
      
      useAuthenticationStore.setState({ 
        isSuperuser: shouldBeSuperuser,
        superuserStatusReady: true
      });
      
      // Update user in auth store if needed
      if (shouldBeSuperuser) {
        this.updateUserWithSuperuserStatus();
      }
      
      return shouldBeSuperuser;
    }
    
    // Ensure superuserStatusReady is set
    if (!authState.superuserStatusReady) {
      useAuthenticationStore.setState({ superuserStatusReady: true });
    }
    
    return authState.isSuperuser;
  }
  
  /**
   * Update the user object in auth store with superuser status
   */
  static updateUserWithSuperuserStatus() {
    const authState = useAuthenticationStore.getState();
    if (!authState.user) return;
    
    // Create enhanced user with superuser permissions
    const enhancedUser = {
      ...authState.user,
      account_type: 'superuser',
      role: 'admin',
      permissions: [...new Set([
        ...(authState.user.permissions || []),
        'admin',
        'superuser'
      ])]
    };
    
    // Update user in store
    useAuthenticationStore.setState({ user: enhancedUser });
    
    // Update persisted auth state
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state) {
          parsed.state.user = enhancedUser;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
          logDebug('[AuthManager] Updated persisted auth state with superuser user');
        }
      }
    } catch (e) {
      logWarn('[AuthManager] Failed to update persisted auth state:', e);
    }
  }
  
  /**
   * Determine if a user should have superuser status
   * @param {Object} user - The user to check
   * @returns {boolean} - True if the user should have superuser status
   */
  static shouldHaveSuperuserStatus(user) {
    if (!user) return false;
    
    // In development mode, everyone is a superuser by default
    if (isDevelopmentMode()) {
      return true;
    }
    
    // Check user properties for superuser status
    return (
      user.account_type === 'superuser' || 
      user.role === 'admin' || 
      user.permissions?.includes('admin') || 
      user.permissions?.includes('superuser')
    );
  }
  
  /**
   * Sync admin authentication with the auth store and localStorage
   * @returns {boolean} - Whether syncing was successful
   */
  static syncAdminAuth() {
    logInfo('[AuthManager] Synchronizing admin authentication');
    
    const authState = useAuthenticationStore.getState();
    
    // Only sync if authenticated
    if (!authState.isAuthenticated || !authState.user) {
      logDebug('[AuthManager] Not authenticated, skipping admin auth sync');
      return false;
    }
    
    // In development mode, ensure admin flags are set
    if (isDevelopmentMode()) {
      this.setDevelopmentAdminFlags();
    }
    
    // Check and apply superuser status
    const isSuperuser = this.checkAndApplySuperuserStatus();
    
    // Ensure superuserStatusReady is set
    if (!authState.superuserStatusReady) {
      useAuthenticationStore.setState({ superuserStatusReady: true });
    }
    
    return isSuperuser;
  }
  
  /**
   * Sync auth state across tabs
   */
  static syncAuthStateAcrossTabs() {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) return;
      
      const parsed = JSON.parse(authStorage);
      if (!parsed.state) return;
      
      // Get current state to compare
      const currentState = useAuthenticationStore.getState();
      
      // Only update if there are actual changes
      if (parsed.state.isAuthenticated !== currentState.isAuthenticated ||
          parsed.state.isSuperuser !== currentState.isSuperuser) {
        
        logInfo('[AuthManager] Syncing auth state across tabs');
        
        // Update auth store with storage values
        useAuthenticationStore.setState({
          isAuthenticated: parsed.state.isAuthenticated,
          user: parsed.state.user,
          isSuperuser: parsed.state.isSuperuser,
          superuserStatusReady: true
        });
      }
    } catch (e) {
      logWarn('[AuthManager] Error syncing auth state across tabs:', e);
    }
  }
  
  /**
   * Set development mode admin flags in localStorage
   */
  static setDevelopmentAdminFlags() {
    if (!isDevelopmentMode()) return;
    
    localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
    localStorage.setItem('bypass_auth_check', 'true');
    localStorage.setItem('superuser_override', 'true');
    localStorage.setItem('admin_access_enabled', 'true');
    localStorage.removeItem('user_explicitly_logged_out');
    
    logDebug('[AuthManager] Set development admin flags in localStorage');
  }
  
  /**
   * Clear development mode admin flags from localStorage
   */
  static clearDevelopmentAdminFlags() {
    if (!isDevelopmentMode()) return;
    
    localStorage.removeItem('admin_api_key');
    localStorage.removeItem('bypass_auth_check');
    localStorage.removeItem('superuser_override');
    localStorage.removeItem('admin_access_enabled');
    localStorage.setItem('user_explicitly_logged_out', 'true');
    
    logDebug('[AuthManager] Cleared development admin flags from localStorage');
  }
  
  /**
   * Subscribe to an auth event
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  static subscribe(eventName, callback) {
    const handler = (event) => callback(event.detail);
    this.events.addEventListener(eventName, handler);
    
    return () => {
      this.events.removeEventListener(eventName, handler);
    };
  }
  
  /**
   * Dispatch an auth event
   * @param {string} eventName - Event name to dispatch
   * @param {Object} detail - Event details
   */
  static dispatchAuthEvent(eventName, detail = {}) {
    this.events.dispatchEvent(new CustomEvent(eventName, { detail }));
    
    // Also dispatch a window event for legacy support
    if (typeof window !== 'undefined') {
      // Map auth events to legacy events
      const legacyEventMap = {
        [AUTH_EVENTS.LOGIN_COMPLETE]: 'adminLoginComplete',
        [AUTH_EVENTS.LOGOUT_COMPLETE]: 'adminLogoutComplete',
        [AUTH_EVENTS.SUPERUSER_STATUS_CHANGED]: 'superuserStatusChanged'
      };
      
      const legacyEvent = legacyEventMap[eventName];
      if (legacyEvent) {
        window.dispatchEvent(new CustomEvent(legacyEvent, { detail }));
      }
    }
  }
}

export default AuthManager; 