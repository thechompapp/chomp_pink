/* src/services/auth/authService.js */
/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls with:
 * - Consistent error handling
 * - Token management
 * - Offline mode support
 * - Development mode handling
 */
import httpClient from '@/services/http/httpClient';
import tokenManager from './tokenManager';
import authErrorHandler, { AUTH_ERROR_TYPES } from '@/utils/auth/errorHandler';
import { logDebug, logInfo, logError } from '@/utils/logger';

// Constants
const AUTH_ENDPOINT = '/auth';

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate password format
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Handle development mode admin login
 * @param {Object} credentials - Login credentials
 * @returns {boolean} True if admin login was handled
 */
const handleDevModeAdminLogin = (credentials) => {
  if (process.env.NODE_ENV === 'development' && 
      credentials.email === 'admin@example.com' && 
      credentials.password === 'doof123') {
    
    logInfo('[AuthService] Using admin credentials in development mode');
    
    // Set admin flags for development mode
    localStorage.setItem('admin_access_enabled', 'true');
    localStorage.setItem('superuser_override', 'true');
    localStorage.setItem('bypass_auth_check', 'true');
    
    return true;
  }
  
  return false;
};

/**
 * Clear offline mode flags
 */
const clearOfflineMode = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('offline-mode');
    localStorage.setItem('force_online', 'true');
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('offline_mode');
    sessionStorage.removeItem('offline-mode');
  }
};

