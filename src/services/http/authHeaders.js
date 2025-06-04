/**
 * Authentication Headers Manager
 * 
 * Handles authentication header management for HTTP requests including:
 * - Token retrieval and caching
 * - Header injection
 * - Token validation
 */

import { logDebug, logWarn } from '@/utils/logger';
import { HTTP_CONFIG } from './httpConfig';

// Cache for authentication token to reduce localStorage reads
const tokenCache = {
  value: null,
  timestamp: 0
};

/**
 * Get the authentication token from cache or storage
 * @param {boolean} forceRefresh - Force refresh from storage
 * @returns {string|null} Authentication token
 */
export function getAuthToken(forceRefresh = false) {
  const now = Date.now();
  
  // Check if we have a valid cached token
  if (!forceRefresh && 
      tokenCache.value && 
      (now - tokenCache.timestamp) < HTTP_CONFIG.TOKEN_CACHE_TTL) {
    return tokenCache.value;
  }
  
  // Get token from storage with fallback locations
  let token = null;
  
  try {
    // 1. PRIMARY: Check the main 'token' storage
    token = localStorage.getItem('token');
    
    // Validate token is not a null string or empty
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      // Update cache
      tokenCache.value = token;
      tokenCache.timestamp = now;
      logDebug('[AuthHeaders] Token retrieved from primary storage and cached');
      return token;
    }
    
    // 2. FALLBACK: Try auth-authentication-storage (Zustand store)
    const authStorage = localStorage.getItem('auth-authentication-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        token = authData?.state?.token;
        if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
          // Update cache and store in primary location for consistency
          tokenCache.value = token;
          tokenCache.timestamp = now;
          localStorage.setItem('token', token); // Sync to primary location
          logDebug('[AuthHeaders] Token retrieved from Zustand store and synced to primary');
          return token;
        }
      } catch (parseError) {
        logWarn('[AuthHeaders] Error parsing auth storage data:', parseError);
      }
    }
    
    // 3. LEGACY FALLBACK: Try legacy auth-token location
    token = localStorage.getItem('auth-token');
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      // Update cache and store in primary location for consistency
      tokenCache.value = token;
      tokenCache.timestamp = now;
      localStorage.setItem('token', token); // Sync to primary location
      logDebug('[AuthHeaders] Token retrieved from legacy storage and synced to primary');
      return token;
    }
    
    // No valid token found anywhere
    logDebug('[AuthHeaders] No valid token found in any storage location');
    token = null;
    
  } catch (error) {
    logWarn('[AuthHeaders] Error retrieving token:', error);
    token = null;
  }
  
  // Update cache even if token is null
  tokenCache.value = token;
  tokenCache.timestamp = now;
  
  return token;
}

/**
 * Validate if a token appears to be valid
 * @param {string} token - Token to validate
 * @returns {boolean} Whether token appears valid
 */
export function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic validation - token should not be empty and should be reasonable length
  const trimmedToken = token.trim();
  if (trimmedToken.length < 10) {
    return false;
  }
  
  // Additional validation can be added here (JWT format, expiration, etc.)
  return true;
}

/**
 * Add authentication headers to request config
 * @param {Object} config - Axios request config
 * @returns {Object} Modified config with auth headers
 */
export function addAuthHeaders(config) {
  if (!config) {
    logWarn('[AuthHeaders] No config provided');
    return config;
  }
  
  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {};
  }
  
  // Get authentication token
  const token = getAuthToken();
  
  if (token && validateToken(token)) {
    // Add Authorization header
    config.headers.Authorization = `Bearer ${token}`;
    logDebug('[AuthHeaders] Added Authorization header to request');
  } else {
    logDebug('[AuthHeaders] No valid token available for request');
  }
  
  // Add development mode bypass headers
  if (import.meta.env.DEV) {
    config.headers['X-Bypass-Auth'] = 'true';
    logDebug('[AuthHeaders] Added X-Bypass-Auth header for development mode');
  }
  
  // Add default headers
  Object.assign(config.headers, HTTP_CONFIG.DEFAULT_HEADERS);
  
  return config;
}

/**
 * Remove authentication headers from config
 * @param {Object} config - Axios request config
 * @returns {Object} Modified config without auth headers
 */
export function removeAuthHeaders(config) {
  if (!config?.headers) {
    return config;
  }
  
  delete config.headers.Authorization;
  logDebug('[AuthHeaders] Removed Authorization header from request');
  
  return config;
}

/**
 * Check if request requires authentication
 * @param {Object} config - Axios request config
 * @returns {boolean} Whether request requires auth
 */
export function requiresAuth(config) {
  // Skip auth for certain endpoints
  const skipAuthPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/health',
    '/public/'
  ];
  
  const url = config?.url || '';
  return !skipAuthPaths.some(path => url.includes(path));
}

/**
 * Clear token cache (useful when user logs out)
 */
export function clearTokenCache() {
  tokenCache.value = null;
  tokenCache.timestamp = 0;
  logDebug('[AuthHeaders] Token cache cleared');
}

/**
 * Set token in cache and storage
 * @param {string} token - Token to set
 */
export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(HTTP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
      tokenCache.value = token;
      tokenCache.timestamp = Date.now();
      logDebug('[AuthHeaders] Token set and cached');
    } else {
      localStorage.removeItem(HTTP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      clearTokenCache();
      logDebug('[AuthHeaders] Token removed from storage and cache');
    }
  } catch (error) {
    logWarn('[AuthHeaders] Error setting token:', error);
  }
}

/**
 * Get token cache statistics
 * @returns {Object} Cache statistics
 */
export function getTokenCacheStats() {
  return {
    hasToken: !!tokenCache.value,
    cacheAge: Date.now() - tokenCache.timestamp,
    isExpired: (Date.now() - tokenCache.timestamp) > HTTP_CONFIG.TOKEN_CACHE_TTL
  };
} 