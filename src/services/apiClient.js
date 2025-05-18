/**
 * Enhanced API Client
 * 
 * Features:
 * - Centralized request handling
 * - Automatic authentication token management
 * - Request/response logging
 * - Error handling with retry capability
 * - Response caching
 * - Offline mode support
 * 
 * This module provides a unified interface for making API requests
 * with enhanced features like retry, caching, and error handling.
 */

import axios from 'axios';
import { patchGlobalAxios, patchAxiosInstance } from '@/services/axios-patch';
import * as config from '@/config';
import { logDebug, logError, logWarn } from '@/utils/logger';
import httpInterceptor from '@/services/httpInterceptor';
import CacheManager from '@/utils/CacheManager';
import ErrorHandler from '@/utils/ErrorHandler';

// Apply the patch to fix the TypeError: Cannot read properties of undefined (reading 'toUpperCase')
patchGlobalAxios(axios);

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
const getApiBaseUrl = () => {
  if (_apiBaseUrlCache) return _apiBaseUrlCache;
  
  // In development mode, ensure we're using the correct port for the API
  if (process.env.NODE_ENV === 'development') {
    // Log the current origin to help with debugging
    const currentOrigin = window.location.origin;
    logDebug(`[ApiClient] Current frontend origin: ${currentOrigin}`);
    
    // Use the configured API URL or default to localhost:5001
    _apiBaseUrlCache = config.API_BASE_URL || 'http://localhost:5001/api';
    logDebug(`[ApiClient] Using API base URL: ${_apiBaseUrlCache}`);
  } else {
    _apiBaseUrlCache = config.API_BASE_URL || 'http://localhost:5001/api';
  }
  
  return _apiBaseUrlCache;
};

/**
 * Default request configuration
 */
const DEFAULT_CONFIG = {
  timeout: 15000, // 15 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Default retry configuration
  retry: {
    retries: 1,
    retryDelay: 1000,
    retryCondition: (error) => ErrorHandler.isNetworkError(error) || ErrorHandler.isServerError(error)
  }
};

// Import the custom adapter
import customAdapter from '@/services/customAdapter';

// Create dedicated API client instance with custom adapter
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  adapter: customAdapter, // Use our custom adapter to fix the TypeError
  ...DEFAULT_CONFIG
});

// Apply the patch directly to this instance to ensure it's fixed
patchAxiosInstance(apiClient);

// Setup HTTP interceptors with enhanced configuration
httpInterceptor.setupInterceptors(apiClient, {
  includeAuth: true,
  trackLoading: true,
  handleErrors: true,
  logRequests: process.env.NODE_ENV !== 'production'
});

// Ensure the adapter is set even after interceptors are applied
apiClient.defaults.adapter = customAdapter;

/**
 * Get the current auth token with caching
 * @returns {string|null} Current auth token or null
 */
export const getAuthToken = () => {
  // Try from auth store first (most reliable source)
  if (authStoreRef) {
    const state = authStoreRef.getState();
    if (state?.token) {
      return state.token;
    }
  }
  
  // Try direct localStorage access next
  const directToken = localStorage.getItem('auth-token');
  if (directToken) {
    return directToken;
  }
  
  // Finally, try parsing from auth-storage (most expensive operation)
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.token || null;
    }
  } catch (error) {
    logWarn('[ApiClient] Error parsing auth storage:', error);
  }
  
  return null;
};

/**
 * Helper function to perform request with retry capability
 * 
 * @param {Function} requestFn - Function that performs the actual request
 * @param {Object} options - Request options
 * @param {string} context - Context for logging
 * @returns {Promise<Object>} Response data
 */
