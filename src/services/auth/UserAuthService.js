/**
 * User Authentication Service
 * 
 * Handles user authentication operations (login, logout, getCurrentUser)
 */
import { getDefaultApiClient } from '@/services/http';
import { logDebug, logError } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import TokenService from './TokenService';

const API_ENDPOINT = '/auth';

/**
 * UserAuthService - Handles user authentication operations
 */
const UserAuthService = {
  /**
   * Logs in a user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} User data and tokens or error object
   */
  async login(credentials) {
    logDebug('[UserAuthService] Attempting login for:', credentials.email);
    
    const apiClient = getDefaultApiClient();
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/login`, credentials),
      'UserAuthService.login'
    );

    if (result.success && result.data?.token) {
      // Store tokens using TokenService
      TokenService.storeTokens({
        token: result.data.token,
        refreshToken: result.data.refreshToken
      });
      
      // Store user data in localStorage for context to find
      if (result.data.user) {
        localStorage.setItem('current_user', JSON.stringify(result.data.user));
        localStorage.setItem('token', result.data.token);
      }
      
      // Dispatch login event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:login_complete', {
          detail: { isAuthenticated: true, user: result.data }
        }));
      }
      
      logDebug('[UserAuthService] Login successful');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Logs out the current user
   * @returns {Promise<Object>} Success status
   */
  async logout() {
    logDebug('[UserAuthService] Attempting logout');
    
    try {
      const apiClient = getDefaultApiClient();
      
      // Call logout API if we have a token
      if (TokenService.hasTokens()) {
        const result = await handleApiResponse(
          () => apiClient.post(`${API_ENDPOINT}/logout`),
          'UserAuthService.logout'
        );
        
        // Even if API call fails, we still clear tokens
        if (!result.success) {
          logDebug('[UserAuthService] Logout API call failed, but proceeding with local logout');
        }
      }
      
      // Clear tokens
      TokenService.clearTokens();
      
      // Clear auth context storage
      localStorage.removeItem('current_user');
      localStorage.removeItem('token');
      
      // Set explicit logout flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      // Clear other auth-related storage
      try {
        // Clear specific auth cookies
        const authCookies = ['auth', 'token', 'user', 'admin'];
        document.cookie.split(';').forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim();
          if (authCookies.some(prefix => cookieName.includes(prefix))) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      } catch (error) {
        logError('[UserAuthService] Error clearing cookies:', error);
      }
      
      // Dispatch logout event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout_complete', {
          detail: { cleared: true }
        }));
      }
      
      logDebug('[UserAuthService] Logout successful');
      return { success: true };
    } catch (error) {
      logError('[UserAuthService] Error during logout:', error);
      
      // Still clear tokens on error
      TokenService.clearTokens();
      
      return { success: false, error: 'Logout failed' };
    }
  },

  /**
   * Gets the current authenticated user's profile
   * @returns {Promise<Object>} User profile data or error object
   */
  async getCurrentUser() {
    logDebug('[UserAuthService] Fetching current user profile');
    
    // Ensure we have a valid token before making the request
    const hasValidToken = await TokenService.ensureValidToken();
    if (!hasValidToken) {
      logDebug('[UserAuthService] No valid token available');
      return { success: false, error: 'Not authenticated' };
    }
    
    const apiClient = getDefaultApiClient();
    
    const result = await handleApiResponse(
      () => apiClient.get(`${API_ENDPOINT}/me`),
      'UserAuthService.getCurrentUser'
    );
    
    if (result.success) {
      logDebug('[UserAuthService] Current user fetched successfully');
    } else {
      logDebug('[UserAuthService] Failed to fetch current user');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Checks if the user is authenticated
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  async isAuthenticated() {
    // First check if we have tokens
    if (!TokenService.hasTokens()) {
      return false;
    }
    
    // Ensure token is valid
    const hasValidToken = await TokenService.ensureValidToken();
    if (!hasValidToken) {
      return false;
    }
    
    // Optionally verify with the server
    try {
      const result = await this.getCurrentUser();
      return result.success;
    } catch (error) {
      logError('[UserAuthService] Error checking authentication status:', error);
      return false;
    }
  }
};

export default UserAuthService;
