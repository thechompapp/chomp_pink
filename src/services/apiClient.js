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
 * - Robust validation to prevent undefined property errors
 *
 * This module provides a unified interface for making API requests
 * with enhanced features like retry, caching, and error handling.
 * 
 * NOTE: This file is now a wrapper around the modular API client implementation
 * in the /services/http directory. It maintains the same interface for backward
 * compatibility but delegates to the new modules.
 */

// Import from new modular HTTP service structure
import { 
  apiClient, 
  createApiClient,
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading
} from '@/services/http';

// Still import these for backward compatibility and to ensure they're initialized
import { patchGlobalAxios, applyXhrFixes } from '@/services/axios-fix';
import axios from 'axios';

// Apply the unified axios fixes to prevent the TypeError: Cannot read properties of undefined (reading 'toUpperCase')
patchGlobalAxios(axios);

// Apply XHR-level fixes for browser environments
applyXhrFixes();

/**
 * Wrapper functions to maintain backward compatibility
 */

// HTTP Methods
const get = (url, config = {}) => apiClient.get(url, config);
const post = (url, data, config = {}) => apiClient.post(url, data, config);
const put = (url, data, config = {}) => apiClient.put(url, data, config);
const patch = (url, data, config = {}) => apiClient.patch(url, data, config);
const del = (url, config = {}) => apiClient.delete(url, config);

// Cache Management
const clearCache = (url) => {
  // Delegate to the HTTP service cache utility
  if (typeof apiClient.clearCache === 'function') {
    return apiClient.clearCache(url);
  }
  return false;
};

const clearAllCache = () => {
  // Delegate to the HTTP service cache utility
  if (typeof apiClient.clearAllCache === 'function') {
    return apiClient.clearAllCache();
  }
  return false;
};

// Offline Mode
const isOfflineMode = () => {
  // Delegate to the HTTP service offline interceptor
  if (typeof apiClient.isOfflineMode === 'function') {
    return apiClient.isOfflineMode();
  }
  return !navigator.onLine;
};

const setOfflineMode = (isOffline) => {
  // Delegate to the HTTP service offline interceptor
  if (typeof apiClient.setOfflineMode === 'function') {
    return apiClient.setOfflineMode(isOffline);
  }
  return false;
};

// Core Functions
const getApiBaseUrl = () => {
  // Return the base URL from the apiClient defaults
  return apiClient.defaults?.baseURL || '';
};

const setAuthStoreRef = (authStore) => {
  // Delegate to the HTTP service auth interceptor
  if (typeof apiClient.setAuthStoreRef === 'function') {
    return apiClient.setAuthStoreRef(authStore);
  }
  return false;
};

const getRawInstance = () => {
  // Return the raw axios instance
  return apiClient;
};

// Create the API client object with all the required methods
const apiUtils = {
  // Core instance
  client: apiClient,
  
  // HTTP methods
  get,
  post,
  put,
  patch,
  delete: del,  // 'delete' is a reserved word
  
  // Cache management
  clearCache,
  clearAllCache,
  
  // Offline mode
  isOfflineMode,
  setOfflineMode,
  
  // Core functions
  getApiBaseUrl,
  setAuthStoreRef,
  getRawInstance,
  
  // Loading state (from HTTP service for backward compatibility)
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useLoading: useHttpLoading
};

// Export the API utils as the default export
export default apiUtils;

// Also export apiClient and other functions as named exports for backward compatibility
export { 
  apiClient, 
  setAuthStoreRef, 
  getApiBaseUrl, 
  get, 
  post, 
  put, 
  patch, 
  del as delete, 
  clearCache, 
  clearAllCache, 
  isOfflineMode, 
  setOfflineMode, 
  getRawInstance 
};