const authService = {
  /**
   * Log in a user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  login: async (credentials) => {
    try {
      // Clear offline mode flags to ensure we're in online mode
      clearOfflineMode();
      
      // Validate credentials
      if (!credentials || !credentials.email || !credentials.password) {
        throw authErrorHandler.createValidationError('Email and password are required');
      }
      
      if (!isValidEmail(credentials.email)) {
        throw authErrorHandler.createValidationError('Invalid email format');
      }
      
      if (!isValidPassword(credentials.password)) {
        throw authErrorHandler.createValidationError('Password must be at least 6 characters');
      }
      
      // Handle development mode admin login
      if (handleDevModeAdminLogin(credentials)) {
        // Return mock admin user for development
        return {
          user: {
            id: 1,
            email: credentials.email,
            name: 'Admin User',
            account_type: 'superuser',
            permissions: ['admin', 'create', 'edit', 'delete']
          },
          tokens: {
            accessToken: 'dev-mode-token',
            refreshToken: 'dev-mode-refresh-token',
            expiresIn: 86400 // 24 hours
          }
        };
      }
      
      logDebug('[AuthService] Attempting login for:', credentials.email);
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/login`, credentials);
      
      // Extract user and token data
      const { user, accessToken, refreshToken, expiresIn } = response.data;
      
      // Store tokens
      tokenManager.setTokens({
        accessToken,
        refreshToken,
        expiresIn
      });
      
      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn
        }
      };
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'login');
      throw formattedError;
    }
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User name
   * @returns {Promise<Object>} User data and tokens
   */
  register: async (userData) => {
    try {
      // Clear offline mode flags to ensure we're in online mode
      clearOfflineMode();
      
      // Validate user data
      if (!userData || !userData.email || !userData.password || !userData.name) {
        throw authErrorHandler.createValidationError('Name, email, and password are required');
      }
      
      if (!isValidEmail(userData.email)) {
        throw authErrorHandler.createValidationError('Invalid email format');
      }
      
      if (!isValidPassword(userData.password)) {
        throw authErrorHandler.createValidationError('Password must be at least 6 characters');
      }
      
      logDebug('[AuthService] Attempting registration for:', userData.email);
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/register`, userData);
      
      // Extract user and token data
      const { user, accessToken, refreshToken, expiresIn } = response.data;
      
      // Store tokens
      tokenManager.setTokens({
        accessToken,
        refreshToken,
        expiresIn
      });
      
      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn
        }
      };
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'register');
      throw formattedError;
    }
  },
  
  /**
   * Log out the current user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Get current token for the request
      const token = tokenManager.getAccessToken();
      
      // Clear tokens first to prevent any issues if the request fails
      tokenManager.clearTokens();
      
      // Only make the API call if we have a token and we're not in offline mode
      const isOfflineMode = localStorage.getItem('offline_mode') === 'true';
      
      if (token && !isOfflineMode) {
        try {
          // Make API request with the token
          await httpClient.post(`${AUTH_ENDPOINT}/logout`, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          logDebug('[AuthService] Logout successful');
        } catch (apiError) {
          // Log but don't throw - we still want to clear local tokens
          logError('[AuthService] Error during logout API call:', apiError);
        }
      }
      
      // Clear development mode flags
      if (process.env.NODE_ENV === 'development') {
        localStorage.removeItem('admin_access_enabled');
        localStorage.removeItem('superuser_override');
        localStorage.removeItem('bypass_auth_check');
      }
      
      // Clear user explicitly logged out flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      return { success: true };
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'logout');
      
      // Still clear tokens even if there was an error
      tokenManager.clearTokens();
      
      throw formattedError;
    }
  },
  
  /**
   * Refresh the authentication token
   * @returns {Promise<Object>} New tokens
   */
  refreshToken: async () => {
    try {
      // Get refresh token
      const refreshToken = tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      logDebug('[AuthService] Attempting token refresh');
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/refresh`, {
        refreshToken
      });
      
      // Extract token data
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
      
      // Store tokens
      tokenManager.setTokens({
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn
      });
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn
      };
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'refreshToken');
      
      // Clear tokens if refresh failed
      tokenManager.clearTokens();
      
      throw formattedError;
    }
  },
  
  /**
   * Check if user is authenticated
   * @param {boolean} validateWithApi - Whether to validate with API
   * @returns {Promise<boolean>} True if authenticated
   */
  isAuthenticated: async (validateWithApi = false) => {
    try {
      // Check if we have a valid token
      if (!tokenManager.hasValidTokens()) {
        return false;
      }
      
      // If we don't need to validate with API, return true
      if (!validateWithApi) {
        return true;
      }
      
      // Validate with API
      const response = await httpClient.get(`${AUTH_ENDPOINT}/validate`);
      return response.data.valid === true;
    } catch (error) {
      // Log but return false instead of throwing
      logError('[AuthService] Error checking authentication:', error);
      return false;
    }
  },
  
  /**
   * Get the current user profile
   * @returns {Promise<Object>} User profile data
   */
  getCurrentUser: async () => {
    try {
      // Check if we have a valid token
      if (!tokenManager.hasValidTokens()) {
        throw new Error('Not authenticated');
      }
      
      // Make API request
      const response = await httpClient.get(`${AUTH_ENDPOINT}/me`);
      
      return response.data.user;
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'getCurrentUser');
      throw formattedError;
    }
  },
  
  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  updateProfile: async (userData) => {
    try {
      // Check if we have a valid token
      if (!tokenManager.hasValidTokens()) {
        throw new Error('Not authenticated');
      }
      
      // Make API request
      const response = await httpClient.put(`${AUTH_ENDPOINT}/profile`, userData);
      
      return response.data.user;
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'updateProfile');
      throw formattedError;
    }
  },
  
  /**
   * Change user password
   * @param {Object} passwordData - Password data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  changePassword: async (passwordData) => {
    try {
      // Validate password data
      if (!passwordData || !passwordData.currentPassword || !passwordData.newPassword) {
        throw authErrorHandler.createValidationError('Current and new passwords are required');
      }
      
      if (!isValidPassword(passwordData.newPassword)) {
        throw authErrorHandler.createValidationError('New password must be at least 6 characters');
      }
      
      // Check if we have a valid token
      if (!tokenManager.hasValidTokens()) {
        throw new Error('Not authenticated');
      }
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/change-password`, passwordData);
      
      return response.data;
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'changePassword');
      throw formattedError;
    }
  },
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Success response
   */
  requestPasswordReset: async (email) => {
    try {
      // Validate email
      if (!email) {
        throw authErrorHandler.createValidationError('Email is required');
      }
      
      if (!isValidEmail(email)) {
        throw authErrorHandler.createValidationError('Invalid email format');
      }
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/forgot-password`, { email });
      
      return response.data;
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'requestPasswordReset');
      throw formattedError;
    }
  },
  
  /**
   * Reset password with token
   * @param {Object} resetData - Reset data
   * @param {string} resetData.token - Reset token
   * @param {string} resetData.password - New password
   * @returns {Promise<Object>} Success response
   */
  resetPassword: async (resetData) => {
    try {
      // Validate reset data
      if (!resetData || !resetData.token || !resetData.password) {
        throw authErrorHandler.createValidationError('Token and new password are required');
      }
      
      if (!isValidPassword(resetData.password)) {
        throw authErrorHandler.createValidationError('Password must be at least 6 characters');
      }
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/reset-password`, resetData);
      
      return response.data;
    } catch (error) {
      // Handle and standardize error
      const formattedError = authErrorHandler.handleError(error, 'resetPassword');
      throw formattedError;
    }
  }
};

export default authService;
