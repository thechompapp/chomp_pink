/* src/services/auth/authService.js */
/**
 * Simplified Authentication Service
 * 
 * FIXED: Removed duplicate token storage - AuthenticationCoordinator handles all token management
 * This service now only handles API calls, no token storage conflicts.
 */
import httpClient from '@/services/http/httpClient';
import authErrorHandler from '@/utils/auth/errorHandler';
import { logDebug, logInfo, logError } from '@/utils/logger';

// Constants
const AUTH_ENDPOINT = '/auth';

/**
 * Simplified Authentication Service - API calls only, no token management
 */
const authService = {
  /**
   * Login user with credentials
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Login response
   */
  async login(credentials) {
    try {
      logInfo('[AuthService] Attempting login');
      
      const response = await httpClient.post(`${AUTH_ENDPOINT}/login`, credentials);
      
      logInfo('[AuthService] Login API call successful');
      
      // Return the raw response - let AuthenticationCoordinator handle token storage
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      logError('[AuthService] Login error:', error.message);
      const formattedError = authErrorHandler.handleError(error, 'login');
      throw formattedError;
    }
  },

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      logInfo('[AuthService] Attempting logout');
      
      const response = await httpClient.post(`${AUTH_ENDPOINT}/logout`);
      
      logInfo('[AuthService] Logout API call successful');
      
      return {
        success: true,
        message: response.data?.message || 'Logout successful'
      };
    } catch (error) {
      logError('[AuthService] Logout error:', error.message);
      // Don't throw on logout errors - local cleanup is more important
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    try {
      logInfo('[AuthService] Attempting registration');
      
      const response = await httpClient.post(`${AUTH_ENDPOINT}/register`, userData);
      
      logInfo('[AuthService] Registration successful');
      
      return {
        success: true,
        message: response.data?.message || 'Registration successful',
        data: response.data?.data
      };
    } catch (error) {
      logError('[AuthService] Registration error:', error.message);
      const formattedError = authErrorHandler.handleError(error, 'register');
      throw formattedError;
    }
  },

  /**
   * Check if token exists (without validation)
   * @returns {boolean} Whether token exists
   */
  hasToken() {
    return !!(localStorage.getItem('token') || localStorage.getItem('auth-token'));
  },

  /**
   * Get current user from localStorage (for compatibility)
   * @returns {Object|null} Current user object
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('current_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logWarn('[AuthService] Error parsing stored user data:', error);
      return null;
    }
  },

  /**
   * Simple token validation (format check only)
   * @returns {boolean} Whether token format is valid
   */
  isTokenValid() {
    const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
    return !!(token && token !== 'null' && token !== 'undefined' && token.length > 10);
  }
};

export default authService;
