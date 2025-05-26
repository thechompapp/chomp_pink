/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles user authentication, session management, and role-based access control.
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../services/authService';
import { logDebug, logError } from '@/utils/logger';

// Create context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authStatus = await authService.getAuthStatus();
      
      setIsAuthenticated(authStatus.isAuthenticated);
      setUser(authStatus.user);
      setIsAdmin(authStatus.isAdmin);
      
      logDebug('[AuthContext] Auth initialized:', authStatus.isAuthenticated);
    } catch (err) {
      logError('[AuthContext] Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, []);
  
  /**
   * Login with credentials
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Login result
   */
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        setIsAdmin(result.isAdmin);
        logDebug('[AuthContext] User logged in successfully');
      } else {
        setError(result.message || 'Login failed');
        logDebug('[AuthContext] Login failed:', result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during login';
      logError('[AuthContext] Login error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      
      if (!result.success) {
        setError(result.message || 'Registration failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during registration';
      logError('[AuthContext] Registration error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Logout the current user
   * @returns {Promise<Object>} Logout result
   */
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      setError(null);
      
      return { success: true };
    } catch (err) {
      logError('[AuthContext] Logout error:', err);
      
      // Still clear auth state even if API call fails
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Update result
   */
  const updateProfile = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.updateProfile(userData);
      
      if (result.success) {
        setUser(result.user);
      } else {
        setError(result.message || 'Profile update failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during profile update';
      logError('[AuthContext] Profile update error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Password change result
   */
  const changePassword = async (passwordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.changePassword(passwordData);
      
      if (!result.success) {
        setError(result.message || 'Password change failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during password change';
      logError('[AuthContext] Password change error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Password reset request result
   */
  const requestPasswordReset = async (email) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.requestPasswordReset(email);
      
      if (!result.success) {
        setError(result.message || 'Password reset request failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during password reset request';
      logError('[AuthContext] Password reset request error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Reset password with token
   * @param {Object} resetData - Password reset data
   * @returns {Promise<Object>} Password reset result
   */
  const resetPassword = async (resetData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.resetPassword(resetData);
      
      if (!result.success) {
        setError(result.message || 'Password reset failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during password reset';
      logError('[AuthContext] Password reset error:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Check if user has required role
   * @param {string|string[]} roles - Required role(s)
   * @returns {boolean} True if user has required role
   */
  const hasRole = (roles) => {
    if (!isAuthenticated || !user || !user.role) {
      return false;
    }
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isAuthenticated,
    isAdmin,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    hasRole,
    refreshAuth: initializeAuth
  }), [isAuthenticated, isAdmin, user, isLoading, error]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
