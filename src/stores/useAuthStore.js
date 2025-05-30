/* src/stores/useAuthStore.js */
/**
 * Legacy useAuthStore - Coordinated Version
 * 
 * This file now re-exports the migration helper to ensure all existing
 * components continue working while using the centralized AuthenticationCoordinator.
 * 
 * All authentication state is now synchronized across the entire application.
 */

// Re-export the migration helper as the default useAuthStore
export { default, useAuthStoreCompat as useAuthStore } from '@/utils/AuthMigrationHelper';

// Re-export convenience getters for backward compatibility
export const getIsAuthenticated = () => {
  // In a non-React context, we need to get the coordinator directly
  if (typeof window !== 'undefined' && window.__authCoordinator) {
    return window.__authCoordinator.getCurrentState().isAuthenticated;
  }
  return false;
};

export const getCurrentUser = () => {
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
  if (typeof window !== 'undefined' && window.__authCoordinator) {
    return window.__authCoordinator.getCurrentState().isSuperuser;
  }
  return false;
};

export const getSuperuserStatusReady = () => {
  // With coordinator, status is always ready
  return true;
};