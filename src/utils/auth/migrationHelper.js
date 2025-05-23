/* src/utils/auth/migrationHelper.js */
/**
 * Authentication Migration Helper
 * 
 * Provides compatibility layer between old and new authentication systems
 * to enable gradual migration without breaking existing functionality.
 */
import { logDebug, logWarn } from '@/utils/logger';
import tokenManager from '@/services/auth/tokenManager';
import authService from '@/services/auth/authService';

// Reference to the Zustand store (will be set during initialization)
let authStore = null;

/**
 * Initialize migration helper with reference to old auth store
 * @param {Object} store - Reference to the Zustand auth store
 */
const initialize = (store) => {
  authStore = store;
  logDebug('[MigrationHelper] Initialized with auth store reference');
};

/**
 * Sync old auth store state from new auth context
 * @param {Object} authContextState - Current state from AuthContext
 */
const syncOldStoreFromContext = (authContextState) => {
  if (!authStore) {
    logWarn('[MigrationHelper] Cannot sync old store: not initialized');
    return;
  }
  
  try {
    const { 
      user, 
      isAuthenticated, 
      isLoading, 
      error, 
      isSuperuser 
    } = authContextState;
    
    authStore.setState({
      user,
      isAuthenticated,
      isLoading,
      error: error || null,
      isSuperuser: isSuperuser || false,
      superuserStatusReady: true
    });
    
    logDebug('[MigrationHelper] Synced old store from context');
  } catch (error) {
    logWarn('[MigrationHelper] Error syncing old store:', error);
  }
};

/**
 * Sync new auth context from old auth store
 * This is used when old components trigger auth changes
 * @param {Function} updateAuthContext - Function to update auth context state
 */
const syncContextFromOldStore = (updateAuthContext) => {
  if (!authStore) {
    logWarn('[MigrationHelper] Cannot sync context: not initialized');
    return;
  }
  
  try {
    const state = authStore.getState();
    
    updateAuthContext({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      isSuperuser: state.isSuperuser
    });
    
    logDebug('[MigrationHelper] Synced context from old store');
  } catch (error) {
    logWarn('[MigrationHelper] Error syncing context:', error);
  }
};

/**
 * Handle login from old auth system
 * This is called when a component uses the old auth store's login method
 * @param {Object} credentials - Login credentials
 * @param {Function} updateAuthContext - Function to update auth context state
 * @returns {Promise<Object>} Login result
 */
const handleLegacyLogin = async (credentials, updateAuthContext) => {
  try {
    // Use new auth service for login
    const result = await authService.login(credentials);
    
    // Update auth context with new state
    updateAuthContext({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      isSuperuser: result.user.account_type === 'superuser' || result.user.role === 'admin'
    });
    
    // Also update old store for components still using it
    if (authStore) {
      authStore.setState({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isSuperuser: result.user.account_type === 'superuser' || result.user.role === 'admin',
        superuserStatusReady: true
      });
    }
    
    logDebug('[MigrationHelper] Handled legacy login');
    return result.user;
  } catch (error) {
    // Update both systems with error
    const errorMessage = error.message || 'Login failed';
    
    updateAuthContext({
      isLoading: false,
      error
    });
    
    if (authStore) {
      authStore.setState({
        isLoading: false,
        error: errorMessage
      });
    }
    
    logWarn('[MigrationHelper] Legacy login failed:', error);
    throw error;
  }
};

/**
 * Handle logout from old auth system
 * This is called when a component uses the old auth store's logout method
 * @param {Function} updateAuthContext - Function to update auth context state
 * @returns {Promise<void>}
 */
const handleLegacyLogout = async (updateAuthContext) => {
  try {
    // Use new auth service for logout
    await authService.logout();
    
    // Update auth context with new state
    updateAuthContext({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isSuperuser: false
    });
    
    // Also update old store for components still using it
    if (authStore) {
      authStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isSuperuser: false,
        superuserStatusReady: true
      });
    }
    
    logDebug('[MigrationHelper] Handled legacy logout');
  } catch (error) {
    // Update both systems with error
    const errorMessage = error.message || 'Logout failed';
    
    updateAuthContext({
      isLoading: false,
      error
    });
    
    if (authStore) {
      authStore.setState({
        isLoading: false,
        error: errorMessage
      });
    }
    
    logWarn('[MigrationHelper] Legacy logout failed:', error);
    throw error;
  }
};

/**
 * Create a proxy for the old auth store
 * This replaces the old auth store with a proxy that uses the new auth system
 * @param {Object} store - Reference to the Zustand auth store
 * @param {Function} updateAuthContext - Function to update auth context state
 * @returns {Object} Proxied auth store
 */
const createAuthStoreProxy = (store, updateAuthContext) => {
  // Initialize with store reference
  initialize(store);
  
  // Create a proxy that intercepts auth operations
  const proxyHandler = {
    get: (target, prop) => {
      // Intercept auth operations
      if (prop === 'login') {
        return async (credentials) => {
          return handleLegacyLogin(credentials, updateAuthContext);
        };
      }
      
      if (prop === 'logout') {
        return async () => {
          return handleLegacyLogout(updateAuthContext);
        };
      }
      
      // Pass through other operations
      return target[prop];
    }
  };
  
  return new Proxy(store, proxyHandler);
};

/**
 * Update tokens in both systems
 * This ensures token consistency between old and new systems
 * @param {Object} tokens - Token data
 */
const updateTokensInBothSystems = (tokens) => {
  try {
    // Update tokens in new system
    tokenManager.setTokens(tokens);
    
    // Update tokens in old system (if it uses localStorage)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
      
      if (tokens.expiresIn) {
        const expiresAt = Date.now() + tokens.expiresIn * 1000;
        localStorage.setItem('token_expires_at', expiresAt.toString());
      }
    }
    
    logDebug('[MigrationHelper] Updated tokens in both systems');
  } catch (error) {
    logWarn('[MigrationHelper] Error updating tokens:', error);
  }
};

/**
 * Clear tokens from both systems
 */
const clearTokensInBothSystems = () => {
  try {
    // Clear tokens in new system
    tokenManager.clearTokens();
    
    // Clear tokens in old system (if it uses localStorage)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
    }
    
    logDebug('[MigrationHelper] Cleared tokens in both systems');
  } catch (error) {
    logWarn('[MigrationHelper] Error clearing tokens:', error);
  }
};

const migrationHelper = {
  initialize,
  syncOldStoreFromContext,
  syncContextFromOldStore,
  handleLegacyLogin,
  handleLegacyLogout,
  createAuthStoreProxy,
  updateTokensInBothSystems,
  clearTokensInBothSystems
};

export default migrationHelper;
