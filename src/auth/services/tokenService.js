/**
 * Token Service
 * 
 * Handles all token-related operations including storage, retrieval,
 * validation, and refresh functionality.
 */
import { getDefaultApiClient } from '@/services/http';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Storage keys for tokens
 * @type {Object}
 */
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRY: 'auth_token_expiry'
};

/**
 * Base URL for authentication endpoints
 * @type {string}
 */
const BASE_URL = '/api/auth';

/**
 * Token cache to reduce localStorage reads
 * @type {Object}
 */
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiry: null,
  lastCheck: 0
};

/**
 * Token cache TTL in milliseconds
 * @type {number}
 */
const TOKEN_CACHE_TTL = 5000; // 5 seconds

/**
 * Token Service
 */
class TokenService {
  /**
   * Set access token and expiry
   * @param {string} token - Access token
   * @param {number} expiryTime - Token expiry timestamp
   */
  setAccessToken(token, expiryTime) {
    if (!token) return;
    
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(TOKEN_KEYS.EXPIRY, expiryTime.toString());
    
    // Update cache
    tokenCache.accessToken = token;
    tokenCache.expiry = expiryTime;
    tokenCache.lastCheck = Date.now();
    
    logDebug('[TokenService] Access token set');
  }
  
  /**
   * Set refresh token
   * @param {string} refreshToken - Refresh token
   */
  setRefreshToken(refreshToken) {
    if (!refreshToken) return;
    
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    
    // Update cache
    tokenCache.refreshToken = refreshToken;
    tokenCache.lastCheck = Date.now();
    
    logDebug('[TokenService] Refresh token set');
  }
  
  /**
   * Set all tokens
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {number} expiryTime - Token expiry timestamp
   */
  setTokens(accessToken, refreshToken, expiryTime) {
    this.setAccessToken(accessToken, expiryTime);
    this.setRefreshToken(refreshToken);
  }
  
  /**
   * Get access token
   * @returns {string|null} Access token or null if not found
   */
  getAccessToken() {
    const now = Date.now();
    
    // Use cached token if available and cache is fresh
    if (tokenCache.accessToken && (now - tokenCache.lastCheck < TOKEN_CACHE_TTL)) {
      return tokenCache.accessToken;
    }
    
    // Read from localStorage
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    
    // Update cache
    tokenCache.accessToken = token;
    tokenCache.lastCheck = now;
    
    return token;
  }
  
  /**
   * Get refresh token
   * @returns {string|null} Refresh token or null if not found
   */
  getRefreshToken() {
    const now = Date.now();
    
    // Use cached token if available and cache is fresh
    if (tokenCache.refreshToken && (now - tokenCache.lastCheck < TOKEN_CACHE_TTL)) {
      return tokenCache.refreshToken;
    }
    
    // Read from localStorage
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    
    // Update cache
    tokenCache.refreshToken = refreshToken;
    tokenCache.lastCheck = now;
    
    return refreshToken;
  }
  
  /**
   * Get token expiry timestamp
   * @returns {number|null} Expiry timestamp or null if not found
   */
  getTokenExpiry() {
    const now = Date.now();
    
    // Use cached expiry if available and cache is fresh
    if (tokenCache.expiry && (now - tokenCache.lastCheck < TOKEN_CACHE_TTL)) {
      return tokenCache.expiry;
    }
    
    // Read from localStorage
    const expiry = localStorage.getItem(TOKEN_KEYS.EXPIRY);
    
    // Update cache
    tokenCache.expiry = expiry ? parseInt(expiry, 10) : null;
    tokenCache.lastCheck = now;
    
    return tokenCache.expiry;
  }
  
  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired or expiry not found
   */
  isTokenExpired() {
    const expiry = this.getTokenExpiry();
    
    if (!expiry) {
      return true;
    }
    
    // Add a 30-second buffer to account for network latency
    return Date.now() > (expiry - 30000);
  }
  
  /**
   * Clear all tokens
   */
  clearTokens() {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.EXPIRY);
    
    // Clear cache
    tokenCache = {
      accessToken: null,
      refreshToken: null,
      expiry: null,
      lastCheck: 0
    };
    
    logDebug('[TokenService] Tokens cleared');
  }
  
  /**
   * Refresh the authentication token
   * @returns {Promise<Object>} Refresh result
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return { success: false, message: 'No refresh token available' };
    }
    
    logDebug('[TokenService] Refreshing auth token');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/refresh`, { refreshToken });
      
      if (!response || !response.data || !response.data.token) {
        this.clearTokens();
        return { success: false, message: 'Invalid refresh response' };
      }
      
      const { token, expiresIn } = response.data;
      
      // Calculate new expiry time
      const expiryTime = expiresIn 
        ? Date.now() + (expiresIn * 1000) 
        : Date.now() + (24 * 60 * 60 * 1000); // Default to 24 hours
      
      // Update tokens
      this.setAccessToken(token, expiryTime);
      
      logInfo('[TokenService] Token refreshed successfully');
      
      return { success: true };
    } catch (error) {
      logError('[TokenService] Token refresh error:', error);
      
      // Clear tokens on refresh failure
      this.clearTokens();
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Token refresh failed' 
      };
    }
  }
}

// Create and export a singleton instance
export const tokenService = new TokenService();

export default TokenService;
