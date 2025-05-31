/**
 * Optimized Admin Authentication Hook
 * 
 * Works with the optimized AuthContext for admin authentication state.
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug } from '@/utils/logger';

/**
 * Hook for accessing admin authentication state
 * 
 * @returns {Object} Admin auth state and helper methods
 */
export function useAdminAuth() {
  const { isAuthenticated, user, isSuperuser } = useAuth();
  
  // Memoize the admin auth object to prevent unnecessary re-renders
  const adminAuth = useMemo(() => {
    try {
      // Development mode always grants admin access if authenticated
      const isDevelopment = import.meta.env.DEV;
      const forceAdminAccess = isDevelopment && isAuthenticated;
      
      // Check admin status from user data
      const isAdmin = forceAdminAccess || isSuperuser;
      const hasAdminAccess = isAdmin || isSuperuser;
      
      return {
        // Basic status
        isAdmin,
        isSuperuser,
        hasAdminAccess,
        
        // Ready state - always ready with optimized system
        isReady: true,
        isLoading: false,
        
        // User info
        user,
        
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
  }, [isAuthenticated, user, isSuperuser]);
  
  return adminAuth;
}

export default useAdminAuth; 