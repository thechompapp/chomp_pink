// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { logInfo, logDebug } from '../utils/logger';

/**
 * ProtectedRoute Component
 * 
 * FIXED: Now uses direct AuthenticationCoordinator integration to avoid React state timing issues
 * This ensures immediate and accurate authentication status checking.
 */
const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const { isLoading, user } = useAuth(); // Still use for user data and loading state
  const adminAuth = useAdminAuth();
  
  // State for coordinator-based authentication check
  const [coordinatorAuth, setCoordinatorAuth] = useState(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // CRITICAL FIX: Check authentication directly with coordinator
  useEffect(() => {
    const checkAuthWithCoordinator = async () => {
      try {
        // Import coordinator
        const { default: authCoordinator } = await import('@/utils/AuthenticationCoordinator');
        
        // Get current state directly from coordinator
        const coordinatorState = authCoordinator.getCurrentState();
        
        logDebug('[ProtectedRoute] Coordinator auth check:', {
          isAuthenticated: coordinatorState.isAuthenticated,
          hasToken: !!coordinatorState.token,
          hasUser: !!coordinatorState.user,
          pathname: location.pathname
        });
        
        // Also check localStorage for backup verification
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('current_user');
        const logoutFlag = localStorage.getItem('user_explicitly_logged_out');
        
        const hasValidStoredAuth = token && 
                                  token !== 'null' && 
                                  storedUser && 
                                  storedUser !== 'null' && 
                                  logoutFlag !== 'true';
        
        logDebug('[ProtectedRoute] Storage auth check:', {
          hasValidToken: !!token && token !== 'null',
          hasValidUser: !!storedUser && storedUser !== 'null',
          notLoggedOut: logoutFlag !== 'true',
          hasValidStoredAuth
        });
        
        // Use coordinator state as primary, storage as backup
        const isAuthenticated = coordinatorState.isAuthenticated || 
                               (hasValidStoredAuth && !coordinatorState.isAuthenticated);
        
        setCoordinatorAuth({
          isAuthenticated,
          user: coordinatorState.user || (hasValidStoredAuth ? JSON.parse(storedUser) : null),
          token: coordinatorState.token || (hasValidStoredAuth ? token : null)
        });
        
        setAuthCheckComplete(true);
        
        logInfo('[ProtectedRoute] Final auth decision:', {
          isAuthenticated,
          method: coordinatorState.isAuthenticated ? 'coordinator' : (hasValidStoredAuth ? 'storage-backup' : 'none'),
          pathname: location.pathname
        });
        
      } catch (error) {
        logInfo('[ProtectedRoute] Error checking coordinator auth:', error);
        
        // Fallback to storage check only
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('current_user');
        const logoutFlag = localStorage.getItem('user_explicitly_logged_out');
        
        const hasValidStoredAuth = token && 
                                  token !== 'null' && 
                                  storedUser && 
                                  storedUser !== 'null' && 
                                  logoutFlag !== 'true';
        
        setCoordinatorAuth({
          isAuthenticated: hasValidStoredAuth,
          user: hasValidStoredAuth ? JSON.parse(storedUser) : null,
          token: hasValidStoredAuth ? token : null
        });
        
        setAuthCheckComplete(true);
        
        logInfo('[ProtectedRoute] Fallback auth decision:', {
          isAuthenticated: hasValidStoredAuth,
          method: 'storage-fallback',
          pathname: location.pathname
        });
      }
    };

    checkAuthWithCoordinator();
    
    // Listen for auth state changes
    const handleAuthChange = () => {
      logDebug('[ProtectedRoute] Auth state change detected, rechecking');
      checkAuthWithCoordinator();
    };
    
    window.addEventListener('auth:state_sync', handleAuthChange);
    window.addEventListener('auth:login_success', handleAuthChange);
    window.addEventListener('auth:logout_complete', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth:state_sync', handleAuthChange);
      window.removeEventListener('auth:login_success', handleAuthChange);
      window.removeEventListener('auth:logout_complete', handleAuthChange);
    };
  }, [location.pathname]);
  
  // Show loading state while checking authentication
  if (isLoading || !authCheckComplete || coordinatorAuth === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Use coordinator authentication decision
  const isAuthenticated = coordinatorAuth.isAuthenticated;
  const authUser = coordinatorAuth.user || user; // Use coordinator user or fallback to context user
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    logInfo(`[ProtectedRoute] User not authenticated (coordinator check), redirecting to ${redirectTo} from ${location.pathname}`);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // If admin-only route, check for admin permissions
  if (adminOnly) {
    // In development mode, grant admin access to authenticated users
    const isDevelopment = import.meta.env.DEV;
    const hasAdminAccess = adminAuth.hasAdminAccess || 
                          adminAuth.can('admin.access') || 
                          adminAuth.isAdmin || 
                          adminAuth.isSuperuser ||
                          (isDevelopment && isAuthenticated) ||
                          // Also check user role directly
                          (authUser && (authUser.role === 'admin' || authUser.role === 'superuser' || authUser.account_type === 'superuser'));
    
    logDebug(`[ProtectedRoute] Admin access check:`, {
      isDevelopment,
      isAuthenticated,
      hasAdminAccess: adminAuth.hasAdminAccess,
      canAccess: adminAuth.can('admin.access'),
      isAdmin: adminAuth.isAdmin,
      isSuperuser: adminAuth.isSuperuser,
      userRole: authUser?.role,
      userAccountType: authUser?.account_type,
      finalAccess: hasAdminAccess,
      pathname: location.pathname
    });
    
    if (!hasAdminAccess) {
      logInfo(`[ProtectedRoute] User lacks admin permissions, redirecting to home from ${location.pathname}`);
      return <Navigate to="/" replace />;
    }
    
    logDebug(`[ProtectedRoute] Admin access granted for ${location.pathname}`);
  }
  
  // User is authenticated and has required permissions
  logInfo(`[ProtectedRoute] Access granted for ${location.pathname}`);
  return children;
};

export default ProtectedRoute;
