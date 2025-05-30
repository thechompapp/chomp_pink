/**
 * Authentication Configuration
 * 
 * Centralized configuration for authentication including:
 * - Storage keys and cache durations
 * - Development mode settings
 * - Event names and throttling
 */

// Storage and caching configuration
export const AUTH_CONFIG = {
  // Storage keys
  STORAGE_KEY: 'auth-authentication-storage',
  EXPLICIT_LOGOUT_KEY: 'user_explicitly_logged_out',
  BYPASS_AUTH_KEY: 'bypass_auth_check',
  AUTH_TOKEN_KEY: 'auth-token',
  FORCE_ONLINE_KEY: 'force_online',
  
  // Cache durations
  SESSION_CACHE_DURATION: 30 * 60 * 1000, // 30 minutes (increased from 5 minutes)
  THROTTLE_INTERVAL: 500, // 500ms for state updates
  
  // API timeouts
  AUTH_CHECK_TIMEOUT: 15000, // 15 seconds
  DEV_MODE_TIMEOUT: 100, // 100ms for dev mode bypass
  
  // Development mode settings
  DEV_MODE: {
    ADMIN_EMAIL: 'admin@example.com',
    MOCK_ADMIN_USER: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      account_type: 'superuser',
      role: 'admin',
      permissions: ['admin', 'superuser']
    }
  },
  
  // Event names for auth state changes
  EVENTS: {
    LOGIN_COMPLETE: 'auth:login_complete',
    LOGOUT_COMPLETE: 'auth:logout_complete',
    OFFLINE_STATUS_CHANGED: 'offlineStatusChanged',
    FORCE_UI_REFRESH: 'forceUiRefresh'
  },
  
  // Storage keys to clear on offline mode
  OFFLINE_STORAGE_KEYS: [
    'offline-mode',
    'offline_mode'
  ],
  
  // Cookie prefixes to clear on logout
  AUTH_COOKIE_PREFIXES: ['auth', 'token', 'user', 'admin']
};

/**
 * Get initial authentication state
 * @returns {Object} Initial auth state
 */
export function getInitialAuthState() {
  // Test environment state
  if (process.env.NODE_ENV === 'test') {
    return {
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastAuthCheck: null
    };
  }
  
  // Check for window-provided initial state (SSR/hydration)
  const windowState = typeof window !== 'undefined' && window.__INITIAL_AUTH_STATE__;
  
  if (windowState) {
    return {
      token: windowState.token || null,
      isAuthenticated: windowState.isAuthenticated || false,
      user: windowState.user || null,
      isLoading: false,
      error: null,
      lastAuthCheck: windowState.lastAuthCheck || null,
    };
  }
  
  // Default state
  return {
    token: null,
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    lastAuthCheck: null,
  };
}

/**
 * Check if we're in development mode on localhost
 * @returns {boolean} Whether in dev mode on localhost
 */
export function isDevModeLocalhost() {
  return process.env.NODE_ENV === 'development' && 
         typeof window !== 'undefined' && 
         window.location.hostname === 'localhost';
}

/**
 * Check if user has explicitly logged out
 * @returns {boolean} Whether user explicitly logged out
 */
export function hasExplicitlyLoggedOut() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY) === 'true';
}

/**
 * Generate admin token for development
 * @returns {string} Admin token
 */
export function generateAdminToken() {
  return `admin-mock-token-with-superuser-privileges-${Date.now()}`;
}

/**
 * Get Zustand persist configuration
 * @returns {Object} Persist configuration
 */
export function getPersistConfig() {
  return {
    name: AUTH_CONFIG.STORAGE_KEY,
    partialize: (state) => ({
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      lastAuthCheck: state.lastAuthCheck
    }),
  };
}

export default AUTH_CONFIG; 