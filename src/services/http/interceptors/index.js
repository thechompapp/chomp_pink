/**
 * HTTP Interceptors Index
 * 
 * Central export for all HTTP interceptor modules.
 * Provides both individual interceptor access and convenience functions
 * for setting up multiple interceptors together.
 */

import { setupAuthInterceptor, addAuthHeaders, handleAuthError, isAuthenticated, clearAuthTokenCache } from './AuthInterceptor.js';
import { setupLoadingInterceptor, getLoadingState, subscribeToLoadingState, isUrlLoading, useHttpLoading, clearLoadingState } from './LoadingInterceptor.js';
import { setupOfflineInterceptor, checkOfflineMode, setOfflineMode, isOfflineMode, getOfflineStatus, isDevelopmentModeNoBackend, setDevelopmentModeNoBackend } from './OfflineInterceptor.js';
import { setupErrorHandlerInterceptor, handleResponseError } from './ErrorHandlerInterceptor.js';
import { setupLoggingInterceptor, getRequestSummary, getResponseSummary, getErrorSummary } from './LoggingInterceptor.js';
import { setupRetryInterceptor, getRetryStats, createRetryConfig, isRetryableStatusCode, isRetryableError } from './RetryInterceptor.js';

// Re-export individual interceptor setup functions
export {
  setupAuthInterceptor,
  setupLoadingInterceptor,
  setupOfflineInterceptor,
  setupErrorHandlerInterceptor,
  setupLoggingInterceptor,
  setupRetryInterceptor
};

// Re-export utility functions
export {
  // Auth utilities
  addAuthHeaders,
  handleAuthError,
  isAuthenticated,
  clearAuthTokenCache,
  
  // Loading state utilities
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading,
  clearLoadingState,
  
  // Offline mode utilities
  checkOfflineMode,
  setOfflineMode,
  isOfflineMode,
  getOfflineStatus,
  isDevelopmentModeNoBackend,
  setDevelopmentModeNoBackend,
  
  // Error handling utilities
  handleResponseError,
  
  // Logging utilities
  getRequestSummary,
  getResponseSummary,
  getErrorSummary,
  
  // Retry utilities
  getRetryStats,
  createRetryConfig,
  isRetryableStatusCode,
  isRetryableError
};

/**
 * Setup all interceptors with default configuration
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options for all interceptors
 */
export function setupAllInterceptors(axiosInstance, options = {}) {
  const {
    auth = { enabled: true },
    loading = { enabled: true },
    offline = { enabled: true },
    errorHandler = { enabled: true },
    logging = { enabled: process.env.NODE_ENV === 'development' },
    retry = { enabled: true, maxRetries: 3, retryDelay: 1000 }
  } = options;

  // Setup interceptors in order of priority
  // 1. Auth interceptor (adds headers to requests)
  if (auth.enabled) {
    setupAuthInterceptor(axiosInstance, auth);
  }

  // 2. Loading interceptor (tracks request state)
  if (loading.enabled) {
    setupLoadingInterceptor(axiosInstance, loading);
  }

  // 3. Logging interceptor (logs requests/responses)
  if (logging.enabled) {
    setupLoggingInterceptor(axiosInstance, logging);
  }

  // 4. Retry interceptor (handles retries on failure)
  if (retry.enabled) {
    setupRetryInterceptor(axiosInstance, retry);
  }

  // 5. Offline interceptor (handles network detection)
  if (offline.enabled) {
    setupOfflineInterceptor(axiosInstance, offline);
  }

  // 6. Error handler interceptor (handles error processing and user notifications)
  if (errorHandler.enabled) {
    setupErrorHandlerInterceptor(axiosInstance, errorHandler);
  }
}

/**
 * Setup interceptors with enhanced configuration
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Enhanced configuration options
 */
export function setupEnhancedInterceptors(axiosInstance, options = {}) {
  const {
    includeAuth = true,
    trackLoading = true,
    handleErrors = true,
    enableLogging = process.env.NODE_ENV === 'development',
    enableRetry = true,
    enableOfflineDetection = true,
    retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    }
  } = options;

  setupAllInterceptors(axiosInstance, {
    auth: { enabled: includeAuth },
    loading: { enabled: trackLoading },
    offline: { enabled: enableOfflineDetection },
    errorHandler: { enabled: handleErrors },
    logging: { enabled: enableLogging },
    retry: { enabled: enableRetry, ...retryConfig }
  });
}

/**
 * Get interceptor status information
 * @returns {Object} - Status of all interceptors
 */
export function getInterceptorStatus() {
  return {
    auth: {
      available: true,
      authenticated: isAuthenticated()
    },
    loading: {
      available: true,
      state: getLoadingState()
    },
    offline: {
      available: true,
      status: getOfflineStatus()
    },
    errorHandler: {
      available: true
    },
    logging: {
      available: true
    },
    retry: {
      available: true
    }
  };
} 