/**
 * Protected Route Component
 * 
 * Component for protecting routes based on authentication status and roles.
 * Redirects users who don't meet the requirements.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug } from '@/utils/logger';

/**
 * Protected Route Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.requiredRoles - Required role(s) for access
 * @param {string} props.redirectTo - Path to redirect to if unauthorized
 * @param {boolean} props.allowUnauthenticated - Whether to allow unauthenticated users
 */
const ProtectedRoute = ({
  children,
  requiredRoles = null,
  redirectTo = '/login',
  allowUnauthenticated = false
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();
  
  // Show nothing while authentication is being checked
  if (isLoading) {
    return null;
  }
  
  // Check authentication requirement
  if (!allowUnauthenticated && !isAuthenticated) {
    logDebug(`[ProtectedRoute] Redirecting unauthenticated user from ${location.pathname} to ${redirectTo}`);
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }
  
  // Check role requirement if authenticated
  if (isAuthenticated && requiredRoles && !hasRole(requiredRoles)) {
    logDebug(`[ProtectedRoute] Redirecting user without required role from ${location.pathname} to ${redirectTo}`);
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }
  
  // User meets all requirements, render children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  redirectTo: PropTypes.string,
  allowUnauthenticated: PropTypes.bool
};

export default ProtectedRoute;
