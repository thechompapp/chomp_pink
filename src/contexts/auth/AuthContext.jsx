/* src/contexts/auth/AuthContext.jsx */
/**
 * Authentication Context - Fixed for proper state synchronization
 * 
 * Simple React wrapper around the consolidated authentication store
 * Fixed to ensure React components re-render when Zustand store updates
 */
import React, { createContext, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import useAuthenticationStore from '@/stores/auth/useAuthenticationStore';
import { logDebug, logInfo } from '@/utils/logger';

// Context creation
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  // CRITICAL FIX: Use direct store subscription without selective subscriptions
  // This ensures ALL store changes trigger re-renders
  const authState = useAuthenticationStore();
  
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    checkAuthStatus,
    isAdmin,
    clearError
  } = authState;

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Enhanced login function
   */
  const login = useCallback(async (credentials) => {
    try {
      const success = await storeLogin(credentials);
      if (success) {
        // Force a small delay to ensure store has updated
        await new Promise(resolve => setTimeout(resolve, 50));
        // Get the updated user from the store after login
        const updatedUser = useAuthenticationStore.getState().user;
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      logDebug('[AuthContext] Login error:', error);
      return { success: false, error: error.message };
    }
  }, [storeLogin]);

  /**
   * Enhanced logout function
   */
  const logout = useCallback(async () => {
    try {
      await storeLogout();
      // Force a small delay to ensure store has updated
      await new Promise(resolve => setTimeout(resolve, 50));
      return { success: true };
    } catch (error) {
      logDebug('[AuthContext] Logout error:', error);
      return { success: false, error: error.message };
    }
  }, [storeLogout]);

  /**
   * Registration function
   */
  const register = useCallback(async (userData) => {
    try {
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
      return { success: true, message: result.message };
      
    } catch (error) {
      logDebug('[AuthContext] Registration error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Check if user has admin privileges
   */
  const isSuperuser = isAdmin();

  // CRITICAL FIX: Remove memoization that was preventing re-renders
  // Create context value directly without useMemo to ensure updates
  const contextValue = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    isSuperuser,
    isAdmin: isSuperuser, // Alias for backward compatibility
    superuserStatusReady: true, // Always ready in optimized version

    // Actions
    login,
    logout,
    register,
    checkAuthStatus,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
