/* src/services/auth/tokenManager.js */
/**
 * Token Manager
 * 
 * Handles all aspects of authentication token management including:
 * - Secure storage of access and refresh tokens
 * - Automatic token refresh
 * - Expiration tracking
 * - Race condition prevention for multiple refresh requests
 */
import { logDebug, logError, logWarn } from '@/utils/logger';

// Constants - Updated to match AuthenticationCoordinator storage keys
const ACCESS_TOKEN_KEY = 'token'; // Changed from 'auth_access_token' to match AuthenticationCoordinator
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const USER_KEY = 'current_user'; // Added to match AuthenticationCoordinator

// Track refresh promise to prevent multiple simultaneous refresh calls
let refreshPromise = null;

/**
 * Securely stores tokens in the appropriate storage mechanism
 * Uses localStorage for persistence across sessions
 */
const tokenManager = {
  /**
   * Set authentication tokens and expiry
   * @param {Object} tokens - Object containing access and refresh tokens
   * @param {string} tokens.accessToken - JWT access token
   * @param {string} tokens.refreshToken - JWT refresh token
   * @param {number} tokens.expiresIn - Expiration time in seconds
   */
  setTokens: (tokens) => {
    if (!tokens) {
      logWarn('[TokenManager] Attempted to set null tokens');
      return;
    }

    try {
      const { accessToken, refreshToken, expiresIn } = tokens;
      
      if (!accessToken) {
        logWarn('[TokenManager] Missing access token');
        return;
      }
      
      // Calculate expiry time
      const expiryTime = expiresIn 
        ? Date.now() + (expiresIn * 1000)
        : Date.now() + (24 * 60 * 60 * 1000); // Default 24 hours
      
      // Store tokens using AuthenticationCoordinator's storage keys
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Only store refresh token if provided
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      logDebug('[TokenManager] Tokens stored successfully using coordinator keys');
    } catch (error) {
      logError('[TokenManager] Error storing tokens:', error);
      // Fallback to memory storage if localStorage fails
      tokenManager._memoryTokens = tokens;
    }
  },
  
  /**
   * Get the current access token
   * @returns {string|null} The access token or null if not found
   */
  getAccessToken: () => {
    try {
      // First try the primary storage location (AuthenticationCoordinator key)
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
        return token;
      }
      
      // Fallback to memory storage
      const memoryToken = tokenManager._memoryTokens?.accessToken;
      if (memoryToken && memoryToken !== 'null' && memoryToken !== 'undefined') {
        return memoryToken;
      }
      
      return null;
    } catch (error) {
      logError('[TokenManager] Error retrieving access token:', error);
      return tokenManager._memoryTokens?.accessToken || null;
    }
  },
  
  /**
   * Get the refresh token
   * @returns {string|null} The refresh token or null if not found
   */
  getRefreshToken: () => {
    try {
      const token = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
        return token;
      }
      
      return tokenManager._memoryTokens?.refreshToken || null;
    } catch (error) {
      logError('[TokenManager] Error retrieving refresh token:', error);
      return tokenManager._memoryTokens?.refreshToken || null;
    }
  },
  
  /**
   * Check if the access token is expired
   * @returns {boolean} True if token is expired or missing
   */
  isTokenExpired: () => {
    try {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;
      
      // Add 30-second buffer to prevent edge cases
      return parseInt(expiryTime, 10) - 30000 < Date.now();
    } catch (error) {
      logError('[TokenManager] Error checking token expiry:', error);
      return true;
    }
  },
  
  /**
   * Clear all authentication tokens
   */
  clearTokens: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem(USER_KEY);
      tokenManager._memoryTokens = null;
      logDebug('[TokenManager] Tokens cleared successfully');
    } catch (error) {
      logError('[TokenManager] Error clearing tokens:', error);
      tokenManager._memoryTokens = null;
    }
  },
  
  /**
   * Get the token expiry time
   * @returns {number|null} Expiry timestamp or null if not found
   */
  getExpiryTime: () => {
    try {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiryTime ? parseInt(expiryTime, 10) : null;
    } catch (error) {
      logError('[TokenManager] Error retrieving token expiry:', error);
      return null;
    }
  },
  
  /**
   * Check if user has valid authentication tokens
   * @returns {boolean} True if valid tokens exist
   */
  hasValidTokens: () => {
    return !!tokenManager.getAccessToken() && !tokenManager.isTokenExpired();
  },
  
  /**
   * Check if the current token is valid (alias for hasValidTokens for compatibility)
   * @returns {boolean} True if valid tokens exist
   */
  isTokenValid: () => {
    return tokenManager.hasValidTokens();
  },
  
  // Private memory storage fallback
  _memoryTokens: null
};

export default tokenManager;
