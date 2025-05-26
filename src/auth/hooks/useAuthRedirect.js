/**
 * Authentication Redirect Hook
 * 
 * Hook for handling authentication-based redirects.
 * Redirects users based on their authentication status and roles.
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logDebug } from '@/utils/logger';

/**
 * Hook to handle authentication-based redirects
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Whether authentication is required
 * @param {string|string[]} options.requiredRoles - Required role(s) for access
 * @param {string} options.redirectTo - Path to redirect to if conditions not met
 * @param {boolean} options.redirectAuthenticated - Whether to redirect authenticated users
 * @param {string} options.authenticatedRedirectTo - Path to redirect authenticated users to
 * @returns {boolean} Whether the user meets the requirements
 */
const useAuthRedirect = ({
  requireAuth = false,
  requiredRoles = null,
  redirectTo = '/login',
  redirectAuthenticated = false,
  authenticatedRedirectTo = '/'
} = {}) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) return;
    
    // Handle redirecting authenticated users (e.g., from login page)
    if (redirectAuthenticated && isAuthenticated) {
      const from = location.state?.from?.pathname || authenticatedRedirectTo;
      logDebug(`[useAuthRedirect] Redirecting authenticated user to: ${from}`);
      navigate(from, { replace: true });
      return;
    }
    
    // Handle redirecting unauthenticated users from protected routes
    if (requireAuth && !isAuthenticated) {
      logDebug(`[useAuthRedirect] Redirecting unauthenticated user to: ${redirectTo}`);
      navigate(redirectTo, { 
        replace: true,
        state: { from: location }
      });
      return;
    }
    
    // Handle role-based access control
    if (requiredRoles && isAuthenticated && !hasRole(requiredRoles)) {
      logDebug(`[useAuthRedirect] Redirecting user without required role to: ${redirectTo}`);
      navigate(redirectTo, { replace: true });
      return;
    }
  }, [
    isAuthenticated, 
    isLoading, 
    requireAuth, 
    redirectAuthenticated,
    requiredRoles,
    redirectTo,
    authenticatedRedirectTo,
    navigate,
    location,
    user,
    hasRole
  ]);
  
  // Return whether user meets requirements (for conditional rendering)
  if (isLoading) return false;
  if (requireAuth && !isAuthenticated) return false;
  if (requiredRoles && !hasRole(requiredRoles)) return false;
  
  return true;
};

export default useAuthRedirect;
