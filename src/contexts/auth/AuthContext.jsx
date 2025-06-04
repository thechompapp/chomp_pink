/* src/contexts/auth/AuthContext.jsx */
/**
 * Production-Ready Authentication Context
 * 
 * Enterprise-grade authentication system with robust error handling,
 * token persistence, and proper state management.
 */
import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { logDebug, logInfo, logWarn, logError } from '@/utils/logger';

// Context creation
const AuthContext = createContext(null);

// Constants for token management
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'current_user';
const LOGOUT_FLAG_KEY = 'user_explicitly_logged_out';
const AUTH_STATE_KEY = 'auth_state_timestamp';

// Token validation utilities
const isValidToken = (token) => {
  if (!token || token === 'null' || token === 'undefined' || token.length < 10) {
    return false;
  }
  return true;
};

const isValidUser = (user) => {
  if (!user || typeof user !== 'object') return false;
  return !!(user.id || user.email || user.username);
};

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  // Core authentication state
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  
  // Internal state management
  const [authReady, setAuthReady] = useState(false);
  const initializationRef = useRef(false);
  const tokenValidationRef = useRef(null);

  /**
   * Secure token storage with validation
   */
  const storeAuthData = useCallback((token, userData) => {
    try {
      logDebug('[AuthContext] storeAuthData called', { 
        hasToken: !!token, 
        tokenLength: token ? token.length : 0,
        hasUser: !!userData,
        user: userData
      });

      if (!isValidToken(token) || !isValidUser(userData)) {
        const error = `Invalid authentication data provided - token valid: ${isValidToken(token)}, user valid: ${isValidUser(userData)}`;
        logError('[AuthContext] Validation failed in storeAuthData:', error);
        throw new Error(error);
      }

      // Store with timestamp for tracking
      const timestamp = Date.now();
      logDebug('[AuthContext] Storing to localStorage...', {
        tokenKey: TOKEN_STORAGE_KEY,
        userKey: USER_STORAGE_KEY,
        authStateKey: AUTH_STATE_KEY,
        timestamp
      });

      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(AUTH_STATE_KEY, timestamp.toString());
      localStorage.removeItem(LOGOUT_FLAG_KEY);
      
      // Verify storage worked
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      logDebug('[AuthContext] Storage verification', {
        tokenStored: !!storedToken,
        userStored: !!storedUser,
        tokenMatches: storedToken === token,
        userMatches: storedUser === JSON.stringify(userData)
      });
      
      logInfo('[AuthContext] Authentication data stored securely');
      return true;
    } catch (error) {
      logError('[AuthContext] Failed to store auth data:', error);
      return false;
    }
  }, []);

  /**
   * Secure token retrieval with validation
   */
  const getAuthData = useCallback(() => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);

      // Check if user explicitly logged out
      if (logoutFlag === 'true') {
        return { valid: false, reason: 'user_logged_out' };
      }

      // Validate token
      if (!isValidToken(token)) {
        return { valid: false, reason: 'invalid_token' };
      }

      // Parse and validate user data
      let userData = null;
      if (userStr && userStr !== 'null') {
        try {
          userData = JSON.parse(userStr);
          if (!isValidUser(userData)) {
            return { valid: false, reason: 'invalid_user_data' };
          }
        } catch (parseError) {
          logWarn('[AuthContext] Failed to parse user data:', parseError);
          return { valid: false, reason: 'user_parse_error' };
        }
      } else {
        return { valid: false, reason: 'no_user_data' };
      }

      return {
        valid: true,
        token,
        user: userData
      };
    } catch (error) {
      logError('[AuthContext] Error retrieving auth data:', error);
      return { valid: false, reason: 'retrieval_error' };
    }
  }, []);

  /**
   * Clear authentication data securely
   */
  const clearAuthData = useCallback((reason = 'logout') => {
    try {
      // Clear state first
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Clear storage
      if (reason === 'logout') {
        localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
      }
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STATE_KEY);
      
      logInfo(`[AuthContext] Auth data cleared (reason: ${reason})`);
    } catch (error) {
      logError('[AuthContext] Error clearing auth data:', error);
    }
  }, []);

  /**
   * Validate current authentication state
   */
  const validateAuthState = useCallback(async () => {
    try {
      const authData = getAuthData();
      
      if (!authData.valid) {
        logDebug(`[AuthContext] Auth validation failed: ${authData.reason}`);
        
        // Only clear if it's not a user logout
        if (authData.reason !== 'user_logged_out') {
          clearAuthData('invalid_state');
        }
        return false;
      }

      // For production, we would validate the token with the server here
      // For development, we trust localStorage data if it passes basic validation
      if (import.meta.env.DEV) {
        setUser(authData.user);
        setIsAuthenticated(true);
        logInfo('[AuthContext] Auth state validated (dev mode)');
        return true;
      }

      // In production, validate with server
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const validationData = await response.json();
          setUser(validationData.user || authData.user);
          setIsAuthenticated(true);
          logInfo('[AuthContext] Auth state validated with server');
          return true;
        } else {
          logWarn('[AuthContext] Server validation failed');
          clearAuthData('server_validation_failed');
          return false;
        }
      } catch (networkError) {
        // In case of network error, trust local data temporarily
        logWarn('[AuthContext] Network error during validation, using local data');
        setUser(authData.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      logError('[AuthContext] Auth validation error:', error);
      return false;
    }
  }, [getAuthData, clearAuthData]);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        setIsLoading(true);
        logDebug('[AuthContext] Initializing authentication state...');
        
        await validateAuthState();
        
        setAuthReady(true);
        logInfo('[AuthContext] Authentication initialized successfully');
      } catch (error) {
        logError('[AuthContext] Auth initialization failed:', error);
        clearAuthData('initialization_error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [validateAuthState, clearAuthData]);

  /**
   * Login function with comprehensive error handling
   */
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logDebug('[AuthContext] Starting login process', credentials);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      logDebug('[AuthContext] Login response received', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const responseData = await response.json();
        
        logDebug('[AuthContext] Login response data', { 
          hasToken: !!(responseData.data?.token), 
          hasUser: !!(responseData.data?.user),
          tokenLength: responseData.data?.token ? responseData.data.token.length : 0,
          user: responseData.data?.user,
          fullData: responseData,
          dataKeys: Object.keys(responseData),
          rawData: JSON.stringify(responseData)
        });
        
        // Extract token and user from nested data structure
        const token = responseData.data?.token;
        const user = responseData.data?.user;
        
        if (!token || !user) {
          const errorMsg = `Invalid response from login endpoint - token: ${!!token}, user: ${!!user}`;
          logError('[AuthContext] Login validation failed:', errorMsg);
          throw new Error(errorMsg);
        }

        // Store authentication data securely
        logDebug('[AuthContext] Attempting to store auth data...');
        const stored = storeAuthData(token, user);
        if (!stored) {
          throw new Error('Failed to store authentication data');
        }
        logDebug('[AuthContext] Auth data stored successfully');
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        logInfo('[AuthContext] Login successful - state updated');
        return { success: true, user: user };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Login failed (${response.status})`;
        setError(errorMessage);
        logWarn('[AuthContext] Login failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during login';
      setError(errorMessage);
      logError('[AuthContext] Login error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [storeAuthData]);

  /**
   * Logout function with cleanup
   */
  const logout = useCallback(async (options = {}) => {
    try {
      const { notifyServer = true } = options;
      
      logDebug('[AuthContext] Starting logout process');
      
      // Notify server if requested and possible
      if (notifyServer && isAuthenticated) {
        try {
          const token = localStorage.getItem(TOKEN_STORAGE_KEY);
          if (token) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (serverError) {
          logWarn('[AuthContext] Server logout notification failed:', serverError);
        }
      }
      
      // Clear all auth data
      clearAuthData('logout');
      
      logInfo('[AuthContext] Logout completed');
      return { success: true };
    } catch (error) {
      logError('[AuthContext] Logout error:', error);
      // Even if logout fails, clear local data
      clearAuthData('logout_error');
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, clearAuthData]);

  /**
   * Registration function
   */
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logDebug('[AuthContext] Starting registration process');
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.token || !data.user) {
          throw new Error('Invalid response from registration endpoint');
        }

        // Store authentication data securely
        const stored = storeAuthData(data.token, data.user);
        if (!stored) {
          throw new Error('Failed to store authentication data');
        }
        
        // Update state
        setUser(data.user);
        setIsAuthenticated(true);
        
        logInfo('[AuthContext] Registration successful');
        return { success: true, user: data.user };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Registration failed (${response.status})`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during registration';
      setError(errorMessage);
      logError('[AuthContext] Registration error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [storeAuthData]);

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const isValid = await validateAuthState();
      return { success: isValid };
    } catch (error) {
      logError('[AuthContext] Auth refresh error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [validateAuthState]);

  /**
   * Clear error function
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed properties
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser' || user?.account_type === 'superuser';
  const isSuperuser = user?.role === 'superuser' || user?.account_type === 'superuser';

  // Context value
  const contextValue = {
    // Core state
    user,
    isAuthenticated,
    isLoading,
    error,
    authReady,
    
    // Computed properties
    isAdmin,
    isSuperuser,
    
    // Functions
    login,
    logout,
    register,
    refreshAuth,
    clearError,
    
    // Utilities
    getAuthData,
    validateAuthState
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

/**
 * Hook to check if auth is ready
 */
export const useAuthReady = () => {
  const { authReady } = useAuth();
  return authReady;
};

export default AuthContext;
