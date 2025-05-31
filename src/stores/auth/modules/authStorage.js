/**
 * Authentication Storage Manager
 * 
 * Handles all authentication-related storage operations including:
 * - LocalStorage and sessionStorage management
 * - Token persistence and retrieval
 * - Storage cleanup and clearing
 * - Cookie management
 */

import { logInfo, logWarn, logError } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { AUTH_CONFIG } from './authConfig';

/**
 * Clear all offline mode flags from storage
 */
export function clearOfflineFlags() {
  if (typeof localStorage !== 'undefined') {
    AUTH_CONFIG.OFFLINE_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.setItem(AUTH_CONFIG.FORCE_ONLINE_KEY, 'true');
  }
  
  if (typeof sessionStorage !== 'undefined') {
    AUTH_CONFIG.OFFLINE_STORAGE_KEYS.forEach(key => {
      sessionStorage.removeItem(key);
    });
  }
  
  logInfo('[AuthStorage] Cleared all offline mode flags');
}

/**
 * Get authentication data from localStorage
 * @returns {Object|null} Parsed auth data or null
 */
export function getStoredAuthData() {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const storedData = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    ErrorHandler.handle(error, 'AuthStorage.getStoredAuthData', {
      showToast: false,
      logLevel: 'warn'
    });
    return null;
  }
}

/**
 * Store authentication data in localStorage
 * @param {Object} authData - Auth data to store
 */
export function setStoredAuthData(authData) {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(authData));
    logInfo('[AuthStorage] Auth data stored successfully');
  } catch (error) {
    ErrorHandler.handle(error, 'AuthStorage.setStoredAuthData', {
      showToast: false,
      logLevel: 'error'
    });
  }
}

/**
 * Update token in stored auth data
 * @param {string|null} token - Token to store
 */
export function updateStoredToken(token) {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const existingData = getStoredAuthData() || { state: {} };
    existingData.state.token = token;
    setStoredAuthData(existingData);
    
    // Also store token separately for compatibility
    if (token) {
      localStorage.setItem(AUTH_CONFIG.AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_CONFIG.AUTH_TOKEN_KEY);
    }
    
    logInfo('[AuthStorage] Token updated in storage');
  } catch (error) {
    ErrorHandler.handle(error, 'AuthStorage.updateStoredToken', {
      showToast: false,
      logLevel: 'error'
    });
  }
}

/**
 * Set development mode flags
 */
export function setDevModeFlags() {
  if (typeof localStorage === 'undefined') return;
  
  // Don't clear explicit logout flag - respect user's logout intention
  // Only clear it if this is NOT an explicit logout scenario
  const hasExplicitlyLoggedOut = localStorage.getItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY) === 'true';
  const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
  
  if (!hasExplicitlyLoggedOut && !isE2ETesting) {
    localStorage.removeItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY);
  }
  
  localStorage.setItem(AUTH_CONFIG.BYPASS_AUTH_KEY, 'true');
  logInfo('[AuthStorage] Development mode flags set');
}

/**
 * Clear development mode flags
 */
export function clearDevModeFlags() {
  if (typeof localStorage === 'undefined') return;
  
  localStorage.removeItem(AUTH_CONFIG.BYPASS_AUTH_KEY);
  logInfo('[AuthStorage] Development mode flags cleared');
}

/**
 * Check if auth bypass is enabled
 * @returns {boolean} Whether auth bypass is enabled
 */
export function isAuthBypassEnabled() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(AUTH_CONFIG.BYPASS_AUTH_KEY) === 'true';
}

/**
 * Set explicit logout flag
 */
export function setExplicitLogoutFlag() {
  if (typeof localStorage === 'undefined') return;
  
  localStorage.setItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY, 'true');
  logInfo('[AuthStorage] Explicit logout flag set');
}

/**
 * Clear explicit logout flag
 */
export function clearExplicitLogoutFlag() {
  if (typeof localStorage === 'undefined') return;
  
  localStorage.removeItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY);
  logInfo('[AuthStorage] Explicit logout flag cleared');
}

/**
 * Clear all authentication-related cookies
 */
export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  
  try {
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      const isAuthCookie = AUTH_CONFIG.AUTH_COOKIE_PREFIXES.some(prefix => 
        cookieName.includes(prefix)
      );
      
      if (isAuthCookie) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        logInfo(`[AuthStorage] Cleared auth cookie: ${cookieName}`);
      }
    });
  } catch (error) {
    ErrorHandler.handle(error, 'AuthStorage.clearAuthCookies', {
      showToast: false,
      logLevel: 'warn'
    });
  }
}

/**
 * Clear all authentication storage (localStorage, sessionStorage, cookies)
 */
export function clearAllAuthStorage() {
  try {
    // Set explicit logout flag first
    setExplicitLogoutFlag();
    
    // Clear all localStorage and sessionStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    
    // Restore explicit logout flag after clearing
    setExplicitLogoutFlag();
    
    // Clear auth cookies
    clearAuthCookies();
    
    logInfo('[AuthStorage] All auth storage cleared');
  } catch (error) {
    ErrorHandler.handle(error, 'AuthStorage.clearAllAuthStorage', {
      showToast: false,
      logLevel: 'warn'
    });
  }
}

/**
 * Restore session from stored data if available
 * @returns {Object|null} Restored session data or null
 */
export function restoreSessionFromStorage() {
  // Check if user has explicitly logged out - if so, don't restore session
  const hasExplicitlyLoggedOut = localStorage.getItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY) === 'true';
  const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
  const isLogoutInProgress = localStorage.getItem('logout_in_progress') === 'true';
  
  if (hasExplicitlyLoggedOut || isE2ETesting || isLogoutInProgress) {
    logInfo('[AuthStorage] Not restoring session - user explicitly logged out or testing mode');
    return null;
  }
  
  const storedData = getStoredAuthData();
  
  if (storedData?.state?.token) {
    logInfo('[AuthStorage] Found token in localStorage, attempting session restore');
    
    const restoredSession = {
      token: storedData.state.token,
      user: storedData.state.user,
      isAuthenticated: true,
      lastAuthCheck: Date.now() - 70000, // Force auth check
      error: null
    };
    
    logInfo('[AuthStorage] Session restored from localStorage');
    return restoredSession;
  }
  
  return null;
}

/**
 * Get storage statistics for debugging
 * @returns {Object} Storage statistics
 */
export function getStorageStats() {
  const stats = {
    localStorage: {
      available: typeof localStorage !== 'undefined',
      authData: !!getStoredAuthData(),
      explicitLogout: typeof localStorage !== 'undefined' && 
                     localStorage.getItem(AUTH_CONFIG.EXPLICIT_LOGOUT_KEY) === 'true',
      authBypass: isAuthBypassEnabled()
    },
    sessionStorage: {
      available: typeof sessionStorage !== 'undefined'
    },
    cookies: {
      available: typeof document !== 'undefined'
    }
  };
  
  return stats;
} 