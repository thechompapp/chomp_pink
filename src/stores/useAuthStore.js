/* src/stores/useAuthStore.js */
/**
 * Simplified useAuthStore - Direct AuthContext Re-export
 * 
 * FIXED: Removed migration helper complexity, now directly uses AuthContext
 * This ensures all components use the same authentication source.
 */

// Direct re-export of the AuthContext hook
export { useAuth as useAuthStore, useAuth as default } from '@/contexts/auth/AuthContext';

// Convenience getters for backward compatibility
export const getIsAuthenticated = () => {
  // For non-React contexts, check coordinator directly
  if (typeof window !== 'undefined' && window.__authCoordinator) {
    return window.__authCoordinator.getCurrentState().isAuthenticated;
  }
  return false;
};

export const getCurrentUser = () => {
  // For non-React contexts, check coordinator directly  
  if (typeof window !== 'undefined' && window.__authCoordinator) {
    return window.__authCoordinator.getCurrentState().user;
  }
  return null;
};

export const getToken = () => {
  if (typeof window !== 'undefined' && window.__authCoordinator) {
    return window.__authCoordinator.getCurrentState().token;
  }
  return null;
};

export const getIsSuperuser = () => {
  // For non-React contexts, check coordinator directly
  if (typeof window !== 'undefined' && window.__authCoordinator) {
    return window.__authCoordinator.getCurrentState().isSuperuser;
  }
  return false;
};

export const getSuperuserStatusReady = () => {
  // Always ready with the simplified system
  return true;
};