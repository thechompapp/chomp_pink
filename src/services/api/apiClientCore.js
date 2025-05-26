/**
 * API Client Core
 *
 * Core functionality for the API client, including:
 * - Axios instance creation and configuration
 * - Base URL management
 * - Default configuration
 */

import axios from 'axios';
import { patchAxiosInstance } from '@/services/axios-fix';
import * as config from '@/config';
import { logDebug } from '@/utils/logger';
import customAdapter from '@/services/customAdapter';
import { applyInterceptors } from './apiInterceptors';
import { setupAuthInterceptors } from '@/services/authService';

// Store reference to auth store to avoid circular dependency
let authStoreRef = null;

/**
 * Set auth store reference for token management
 * This needs to be at the top to avoid circular dependencies
 * @param {Object} authStore - Zustand auth store
 */
export const setAuthStoreRef = (authStore) => {
  authStoreRef = authStore;
  // We can't use logDebug here since it would create another circular dependency
  console.debug('[ApiClient] Auth store reference set');
};

// Cache for API base URL to avoid repeated function calls
let _apiBaseUrlCache = null;

/**
 * Get the API base URL with caching
 * @returns {string} API base URL
 */
export const getApiBaseUrl = () => {
  if (_apiBaseUrlCache) return _apiBaseUrlCache;

  // In development mode, use relative URL to leverage Vite proxy
  if (process.env.NODE_ENV === 'development') {
    _apiBaseUrlCache = '/api'; // Vite proxy should be configured to handle this
    logDebug(`[ApiClient] Using relative API URL to leverage Vite proxy: ${_apiBaseUrlCache}`);
  } else {
    // In production, use the configured API URL
    _apiBaseUrlCache = config.API_BASE_URL || 'http://localhost:5001/api';
    logDebug(`[ApiClient] Using absolute API URL: ${_apiBaseUrlCache}`);
  }

  return _apiBaseUrlCache;
};

/**
 * Default request configuration
 */
export const DEFAULT_CONFIG = {
  timeout: 15000, // 15 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Default retry configuration
  retry: {
    retries: 1, // Number of retries after the initial attempt fails
    retryDelay: 1000, // Initial delay in ms
    retryCondition: (error) => {
      // Import dynamically to avoid circular dependency
      const ErrorHandler = require('@/utils/ErrorHandler').default;
      return ErrorHandler.isNetworkError(error) || ErrorHandler.isServerError(error);
    }
  },
  cacheTTL: 5 * 60 * 1000 // Default cache TTL: 5 minutes
};

// Create dedicated API client instance with custom adapter
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  adapter: customAdapter, // Use our custom adapter
  // Directly set headers and timeout from DEFAULT_CONFIG, exclude custom keys like 'retry'
  headers: DEFAULT_CONFIG.headers,
  timeout: DEFAULT_CONFIG.timeout,
  withCredentials: true,
  // Add a default method to prevent 'toUpperCase' errors
  method: 'get',
  validateStatus: function (status) {
    // Consider status codes less than 500 as success
    return status < 500;
  }
});

// Apply patches and interceptors
patchAxiosInstance(apiClient);
setupAuthInterceptors(apiClient);

// Apply our new interceptors
applyInterceptors(apiClient, {
  includeAuth: true,
  trackLoading: true,
  handleErrors: true,
  logRequests: process.env.NODE_ENV !== 'production'
});

export default apiClient;
