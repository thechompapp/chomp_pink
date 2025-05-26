/**
 * AdminRoute Component
 * 
 * A route component that only allows access to admin users.
 * Redirects non-admin users to a specified path.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/auth/hooks/useAdmin';
import { Spinner } from '@/components/common/loaders/Spinner';

/**
 * AdminRoute component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.redirectPath - Path to redirect non-admin users to
 * @returns {React.ReactNode}
 */
export const AdminRoute = ({ children, redirectPath = '/' }) => {
  const { isAdmin, loading } = useAdmin();
  
  // Show loading spinner while checking admin status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Render children for admin users
  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectPath: PropTypes.string
};

export default AdminRoute;
