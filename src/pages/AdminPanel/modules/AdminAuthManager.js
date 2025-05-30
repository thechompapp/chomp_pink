/**
 * Admin Authentication Manager
 * 
 * Handles authentication verification and management for the Admin Panel.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 * 
 * Responsibilities:
 * - Authentication status verification
 * - Admin permission checking
 * - Navigation handling for auth failures
 * - Development mode authentication
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Authentication verification utilities
 */
export const AuthVerifier = {
  /**
   * Verify if user has admin access
   * @param {Object} user - User object
   * @param {boolean} isAuthenticated - Authentication status
   * @param {boolean} isSuperuser - Superuser status
   * @returns {Object} Verification result
   */
  verifyAdminAccess: (user, isAuthenticated, isSuperuser) => {
    const result = {
      hasAccess: false,
      reason: null,
      action: null
    };
    
    if (!isAuthenticated) {
      result.reason = 'User not authenticated';
      result.action = 'redirect_login';
      return result;
    }
    
    if (!user) {
      result.reason = 'User data not available';
      result.action = 'redirect_login';
      return result;
    }
    
    if (!isSuperuser) {
      result.reason = 'User does not have admin permissions';
      result.action = 'redirect_home';
      return result;
    }
    
    result.hasAccess = true;
    return result;
  },

  /**
   * Check if authentication is in loading state
   * @param {boolean} isLoading - Auth loading state
   * @param {boolean} isSuperuserStatusReady - Superuser status ready
   * @returns {boolean} Whether auth is loading
   */
  isAuthLoading: (isLoading, isSuperuserStatusReady) => {
    return isLoading || !isSuperuserStatusReady;
  },

  /**
   * Get authentication state summary
   * @param {Object} authState - Full auth state
   * @returns {Object} Auth state summary
   */
  getAuthSummary: (authState) => {
    const {
      user,
      isAuthenticated,
      isLoading,
      isSuperuser,
      isSuperuserStatusReady
    } = authState;
    
    return {
      isLoading: AuthVerifier.isAuthLoading(isLoading, isSuperuserStatusReady),
      hasAccess: isAuthenticated && user && isSuperuser,
      userInfo: user ? { id: user.id, username: user.username } : null,
      permissions: {
        isAuthenticated,
        isSuperuser,
        statusReady: isSuperuserStatusReady
      }
    };
  }
};

/**
 * Navigation handler for authentication failures
 */
export const AuthNavigator = {
  /**
   * Handle redirect to login page
   * @param {Function} navigate - React Router navigate function
   * @param {string} reason - Reason for redirect
   */
  redirectToLogin: (navigate, reason = 'Authentication required') => {
    logInfo(`[AdminAuthManager] Redirecting to login: ${reason}`);
    
    navigate('/login', {
      state: {
        from: '/admin',
        message: reason
      }
    });
  },

  /**
   * Handle redirect to home page
   * @param {Function} navigate - React Router navigate function
   * @param {string} reason - Reason for redirect
   */
  redirectToHome: (navigate, reason = 'Access denied') => {
    logWarn(`[AdminAuthManager] Redirecting to home: ${reason}`);
    
    toast.error(reason);
    navigate('/');
  },

  /**
   * Handle authentication failure based on verification result
   * @param {Object} verificationResult - Result from AuthVerifier
   * @param {Function} navigate - React Router navigate function
   */
  handleAuthFailure: (verificationResult, navigate) => {
    const { reason, action } = verificationResult;
    
    switch (action) {
      case 'redirect_login':
        AuthNavigator.redirectToLogin(navigate, reason);
        break;
      case 'redirect_home':
        AuthNavigator.redirectToHome(navigate, reason);
        break;
      default:
        logError('[AdminAuthManager] Unknown auth failure action:', action);
        AuthNavigator.redirectToHome(navigate, 'Authentication error');
    }
  }
};

/**
 * Development mode authentication utilities
 */
