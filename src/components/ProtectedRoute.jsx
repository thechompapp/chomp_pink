// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { logInfo, logDebug } from '../utils/logger';

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication or specific permissions
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.adminOnly - Whether the route requires admin permissions
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Path to redirect to if not authenticated (defaults to /login)
 * @returns {React.ReactNode} Protected route component
 */
const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const adminAuth = useAdminAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    logInfo(`[ProtectedRoute] User not authenticated, redirecting to ${redirectTo} from ${location.pathname}`);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // If admin-only route, check for admin permissions
  if (adminOnly) {
    // In development mode, grant admin access to authenticated users
    const isDevelopment = import.meta.env.DEV;
    const hasAdminAccess = adminAuth.hasAdminAccess || 
                          adminAuth.can('admin.access') || 
                          adminAuth.isAdmin || 
                          adminAuth.isSuperuser ||
                          (isDevelopment && isAuthenticated);
    
    logDebug(`[ProtectedRoute] Admin access check:`, {
      isDevelopment,
      isAuthenticated,
      hasAdminAccess: adminAuth.hasAdminAccess,
      canAccess: adminAuth.can('admin.access'),
      isAdmin: adminAuth.isAdmin,
      isSuperuser: adminAuth.isSuperuser,
      finalAccess: hasAdminAccess,
      userRole: user?.role,
      userAccountType: user?.account_type
    });
    
    if (!hasAdminAccess) {
      logInfo(`[ProtectedRoute] User lacks admin permissions, redirecting to home from ${location.pathname}`);
      return <Navigate to="/" replace />;
    }
    
    logDebug(`[ProtectedRoute] Admin access granted for ${location.pathname}`);
  }
  
  // User is authenticated and has required permissions
  return children;
};

export default ProtectedRoute;
