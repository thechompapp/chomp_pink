/**
 * Authentication Store Modules Index
 * 
 * Main entry point for all authentication store modules
 * Provides a clean API for the refactored authentication functionality
 */

// Configuration
export { 
  AUTH_CONFIG, 
  getInitialAuthState, 
  isDevModeLocalhost,
  hasExplicitlyLoggedOut,
  generateAdminToken,
  getPersistConfig
} from './authConfig';

// Storage Management
export {
  clearOfflineFlags,
  getStoredAuthData,
  setStoredAuthData,
  updateStoredToken,
  setDevModeFlags,
  clearDevModeFlags,
  isAuthBypassEnabled,
  setExplicitLogoutFlag,
  clearExplicitLogoutFlag,
  clearAuthCookies,
  clearAllAuthStorage,
  restoreSessionFromStorage,
  getStorageStats
} from './authStorage';

// Event Management
export {
  dispatchLoginComplete,
  dispatchLogoutComplete,
  dispatchUIRefresh,
  dispatchOfflineStatusChange,
  dispatchLoginEvents,
  dispatchLogoutEvents,
  addEventListener,
  onLoginComplete,
  onLogoutComplete,
  onUIRefresh,
  onOfflineStatusChange,
  removeAllEventListeners,
  getEventListeners
} from './authEvents';

// State Utilities
export {
  handleAuthError,
  createThrottledSetter,
  shouldUseCachedAuth,
  validateLoginData,
  isAdminLoginAttempt,
  createAuthState,
  createLoginSuccessState,
  createLoginErrorState,
  createLogoutState,
  createDevModeAuthState,
  normalizeAuthResponse,
  createTimeoutPromise,
  validateAuthState,
  getTimeSinceLastCheck
} from './authStateUtils';

// Core Operations
export {
  checkAuthStatus,
  login,
  logout
} from './authOperations';

// Main Store
export {
  createAuthStoreInitializer,
  default as useAuthenticationStore
} from './authStore';

// Legacy compatibility exports
export { default as useRefactoredAuthStore } from './authStore'; 