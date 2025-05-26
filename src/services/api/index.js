/**
 * API Client - Main Entry Point
 *
 * This file serves as the main entry point for the API client.
 * It exports all the necessary functions and utilities for making API requests.
 */

// Import core components
import apiClient, { setAuthStoreRef, getApiBaseUrl } from './apiClientCore';
import { get, post, put, patch, del, getRawInstance, apiUtils } from './apiRequestMethods';
import { performRequestWithRetry } from './apiRetryLogic';
import { getWithCache, clearCache, clearAllCache } from './apiCacheManager';
import { isOfflineMode, setOfflineMode, checkNetworkConnectivity, setupNetworkListeners } from './apiOfflineMode';
import { validateUrl, validateMethod, validateConfig, validateId } from './apiValidation';
import { applyInterceptors, createRequestInterceptor, createResponseInterceptor } from './apiInterceptors';
import { enhanceError, classifyError, getUserFriendlyMessage, logApiError } from './apiErrorUtils';

// Export all API client functionality
export {
  // Core
  apiClient,
  setAuthStoreRef,
  getApiBaseUrl,
  
  // HTTP methods
  get,
  post,
  put,
  patch,
  del,
  getRawInstance,
  
  // Retry logic
  performRequestWithRetry,
  
  // Cache management
  getWithCache,
  clearCache,
  clearAllCache,
  
  // Offline mode
  isOfflineMode,
  setOfflineMode,
  checkNetworkConnectivity,
  setupNetworkListeners,
  
  // Validation
  validateUrl,
  validateMethod,
  validateConfig,
  validateId,
  
  // Interceptors
  applyInterceptors,
  createRequestInterceptor,
  createResponseInterceptor,
  
  // Error utilities
  enhanceError,
  classifyError,
  getUserFriendlyMessage,
  logApiError
};

// Default export for backwards compatibility
export default {
  // Core
  client: apiClient,
  setAuthStoreRef,
  getApiBaseUrl,
  
  // HTTP methods
  get,
  post,
  put,
  patch,
  delete: del,
  getRawInstance,
  
  // Retry logic
  performRequestWithRetry,
  
  // Cache management
  getWithCache,
  clearCache,
  clearAllCache,
  
  // Offline mode
  isOfflineMode,
  setOfflineMode,
  checkNetworkConnectivity,
  setupNetworkListeners,
  
  // Validation
  validateUrl,
  validateMethod,
  validateConfig,
  validateId,
  
  // Interceptors
  applyInterceptors,
  createRequestInterceptor,
  createResponseInterceptor,
  
  // Error utilities
  enhanceError,
  classifyError,
  getUserFriendlyMessage,
  logApiError,
  
  // Original utils object for backward compatibility
  utils: apiUtils
};