export const DevAuthManager = {
  /**
   * Check if in development mode
   * @returns {boolean} Whether in development mode
   */
  isDevelopmentMode: () => {
    return process.env.NODE_ENV === 'development';
  },

  /**
   * Sync admin authentication for development
   * Note: The new AuthenticationCoordinator handles synchronization automatically
   */
  syncAdminAuth: () => {
    if (DevAuthManager.isDevelopmentMode()) {
      try {
        // Authentication sync is now handled by AuthenticationCoordinator
        logInfo('[AdminAuthManager] Authentication is handled by centralized coordinator');
      } catch (error) {
        logError('[AdminAuthManager] Error in auth coordinator:', error);
      }
    }
  },

  /**
   * Setup development mode if applicable
   * @param {Object} authState - Current auth state
   */
  setupDevelopmentMode: (authState) => {
    if (DevAuthManager.isDevelopmentMode() && authState.isAuthenticated) {
      // No manual sync needed - coordinator handles this automatically
      logInfo('[AdminAuthManager] Development mode active - using coordinator');
    }
  }
};

/**
 * Custom hook for admin authentication management
 * @returns {Object} Authentication state and handlers
 */
export function useAdminAuthentication() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading  } = useAuth();
  const { isSuperuser, isReady: isSuperuserStatusReady } = useAdminAuth();
  
  // Full auth state
  const authState = {
    user,
    isAuthenticated,
    isLoading,
    isSuperuser,
    isSuperuserStatusReady
  };
  
  // Auth summary
  const authSummary = AuthVerifier.getAuthSummary(authState);
  
  // Verification function
  const verifyAccess = useCallback(() => {
    return AuthVerifier.verifyAdminAccess(user, isAuthenticated, isSuperuser);
  }, [user, isAuthenticated, isSuperuser]);
  
  // Setup development mode
  useEffect(() => {
    DevAuthManager.setupDevelopmentMode(authState);
  }, [isAuthenticated, user]);
  
  // Handle authentication changes
  const handleAuthVerification = useCallback(async () => {
    // Wait for auth to be ready
    if (authSummary.isLoading) {
      return { verified: false, loading: true };
    }
    
    const verification = verifyAccess();
    
    if (!verification.hasAccess) {
      AuthNavigator.handleAuthFailure(verification, navigate);
      return { verified: false, loading: false, reason: verification.reason };
    }
    
    // Setup development mode if needed
    DevAuthManager.setupDevelopmentMode(authState);
    
    logInfo('[AdminAuthManager] Admin access verified');
    return { verified: true, loading: false };
    
  }, [authSummary.isLoading, verifyAccess, navigate, authState]);
  
  return {
    // Auth state
    authState,
    authSummary,
    
    // Verification
    verifyAccess,
    handleAuthVerification,
    
    // Status checks
    isLoading: authSummary.isLoading,
    hasAccess: authSummary.hasAccess,
    isAuthenticated,
    isSuperuser,
    
    // User info
    user: authSummary.userInfo,
    
    // Utilities
    isDevelopmentMode: DevAuthManager.isDevelopmentMode(),
    syncAdminAuth: DevAuthManager.syncAdminAuth
  };
}

/**
 * Authentication error boundary utilities
 */
export const AuthErrorHandler = {
  /**
   * Handle authentication errors
   * @param {Error} error - Authentication error
   * @param {Function} navigate - Navigation function
   */
  handleAuthError: (error, navigate) => {
    const message = `Authentication error: ${error.message}`;
    logError('[AdminAuthManager] Auth error:', error);
    
    toast.error(message);
    navigate('/');
  },

  /**
   * Handle permission errors
   * @param {Error} error - Permission error
   * @param {Function} navigate - Navigation function
   */
  handlePermissionError: (error, navigate) => {
    const message = `Permission error: ${error.message}`;
    logError('[AdminAuthManager] Permission error:', error);
    
    toast.error(message);
    navigate('/');
  },

  /**
   * Create error handler for async auth operations
   * @param {Function} navigate - Navigation function
   * @returns {Function} Error handler function
   */
  createAsyncErrorHandler: (navigate) => {
    return (error) => {
      if (error.message?.includes('permission') || error.message?.includes('admin')) {
        AuthErrorHandler.handlePermissionError(error, navigate);
      } else {
        AuthErrorHandler.handleAuthError(error, navigate);
      }
    };
  }
};

export default {
  AuthVerifier,
  AuthNavigator,
  DevAuthManager,
  useAdminAuthentication,
  AuthErrorHandler
}; 