// src/components/ProtectedRoute.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import * as logger from '@/utils/logger';

/**
 * ProtectedRoute Component
 * 
 * A robust authentication guard that protects routes from unauthenticated access.
 * Features coordinator-based authentication checking, admin role validation,
 * comprehensive error handling, and fallback mechanisms.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components to render if access is granted
 * @param {boolean} props.adminOnly - Whether route requires admin permissions
 * @param {string} props.redirectTo - Where to redirect unauthenticated users
 * @param {Function} props.onAuthError - Callback for authentication errors
 * @param {React.ReactNode} props.fallback - Custom loading component
 * @param {number} props.maxRetries - Maximum authentication check retries
 * @param {number} props.retryDelay - Delay between retries in milliseconds
 */
const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  redirectTo = '/login',
  onAuthError = null,
  fallback = null,
  maxRetries = 3,
  retryDelay = 1000
}) => {
  const location = useLocation();
  const { isLoading, user, error: authContextError } = useAuth();
  const adminAuth = useAdminAuth();
  
  // Enhanced state management
  const [coordinatorAuth, setCoordinatorAuth] = useState(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [localAuthError, setLocalAuthError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Memoized error handlers
  const handleAuthError = useCallback((error, context = 'unknown') => {
    const errorMessage = error?.message || error || 'Authentication check failed';
    logger.logError(`[ProtectedRoute] ${context} error:`, error);
    setLocalAuthError(errorMessage);
    
    // Call external error handler if provided
    if (onAuthError && typeof onAuthError === 'function') {
      try {
        onAuthError(error, context);
      } catch (callbackError) {
        logger.logError('[ProtectedRoute] Error in onAuthError callback:', callbackError);
      }
    }
  }, [onAuthError]);

  // Enhanced authentication checker with retry logic
  const checkAuthWithCoordinator = useCallback(async (attempt = 0) => {
    try {
      setIsRetrying(attempt > 0);
      setLocalAuthError(null);
      
      logger.logDebug(`[ProtectedRoute] Auth check attempt ${attempt + 1}/${maxRetries + 1}`, {
        pathname: location.pathname,
        isRetry: attempt > 0
      });

      // Dynamic import with error handling
      let authCoordinator;
      try {
        const module = await import('@/utils/AuthenticationCoordinator');
        authCoordinator = module.default;
        
        if (!authCoordinator) {
          throw new Error('AuthenticationCoordinator not found in module');
        }
      } catch (importError) {
        logger.logError('[ProtectedRoute] Failed to import AuthenticationCoordinator:', importError);
        throw new Error('Failed to load authentication module');
      }

      // Get coordinator state with validation
      let coordinatorState;
      try {
        coordinatorState = authCoordinator.getCurrentState();
        
        if (!coordinatorState || typeof coordinatorState !== 'object') {
          throw new Error('Invalid coordinator state');
        }
      } catch (stateError) {
        logger.logError('[ProtectedRoute] Failed to get coordinator state:', stateError);
        throw new Error('Failed to check authentication state');
      }

      logger.logDebug('[ProtectedRoute] Coordinator auth state:', {
        isAuthenticated: coordinatorState.isAuthenticated,
        hasToken: !!coordinatorState.token,
        hasUser: !!coordinatorState.user,
        pathname: location.pathname
      });

      // Enhanced storage validation with type checking
      const validateStorageAuth = () => {
        try {
          const token = localStorage.getItem('token');
          const storedUser = localStorage.getItem('current_user');
          const logoutFlag = localStorage.getItem('user_explicitly_logged_out');

          const hasValidToken = token && 
                               typeof token === 'string' && 
                               token.trim() !== '' && 
                               token !== 'null' && 
                               token !== 'undefined';

          let parsedUser = null;
          let hasValidUser = false;
          
          if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
            try {
              parsedUser = JSON.parse(storedUser);
              hasValidUser = parsedUser && 
                           typeof parsedUser === 'object' && 
                           (parsedUser.id || parsedUser.email);
            } catch (parseError) {
              logger.logWarn('[ProtectedRoute] Failed to parse stored user:', parseError);
              hasValidUser = false;
            }
          }

          const notExplicitlyLoggedOut = logoutFlag !== 'true';
          const hasValidStoredAuth = hasValidToken && hasValidUser && notExplicitlyLoggedOut;

          logger.logDebug('[ProtectedRoute] Storage validation:', {
            hasValidToken,
            hasValidUser,
            notExplicitlyLoggedOut,
            hasValidStoredAuth
          });

          return {
            isValid: hasValidStoredAuth,
            token: hasValidToken ? token : null,
            user: parsedUser
          };
        } catch (storageError) {
          logger.logError('[ProtectedRoute] Storage validation error:', storageError);
          return { isValid: false, token: null, user: null };
        }
      };

      const storageAuth = validateStorageAuth();

      // Combine coordinator and storage auth with priority
      const finalAuth = {
        isAuthenticated: coordinatorState.isAuthenticated || storageAuth.isValid,
        user: coordinatorState.user || storageAuth.user,
        token: coordinatorState.token || storageAuth.token,
        source: coordinatorState.isAuthenticated ? 'coordinator' : 
                storageAuth.isValid ? 'storage' : 'none'
      };

      setCoordinatorAuth(finalAuth);
      setAuthCheckComplete(true);
      setIsRetrying(false);
      setRetryCount(0);

      logger.logInfo('[ProtectedRoute] Auth check completed:', {
        isAuthenticated: finalAuth.isAuthenticated,
        source: finalAuth.source,
        hasUser: !!finalAuth.user,
        pathname: location.pathname
      });

    } catch (error) {
      const errorMessage = error?.message || 'Authentication check failed';
      logger.logError(`[ProtectedRoute] Auth check failed (attempt ${attempt + 1}):`, error);

      // Retry logic
      if (attempt < maxRetries) {
        const nextAttempt = attempt + 1;
        setRetryCount(nextAttempt);
        
        logger.logInfo(`[ProtectedRoute] Retrying auth check in ${retryDelay}ms (attempt ${nextAttempt}/${maxRetries})`);
        
        setTimeout(() => {
          checkAuthWithCoordinator(nextAttempt);
        }, retryDelay);
        return;
      }

      // Max retries reached - fallback to storage only
      logger.logWarn('[ProtectedRoute] Max retries reached, using storage fallback');
      
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('current_user');
        const logoutFlag = localStorage.getItem('user_explicitly_logged_out');

        const hasValidAuth = token && 
                           token !== 'null' && 
                           storedUser && 
                           storedUser !== 'null' && 
                           logoutFlag !== 'true';

        let parsedUser = null;
        if (hasValidAuth) {
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (parseError) {
            logger.logError('[ProtectedRoute] Failed to parse user in fallback:', parseError);
          }
        }

        setCoordinatorAuth({
          isAuthenticated: hasValidAuth,
          user: parsedUser,
          token: hasValidAuth ? token : null,
          source: 'storage-fallback'
        });

        setAuthCheckComplete(true);
        setIsRetrying(false);
        
        if (!hasValidAuth) {
          handleAuthError(error, 'coordinator-fallback');
        }

      } catch (fallbackError) {
        logger.logError('[ProtectedRoute] Storage fallback failed:', fallbackError);
        handleAuthError(fallbackError, 'storage-fallback');
        
        // Set minimal state to prevent indefinite loading
        setCoordinatorAuth({
          isAuthenticated: false,
          user: null,
          token: null,
          source: 'error-fallback'
        });
        setAuthCheckComplete(true);
        setIsRetrying(false);
      }
    }
  }, [location.pathname, maxRetries, retryDelay, handleAuthError]);

  // Main auth check effect
  useEffect(() => {
    checkAuthWithCoordinator(0);
    
    // Enhanced event listeners with error handling
    const createEventHandler = (eventName) => (event) => {
      try {
        logger.logDebug(`[ProtectedRoute] ${eventName} event received, rechecking auth`);
        setRetryCount(0); // Reset retry count on new auth events
        checkAuthWithCoordinator(0);
      } catch (error) {
        logger.logError(`[ProtectedRoute] Error handling ${eventName} event:`, error);
      }
    };

    const authStateHandler = createEventHandler('auth:state_sync');
    const loginHandler = createEventHandler('auth:login_success');
    const logoutHandler = createEventHandler('auth:logout_complete');
    
    window.addEventListener('auth:state_sync', authStateHandler);
    window.addEventListener('auth:login_success', loginHandler);
    window.addEventListener('auth:logout_complete', logoutHandler);
    
    return () => {
      window.removeEventListener('auth:state_sync', authStateHandler);
      window.removeEventListener('auth:login_success', loginHandler);
      window.removeEventListener('auth:logout_complete', logoutHandler);
    };
  }, [checkAuthWithCoordinator]);

  // Memoized admin access checker
  const checkAdminAccess = useMemo(() => {
    if (!adminOnly || !coordinatorAuth?.isAuthenticated) {
      return { hasAccess: !adminOnly, reason: adminOnly ? 'not-authenticated' : 'not-required' };
    }

    try {
      const authUser = coordinatorAuth.user || user;
      const isDevelopment = import.meta.env.DEV;

      // Multiple admin access checks
      const adminChecks = {
        adminAuth: {
          hasAdminAccess: adminAuth?.hasAdminAccess,
          canAccess: adminAuth?.can ? adminAuth.can('admin.access') : false,
          isAdmin: adminAuth?.isAdmin,
          isSuperuser: adminAuth?.isSuperuser
        },
        userRole: {
          role: authUser?.role,
          accountType: authUser?.account_type,
          isAdminRole: authUser?.role === 'admin' || authUser?.role === 'superuser',
          isSuperuserType: authUser?.account_type === 'superuser'
        },
        development: {
          isDevelopment,
          devOverride: isDevelopment && coordinatorAuth.isAuthenticated
        }
      };

      const hasAccess = adminChecks.adminAuth.hasAdminAccess ||
                       adminChecks.adminAuth.canAccess ||
                       adminChecks.adminAuth.isAdmin ||
                       adminChecks.adminAuth.isSuperuser ||
                       adminChecks.userRole.isAdminRole ||
                       adminChecks.userRole.isSuperuserType ||
                       adminChecks.development.devOverride;

      logger.logDebug('[ProtectedRoute] Admin access evaluation:', {
        ...adminChecks,
        finalAccess: hasAccess,
        pathname: location.pathname
      });

      return {
        hasAccess,
        reason: hasAccess ? 'granted' : 'insufficient-privileges',
        details: adminChecks
      };

    } catch (error) {
      logger.logError('[ProtectedRoute] Error checking admin access:', error);
      return { hasAccess: false, reason: 'check-error', error };
    }
  }, [adminOnly, coordinatorAuth, user, adminAuth, location.pathname]);

  // Enhanced loading component
  const LoadingComponent = () => {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        {isRetrying && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verifying authentication... (Attempt {retryCount}/{maxRetries})
            </p>
          </div>
        )}
      </div>
    );
  };

  // Error component
  const ErrorComponent = () => (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Authentication Error
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {localAuthError || 'Unable to verify your authentication status.'}
        </p>
        <button
          onClick={() => {
            setLocalAuthError(null);
            setRetryCount(0);
            checkAuthWithCoordinator(0);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // Show loading while checking authentication
  if (isLoading || !authCheckComplete || coordinatorAuth === null) {
    return <LoadingComponent />;
  }

  // Show error if authentication check failed
  if (localAuthError && !coordinatorAuth?.isAuthenticated) {
    return <ErrorComponent />;
  }

  // Authentication decision
  const isAuthenticated = coordinatorAuth.isAuthenticated;
  const authUser = coordinatorAuth.user || user;

  // Redirect if not authenticated
  if (!isAuthenticated) {
    logger.logInfo(`[ProtectedRoute] Access denied - not authenticated, redirecting to ${redirectTo}`, {
      from: location.pathname,
      source: coordinatorAuth.source
    });
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Admin access check
  if (adminOnly) {
    if (!checkAdminAccess.hasAccess) {
      logger.logInfo(`[ProtectedRoute] Access denied - insufficient admin privileges`, {
        reason: checkAdminAccess.reason,
        from: location.pathname,
        user: authUser?.email || authUser?.id
      });
      return <Navigate to="/" replace />;
    }

    logger.logDebug(`[ProtectedRoute] Admin access granted`, {
      pathname: location.pathname,
      reason: checkAdminAccess.reason
    });
  }

  // Success - render protected content
  logger.logInfo(`[ProtectedRoute] Access granted`, {
    pathname: location.pathname,
    adminOnly,
    source: coordinatorAuth.source
  });

  return children;
};

// PropTypes validation
ProtectedRoute.propTypes = {
  /** The components to render if access is granted */
  children: PropTypes.node.isRequired,
  /** Whether the route requires admin permissions */
  adminOnly: PropTypes.bool,
  /** Where to redirect unauthenticated users */
  redirectTo: PropTypes.string,
  /** Callback function called when authentication errors occur */
  onAuthError: PropTypes.func,
  /** Custom loading component to show during auth checks */
  fallback: PropTypes.node,
  /** Maximum number of authentication check retries */
  maxRetries: PropTypes.number,
  /** Delay between retries in milliseconds */
  retryDelay: PropTypes.number,
};

ProtectedRoute.defaultProps = {
  adminOnly: false,
  redirectTo: '/login',
  onAuthError: null,
  fallback: null,
  maxRetries: 3,
  retryDelay: 1000,
};

export default ProtectedRoute;
