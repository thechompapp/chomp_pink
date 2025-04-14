/* src/components/ProtectedRoute.jsx */
/* REMOVED: All TypeScript syntax */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Assuming JS/JSX

const ProtectedRoute = () => {
  // Select state primitives directly
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
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

  // Render the child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;