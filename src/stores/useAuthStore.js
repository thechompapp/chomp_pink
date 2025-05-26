/* src/stores/useAuthStore.js */
/**
 * Authentication store using Zustand with enhanced error handling
 * Updated to support both default and named exports for API standardization
 * 
 * COMPATIBILITY WRAPPER: This file now serves as a compatibility wrapper
 * for the new modular authentication stores. It maintains the same API
 * as the original useAuthStore but delegates to the new modular stores.
 */
import {
  useAuthenticationStore,
  useUserProfileStore,
  useAuthSessionStore,
  useRegistrationStore,
  useSuperuserStore
} from './auth';

import { logInfo } from '@/utils/logger.js';

// Log migration notice in development mode
if (process.env.NODE_ENV === 'development') {
  logInfo(
    '[useAuthStore] This is a compatibility wrapper for the new modular auth stores. ' +
    'Consider migrating to the new stores directly for better maintainability.'
  );
}

/**
 * Compatibility wrapper for useAuthStore
 * 
 * This provides the same API as the original useAuthStore
 * but delegates to the new modular stores.
 */
const useAuthStore = () => {
  // Get state and actions from the new modular stores
  const authState = useAuthenticationStore();
  const superuserState = useSuperuserStore();
  const profileState = useUserProfileStore();
  const sessionState = useAuthSessionStore();
  const registrationState = useRegistrationStore();
  
  return {
    // Core authentication state from useAuthenticationStore
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    lastAuthCheck: authState.lastAuthCheck,
    
    // Superuser state from useSuperuserStore
    isSuperuser: superuserState.isSuperuser,
    superuserStatusReady: superuserState.superuserStatusReady,
    
    // Core authentication methods
    checkAuthStatus: authState.checkAuthStatus,
    login: authState.login,
    logout: authState.logout,
    
    // Registration method
    register: registrationState.register,
    
    // Superuser methods
    setSuperuser: superuserState.setSuperuser,
    
    // Getters
    getCurrentUser: authState.getCurrentUser,
    getIsAuthenticated: authState.getIsAuthenticated,
    getIsLoading: authState.getIsLoading,
    getIsSuperuser: superuserState.getIsSuperuser,
    getSuperuserStatusReady: superuserState.getSuperuserStatusReady
  };
}

// Export the compatibility wrapper as default export
export default useAuthStore;

// Named exports for better IDE support
export const getIsAuthenticated = () => useAuthenticationStore.getState().getIsAuthenticated();
export const getCurrentUser = () => useAuthenticationStore.getState().getCurrentUser();
export const getIsSuperuser = () => useSuperuserStore.getState().getIsSuperuser();
export const getSuperuserStatusReady = () => useSuperuserStore.getState().getSuperuserStatusReady();

// Register stores with apiClient
setTimeout(() => {
  try {
    import('@/services/apiClient').then(apiClientModule => {
      if (apiClientModule.registerStore) {
        apiClientModule.registerStore('auth', useAuthStore);
        logInfo('[AuthStore] Registered compatibility wrapper with apiClient');
      }
    });
  } catch (e) {
    console.warn('[AuthStore] Failed to register with apiClient:', e);
  }
}, 0);

export { useAuthStore };