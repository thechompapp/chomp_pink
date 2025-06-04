// src/components/ProtectedRoute.jsx
/**
 * Production-Ready Protected Route Component
 * 
 * Enterprise-grade route protection with proper error handling,
 * loading states, and secure authentication verification.
 */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, Shield, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * LoadingScreen component for better UX
 */
const LoadingScreen = ({ message = 'Loading...', icon: Icon = Loader2 }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center space-y-4 text-center">
      <Icon className="w-8 h-8 animate-spin text-indigo-600" />
      <div className="space-y-2">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {message}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  </div>
);

/**
 * ErrorScreen component for access denied scenarios
 */
const ErrorScreen = ({ 
  title = 'Access Denied', 
  message = 'You don\'t have permission to access this page.',
  icon: Icon = AlertTriangle,
  showRetry = false,
  onRetry = null
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center max-w-md mx-auto px-4">
      <Icon className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {message}
      </p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

/**
 * Hook for admin authentication verification
 */
const useAdminVerification = (user, requireAdmin) => {
  const [verification, setVerification] = useState({
    isLoading: true,
    isAdmin: false,
    error: null
  });

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!requireAdmin) {
        setVerification({ isLoading: false, isAdmin: true, error: null });
        return;
      }

      if (!user) {
        setVerification({ isLoading: false, isAdmin: false, error: 'No user data' });
        return;
      }

      try {
        // Check local user data first
        const isLocalAdmin = user.role === 'admin' || 
                            user.role === 'superuser' || 
                            user.account_type === 'superuser';

        // In development mode, trust local data
        if (import.meta.env.DEV) {
          logDebug('[ProtectedRoute] Development mode - using local admin check');
          setVerification({ isLoading: false, isAdmin: isLocalAdmin, error: null });
          return;
        }

        // In production, verify with server
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token');
          }

          const response = await fetch('/api/auth/verify-admin', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setVerification({ 
              isLoading: false, 
              isAdmin: data.isAdmin || isLocalAdmin, 
              error: null 
            });
          } else {
            // If server verification fails, fall back to local check
            logWarn('[ProtectedRoute] Server admin verification failed, using local check');
            setVerification({ isLoading: false, isAdmin: isLocalAdmin, error: null });
          }
        } catch (serverError) {
          // Network error - use local data
          logWarn('[ProtectedRoute] Network error during admin verification:', serverError);
          setVerification({ isLoading: false, isAdmin: isLocalAdmin, error: null });
        }
      } catch (error) {
        logError('[ProtectedRoute] Admin verification error:', error);
        setVerification({ isLoading: false, isAdmin: false, error: error.message });
      }
    };

    verifyAdminAccess();
  }, [user, requireAdmin]);

  return verification;
};

/**
 * Main ProtectedRoute Component
 */
const ProtectedRoute = ({ 
  children, 
  adminOnly = false,
  superuserOnly = false,
  redirectTo = '/login',
  fallbackComponent = null,
  loadingComponent = null,
  errorComponent = null
}) => {
  const location = useLocation();
  const { 
    isLoading: authLoading, 
    user, 
    isAuthenticated, 
    authReady,
    refreshAuth 
  } = useAuth();

  const requireAdmin = adminOnly || superuserOnly;
  const adminVerification = useAdminVerification(user, requireAdmin);

  // Handle refresh attempts
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const maxRefreshAttempts = 2;

  const handleRetryAuth = async () => {
    if (refreshAttempts >= maxRefreshAttempts) {
      logWarn('[ProtectedRoute] Max refresh attempts reached');
      return;
    }

    setRefreshAttempts(prev => prev + 1);
    await refreshAuth();
  };

  // Wait for auth system to be ready
  if (!authReady || authLoading) {
    if (loadingComponent) return loadingComponent;
    return <LoadingScreen message="Initializing authentication..." />;
  }

  // Check basic authentication
  if (!isAuthenticated || !user) {
    logDebug(`[ProtectedRoute] Access denied: not authenticated (path: ${location.pathname})`);
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location.pathname,
          reason: 'authentication_required'
        }} 
        replace 
      />
    );
  }

  // Handle admin verification if required
  if (requireAdmin) {
    if (adminVerification.isLoading) {
      if (loadingComponent) return loadingComponent;
      return <LoadingScreen message="Verifying admin permissions..." icon={Shield} />;
    }

    if (adminVerification.error) {
      logError('[ProtectedRoute] Admin verification error:', adminVerification.error);
      
      if (errorComponent) return errorComponent;
      return (
        <ErrorScreen
          title="Verification Error"
          message="Unable to verify your admin permissions. Please try again."
          icon={AlertTriangle}
          showRetry={refreshAttempts < maxRefreshAttempts}
          onRetry={handleRetryAuth}
        />
      );
    }

    if (!adminVerification.isAdmin) {
      logWarn(`[ProtectedRoute] Access denied: user ${user.id} not admin (path: ${location.pathname})`);
      
      // Check if it's specifically superuser requirement
      if (superuserOnly) {
        const isSuperuser = user.role === 'superuser' || user.account_type === 'superuser';
        if (!isSuperuser) {
          if (errorComponent) return errorComponent;
          return (
            <ErrorScreen
              title="Superuser Access Required"
              message="This page requires superuser privileges. Contact your administrator if you believe this is an error."
              icon={Lock}
            />
          );
        }
      }

      if (fallbackComponent) return fallbackComponent;
      if (errorComponent) return errorComponent;
      
      return (
        <ErrorScreen
          title="Admin Access Required"
          message="This page requires administrator privileges. Contact your administrator if you believe this is an error."
          icon={Lock}
        />
      );
    }
  }

  // Log successful access
  logDebug(`[ProtectedRoute] Access granted to ${user.username || user.email} (path: ${location.pathname})`);

  // Render protected content
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
  superuserOnly: PropTypes.bool,
  redirectTo: PropTypes.string,
  fallbackComponent: PropTypes.node,
  loadingComponent: PropTypes.node,
  errorComponent: PropTypes.node
};

export default ProtectedRoute;
