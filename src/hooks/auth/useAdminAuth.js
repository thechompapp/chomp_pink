/* src/hooks/auth/useAdminAuth.js */
/**
 * Admin Authentication Hook
 * 
 * Provides specialized authentication for admin users:
 * - Admin status checking
 * - Permission verification
 * - Development mode handling
 * - Superuser detection
 */
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug, logWarn } from '@/utils/logger';

/**
 * Hook for admin authentication
 * @returns {Object} Admin authentication utilities
 */
const useAdminAuth = () => {
  const { 
    user, 
    isAuthenticated,
    isSuperuser,
    superuserStatusReady
  } = useAuth();
  
  /**
   * Check if user is an admin
   * @returns {boolean} True if user is an admin
   */
  const isAdmin = useMemo(() => {
    // Not admin if not authenticated
    if (!isAuthenticated || !user) return false;
    
    // Check for superuser status
    if (isSuperuser) return true;
    
    // Check for admin role
    if (user.role === 'admin') return true;
    
    // Check for admin permissions
    if (user.permissions?.includes('admin')) return true;
    
    // Development mode override
    if (process.env.NODE_ENV === 'development') {
      const adminAccessEnabled = localStorage.getItem('admin_access_enabled') === 'true';
      const superuserOverride = localStorage.getItem('superuser_override') === 'true';
      
      if (adminAccessEnabled || superuserOverride) {
        logDebug('[useAdminAuth] Using development mode admin override');
        return true;
      }
    }
    
    return false;
  }, [isAuthenticated, user, isSuperuser]);
  
  /**
   * Check if user has specific permission
   * @param {string|Array<string>} permission - Permission or array of permissions to check
   * @returns {boolean} True if user has permission
   */
  const hasPermission = useCallback((permission) => {
    // Not permitted if not authenticated
    if (!isAuthenticated || !user) return false;
    
    // Superusers have all permissions
    if (isSuperuser) return true;
    
    // Development mode override
    if (process.env.NODE_ENV === 'development') {
      const adminAccessEnabled = localStorage.getItem('admin_access_enabled') === 'true';
      const superuserOverride = localStorage.getItem('superuser_override') === 'true';
      
      if (adminAccessEnabled || superuserOverride) {
        logDebug('[useAdminAuth] Using development mode permission override');
        return true;
      }
    }
    
    // Admin users have all permissions
    if (user.role === 'admin' || user.permissions?.includes('admin')) return true;
    
    // Check for specific permissions
    if (typeof permission === 'string') {
      return Boolean(user.permissions?.includes(permission));
    }
    
    // Check for any of the permissions in the array
    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions?.includes(p));
    }
    
    return false;
  }, [isAuthenticated, user, isSuperuser]);
  
  /**
   * Check if user has all specified permissions
   * @param {Array<string>} permissions - Permissions to check
   * @returns {boolean} True if user has all permissions
   */
  const hasAllPermissions = useCallback((permissions) => {
    // Not permitted if not authenticated
    if (!isAuthenticated || !user) return false;
    
    // Superusers have all permissions
    if (isSuperuser) return true;
    
    // Development mode override
    if (process.env.NODE_ENV === 'development') {
      const adminAccessEnabled = localStorage.getItem('admin_access_enabled') === 'true';
      const superuserOverride = localStorage.getItem('superuser_override') === 'true';
      
      if (adminAccessEnabled || superuserOverride) {
        logDebug('[useAdminAuth] Using development mode permission override');
        return true;
      }
    }
    
    // Admin users have all permissions
    if (user.role === 'admin' || user.permissions?.includes('admin')) return true;
    
    // Check if user has all specified permissions
    if (Array.isArray(permissions)) {
      return permissions.every(p => user.permissions?.includes(p));
    }
    
    logWarn('[useAdminAuth] Invalid permissions format:', permissions);
    return false;
  }, [isAuthenticated, user, isSuperuser]);
  
  /**
   * Get user's permissions
   * @returns {Array<string>} User's permissions
   */
  const getUserPermissions = useCallback(() => {
    if (!isAuthenticated || !user) return [];
    
    // Development mode override
    if (process.env.NODE_ENV === 'development') {
      const adminAccessEnabled = localStorage.getItem('admin_access_enabled') === 'true';
      const superuserOverride = localStorage.getItem('superuser_override') === 'true';
      
      if (adminAccessEnabled || superuserOverride) {
        logDebug('[useAdminAuth] Using development mode permissions');
        return ['admin', 'create', 'edit', 'delete', 'view'];
      }
    }
    
    // Return user's permissions or empty array
    return user.permissions || [];
  }, [isAuthenticated, user]);
  
  /**
   * Check if admin status is ready
   * @returns {boolean} True if admin status is ready
   */
  const isAdminStatusReady = useMemo(() => {
    return superuserStatusReady;
  }, [superuserStatusReady]);
  
  return {
    isAdmin,
    hasPermission,
    hasAllPermissions,
    getUserPermissions,
    isAdminStatusReady
  };
};

export default useAdminAuth;
