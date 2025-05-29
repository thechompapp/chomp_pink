/**
 * Token Service
 * 
 * Handles authentication token management, storage, and refresh
 */
import { getDefaultApiClient } from '@/services/http';
import { logDebug, logError } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers.js';

const API_ENDPOINT = '/auth';

/**
 * TokenService - Manages authentication tokens
 */
const TokenService = {
  /**
   * Stores authentication tokens in localStorage
   * @param {Object} tokenData - Token data
   * @param {string} tokenData.token - Access token
   * @param {string} [tokenData.refreshToken] - Refresh token (optional)
   */
  storeTokens(tokenData) {
    if (!tokenData) return;
    
    try {
      if (tokenData.token) {
        localStorage.setItem('token', tokenData.token);
        logDebug('[TokenService] Access token stored');
      }
      
      if (tokenData.refreshToken) {
        localStorage.setItem('refreshToken', tokenData.refreshToken);
        logDebug('[TokenService] Refresh token stored');
      }
    } catch (error) {
      logError('[TokenService] Error storing tokens:', error);
    }
  },

  /**
   * Retrieves the access token from localStorage
   * @returns {string|null} Access token or null if not found
   */
  getAccessToken() {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      logError('[TokenService] Error retrieving access token:', error);
      return null;
    }
  },

  /**
   * Retrieves the refresh token from localStorage
   * @returns {string|null} Refresh token or null if not found
   */
  getRefreshToken() {
    try {
      return localStorage.getItem('refreshToken');
    } catch (error) {
      logError('[TokenService] Error retrieving refresh token:', error);
      return null;
    }
  },

  /**
   * Checks if the user has valid tokens stored
   * @returns {boolean} Whether valid tokens exist
   */
  hasTokens() {
    return !!this.getAccessToken();
  },

  /**
   * Clears all authentication tokens
   */
  clearTokens() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      logDebug('[TokenService] All tokens cleared');
    } catch (error) {
      logError('[TokenService] Error clearing tokens:', error);
    }
  },

  /**
   * Refreshes the authentication token
   * @returns {Promise<Object>} New token data or error object
   */
  async refreshToken() {
    logDebug('[TokenService] Attempting to refresh token');
    
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      logDebug('[TokenService] No refresh token available');
      return { success: false, error: 'No refresh token available' };
    }
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/refresh-token`, { refreshToken }),
      'TokenService.refreshToken'
    );
    
    if (result.success && result.data?.token) {
      this.storeTokens(result.data);
      logDebug('[TokenService] Token refreshed successfully');
      return { success: true, data: result.data };
    }
    
    // If refresh failed, clear tokens to force re-login
    if (!result.success) {
      this.clearTokens();
      logDebug('[TokenService] Token refresh failed, tokens cleared');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Checks if the token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} Whether the token is expired
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      // JWT tokens are in format: header.payload.signature
      const payload = token.split('.')[1];
      if (!payload) return true;
      
      // Decode the base64 payload
      const decodedPayload = JSON.parse(atob(payload));
      
      // Check if the token has an expiration claim
      if (!decodedPayload.exp) return false;
      
      // Check if the token is expired
      const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch (error) {
      logError('[TokenService] Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  },

  /**
   * Validates the current token and refreshes if needed
   * @returns {Promise<boolean>} Whether a valid token is available
   */
  async ensureValidToken() {
    const token = this.getAccessToken();
    
    if (!token) {
      logDebug('[TokenService] No token available');
      return false;
    }
    
    if (!this.isTokenExpired(token)) {
      logDebug('[TokenService] Token is valid');
      return true;
    }
    
    logDebug('[TokenService] Token is expired, attempting refresh');
    const refreshResult = await this.refreshToken();
    
    return refreshResult.success;
  }
};

export default TokenService;
