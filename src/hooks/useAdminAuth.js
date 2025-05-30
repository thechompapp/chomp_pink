/**
 * Simplified Admin Authentication Hook - Coordinated Version
 * 
 * Uses the centralized AuthenticationCoordinator for all admin auth state.
 * This eliminates redundancy and ensures synchronization across the app.
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug } from '@/utils/logger';

/**
 * Simplified hook for accessing admin authentication state
 * All logic is delegated to the AuthenticationCoordinator
 * 
 * @returns {Object} Admin auth state and helper methods
 */
export function useAdminAuth() {
  const { isAuthenticated, user, coordinator } = useAuth();
  
  // Get coordinator state
  const coordinatorState = coordinator.getCurrentState();
  
  // Memoize the admin auth object to prevent unnecessary re-renders
  const adminAuth = useMemo(() => {
    try {
      // Development mode always grants admin access if authenticated
      const isDevelopment = import.meta.env.DEV;
      const forceAdminAccess = isDevelopment && isAuthenticated;
      
      // Check admin status from coordinator state
      const isAdmin = forceAdminAccess || coordinatorState.isAdmin;
      const isSuperuser = forceAdminAccess || coordinatorState.isSuperuser;
      const hasAdminAccess = isAdmin || isSuperuser;
      
      return {
        // Basic status
        isAdmin,
        isSuperuser,
        hasAdminAccess,
        
        // Ready state - always ready with coordinator
        isReady: true,
        isLoading: false,
        
        // User info
        user: coordinatorState.user,
        
        // Permission checking methods
        can: (permission) => {
          if (forceAdminAccess) return true;
          if (!isAuthenticated || !user) return false;
          if (isSuperuser || isAdmin) return true;
          
          // Check specific permissions
          if (typeof permission === 'string') {
            return Boolean(user.permissions?.includes(permission));
          }
          if (Array.isArray(permission)) {
            return permission.some(p => user.permissions?.includes(p));
          }
          return false;
        },
        
        hasRole: (role) => {
          if (forceAdminAccess && (role === 'admin' || role === 'superuser')) return true;
          return user?.role === role || user?.account_type === role;
        },
        
        // Helper for common permissions
        canManageUsers: forceAdminAccess || hasAdminAccess,
        canManageContent: forceAdminAccess || hasAdminAccess,
        
        // Development mode helpers
        isDevelopment,
        adminOverrideApplied: forceAdminAccess
      };
    } catch (error) {
      logDebug('[useAdminAuth] Error creating admin auth object:', error);
      
      // Return safe fallback
      const isDevelopment = import.meta.env.DEV;
      return {
        isAdmin: isDevelopment && isAuthenticated,
        isSuperuser: isDevelopment && isAuthenticated,
        hasAdminAccess: isDevelopment && isAuthenticated,
        isReady: true,
        isLoading: false,
        user: null,
        can: () => isDevelopment && isAuthenticated,
        hasRole: () => isDevelopment && isAuthenticated,
        canManageUsers: isDevelopment && isAuthenticated,
        canManageContent: isDevelopment && isAuthenticated,
        isDevelopment,
        adminOverrideApplied: isDevelopment && isAuthenticated
      };
    }
  }, [isAuthenticated, user, coordinatorState]);
  
  return adminAuth;
}

export default useAdminAuth; 