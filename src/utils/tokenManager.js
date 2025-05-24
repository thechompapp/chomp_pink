import { logDebug, logError } from './logger';

/**
 * Token Manager
 * 
 * Handles all token-related operations including:
 * - Storing and retrieving tokens from localStorage
 * - Token validation
 * - Token refresh
 * - Token cleanup
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/**
 * Save token data to storage
 * @param {string} token - JWT token
 * @param {string} [refreshToken] - Refresh token (optional)
 * @param {number} [expiresIn] - Expiration time in seconds (optional)
 */
export const saveTokens = (token, refreshToken, expiresIn) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      logDebug('[TokenManager] Auth token saved');
    }
    
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      logDebug('[TokenManager] Refresh token saved');
    }
    
    if (expiresIn) {
      // Convert expiresIn (seconds) to timestamp (milliseconds)
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      logDebug(`[TokenManager] Token expires at: ${new Date(expiryTime).toISOString()}`);
    }
  } catch (error) {
    logError('[TokenManager] Error saving tokens:', error);
    throw new Error('Failed to save authentication data');
  }
};

/**
 * Get the stored auth token
 * @returns {string|null} The auth token or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    logError('[TokenManager] Error getting token:', error);
    return null;
  }
};

/**
 * Get the stored refresh token
 * @returns {string|null} The refresh token or null if not found
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    logError('[TokenManager] Error getting refresh token:', error);
    return null;
  }
};

/**
 * Check if the current token is expired
 * @returns {boolean} True if token is expired or missing, false otherwise
 */
export const isTokenExpired = () => {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    const expiryDate = parseInt(expiryTime, 10);
    const now = Date.now();
    
    // Consider token expired if within 1 minute of expiry
    return now >= (expiryDate - 60000);
  } catch (error) {
    logError('[TokenManager] Error checking token expiry:', error);
    return true; // If we can't verify, assume expired
  }
};

/**
 * Check if user has a valid token
 * @returns {boolean} True if token exists and is not expired
 */
export const hasValidToken = () => {
  const token = getToken();
  return !!token && !isTokenExpired();
};

/**
 * Clear all authentication data from storage
 */
export const clearTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    logDebug('[TokenManager] All authentication data cleared');
  } catch (error) {
    logError('[TokenManager] Error clearing tokens:', error);
    throw new Error('Failed to clear authentication data');
  }
};

/**
 * Get the time remaining until token expiration in seconds
 * @returns {number} Seconds until token expires, or 0 if expired/missing
 */
export const getTimeToExpiry = () => {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return 0;
    
    const expiryDate = parseInt(expiryTime, 10);
    const now = Date.now();
    
    if (now >= expiryDate) return 0;
    return Math.floor((expiryDate - now) / 1000);
  } catch (error) {
    logError('[TokenManager] Error getting time to expiry:', error);
    return 0;
  }
};

/**
 * Set up automatic token refresh
 * @param {Function} refreshCallback - Function to call when token needs refreshing
 * @returns {Function} Function to clear the refresh interval
 */
export const setupTokenRefresh = (refreshCallback) => {
  if (typeof refreshCallback !== 'function') {
    throw new Error('Refresh callback must be a function');
  }
  
  // Check token status immediately
  if (hasValidToken()) {
    const timeToExpiry = getTimeToExpiry();
    
    // If token expires in less than 5 minutes, refresh it
    if (timeToExpiry < 300) {
      logDebug(`[TokenManager] Token expires soon (${timeToExpiry}s), refreshing...`);
      refreshCallback().catch(error => {
        logError('[TokenManager] Error during initial token refresh:', error);
      });
    } else {
      logDebug(`[TokenManager] Token valid for ${timeToExpiry} seconds`);
    }
    
    // Set up periodic check (every minute)
    const intervalId = setInterval(() => {
      if (hasValidToken()) {
        const remainingTime = getTimeToExpiry();
        
        // Refresh if token expires in less than 5 minutes
        if (remainingTime < 300) {
          logDebug(`[TokenManager] Token expires soon (${remainingTime}s), refreshing...`);
          refreshCallback().catch(error => {
            logError('[TokenManager] Error during scheduled token refresh:', error);
          });
        }
      }
    }, 60000); // Check every minute
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
  
  // Return noop if no valid token
  return () => {};
};

export default {
  saveTokens,
  getToken,
  getRefreshToken,
  isTokenExpired,
  hasValidToken,
  clearTokens,
  getTimeToExpiry,
  setupTokenRefresh
};
