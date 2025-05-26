/**
 * Authentication Stores Index
 * 
 * Exports all authentication-related store modules
 */

// Export individual store modules
export { default as useAuthenticationStore } from './useAuthenticationStore';
export { default as useUserProfileStore } from './useUserProfileStore';
export { default as useAuthSessionStore } from './useAuthSessionStore';
export { default as useRegistrationStore } from './useRegistrationStore';
export { default as useSuperuserStore } from './useSuperuserStore';

// Export named utilities from each store
export { 
  getIsAuthenticated,
  getCurrentUser,
  getToken
} from './useAuthenticationStore';

export {
  getProfile,
  getPreferences
} from './useUserProfileStore';

export {
  getSessionStatus,
  getIsSessionActive
} from './useAuthSessionStore';

export {
  getRegistrationStep,
  getRegistrationData
} from './useRegistrationStore';

export {
  getIsSuperuser,
  getSuperuserStatusReady,
  hasPermission
} from './useSuperuserStore';

// Legacy compatibility export
// This allows existing code to continue working while migration happens
import useAuthenticationStore from './useAuthenticationStore';
import useSuperuserStore from './useSuperuserStore';

const createLegacyAuthStore = () => {
  // Combine the core authentication and superuser stores to match the original useAuthStore API
  const useAuthStore = () => {
    const authState = useAuthenticationStore();
    const superuserState = useSuperuserStore();
    
    return {
      ...authState,
      isSuperuser: superuserState.isSuperuser,
      superuserStatusReady: superuserState.superuserStatusReady,
      setSuperuser: superuserState.setSuperuser,
      getIsSuperuser: superuserState.getIsSuperuser,
      getSuperuserStatusReady: superuserState.getSuperuserStatusReady
    };
  };
  
  return useAuthStore;
};

export const useAuthStore = createLegacyAuthStore();
