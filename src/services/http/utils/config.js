/**
 * HTTP Interceptor Configuration
 * Centralized configuration for all HTTP interceptors
 */

export const CONFIG = {
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
  }
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export const TOKEN_CACHE_TTL = 5000; // 5 seconds cache
