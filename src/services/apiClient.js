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
import { patchGlobalAxios, patchAxiosInstance, applyXhrFixes } from '@/services/axios-fix';
import * as config from '@/config';
import { logDebug, logError, logWarn } from '@/utils/logger';
import httpInterceptor from '@/services/httpInterceptor'; 
import CacheManager from '@/utils/CacheManager';
import ErrorHandler from '@/utils/ErrorHandler';
import mockApi from '@/services/mockApi';
// Import the function to set up auth-specific interceptors
import { setupAuthInterceptors } from '@/services/authService'; 

// Apply the unified axios fixes to prevent the TypeError: Cannot read properties of undefined (reading 'toUpperCase')
patchGlobalAxios(axios);

// Apply XHR-level fixes for browser environments
applyXhrFixes();

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

// Setup authentication-specific interceptors AFTER the instance is created and patched
setupAuthInterceptors(apiClient);

// Create a safe fallback adapter for handling cases where the default adapter fails
const fallbackAdapter = (config) => {
  // Ensure we have a proper method string
  const method = typeof config.method === 'string' ? config.method : 
                (config.method ? String(config.method) : 'get');
  
  // Log that we're using the fallback adapter
  console.warn(`[ApiClient] Using fallback adapter for ${method} ${config.url || 'unknown'}`);
  
  // Perform a fetch request directly as a last resort
  return new Promise((resolve, reject) => {
    try {
      // Basic URL construction using config
      const baseURL = config.baseURL || getApiBaseUrl();
      let fullUrl = config.url;
      
      // Handle relative vs absolute URLs
      if (fullUrl && !fullUrl.startsWith('http')) {
        // Remove leading slash from URL if baseURL ends with slash
        if (baseURL.endsWith('/') && fullUrl.startsWith('/')) {
          fullUrl = fullUrl.substring(1);
        }
        fullUrl = baseURL + fullUrl;
      } else if (!fullUrl) {
        fullUrl = baseURL;
      }
      
      // Convert string URL to URL object for adding params
      const url = new URL(fullUrl);
      
      // Add params to URL if present
      if (config.params) {
        Object.keys(config.params).forEach(key => {
          if (config.params[key] !== undefined && config.params[key] !== null) {
            url.searchParams.append(key, config.params[key]);
          }
        });
      }
      
      // Prepare fetch options
      const fetchOptions = {
        method: method.toUpperCase(), // Use uppercase for fetch method
        headers: config.headers || {},
        // Add timeout via AbortController
        signal: config.timeout ? 
          AbortSignal.timeout(config.timeout) : undefined,
      };
      
      // Add body for non-GET requests
      if (method !== 'get' && config.data) {
        let body = config.data;
        
        // Handle data format conversion
        if (typeof body !== 'string') {
          try {
            // Try to convert body to JSON if it's not already a string
            body = JSON.stringify(body);
            
            // Ensure Content-Type is application/json
            if (!fetchOptions.headers['Content-Type'] && !fetchOptions.headers['content-type']) {
              fetchOptions.headers['Content-Type'] = 'application/json';
            }
          } catch (e) {
            console.warn('[FallbackAdapter] Error stringifying request body:', e);
            
            // Use toString as fallback
            body = String(body);
          }
        }
        
        fetchOptions.body = body;
      }
      
      // Perform the fetch
      fetch(url.toString(), fetchOptions)
        .then(response => {
          // Read response data
          return response.text().then(text => {
            let data = text;
            
            // Try to parse JSON
            try {
              data = JSON.parse(text);
            } catch (e) {
              // Keep as text if not valid JSON
              console.warn('[FallbackAdapter] Error parsing response as JSON:', e);
            }
            
            // Construct axios-like response object
            const responseObject = {
              data,
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              config,
              request: null, // Not needed in fallback
              _isFallbackResponse: true
            };
            
            console.log('[FallbackAdapter] Successfully completed request', {
              url: url.toString(),
              status: response.status
            });
            
            // Resolve with the response object
            resolve(responseObject);
          });
        })
        .catch(error => {
          console.error('[FallbackAdapter] Fetch error:', error);
          
          // Reject with a more structured error object
          reject({
            message: error.message,
            config,
            isAxiosError: true,
            response: null,
            request: null,
            isFallbackError: true,
            toJSON: () => ({
              message: error.message,
              name: error.name,
              code: error.code || 'FETCH_ERROR'
            })
          });
        });
    } catch (error) {
      console.error('[FallbackAdapter] Setup error:', error);
      
      // Reject with structured error
      reject({
        message: error.message,
        config,
        isAxiosError: true,
        isFallbackError: true,
        toJSON: () => ({
          message: error.message,
          name: error.name,
          code: 'FALLBACK_ADAPTER_ERROR'
        })
      });
    }
  });
};

