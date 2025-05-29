/**
 * API Client Factory
 * 
 * Creates and configures axios instances with interceptors
 */

import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { HTTP_CONFIG } from './httpConfig';
import { addAuthHeaders } from './authHeaders';
import { startLoading, stopLoading } from './loadingState';
import { setupRetryInterceptor } from './errorHandler';
import { setupMockInterceptor } from './mockApiService';
import { initializeOfflineMode, canMakeNetworkRequests } from './offlineMode';
import { logDebug, logInfo } from '@/utils/logger';

/**
 * Create an API client with all interceptors configured
 * @param {Object} options - Configuration options
 * @returns {Object} Configured axios instance
 */
export function createApiClient(options = {}) {
  const {
    baseURL = API_BASE_URL,
    timeout = HTTP_CONFIG.TIMEOUTS.DEFAULT,
    withCredentials = false,
    enableAuth = true,
    enableLoading = true,
    enableRetry = true,
    enableMock = true,
    maxRetries = HTTP_CONFIG.RETRY.MAX_ATTEMPTS,
    ...customConfig
  } = options;

  logInfo('[ApiClientFactory] Creating new API client with options:', options);

  // Create axios instance
  const instance = axios.create({
    baseURL,
    timeout,
    withCredentials,
    headers: HTTP_CONFIG.DEFAULT_HEADERS,
    ...customConfig
  });

  // Initialize offline mode detection
  initializeOfflineMode();

  // Setup request interceptor
  instance.interceptors.request.use(
    (config) => {
      logDebug(`[ApiClientFactory] Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Check if we can make network requests
      if (!canMakeNetworkRequests()) {
        logDebug('[ApiClientFactory] Rejecting request - offline mode');
        return Promise.reject(new Error('Application is in offline mode'));
      }

      // Add authentication headers if enabled
      if (enableAuth) {
        addAuthHeaders(config);
      }

      // Start loading tracking if enabled
      if (enableLoading) {
        startLoading(config);
      }

      return config;
    },
    (error) => {
      logDebug('[ApiClientFactory] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Setup response interceptor
  instance.interceptors.response.use(
    (response) => {
      logDebug(`[ApiClientFactory] Response: ${response.status} ${response.config?.url}`);
      
      // Stop loading tracking if enabled
      if (enableLoading) {
        stopLoading(response.config);
      }

      return response;
    },
    (error) => {
      logDebug('[ApiClientFactory] Response interceptor error:', error);
      
      // Stop loading tracking if enabled
      if (enableLoading) {
        stopLoading(error.config);
      }

      return Promise.reject(error);
    }
  );

  // Setup retry interceptor if enabled
  if (enableRetry) {
    setupRetryInterceptor(instance, { maxRetries });
  }

  // Setup mock interceptor if enabled and in development
  if (enableMock) {
    setupMockInterceptor(instance);
  }

  logInfo('[ApiClientFactory] API client created successfully');
  return instance;
}

/**
 * Create a specialized API client for specific use cases
 */
export const createSpecializedClients = {
  /**
   * Create client for file uploads
   */
  upload: (options = {}) => createApiClient({
    timeout: HTTP_CONFIG.TIMEOUTS.UPLOAD,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  }),

  /**
   * Create client for file downloads
   */
  download: (options = {}) => createApiClient({
    timeout: HTTP_CONFIG.TIMEOUTS.DOWNLOAD,
    responseType: 'blob',
    ...options
  }),

  /**
   * Create client without authentication
   */
  public: (options = {}) => createApiClient({
    enableAuth: false,
    ...options
  }),

  /**
   * Create client without loading indicators
   */
  silent: (options = {}) => createApiClient({
    enableLoading: false,
    ...options
  }),

  /**
   * Create client for admin operations
   */
  admin: (options = {}) => createApiClient({
    timeout: HTTP_CONFIG.TIMEOUTS.DEFAULT * 2, // Longer timeout for admin operations
    enableRetry: true,
    maxRetries: 1, // Fewer retries for admin operations
    ...options
  })
};

/**
 * Default API client instance
 */
let defaultClient = null;

/**
 * Get or create the default API client
 * @returns {Object} Default axios instance
 */
export function getDefaultApiClient() {
  if (!defaultClient) {
    defaultClient = createApiClient();
  }
  return defaultClient;
}

/**
 * Reset the default API client (useful for testing)
 */
export function resetDefaultApiClient() {
  defaultClient = null;
}

/**
 * Configure global defaults for axios
 */
export function setupGlobalDefaults() {
  // Set global defaults
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.timeout = HTTP_CONFIG.TIMEOUTS.DEFAULT;
  axios.defaults.headers.common = HTTP_CONFIG.DEFAULT_HEADERS;

  logInfo('[ApiClientFactory] Global axios defaults configured');
}
