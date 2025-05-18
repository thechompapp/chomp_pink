/**
 * Enhanced API Client
 * 
 * Features:
 * - Centralized request handling
 * - Built-in caching
 * - Consistent error handling
 * - Automatic auth token management
 * - Request/response logging
 */
import axios from 'axios';
import * as config from '@/config';
import { logDebug } from '@/utils/logger';
import httpInterceptor from '@/services/httpInterceptor';
import CacheManager from '@/utils/CacheManager';
import ErrorHandler from '@/utils/ErrorHandler';

// Create dedicated API client instance
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000, // 15 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Store reference to auth store to avoid circular dependency
let authStoreRef = null;

// Setup HTTP interceptors
httpInterceptor.setupInterceptors(apiClient, {
  includeAuth: true,
  trackLoading: true,
  handleErrors: true
});

/**
 * Set auth store reference for token management
 * @param {Object} authStore - Zustand auth store
 */
export const setAuthStoreRef = (authStore) => {
  authStoreRef = authStore;
  logDebug('[ApiClient] Auth store reference set');
};

/**
 * Get the current auth token
 * @returns {string|null} Current auth token or null
 */
export const getAuthToken = () => {
  // Try from auth store first
  if (authStoreRef) {
    const state = authStoreRef.getState();
    if (state.token) {
      return state.token;
    }
  }
  
  // Fallback to localStorage
  return localStorage.getItem('auth-token') || 
         (localStorage.getItem('auth-storage') ? 
           JSON.parse(localStorage.getItem('auth-storage'))?.state?.token : 
           null);
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
   * @returns {Promise<Object>} Response data
   */
  async get(url, params = {}, options = {}) {
    const { useCache = false, cacheTTL, ...requestOptions } = options;
    
    // Generate a unique cache key including query params
    const cacheKey = useCache ? 
      `GET:${url}:${JSON.stringify(params)}` : null;
      
    // If caching is enabled, try to get from cache first
    if (useCache) {
      const cachedData = CacheManager.get(cacheKey);
      if (cachedData) {
        logDebug(`[ApiClient] Cache hit for ${url}`);
        return cachedData;
      }
    }
    
    try {
      // Make API request
      const response = await apiClient.get(url, { 
        params,
        ...requestOptions
      });
      
      // Cache the response if needed
      if (useCache && response.data) {
        CacheManager.set(cacheKey, response.data, cacheTTL);
      }
      
      return response.data;
    } catch (error) {
      // Let the interceptor handle most errors
      // We just need to throw a clean error object here
      throw ErrorHandler.formatForDisplay(error);
    }
  },
  
  /**
   * Make a POST request
   * 
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, options = {}) {
    try {
      const response = await apiClient.post(url, data, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.formatForDisplay(error);
    }
  },
  
  /**
   * Make a PUT request
   * 
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(url, data, options = {}) {
    try {
      const response = await apiClient.put(url, data, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.formatForDisplay(error);
    }
  },
  
  /**
   * Make a PATCH request
   * 
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} Response data
   */
  async patch(url, data, options = {}) {
    try {
      const response = await apiClient.patch(url, data, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.formatForDisplay(error);
    }
  },
  
  /**
   * Make a DELETE request
   * 
   * @param {string} url - API endpoint
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(url, options = {}) {
    try {
      const response = await apiClient.delete(url, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.formatForDisplay(error);
    }
  },
  
  /**
   * Clear API cache for a specific URL pattern
   * 
   * @param {string|RegExp} urlPattern - URL or pattern to match
   */
  clearCache(urlPattern) {
    // Get all keys from cache
    const allKeys = [...CacheManager.globalCache.cache.keys()];
    
    // Filter keys that match the pattern
    const matchingKeys = allKeys.filter(key => {
      if (typeof urlPattern === 'string') {
        return key.includes(urlPattern);
      } else if (urlPattern instanceof RegExp) {
        return urlPattern.test(key);
      }
      return false;
    });
    
    // Delete matching keys
    matchingKeys.forEach(key => {
      CacheManager.globalCache.delete(key);
    });
    
    logDebug(`[ApiClient] Cleared ${matchingKeys.length} cache entries matching: ${urlPattern}`);
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
export const get = apiUtils.get;
export const post = apiUtils.post;
export const put = apiUtils.put;
export const patch = apiUtils.patch;
export const del = apiUtils.delete; // Use 'del' since 'delete' is a reserved word
export const clearCache = apiUtils.clearCache;
export const useApiLoading = apiUtils.useLoading;

// Default export is the full API client
export default apiUtils;