// Add the fallback adapter to the client for direct use when needed
apiClient.fallbackAdapter = fallbackAdapter;

// Override the adapter getter to provide a robust adapter chain
Object.defineProperty(apiClient.defaults, 'adapter', {
  get() {
    // Return a smart adapter that tries the custom adapter first,
    // then falls back to the fallback adapter if it fails with toUpperCase error
    return function smartAdapter(config) {
      // Create a safety wrapper to handle missing or invalid method property
      const safeConfig = { ...config };
      
      // Ensure method is properly defined
      if (!safeConfig.method) {
        safeConfig.method = 'get';
        console.debug('[ApiClient] SmartAdapter added missing method: get');
      } else if (typeof safeConfig.method !== 'string') {
        safeConfig.method = String(safeConfig.method);
        console.debug(`[ApiClient] SmartAdapter converted method to string: ${safeConfig.method}`);
      }
      
      // Ensure headers are defined
      if (!safeConfig.headers) {
        safeConfig.headers = {};
      }
      
      // The key fix: Wrap the XMLHttpRequest usage to directly override the method property
      // This ensures dispatchXhrRequest never receives an undefined method property
      return new Promise((resolve, reject) => {
        // First try with our patched custom adapter
        customAdapter(safeConfig)
          .then(resolve)
          .catch(error => {
            // Check if it's the toUpperCase error
            if (error?.message?.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
              console.warn('[ApiClient] Caught toUpperCase error, falling back to safer implementation');
              
              // Try with our fallback adapter
              fallbackAdapter(safeConfig)
                .then(resolve)
                .catch(fallbackError => {
                  // Last resort: create a mock response
                  logError('[ApiClient] All adapters failed - responding with mock data');
                  const mockResponse = mockApi.createMockResponseFromError(error);
                  resolve(mockResponse);
                });
            } else {
              // For other errors, pass through
              reject(error);
            }
          });
      });
    };
  },
  // Make sure the adapter can be replaced if needed
  set(value) {
    this._adapter = value;
  }
});

// The apiClient instance is already patched with our unified fixes

// Force all requests to use our custom adapter to prevent the toUpperCase error
apiClient.defaults.adapter = customAdapter;

