/**
 * Authentication Coordination System
 * 
 * This is the SINGLE SOURCE OF TRUTH for all authentication state.
 * It coordinates between frontend, backend, and all authentication subsystems.
 * 
 * 🔄 Key Responsibilities:
 * 1. Centralized token validation and synchronization
 * 2. Session expiry coordination across all systems
 * 3. Logout coordination (invalidates EVERYWHERE)
 * 4. Cross-service authentication consistency
 * 5. Error handling coordination for 401/403 responses
 * 6. Admin authentication synchronization
 */

import { logInfo, logError, logWarn, logDebug } from './logger';
import { toast } from 'react-hot-toast';

// Constants
const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login_success',
  LOGOUT_COMPLETE: 'auth:logout_complete',
  TOKEN_EXPIRED: 'auth:token_expired',
  UNAUTHORIZED: 'auth:unauthorized',
  SESSION_RESTORED: 'auth:session_restored',
  STATE_SYNC: 'auth:state_sync'
};

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'current_user',
  ADMIN_KEY: 'admin_api_key',
  ADMIN_ACCESS: 'admin_access_enabled',
  SUPERUSER: 'superuser_override',
  FORCE_ONLINE: 'force_online',
  LOGOUT_FLAG: 'user_explicitly_logged_out'
};

/**
 * Authentication Coordination System
 */
class AuthenticationCoordinator {
  constructor() {
    this.listeners = new Map();
    this.authStores = new Set();
    this.isInitialized = false;
    this.currentState = {
      isAuthenticated: false,
      user: null,
      token: null,
      isAdmin: false,
      isSuperuser: false,
      lastVerified: null
    };
    
    this.lastTokenValidation = 0; // Track when we last validated the token
    
    // Bind methods
    this.getCurrentState = this.getCurrentState.bind(this);
  }

  /**
   * Initialize the coordinator
   */
  async initialize() {
    if (this.isInitialized) return;
    
    logInfo('[AuthCoordinator] Initializing authentication coordination system');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Register all auth stores
    await this.registerAuthStores();
    
    // Perform initial state sync
    await this.performInitialSync();
    
    // Set up periodic token validation
    this.setupTokenValidation();
    
    this.isInitialized = true;
    logInfo('[AuthCoordinator] Authentication coordination system ready');
  }

  /**
   * Register authentication stores for coordination
   */
  async registerAuthStores() {
    try {
      // Import stores dynamically to avoid circular dependencies
      const authStoreModules = [
        () => import('@/stores/auth/useAuthenticationStore'),
        () => import('@/stores/useAuthStore'),
        () => import('@/contexts/auth/AuthContext')
      ];

      for (const moduleImporter of authStoreModules) {
        try {
          const module = await moduleImporter();
          const store = module.default || module;
          if (store) {
            this.authStores.add(store);
            logDebug('[AuthCoordinator] Registered auth store');
          }
        } catch (error) {
          logWarn('[AuthCoordinator] Failed to register auth store:', error.message);
        }
      }
    } catch (error) {
      logError('[AuthCoordinator] Error registering auth stores:', error);
    }
  }

