/* src/components/ProtectedRoute.jsx */
/**
 * Protected Route Component
 * 
 * Ensures routes are only accessible to authenticated users.
 * Supports admin-only routes and redirects unauthenticated users to login.
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useAdminAuth } from '@/hooks/auth';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';

/**
 * ProtectedRoute component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {boolean} props.adminOnly - Whether the route requires admin privileges
 * @returns {React.ReactElement} Protected route component
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isAdminStatusReady } = useAdminAuth();
  const location = useLocation();

  // Show loading indicator while checking auth status
  if (isLoading || (adminOnly && !isAdminStatusReady)) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Pass the current location so user can be redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin requirement if specified
  if (adminOnly && !isAdmin) {
    console.warn('[ProtectedRoute] Access denied. Admin privileges required.');
    // Redirect non-admins trying to access admin routes
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Render the child component passed via props OR the Outlet if no children are passed
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
