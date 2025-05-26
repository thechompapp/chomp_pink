/**
 * useAdmin Hook
 * 
 * Custom hook for admin-specific functionality.
 * Provides access to admin status and admin-only features.
 */
import { useContext, useMemo } from 'react';
import { AuthContext } from '@/auth/context/AuthContext';
import { rbacUtils } from '@/auth/utils/rbacUtils';

/**
 * Hook for admin-specific functionality
 * @param {Object} options - Hook options
 * @param {boolean} options.redirectNonAdmin - Whether to redirect non-admin users
 * @param {string} options.redirectPath - Path to redirect non-admin users to
 * @returns {Object} Admin utilities and status
 */
export const useAdmin = (options = {}) => {
  const { redirectNonAdmin = false, redirectPath = '/' } = options;
  const { user, isAuthenticated, isAdmin, loading } = useContext(AuthContext);
  
  // Use the auth redirect hook if redirection is requested
  if (redirectNonAdmin) {
    // Import dynamically to avoid circular dependencies
    const { useAuthRedirect } = require('./useAuthRedirect');
    useAuthRedirect({ 
      requireAuth: true, 
      requiredRoles: ['admin'],
      redirectPath
    });
  }
  
  // Memoize permissions to avoid unnecessary re-renders
  const permissions = useMemo(() => {
    if (!isAuthenticated || !isAdmin) {
      return {
        canManageUsers: false,
        canManageContent: false,
        canViewAnalytics: false,
        canManageSettings: false
      };
    }
    
    return {
      canManageUsers: rbacUtils.hasPermission(user, 'manage_users'),
      canManageContent: rbacUtils.hasPermission(user, 'manage_content'),
      canViewAnalytics: rbacUtils.hasPermission(user, 'view_analytics'),
      canManageSettings: rbacUtils.hasPermission(user, 'manage_settings')
    };
  }, [isAuthenticated, isAdmin, user]);
  
  return {
    isAdmin,
    loading,
    user,
    ...permissions
  };
};

export default useAdmin;
