/**
 * HTTP Service
 * 
 * This is the main entry point for all HTTP-related functionality.
 * It provides a configured axios instance with interceptors for:
 * - Authentication
 * - Loading state management
 * - Error handling
 * - Request/response logging
 * - Offline mode support
 * - Development mode support
 *
 * This file has been refactored to use a modular approach with specialized classes
 * for each concern, while maintaining backward compatibility with existing code.
 */

import axios from 'axios';
import { patchGlobalAxios, applyXhrFixes } from '@/services/axios-fix';
import { logDebug, logInfo } from '@/utils/logger';

// Import interceptors and handlers
import AuthInterceptor from './AuthInterceptor';
import ErrorInterceptor from './ErrorInterceptor';
import LoadingStateManager from './LoadingStateManager';
import OfflineModeHandler from './OfflineModeHandler';
import LoggingInterceptor from './LoggingInterceptor';
import DevelopmentModeHandler from './DevelopmentModeHandler';
import ApiClientFactory from './ApiClientFactory';

// Import hooks
export { default as useHttpLoading } from './hooks/useHttpLoading';

// Apply axios fixes
patchGlobalAxios(axios);
applyXhrFixes();

logInfo('[HTTP] Initializing HTTP service with modular architecture');


/**
 * Create a configured axios instance
 * @param {Object} options - Configuration options
 * @returns {Object} Configured axios instance
 */
const createApiClient = (options = {}) => {
  // Use the ApiClientFactory to create a configured instance
  return ApiClientFactory.createApiClient(options);
};

/**
 * Get the current loading state
 * @returns {Object} Current loading state
 */
const getLoadingState = () => {
  return LoadingStateManager.getLoadingState();
};

/**
 * Subscribe to loading state changes
 * @param {Function} callback - Function to call when loading state changes
 * @returns {Function} Unsubscribe function
 */
const subscribeToLoadingState = (callback) => {
  return LoadingStateManager.subscribeToLoadingState(callback);
};

/**
 * Check if a specific URL is currently loading
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL is loading
 */
const isUrlLoading = (url) => {
  return LoadingStateManager.isUrlLoading(url);
};

/**
 * Check if the app is in offline mode
 * @param {boolean} [forceCheck=false] - Force a fresh check ignoring cache
 * @returns {boolean} Whether the app is in offline mode
 */
const checkOfflineMode = (forceCheck = false) => {
  return OfflineModeHandler.checkOfflineMode(forceCheck);
};

/**
 * Set app offline mode state
 * @param {boolean} offline - Whether to enable offline mode
 * @param {boolean} [persistent=false] - Whether to persist the setting across sessions
 * @param {boolean} [bypassAuth=true] - Whether to bypass authentication checks in offline mode
 */
const setOfflineMode = (offline, persistent = false, bypassAuth = true) => {
  return OfflineModeHandler.setOfflineMode(offline, persistent, bypassAuth);
};

// Create default api client
export const apiClient = createApiClient();

// Export utility functions
export {
  // Loading state utilities
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  
  // Offline mode utilities
  checkOfflineMode,
  setOfflineMode,
  
  // Core functionality
  createApiClient,
  
  // Export the individual modules for direct use
  AuthInterceptor,
  ErrorInterceptor,
  LoadingStateManager,
  OfflineModeHandler,
  LoggingInterceptor,
  DevelopmentModeHandler,
  ApiClientFactory
};

// For backward compatibility
export default apiClient;
