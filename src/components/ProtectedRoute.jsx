// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // For initial auth check state

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading); // Get loading state for initial check

  // Optional: Show loading indicator while initial auth status is determined
  // This prevents flashing the login page unnecessarily if the user is actually logged in
  // but the check hasn't completed yet after hydration.
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-150px)]">
            <LoadingSpinner message="Checking authentication..." />
        </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    // Pass the current location to redirect back after login (optional)
    // state={{ from: location }}
    return <Navigate to="/login" replace />;
  }

  // Render the child route (component) if authenticated
  return <Outlet />;
};

export default ProtectedRoute;