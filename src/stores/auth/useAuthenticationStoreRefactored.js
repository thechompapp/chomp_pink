/**
 * Refactored Authentication Store
 * 
 * This is the new modular authentication store that maintains backward compatibility
 * while using the extracted modules for better organization and maintainability.
 * 
 * Key improvements:
 * - Single Responsibility Principle compliance
 * - Modular architecture for better testing
 * - Improved error handling and state management
 * - Enhanced development experience
 */

import { createJSONStorage } from 'zustand/middleware';
import { 
  useAuthenticationStore as useNewAuthStore,
  createAuthStoreInitializer
} from './modules';

// Export the store initializer separately for vanilla (non-React) testing - maintains compatibility
export { createAuthStoreInitializer as authStoreInitializer };

// Main authentication store - maintains exact same API
const useAuthenticationStore = useNewAuthStore;

// Convenience getters that maintain backward compatibility
export const getIsAuthenticated = () => useAuthenticationStore.getState().getIsAuthenticated();
export const getCurrentUser = () => useAuthenticationStore.getState().getCurrentUser();
export const getToken = () => useAuthenticationStore.getState().getToken();

// Default export maintains compatibility
export default useAuthenticationStore; 