/* src/components/ProtectedRoute.jsx */
/* REMOVED: All TypeScript syntax */
/* Patched: Added logic to check for requireSuperuser prop */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore.js'; // Use alias if configured
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx'; // Assuming JS/JSX

// Accept children and requireSuperuser props
const ProtectedRoute = ({ children, requireSuperuser = false }) => {
  // Select state primitives directly
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user); // Get user object
  const isLoading = useAuthStore(state => state.isLoading);
  const location = useLocation();

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
            <LoadingSpinner message="Checking authentication..." />
        </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Pass the current location so user can be redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NEW: Check for superuser requirement if specified
  if (requireSuperuser && user?.account_type !== 'superuser') {
    console.warn('[ProtectedRoute] Access denied. Superuser required.');
    // Redirect non-superusers trying to access superuser routes (e.g., back home)
    // Alternatively, render an "Access Denied" component
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Render the child component passed via props OR the Outlet if no children are passed
  // This allows wrapping specific components directly: <ProtectedRoute><MyComponent /></ProtectedRoute>
  // Or using it for route layouts: <Route element={<ProtectedRoute />}><Route path="dashboard" element={<Dashboard />} /></Route>
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;