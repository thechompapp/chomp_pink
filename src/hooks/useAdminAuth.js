/**
 * Production-Ready Admin Authentication Hook
 * 
 * Works with the production-ready AuthContext for secure admin authentication.
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug, logWarn } from '@/utils/logger';

/**
 * Hook for accessing admin authentication state
 * 
 * @returns {Object} Admin auth state and helper methods
 */
export function useAdminAuth() {
  const { isAuthenticated, user, isSuperuser, isAdmin: contextIsAdmin, authReady } = useAuth();
  
  // Development mode logic
  const isDevelopment = import.meta.env.DEV;
  const devModeAuthenticated = isDevelopment && isAuthenticated;
  
  // Determine admin status
  const isAdminUser = contextIsAdmin || isSuperuser || devModeAuthenticated;
  const isSuperuserUser = isSuperuser || (isDevelopment && isAuthenticated);
  const hasAdminAccess = isAdminUser || isSuperuserUser;

  // Permission checking function - moved outside useMemo
  const can = useCallback((permission) => {
    if (!isAuthenticated || !user) return false;
    if (devModeAuthenticated) return true;
    if (isSuperuserUser || isAdminUser) return true;
    
    // Check specific permissions
    if (typeof permission === 'string') {
      return Boolean(user.permissions?.includes(permission));
    }
    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions?.includes(p));
    }
    return false;
  }, [isAuthenticated, user, devModeAuthenticated, isSuperuserUser, isAdminUser]);

  // Role checking function - moved outside useMemo
  const hasRole = useCallback((role) => {
    if (!isAuthenticated || !user) return false;
    if (devModeAuthenticated && (role === 'admin' || role === 'superuser')) return true;
    return user?.role === role || user?.account_type === role;
  }, [isAuthenticated, user, devModeAuthenticated]);
  
  // Memoize the admin auth object to prevent unnecessary re-renders
  const adminAuth = useMemo(() => {
    try {
      // Wait for auth system to be ready
      if (!authReady) {
        return {
          isLoading: true,
          isReady: false,
          isAdmin: false,
          isSuperuser: false,
          hasAdminAccess: false,
          user: null,
          can: () => false,
          hasRole: () => false,
          canManageUsers: false,
          canManageContent: false,
          isDevelopment,
          adminOverrideApplied: false
        };
      }
      
      return {
        // Status flags
        isLoading: false,
        isReady: true,
        isAdmin: isAdminUser,
        isSuperuser: isSuperuserUser,
        hasAdminAccess,
        
        // User info
        user,
        
        // Permission checking methods
        can,
        hasRole,
        
        // Helper for common permissions
        canManageUsers: hasAdminAccess,
        canManageContent: hasAdminAccess,
        canManageSystem: isSuperuserUser,
        
        // Development mode helpers
        isDevelopment,
        adminOverrideApplied: devModeAuthenticated && !contextIsAdmin && !isSuperuser
      };
    } catch (error) {
      logWarn('[useAdminAuth] Error creating admin auth object:', error);
      
      // Return safe fallback
      return {
        isLoading: false,
        isReady: true,
        isAdmin: false,
        isSuperuser: false,
        hasAdminAccess: false,
        user: null,
        can: () => false,
        hasRole: () => false,
        canManageUsers: false,
        canManageContent: false,
        canManageSystem: false,
        isDevelopment,
        adminOverrideApplied: false
      };
    }
  }, [isAuthenticated, user, isSuperuser, contextIsAdmin, authReady, isAdminUser, isSuperuserUser, hasAdminAccess, can, hasRole, devModeAuthenticated, isDevelopment]);
  
  // Debug logging in development
  if (import.meta.env.DEV && authReady) {
    logDebug('[useAdminAuth] Auth state:', {
      isAuthenticated,
      hasUser: !!user,
      isAdmin: adminAuth.isAdmin,
      isSuperuser: adminAuth.isSuperuser,
      hasAdminAccess: adminAuth.hasAdminAccess
    });
  }
  
  return adminAuth;
}

export default useAdminAuth; 