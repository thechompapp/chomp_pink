/**
 * HTTP Services Index
 * 
 * Main entry point for all HTTP-related services
 * Provides a clean API for the refactored HTTP interceptor functionality
 */

// Configuration
export { HTTP_CONFIG, CONFIG } from './httpConfig';

// Authentication
export {
  getAuthToken,
  validateToken,
  addAuthHeaders,
  removeAuthHeaders,
  requiresAuth,
  clearTokenCache,
  setAuthToken,
  getTokenCacheStats
} from './authHeaders';

// Loading State
export {
  startLoading,
  stopLoading,
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading,
  clearLoadingState,
  getLoadingStats
} from './loadingState';

// Offline Mode
export {
  initializeOfflineMode,
  isDevelopmentModeNoBackend,
  setDevelopmentModeNoBackend,
  checkOfflineMode,
  setOfflineMode,
  getOfflineStatus,
  canMakeNetworkRequests,
  subscribeToOfflineMode,
  cleanupOfflineMode
} from './offlineMode';

// Error Handling
export {
  handleResponseError,
  isRetryableError,
  getRetryDelay,
  setupRetryInterceptor
} from './errorHandler';

// Mock API
export {
  shouldUseMockApi,
  createMockResponseFromError,
  addMockDelay,
  setupMockInterceptor
} from './mockApiService';

// API Client Factory
export {
  createApiClient,
  createSpecializedClients,
  getDefaultApiClient,
  resetDefaultApiClient,
  setupGlobalDefaults
} from './apiClientFactory';

// Main setup function
export function setupHttpServices(options = {}) {
  const {
    enableGlobalDefaults = true,
    enableOfflineMode = true
  } = options;

  if (enableGlobalDefaults) {
    setupGlobalDefaults();
  }

  if (enableOfflineMode) {
    initializeOfflineMode();
  }

  return {
    apiClient: getDefaultApiClient(),
    config: HTTP_CONFIG
  };
}
