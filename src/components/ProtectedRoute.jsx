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
    // Use the can method instead of hasPermission
    const hasAdminAccess = useAdminAuth().can('admin.access');
    
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
