/**
 * HTTP Configuration Constants
 * 
 * Centralized configuration for HTTP services including:
 * - Cache TTLs
 * - Default headers
 * - Storage keys
 * - Error messages
 * - Timeouts and limits
 */

// Constants for configuration
export const HTTP_CONFIG = {
  // Cache TTLs
  OFFLINE_MODE_CACHE_TTL: 2000, // 2 seconds TTL for offline mode cache
  TOKEN_CACHE_TTL: 5000,        // 5 seconds TTL for auth token cache
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Storage keys
  STORAGE_KEYS: {
    OFFLINE_MODE: 'offline-mode',
    DEV_MODE_NO_BACKEND: 'dev-mode-no-backend',
    AUTH_TOKEN: 'auth-token',
    AUTH_STORAGE: 'auth-storage'
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    AUTH_ERROR: 'Authentication error. Please log in again.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    OFFLINE_MODE: 'You are currently in offline mode.'
  },

  // Request timeouts
  TIMEOUTS: {
    DEFAULT: 10000,      // 10 seconds default timeout
    UPLOAD: 30000,       // 30 seconds for uploads
    DOWNLOAD: 60000      // 60 seconds for downloads
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,    // 1 second base delay
    MAX_DELAY: 5000      // 5 seconds max delay
  },

  // Request limits
  LIMITS: {
    MAX_CONCURRENT_REQUESTS: 6,
    MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_RESPONSE_SIZE: 50 * 1024 * 1024  // 50MB
  }
};

// Legacy export for backward compatibility
export const CONFIG = HTTP_CONFIG;

export default HTTP_CONFIG; 