  /**
   * Perform initial state synchronization
   */
  async performInitialSync() {
    logInfo('[AuthCoordinator] Performing initial authentication state sync');
    
    try {
      // Check for explicit logout flag first
      const explicitLogout = localStorage.getItem(STORAGE_KEYS.LOGOUT_FLAG) === 'true';
      if (explicitLogout) {
        logInfo('[AuthCoordinator] User explicitly logged out, clearing all auth state');
        await this.performCoordinatedLogout(false); // Don't call API
        return;
      }

      // Get token from storage and validate it's not just a string 'null'
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

      // Check for invalid token values (null strings, empty, etc.)
      const isValidToken = token && 
                          token !== 'null' && 
                          token !== 'undefined' && 
                          token.trim() !== '' &&
                          token.length > 10; // Real tokens are much longer

      if (!isValidToken) {
        logInfo('[AuthCoordinator] No valid auth token found (token:', token, '), setting unauthenticated state');
        await this.syncAuthenticatedState(false, null, null);
        return;
      }

      // Parse saved user data and validate it
      let user = null;
      if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        try {
          user = JSON.parse(savedUser);
          // Validate user object has required properties
          if (!user || typeof user !== 'object' || !user.id) {
            throw new Error('Invalid user object structure');
          }
        } catch (error) {
          logWarn('[AuthCoordinator] Invalid saved user data, clearing:', error.message);
          localStorage.removeItem(STORAGE_KEYS.USER);
          user = null;
        }
      }

      // FIXED: Always verify tokens, even in development mode
      // This prevents authentication bypass with invalid tokens
      logInfo('[AuthCoordinator] Verifying token with backend (even in dev mode)');
      const isValid = await this.verifyTokenWithBackend(token);
      
      if (isValid && user) {
        logInfo('[AuthCoordinator] Token verified successfully, syncing authenticated state');
        await this.syncAuthenticatedState(true, user, token);
        
        // Set up admin access if in development mode
        if (import.meta.env.DEV) {
          this.setupDevelopmentAdminAccess(user);
        }
      } else {
        logWarn('[AuthCoordinator] Token verification failed or missing user data, clearing auth state');
        await this.performCoordinatedLogout(false);
      }
    } catch (error) {
      logError('[AuthCoordinator] Error in initial sync:', error);
      // On error, default to unauthenticated state
      await this.syncAuthenticatedState(false, null, null);
    }
  }

  /**
   * Verify token with backend
   */
  async verifyTokenWithBackend(token) {
    try {
      // Validate token format first
      if (!token || token === 'null' || token === 'undefined' || token.trim() === '' || token.length < 10) {
        logWarn('[AuthCoordinator] Invalid token format, skipping verification');
        return false;
      }

      // Skip verification if explicitly logged out
      if (localStorage.getItem(STORAGE_KEYS.LOGOUT_FLAG) === 'true') {
        logInfo('[AuthCoordinator] User explicitly logged out, token invalid');
        return false;
      }

      logDebug('[AuthCoordinator] Verifying token with backend API');

      const response = await fetch('/api/auth/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });

      logDebug('[AuthCoordinator] Token verification response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const isValid = data.valid === true || data.success === true || data.authenticated === true;
        logInfo('[AuthCoordinator] Token verification result:', isValid);
        return isValid;
      } else if (response.status === 401 || response.status === 403) {
        logInfo('[AuthCoordinator] Token expired or unauthorized (status:', response.status, ')');
        return false;
      } else {
        logWarn('[AuthCoordinator] Token verification failed with status:', response.status);
        
        // For server errors (500, 503, etc.), check if we're in dev mode
        if (import.meta.env.DEV) {
          logWarn('[AuthCoordinator] Development mode: treating server error as invalid token to avoid auth loops');
          return false;
        }
        
        // In production, assume token is still valid on server errors for better UX
        return true;
      }
    } catch (error) {
      logError('[AuthCoordinator] Token verification error:', error.message);
      
      // Network/timeout errors in development mode = invalid token
      if (import.meta.env.DEV) {
        logWarn('[AuthCoordinator] Development mode: treating network error as invalid token');
        return false;
      }
      
      // In production, assume token is still valid on network errors for better UX
      return true;
    }
  }

  /**
   * Coordinate login across all systems
   */
  async coordinateLogin(credentials) {
    logInfo('[AuthCoordinator] Coordinating login across all systems');
    
    try {
      // Clear any previous logout flags
      localStorage.removeItem(STORAGE_KEYS.LOGOUT_FLAG);
      
      // Attempt login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const loginData = await response.json();
      const { user, token } = loginData.data || loginData;

      if (!user || !token) {
        throw new Error('Invalid login response from server');
      }

      // Store authentication data in ALL possible token keys for maximum compatibility
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);  // 'token'
      localStorage.setItem('auth-token', token);         // Alternative key
      localStorage.setItem('authToken', token);          // Alternative key
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));  // 'current_user'
      localStorage.setItem('userData', JSON.stringify(user));         // Alternative key
      
      // Sync across all systems
      await this.syncAuthenticatedState(true, user, token);
      
      // Set up admin access if in development
      if (import.meta.env.DEV) {
        this.setupDevelopmentAdminAccess(user);
      }

      // Dispatch success event
      this.dispatchEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user, token });
      
      logInfo('[AuthCoordinator] Login coordinated successfully');
      return { success: true, user, token };
      
    } catch (error) {
      logError('[AuthCoordinator] Login coordination failed:', error);
      
      // Ensure clean state on login failure
      await this.syncAuthenticatedState(false, null, null);
      
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }

  /**
   * Coordinate logout across ALL systems
   */
  async coordinateLogout() {
    logInfo('[AuthCoordinator] Coordinating logout across ALL systems');
    return await this.performCoordinatedLogout(true);
  }

  /**
   * Perform coordinated logout
   */
  async performCoordinatedLogout(callAPI = true) {
    try {
      logInfo('[AuthCoordinator] Starting coordinated logout...');
      
      // 1. Set explicit logout flag FIRST to prevent race conditions
      localStorage.setItem(STORAGE_KEYS.LOGOUT_FLAG, 'true');
      
      // 2. Get current token before clearing for API call
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || 
                   localStorage.getItem('auth-token') || 
                   localStorage.getItem('auth_access_token');
      
      // 3. Call logout API if requested and token exists
      if (callAPI && token) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            logInfo('[AuthCoordinator] Logout API call successful');
          } else {
            logWarn('[AuthCoordinator] Logout API returned non-200 status:', response.status);
          }
        } catch (error) {
          logWarn('[AuthCoordinator] Logout API call failed, continuing with local cleanup:', error.message);
        }
      }

      // 4. Clear ALL storage comprehensively
      this.clearAllAuthStorage();
      
      // 5. Clear additional state not covered by clearAllAuthStorage
      const additionalKeys = [
        'auth-token', 'token', 'refreshToken', 'auth_access_token', 
        'auth_refresh_token', 'auth_token_expiry', 'userData', 'current_user',
        'admin_api_key', 'admin_access_enabled', 'superuser_override',
        'auth-authentication-storage', 'user-profile-storage'
      ];
      
      additionalKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // 6. Clear HTTP client headers
      if (window.axios && window.axios.defaults) {
        delete window.axios.defaults.headers.common['Authorization'];
      }
      
      // 7. Clear all cookies
      this.clearAllCookies();
      
      // 8. Sync unauthenticated state across all systems
      await this.syncAuthenticatedState(false, null, null);
      
      // 9. Dispatch comprehensive logout events
      this.dispatchEvent(AUTH_EVENTS.LOGOUT_COMPLETE, { 
        timestamp: Date.now(),
        cleared: true,
        comprehensive: true
      });
      
      // 10. Force UI refresh across all components
      window.dispatchEvent(new CustomEvent('forceUiRefresh', {
        detail: { 
          source: 'logout',
          timestamp: Date.now() 
        }
      }));
      
      // 11. Restore logout flag after all clearing
      localStorage.setItem(STORAGE_KEYS.LOGOUT_FLAG, 'true');
      
      logInfo('[AuthCoordinator] Comprehensive logout coordinated successfully across all systems');
      
    } catch (error) {
      logError('[AuthCoordinator] Error in coordinated logout:', error);
      
      // CRITICAL: Even on error, ensure complete local state clearing
      this.forceCompleteLogout();
    }
  }

  /**
   * Force complete logout (emergency fallback)
   */
  forceCompleteLogout() {
    try {
      logWarn('[AuthCoordinator] Forcing complete logout cleanup...');
      
      // Clear everything possible
      if (typeof localStorage !== 'undefined') {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      
      // Clear cookies aggressively
      this.clearAllCookies();
      
      // Clear HTTP headers
      if (window.axios && window.axios.defaults) {
        delete window.axios.defaults.headers.common['Authorization'];
      }
      
      // Set logout flag
      localStorage.setItem(STORAGE_KEYS.LOGOUT_FLAG, 'true');
      
      // Force state sync
      this.syncAuthenticatedState(false, null, null);
      
      logInfo('[AuthCoordinator] Force logout completed');
      
    } catch (error) {
      logError('[AuthCoordinator] Error in force logout:', error);
    }
  }

  /**
   * Clear all cookies aggressively
   */
  clearAllCookies() {
    try {
      // Clear all cookies by setting them to expire
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear specific auth cookies
      const authCookies = ['auth-token', 'token', 'session', 'auth'];
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      });
      
    } catch (error) {
      logWarn('[AuthCoordinator] Error clearing cookies:', error);
    }
  }

  /**
   * Clear all authentication storage
   */
  clearAllAuthStorage() {
    logInfo('[AuthCoordinator] Clearing all authentication storage');
    
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear other auth-related keys
    const authKeys = [
      'auth-storage',
      'auth-authentication-storage',
      'admin_config',
      'offline_mode',
      'offline-mode',
      'bypass_auth_check'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Restore the logout flag
    localStorage.setItem(STORAGE_KEYS.LOGOUT_FLAG, 'true');
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies() {
    const authCookieNames = [
      'auth', 'token', 'user', 'admin', 
      'session', 'jwt', 'access_token'
    ];
    
    authCookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
  }

  /**
   * Sync authenticated state across all systems
   */
  async syncAuthenticatedState(isAuthenticated, user, token) {
    // Check if user has explicitly logged out - if so, don't sync authenticated state
    const hasExplicitlyLoggedOut = localStorage.getItem(STORAGE_KEYS.LOGOUT_FLAG) === 'true';
    const isLogoutInProgress = localStorage.getItem('logout_in_progress') === 'true';
    
    if (hasExplicitlyLoggedOut || isLogoutInProgress) {
      logInfo('[AuthCoordinator] User explicitly logged out or logout in progress - not syncing authenticated state');
      
      // Force logout state instead
      const logoutState = {
        isAuthenticated: false,
        user: null,
        token: null,
        isAdmin: false,
        isSuperuser: false,
        lastVerified: Date.now()
      };
      
      this.currentState = logoutState;
      
      // Clear auth storage instead of setting it
      localStorage.removeItem('auth-authentication-storage');
      
      // Sync logout state to all stores
      for (const store of this.authStores) {
        try {
          if (store && typeof store.setState === 'function') {
            store.setState({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
              error: null,
              isSuperuser: false,
              superuserStatusReady: true
            });
          } else if (store && typeof store.getState === 'function') {
            // Handle Zustand stores
            store.setState({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
              error: null,
              isSuperuser: false,
              superuserStatusReady: true
            });
          }
        } catch (error) {
          logWarn('[AuthCoordinator] Failed to sync logout state to auth store:', error.message);
        }
      }
      
      // Dispatch logout state sync event
      this.dispatchEvent(AUTH_EVENTS.STATE_SYNC, logoutState);
      
      logDebug('[AuthCoordinator] Logout state synced across all systems');
      return;
    }
    
    const newState = {
      isAuthenticated,
      user,
      token,
      isAdmin: isAuthenticated && (user?.role === 'admin' || user?.role === 'superuser' || user?.account_type === 'superuser'),
      isSuperuser: isAuthenticated && (user?.role === 'superuser' || user?.account_type === 'superuser'),
      lastVerified: Date.now()
    };

    // Update internal state
    this.currentState = newState;

    // **CRITICAL FIX**: Update the auth-authentication-storage that React context uses
    try {
      const authStorageState = {
        state: {
          token,
          isAuthenticated,
          user,
          lastAuthCheck: Date.now(),
          error: null
        },
        version: 0
      };
      
      localStorage.setItem('auth-authentication-storage', JSON.stringify(authStorageState));
      logDebug('[AuthCoordinator] Updated auth-authentication-storage for React context');
    } catch (error) {
      logWarn('[AuthCoordinator] Failed to update auth-authentication-storage:', error.message);
    }

    // Sync all registered auth stores
    for (const store of this.authStores) {
      try {
        if (store && typeof store.setState === 'function') {
          store.setState({
            isAuthenticated,
            user,
            token,
            isLoading: false,
            error: null,
            isSuperuser: newState.isSuperuser,
            superuserStatusReady: true
          });
        } else if (store && typeof store.getState === 'function') {
          // Handle Zustand stores
          const currentState = store.getState();
          store.setState({
            ...currentState,
            isAuthenticated,
            user,
            token,
            isLoading: false,
            error: null,
            isSuperuser: newState.isSuperuser,
            superuserStatusReady: true
          });
        }
      } catch (error) {
        logWarn('[AuthCoordinator] Failed to sync auth store:', error.message);
      }
    }

    // Dispatch state sync event
    this.dispatchEvent(AUTH_EVENTS.STATE_SYNC, newState);
    
    logDebug('[AuthCoordinator] Authentication state synced across all systems');
  }

  /**
   * Set up development mode admin access
   */
  setupDevelopmentAdminAccess(user) {
    if (!import.meta.env.DEV) return;
    
    logInfo('[AuthCoordinator] Setting up development mode admin access');
    
    // Set admin flags
    localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, 'true');
    localStorage.setItem(STORAGE_KEYS.SUPERUSER, 'true');
    localStorage.setItem(STORAGE_KEYS.ADMIN_KEY, 'doof-admin-secret-key-dev');
    localStorage.setItem(STORAGE_KEYS.FORCE_ONLINE, 'true');
    
    // Clear offline flags
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('offline-mode');
    sessionStorage.removeItem('offline_mode');
    sessionStorage.removeItem('offline-mode');
  }

  /**
   * Handle 401/403 responses from any part of the system
   */
  handleUnauthorizedResponse(response) {
    logWarn('[AuthCoordinator] Unauthorized response detected, coordinating logout');
    
    if (response.status === 401) {
      this.dispatchEvent(AUTH_EVENTS.TOKEN_EXPIRED, { response });
      this.performCoordinatedLogout(false);
      toast.error('Your session has expired. Please log in again.');
    } else if (response.status === 403) {
      this.dispatchEvent(AUTH_EVENTS.UNAUTHORIZED, { response });
      toast.error('You do not have permission to access this resource.');
    }
  }

  /**
   * Set up periodic token validation
   */
  setupTokenValidation() {
    // Use VERY user-friendly token validation
    // Only validate on absolutely necessary events, with very reasonable intervals
    
    logInfo('[AuthCoordinator] Setting up ultra user-friendly token validation');
    
    // Track last validation to prevent over-validation
    this.lastTokenValidation = this.lastTokenValidation || 0;
    
    // Validate on page focus (when user returns to tab) - but only after VERY long periods
    window.addEventListener('focus', async () => {
      if (this.currentState.isAuthenticated && this.currentState.token) {
        const timeSinceLastCheck = Date.now() - this.lastTokenValidation;
        // Only validate if it's been more than 4 HOURS since last check
        // This prevents any validation during normal usage
        if (timeSinceLastCheck > 4 * 60 * 60 * 1000) {
          logInfo('[AuthCoordinator] Validating token on page focus (4+ hours since last check)');
          const isValid = await this.verifyTokenWithBackend(this.currentState.token);
          if (!isValid) {
            logInfo('[AuthCoordinator] Token validation failed on focus, logging out');
            await this.performCoordinatedLogout(false);
          } else {
            this.lastTokenValidation = Date.now();
          }
        } else {
          logDebug('[AuthCoordinator] Skipping token validation on focus - too recent');
        }
      }
    });
    
    // Validate on online event (when network comes back) - but be VERY lenient
    window.addEventListener('online', async () => {
      if (this.currentState.isAuthenticated && this.currentState.token) {
        const timeSinceLastCheck = Date.now() - this.lastTokenValidation;
        // Only validate on network reconnection if it's been more than 1 HOUR
        if (timeSinceLastCheck > 60 * 60 * 1000) {
          logInfo('[AuthCoordinator] Validating token on network reconnection');
          const isValid = await this.verifyTokenWithBackend(this.currentState.token);
          if (!isValid) {
            logInfo('[AuthCoordinator] Token validation failed on reconnection, logging out');
            await this.performCoordinatedLogout(false);
          } else {
            this.lastTokenValidation = Date.now();
          }
        } else {
          logDebug('[AuthCoordinator] Skipping token validation on reconnection - too recent');
        }
      }
    });
    
    // Remove any existing periodic validation intervals
    if (this.tokenValidationInterval) {
      clearInterval(this.tokenValidationInterval);
      this.tokenValidationInterval = null;
    }
    
    logInfo('[AuthCoordinator] Ultra user-friendly token validation setup complete - minimal validation');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for storage changes across tabs
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.LOGOUT_FLAG && event.newValue === 'true') {
        logInfo('[AuthCoordinator] Logout detected in another tab, syncing logout');
        this.performCoordinatedLogout(false);
      }
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      if (this.currentState.isAuthenticated) {
        logInfo('[AuthCoordinator] Network restored, verifying token');
        this.verifyTokenWithBackend(this.currentState.token);
      }
    });
  }

  /**
   * Dispatch authentication events
   */
  dispatchEvent(eventType, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, { detail }));
    }
  }

  /**
   * Get current authentication state
   */
  getCurrentState() {
    return { ...this.currentState };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentState.isAuthenticated;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.currentState.isAdmin;
  }

  /**
   * Check if user is superuser
   */
  isSuperuser() {
    return this.currentState.isSuperuser;
  }

  /**
   * Set token (compatibility method for migration helper)
   */
  async setToken(token) {
    if (!token) {
      logWarn('[AuthCoordinator] Invalid token provided to setToken');
      return;
    }

    // Verify token first
    const isValid = await this.verifyTokenWithBackend(token);
    if (!isValid) {
      logWarn('[AuthCoordinator] Invalid token provided to setToken');
      return;
    }

    // Update storage and state
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    this.currentState.token = token;
    
    logInfo('[AuthCoordinator] Token updated successfully');
  }

  /**
   * Set error (compatibility method for migration helper)
   */
  setError(error) {
    this.currentState.error = error;
    logWarn('[AuthCoordinator] Error set:', error);
    
    // Sync error to all stores
    for (const store of this.authStores) {
      try {
        if (store && typeof store.setState === 'function') {
          store.setState({ error });
        } else if (store && typeof store.getState === 'function') {
          const currentState = store.getState();
          store.setState({ ...currentState, error });
        }
      } catch (err) {
        logWarn('[AuthCoordinator] Failed to sync error to store:', err.message);
      }
    }
  }

  /**
   * Clear error (compatibility method for migration helper)
   */
  clearError() {
    this.currentState.error = null;
    
    // Sync cleared error to all stores
    for (const store of this.authStores) {
      try {
        if (store && typeof store.setState === 'function') {
          store.setState({ error: null });
        } else if (store && typeof store.getState === 'function') {
          const currentState = store.getState();
          store.setState({ ...currentState, error: null });
        }
      } catch (err) {
        logWarn('[AuthCoordinator] Failed to clear error in store:', err.message);
      }
    }
  }

  /**
   * Check auth status (compatibility method for migration helper)
   */
  async checkAuthStatus() {
    if (!this.currentState.token) {
      return false;
    }
    
    const isValid = await this.verifyTokenWithBackend(this.currentState.token);
    if (!isValid && this.currentState.isAuthenticated) {
      // Token is invalid but we think we're authenticated - logout
      await this.performCoordinatedLogout(false);
    }
    
    return isValid;
  }

  /**
   * Login alias method (compatibility for tests and migration helper)
   */
  async login(credentials) {
    return await this.coordinateLogin(credentials);
  }

  /**
   * Logout alias method (compatibility for tests and migration helper)
   */
  async logout() {
    return await this.coordinateLogout();
  }
}

// Create and export singleton instance
const authCoordinator = new AuthenticationCoordinator();

// Initialize and expose coordinator globally for React stores to access
if (typeof window !== 'undefined') {
  // Expose coordinator globally for non-React contexts and React store initialization
  window.__authCoordinator = authCoordinator;
  
  // Initialize coordinator when module loads
  authCoordinator.initialize().catch(error => {
    logError('[AuthCoordinator] Initialization failed:', error);
  });
}

export default authCoordinator;
export { AUTH_EVENTS, STORAGE_KEYS }; 