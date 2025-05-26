/**
 * Token Utilities
 * 
 * Utility functions for token management and validation.
 */
import jwtDecode from 'jwt-decode';
import { logDebug, logError } from '@/utils/logger';

/**
 * Token storage keys
 * @type {Object}
 */
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRY: 'auth_token_expiry',
  USER: 'auth_user'
};

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const parseToken = (token) => {
  if (!token) return null;
  
  try {
    return jwtDecode(token);
  } catch (error) {
    logError('[tokenUtils] Error parsing token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  const decoded = parseToken(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // JWT exp is in seconds, Date.now() is in milliseconds
  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expiryTime;
};

/**
 * Get token expiry time in milliseconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiry time in milliseconds or null if invalid
 */
export const getTokenExpiry = (token) => {
  const decoded = parseToken(token);
  
  if (!decoded || !decoded.exp) {
    return null;
  }
  
  // JWT exp is in seconds, convert to milliseconds
  return decoded.exp * 1000;
};

/**
 * Get time until token expiry in seconds
 * @param {string} token - JWT token
 * @returns {number} Seconds until expiry (negative if expired)
 */
export const getSecondsUntilExpiry = (token) => {
  const expiry = getTokenExpiry(token);
  
  if (!expiry) {
    return -1;
  }
  
  return Math.floor((expiry - Date.now()) / 1000);
};

/**
 * Extract user ID from token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if not found
 */
export const getUserIdFromToken = (token) => {
  const decoded = parseToken(token);
  
  if (!decoded) {
    return null;
  }
  
  // Check common ID fields in JWT payloads
  return decoded.sub || decoded.user_id || decoded.id || null;
};

/**
 * Extract user roles from token
 * @param {string} token - JWT token
 * @returns {string[]|null} User roles or null if not found
 */
export const getRolesFromToken = (token) => {
  const decoded = parseToken(token);
  
  if (!decoded) {
    return null;
  }
  
  // Check common role fields in JWT payloads
  if (decoded.roles && Array.isArray(decoded.roles)) {
    return decoded.roles;
  }
  
  if (decoded.role) {
    return Array.isArray(decoded.role) ? decoded.role : [decoded.role];
  }
  
  return null;
};

/**
 * Check if token has a specific role
 * @param {string} token - JWT token
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean} True if token has the required role
 */
export const hasRole = (token, requiredRoles) => {
  const roles = getRolesFromToken(token);
  
  if (!roles) {
    return false;
  }
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.some(role => roles.includes(role));
  }
  
  return roles.includes(requiredRoles);
};

/**
 * Store token in localStorage
 * @param {string} token - Access token
 * @param {string} refreshToken - Refresh token
 * @param {Object} user - User data
 */
export const storeTokens = (token, refreshToken, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    
    // Store expiry time
    const expiry = getTokenExpiry(token);
    if (expiry) {
      localStorage.setItem(TOKEN_KEYS.EXPIRY, expiry.toString());
    }
  }
  
  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  }
  
  if (user) {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  }
  
  logDebug('[tokenUtils] Tokens stored successfully');
};

/**
 * Clear tokens from localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.EXPIRY);
  localStorage.removeItem(TOKEN_KEYS.USER);
  
  logDebug('[tokenUtils] Tokens cleared successfully');
};

/**
 * Get stored tokens and user data
 * @returns {Object} Stored tokens and user data
 */
export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN),
    expiry: localStorage.getItem(TOKEN_KEYS.EXPIRY),
    user: JSON.parse(localStorage.getItem(TOKEN_KEYS.USER) || 'null')
  };
};

export default {
  parseToken,
  isTokenExpired,
  getTokenExpiry,
  getSecondsUntilExpiry,
  getUserIdFromToken,
  getRolesFromToken,
  hasRole,
  storeTokens,
  clearTokens,
  getStoredTokens,
  TOKEN_KEYS
};
