// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
// Removed useShallow import as we'll select primitives individually
import LoadingSpinner from '@/components/UI/LoadingSpinner';

const ProtectedRoute = () => {
  // Select primitives individually for maximum stability
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const location = useLocation(); // Get current location

  // Show loading indicator while initial auth status is determined
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-150px)]">
            <LoadingSpinner message="Checking authentication..." />
        </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    // Pass the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the child route (component) if authenticated
  return <Outlet />;
};

export default ProtectedRoute;