const performRequestWithRetry = async (requestFn, options = {}, context = 'API') => {
  const { retry = DEFAULT_CONFIG.retry, ...requestOptions } = options;
  const { retries = 1, retryDelay = 1000, retryCondition } = retry;
  
  let lastError = null;
  let attemptCount = 0;
  
  while (attemptCount <= retries) {
    try {
      // Ensure we have a valid method in the request options
      const safeOptions = { ...requestOptions };
      
      // Fix the TypeError by ensuring method is a string
      if (typeof requestOptions.method === 'undefined') {
        safeOptions.method = 'get';
      } else if (typeof requestOptions.method !== 'string') {
        safeOptions.method = String(requestOptions.method);
      }
      
      // Attempt the request with the safe options
      const response = await requestFn(safeOptions);
      return response.data;
    } catch (error) {
      lastError = error;
      attemptCount++;
      
      // Check if we should retry
      const shouldRetry = 
        attemptCount <= retries && 
        (typeof retryCondition === 'function' ? retryCondition(error) : false);
      
      if (shouldRetry) {
        logDebug(`[${context}] Request failed, retrying (${attemptCount}/${retries})...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        // No more retries or condition not met
        break;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
};

/**
 * API client utilities
 */
const apiUtils = {
  /**
   * Make a GET request with caching support
   * 
   * @param {string} url - API endpoint
   * @param {Object} [params={}] - Query parameters
   * @param {Object} [options={}] - Request options
   * @param {boolean} [options.useCache=false] - Whether to use cache
   * @param {number} [options.cacheTTL] - Cache TTL in ms
   * @param {Object} [options.retry] - Retry configuration
   * @returns {Promise<Object>} Response data
   */
  async get(url, params = {}, options = {}) {
    const { useCache = false, cacheTTL = DEFAULT_CONFIG.cacheTTL, ...requestOptions } = options;
    const cacheKey = useCache ? 
      `GET:${url}:${JSON.stringify(params)}` : null;
      
    // If caching is enabled, try to get from cache first
    if (useCache && cacheKey) {
      const cachedData = CacheManager.get(cacheKey);
      if (cachedData) {
        logDebug(`[ApiClient] Cache hit for ${url}`);
        return cachedData;
      }
    }
    
    try {
      // Create a direct axios config object with explicit method
      const axiosConfig = {
        url,
        method: 'get', // Explicitly set method as a string
        params,
        ...requestOptions
      };
      
      // Log the request for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API Request] GET ${url}`);
      }
      
      // Make API request with retry capability using direct config
      const data = await performRequestWithRetry(
        () => apiClient(axiosConfig), // Use the axios instance directly with full config
        { 
          ...requestOptions,
          method: 'get' // Ensure method is set here too
        },
        `ApiClient.get(${url})`
      );
      
      // Cache the response if needed
      if (useCache && cacheKey && data) {
        CacheManager.set(cacheKey, data, cacheTTL);
      }
      
      return data;
    } catch (error) {
      // Add context to the error
      error.context = `ApiClient.get(${url})`;
      throw error;
    }
  },

  /**
   * Make a POST request
   * 
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} [options={}] - Request options
   * @param {Object} [options.retry] - Retry configuration
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, options = {}) {
    try {
      // Create a direct axios config object with explicit method
      const axiosConfig = {
        url,
        method: 'post', // Explicitly set method as a string
        data,
        ...options
      };
      
      // Log the request for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API Request] POST ${url}`);
      }
      
      return await performRequestWithRetry(
        () => apiClient(axiosConfig), // Use the axios instance directly with full config
        { 
          ...options,
          method: 'post' // Ensure method is set here too
        },
        `ApiClient.post(${url})`
      );
    } catch (error) {
      // Add context to the error
      error.context = `ApiClient.post(${url})`;
      throw error;
    }
  },

  /**
   * Make a PUT request
   * 
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} [options={}] - Request options
   * @param {Object} [options.retry] - Retry configuration
   * @returns {Promise<Object>} Response data
   */
  async put(url, data, options = {}) {
    try {
      // Create a direct axios config object with explicit method
      const axiosConfig = {
        url,
        method: 'put', // Explicitly set method as a string
        data,
        ...options
      };
      
      // Log the request for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API Request] PUT ${url}`);
      }
      
      return await performRequestWithRetry(
        () => apiClient(axiosConfig), // Use the axios instance directly with full config
        { 
          ...options,
          method: 'put' // Ensure method is set here too
        },
        `ApiClient.put(${url})`
      );
    } catch (error) {
      // Add context to the error
      error.context = `ApiClient.put(${url})`;
      throw error;
    }
  },

  /**
   * Make a PATCH request
   * 
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} [options={}] - Request options
   * @param {Object} [options.retry] - Retry configuration
   * @returns {Promise<Object>} Response data
   */
  async patch(url, data, options = {}) {
    try {
      // Create a direct axios config object with explicit method
      const axiosConfig = {
        url,
        method: 'patch', // Explicitly set method as a string
        data,
        ...options
      };
      
      // Log the request for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API Request] PATCH ${url}`);
      }
      
      return await performRequestWithRetry(
        () => apiClient(axiosConfig), // Use the axios instance directly with full config
        { 
          ...options,
          method: 'patch' // Ensure method is set here too
        },
        `ApiClient.patch(${url})`
      );
    } catch (error) {
      // Add context to the error
      error.context = `ApiClient.patch(${url})`;
      throw error;
    }
  },

  /**
   * Make a DELETE request
   * 
   * @param {string} url - API endpoint
   * @param {Object} [options={}] - Request options
   * @param {Object} [options.retry] - Retry configuration
   * @returns {Promise<Object>} Response data
   */
  async delete(url, options = {}) {
    try {
      // Create a direct axios config object with explicit method
      const axiosConfig = {
        url,
        method: 'delete', // Explicitly set method as a string
        ...options
      };
      
      // Log the request for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API Request] DELETE ${url}`);
      }
      
      return await performRequestWithRetry(
        () => apiClient(axiosConfig), // Use the axios instance directly with full config
        { 
          ...options,
          method: 'delete' // Ensure method is set here too
        },
        `ApiClient.delete(${url})`
      );
    } catch (error) {
      // Add context to the error
      error.context = `ApiClient.delete(${url})`;
      throw error;
    }
  },

  /**
   * Clear API cache for a specific URL pattern
   * 
   * @param {string|RegExp} urlPattern - URL or pattern to match
   * @returns {number} Number of cleared cache entries
   */
  clearCache(urlPattern) {
    if (!urlPattern) {
      logWarn('[ApiClient] No URL pattern provided for cache clearing');
      return 0;
    }
    
    try {
      // Get all keys from cache more efficiently
      const allKeys = CacheManager.getAllKeys();
      
      // Early return if no keys
      if (!allKeys || allKeys.length === 0) {
        logDebug('[ApiClient] No cache entries to clear');
        return 0;
      }
      
      // Filter keys that match the pattern
      const matchingKeys = allKeys.filter(key => {
        if (typeof urlPattern === 'string') {
          return key.includes(urlPattern);
        } else if (urlPattern instanceof RegExp) {
          return urlPattern.test(key);
        }
        return false;
      });
      
      // Delete matching keys in batch if possible
      if (typeof CacheManager.batchDelete === 'function') {
        CacheManager.batchDelete(matchingKeys);
      } else {
        // Fallback to individual deletion
        matchingKeys.forEach(key => {
          CacheManager.delete(key);
        });
      }
      
      logDebug(`[ApiClient] Cleared ${matchingKeys.length} cache entries matching: ${urlPattern}`);
      return matchingKeys.length;
    } catch (error) {
      logError('[ApiClient] Error clearing cache:', error);
      return 0;
    }
  },
  
  /**
   * Clear all API cache
   * 
   * @returns {number} Number of cleared cache entries
   */
  clearAllCache() {
    try {
      const count = CacheManager.clear();
      logDebug(`[ApiClient] Cleared all ${count} cache entries`);
      return count;
    } catch (error) {
      logError('[ApiClient] Error clearing all cache:', error);
      return 0;
    }
  },
  
  /**
   * Check if the application is in offline mode
   * 
   * @returns {boolean} Whether the application is in offline mode
   */
  isOfflineMode() {
    // Check localStorage first (user preference)
    const offlineModePreference = localStorage.getItem('offline-mode');
    if (offlineModePreference === 'true') {
      return true;
    }
    
    // Check sessionStorage (temporary session setting)
    const offlineModeSession = sessionStorage.getItem('offline-mode');
    if (offlineModeSession === 'true') {
      return true;
    }
    
    // Check network status as fallback
    return typeof navigator !== 'undefined' && 
           typeof navigator.onLine === 'boolean' && 
           !navigator.onLine;
  },
  
  /**
   * Set offline mode
   * 
   * @param {boolean} enabled - Whether to enable offline mode
   * @param {boolean} [persistent=false] - Whether to persist the setting
   */
  setOfflineMode(enabled, persistent = false) {
    const storage = persistent ? localStorage : sessionStorage;
    
    if (enabled) {
      storage.setItem('offline-mode', 'true');
      logDebug('[ApiClient] Offline mode enabled' + (persistent ? ' (persistent)' : ''));
    } else {
      storage.removeItem('offline-mode');
      logDebug('[ApiClient] Offline mode disabled');
    }
  },
  
  /**
   * Get the global loading state for API requests
   * @returns {Object} Loading state
   */
  getLoadingState: httpInterceptor.getLoadingState,
  
  /**
   * Subscribe to loading state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToLoadingState: httpInterceptor.subscribeToLoadingState,
  
  /**
   * Check if a specific URL is currently loading
   * @param {string} url - URL to check
   * @returns {boolean} Whether the URL is loading
   */
  isUrlLoading: httpInterceptor.isUrlLoading,
  
  /**
   * React hook for API loading state
   * @returns {Object} Loading state object
   */
  useLoading: httpInterceptor.useHttpLoading,
  
  /**
   * Get raw axios instance for advanced usage
   * @returns {Object} Axios instance
   */
  getRawInstance() {
    return apiClient;
  }
};

// Add shorthand methods for common REST operations
export const get = apiUtils.get.bind(apiUtils);
export const post = apiUtils.post.bind(apiUtils);
export const put = apiUtils.put.bind(apiUtils);
export const patch = apiUtils.patch.bind(apiUtils);
export const del = apiUtils.delete.bind(apiUtils); // Use 'del' since 'delete' is a reserved word
export const clearCache = apiUtils.clearCache.bind(apiUtils);
export const clearAllCache = apiUtils.clearAllCache.bind(apiUtils);
export const useApiLoading = apiUtils.useLoading;

// Export offline mode utilities
export const isOfflineMode = apiUtils.isOfflineMode.bind(apiUtils);
export const setOfflineMode = apiUtils.setOfflineMode.bind(apiUtils);

// Export the entire API utils object for advanced usage
export default apiUtils;
