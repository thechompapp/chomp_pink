/* src/contexts/auth/AuthContext.jsx */
/**
 * Authentication Context - Coordinated Version
 * 
 * This context now acts as a React wrapper around the centralized
 * AuthenticationCoordinator to ensure all authentication state is
 * synchronized across the entire application.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import authCoordinator, { AUTH_EVENTS } from '@/utils/AuthenticationCoordinator';
import { logDebug, logInfo } from '@/utils/logger';

// Context creation
const AuthContext = createContext(null);

/**
 * Authentication Provider Component - Coordinated Version
 */
export const AuthProvider = ({ children }) => {
  // State synchronized with the coordinator
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isSuperuser: false,
    isAdmin: false,
    superuserStatusReady: false
  });

  /**
   * Sync state from coordinator
   */
  const syncFromCoordinator = useCallback(() => {
    const coordinatorState = authCoordinator.getCurrentState();
    
    setAuthState({
      user: coordinatorState.user,
      isAuthenticated: coordinatorState.isAuthenticated,
      isLoading: false, // Coordinator handles loading states
      error: null,
      isSuperuser: coordinatorState.isSuperuser,
      isAdmin: coordinatorState.isAdmin,
      superuserStatusReady: true // Always ready with coordinator
    });
    
    logDebug('[AuthContext] State synced from coordinator');
  }, []);

  /**
   * Set up event listeners for coordinator events
   */
  useEffect(() => {
    // Initial sync
    syncFromCoordinator();

    // Listen for coordinator state changes
    const handleStateSync = () => {
      syncFromCoordinator();
    };

    const handleLoginSuccess = (event) => {
      logInfo('[AuthContext] Login success received from coordinator');
      syncFromCoordinator();
    };

    const handleLogoutComplete = (event) => {
      logInfo('[AuthContext] Logout complete received from coordinator');
      syncFromCoordinator();
    };

    // Add event listeners
    window.addEventListener(AUTH_EVENTS.STATE_SYNC, handleStateSync);
    window.addEventListener(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
    window.addEventListener(AUTH_EVENTS.LOGOUT_COMPLETE, handleLogoutComplete);

    return () => {
      window.removeEventListener(AUTH_EVENTS.STATE_SYNC, handleStateSync);
      window.removeEventListener(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
      window.removeEventListener(AUTH_EVENTS.LOGOUT_COMPLETE, handleLogoutComplete);
    };
  }, [syncFromCoordinator]);

  /**
   * Login function - delegates to coordinator
   */
  const login = useCallback(async (credentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await authCoordinator.coordinateLogin(credentials);
      
      if (result.success) {
        // State will be updated via event listener
        return { success: true, user: result.user };
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error 
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Logout function - delegates to coordinator
   */
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authCoordinator.coordinateLogout();
      // State will be updated via event listener
      return { success: true };
    } catch (error) {
      logDebug('[AuthContext] Logout error:', error);
      // Even on error, the coordinator should have cleared state
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Register function - delegates to coordinator for consistency
   */
  const register = useCallback(async (userData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // For now, register uses the same pattern as login
      // This could be expanded to use a coordinator.coordinateRegister method
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: true, message: result.message };
      
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Update profile function
   */
  const updateProfile = useCallback(async (profileData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }

      const result = await response.json();
      
      // Update user in coordinator and sync
      if (result.user) {
        await authCoordinator.syncAuthenticatedState(
          true, 
          result.user, 
          token
        );
      }
      
      return { success: true, user: result.user };
      
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Change password function
   */
  const changePassword = useCallback(async (passwordData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password change failed');
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Password change failed';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission) => {
    if (!authState.isAuthenticated || !authState.user) return false;
    
    // Superusers and admins have all permissions
    if (authState.isSuperuser || authState.isAdmin) return true;
    
    // Development mode override
    if (import.meta.env.DEV) {
      const adminAccess = localStorage.getItem('admin_access_enabled') === 'true';
      const superuserOverride = localStorage.getItem('superuser_override') === 'true';
      if (adminAccess || superuserOverride) return true;
    }
    
    // Check specific permissions
    if (typeof permission === 'string') {
      return Boolean(authState.user.permissions?.includes(permission));
    }
    
    if (Array.isArray(permission)) {
      return permission.some(p => authState.user.permissions?.includes(p));
    }
    
    return false;
  }, [authState.isAuthenticated, authState.user, authState.isSuperuser, authState.isAdmin]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // State from coordinator
      user: authState.user,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      error: authState.error,
      isSuperuser: authState.isSuperuser,
      isAdmin: authState.isAdmin,
      roles: authState.user?.roles || [],
      permissions: authState.user?.permissions || [],
      superuserStatusReady: authState.superuserStatusReady,
      isOffline: false, // Coordinator handles offline state
      isRefreshing: false,
      
      // Methods
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      hasPermission,
      
      // Direct coordinator access for advanced use cases
      coordinator: authCoordinator
    }),
    [
      authState,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      hasPermission
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add PropTypes for better developer experience
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider;
