import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import authService from '@/services/authService';
import { logDebug, logError } from '@/utils/logger';

export const AuthContext = createContext();

/**
 * AuthProvider - Provides authentication context to the application
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        logError('[AuthContext] Error checking auth status:', error);
        authService.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Login user with email and password
   */
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      logError('[AuthContext] Login error:', error);
      setError(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.register(userData);
      return { success: true, data: result };
    } catch (error) {
      logError('[AuthContext] Registration error:', error);
      setError(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      logError('[AuthContext] Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.requestPasswordReset(email);
      return { success: true, data: result };
    } catch (error) {
      logError('[AuthContext] Password reset request error:', error);
      setError(error.message || 'Password reset request failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.resetPassword(token, newPassword);
      return { success: true, data: result };
    } catch (error) {
      logError('[AuthContext] Password reset error:', error);
      setError(error.message || 'Password reset failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify email with token
   */
  const verifyEmail = async (token) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.verifyEmail(token);
      return { success: true, data: result };
    } catch (error) {
      logError('[AuthContext] Email verification error:', error);
      setError(error.message || 'Email verification failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