// Apply the custom adapter to the instance directly
apiClient.adapter = customAdapter;

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
  
  // Try direct localStorage access next, ensuring we get the latest value
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
  
  // Log to confirm that we're attempting a real API call
  logDebug(`[${context}] Attempting real API call for ${requestOptions.url || 'unknown endpoint'}`);
  
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
   * Enhanced check if the application is in offline mode
   * This function aggressively checks authentication status and ensures
   * offline mode is never enabled when authenticated
   * 
   * @returns {boolean} Whether the application is in offline mode
   */
  isOfflineMode() {
    try {
      // CRITICAL: Never use offline mode in development
      if (process.env.NODE_ENV === 'development') {
        // Clear offline flags in development mode
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        return false;
      }
      
      // Check if user is authenticated - never use offline mode when authenticated
      let isAuthenticated = false;
      
      // Check multiple auth indicators to be thorough
      if (typeof localStorage !== 'undefined') {
        // Check auth-storage (main auth state)
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            if (authData?.state?.isAuthenticated) {
              isAuthenticated = true;
            }
          }
        } catch (err) {
          logError('[ApiClient] Error parsing auth storage:', err);
        }
        
        // Check auth-token (backup check)
        if (!isAuthenticated && localStorage.getItem('auth-token')) {
          isAuthenticated = true;
        }
        
        // Check admin flags (additional backup)
        if (!isAuthenticated && (
          localStorage.getItem('admin_access_enabled') === 'true' ||
          localStorage.getItem('superuser_override') === 'true'
        )) {
          isAuthenticated = true;
        }
      }
      
      // If authenticated, always force online mode
      if (isAuthenticated) {
        // Clear all offline mode flags to be safe
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        return false;
      }
      
      // Check for force online flag
      if (typeof localStorage !== 'undefined' && localStorage.getItem('force_online') === 'true') {
        return false;
      }
      
      // Check if user explicitly logged out (special case for development)
      if (process.env.NODE_ENV === 'development' && 
          typeof localStorage !== 'undefined' && 
          localStorage.getItem('user_explicitly_logged_out') === 'true') {
        return false;
      }
      
      // Check sessionStorage (temporary session setting)
      if (typeof sessionStorage !== 'undefined') {
        const offlineModeSession = sessionStorage.getItem('offline-mode') || sessionStorage.getItem('offline_mode');
        if (offlineModeSession === 'true') {
          return true;
        }
      }
      
      // Check localStorage (user preference)
      if (typeof localStorage !== 'undefined') {
        const offlineModePreference = localStorage.getItem('offline-mode') || localStorage.getItem('offline_mode');
        if (offlineModePreference === 'true') {
          return true;
        }
      }
      
      // Check network status as fallback
      return typeof navigator !== 'undefined' && 
             typeof navigator.onLine === 'boolean' && 
             !navigator.onLine;
    } catch (error) {
      // If any error occurs, default to online mode for safety
      logError('[ApiClient] Error in isOfflineMode, defaulting to online mode:', error);
      return false;
    }
  },
  
  /**
   * Enhanced set offline mode function
   * This function ensures offline mode is never enabled when authenticated
   * and properly handles storage and event dispatching
   * 
   * @param {boolean} enabled - Whether to enable offline mode
   * @param {boolean} [persistent=false] - Whether to persist the setting
   */
  setOfflineMode(enabled, persistent = false) {
    try {
      logDebug(`[ApiClient] setOfflineMode called with enabled=${enabled}, persistent=${persistent}`);
      
      // CRITICAL: Never enable offline mode in development
      if (process.env.NODE_ENV === 'development' && enabled) {
        logDebug('[ApiClient] Development mode - ignoring offline mode request');
        // Force disable offline mode
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        // Dispatch event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
            detail: { isOffline: false }
          }));
        }
        return;
      }
      
      // Check if user is authenticated - never set offline mode when authenticated
      let isAuthenticated = false;
      
      // Check multiple auth indicators to be thorough
      if (typeof localStorage !== 'undefined') {
        // Check auth-storage (main auth state)
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            if (authData?.state?.isAuthenticated) {
              isAuthenticated = true;
            }
          }
        } catch (err) {
          logError('[ApiClient] Error parsing auth storage:', err);
        }
        
        // Check auth-token (backup check)
        if (!isAuthenticated && localStorage.getItem('auth-token')) {
          isAuthenticated = true;
        }
        
        // Check admin flags (additional backup)
        if (!isAuthenticated && (
          localStorage.getItem('admin_access_enabled') === 'true' ||
          localStorage.getItem('superuser_override') === 'true'
        )) {
          isAuthenticated = true;
        }
      }
      
      // If authenticated and trying to enable offline mode, prevent it
      if (isAuthenticated && enabled) {
        logDebug('[ApiClient] Attempted to enable offline mode while authenticated - ignoring');
        // Force online mode
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        // Dispatch event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
            detail: { isOffline: false }
          }));
        }
        
        return;
      }
      
      // Now handle the actual setting of offline mode
      const storage = persistent ? localStorage : sessionStorage;
      
      if (enabled) {
        if (typeof storage !== 'undefined') {
          storage.setItem('offline-mode', 'true');
          // Also set the alternative key for compatibility
          storage.setItem('offline_mode', 'true');
          // Clear any force online flags
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('force_online');
          }
          logDebug('[ApiClient] Offline mode enabled' + (persistent ? ' (persistent)' : ''));
        }
      } else {
        // Disable offline mode
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        logDebug('[ApiClient] Offline mode disabled');
      }
      
      // Dispatch event to notify components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
          detail: { isOffline: enabled }
        }));
      }
    } catch (error) {
      // If any error occurs, default to online mode for safety
      logError('[ApiClient] Error in setOfflineMode, defaulting to online mode:', error);
      
      // Force online mode as a safety measure
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.setItem('force_online', 'true');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        // Dispatch event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
            detail: { isOffline: false }
          }));
        }
      } catch (e) {
        // Ignore any errors in the error handler
      }
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
