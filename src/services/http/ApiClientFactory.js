/**
 * API Client Factory
 * 
 * Creates configured axios instances with all interceptors.
 */
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { logDebug } from '@/utils/logger';
import AuthInterceptor from './AuthInterceptor';
import ErrorInterceptor from './ErrorInterceptor';
import LoadingStateManager from './LoadingStateManager';
import OfflineModeHandler from './OfflineModeHandler';
import LoggingInterceptor from './LoggingInterceptor';
import DevelopmentModeHandler from './DevelopmentModeHandler';

// Default headers for all requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * API Client Factory class
 */
class ApiClientFactory {
  /**
   * Create a configured axios instance with enhanced features
   * @param {Object} options - Configuration options
   * @returns {Object} - Configured axios instance
   */
  createApiClient(options = {}) {
    const {
      baseURL = API_BASE_URL,
      timeout = 30000,
      headers = {},
      withCredentials = true,
      enableAuth = true,
      enableLoading = true,
      enableErrorHandling = true,
      enableOfflineMode = true,
      enableLogging = true,
      enableDevMode = true,
      loggingVerbosity = 'normal'
    } = options;
    
    // Create axios instance with default config
    const instance = axios.create({
      baseURL,
      timeout,
      headers: { ...DEFAULT_HEADERS, ...headers },
      withCredentials
    });
    
    // Setup global defaults
    this.setupGlobalDefaults(instance);
    
    // Setup interceptors
    if (enableLogging) {
      LoggingInterceptor.setVerbosity(loggingVerbosity);
      LoggingInterceptor.setupRequestInterceptor(instance);
      LoggingInterceptor.setupResponseInterceptor(instance);
    }
    
    if (enableDevMode) {
      DevelopmentModeHandler.setupRequestInterceptor(instance);
      DevelopmentModeHandler.setupResponseInterceptor(instance);
    }
    
    if (enableAuth) {
      AuthInterceptor.setupRequestInterceptor(instance);
      AuthInterceptor.setupResponseInterceptor(instance);
    }
    
    if (enableOfflineMode) {
      OfflineModeHandler.setupRequestInterceptor(instance);
    }
    
    if (enableLoading) {
      LoadingStateManager.setupRequestInterceptor(instance);
      LoadingStateManager.setupResponseInterceptor(instance);
    }
    
    if (enableErrorHandling) {
      ErrorInterceptor.setupResponseInterceptor(instance);
    }
    
    logDebug('[ApiClientFactory] Created API client with options:', {
      baseURL,
      enableAuth,
      enableLoading,
      enableErrorHandling,
      enableOfflineMode,
      enableLogging,
      enableDevMode
    });
    
    return instance;
  }
  
  /**
   * Apply global defaults to axios instance
   * @param {Object} axiosInstance - Axios instance
   */
  setupGlobalDefaults(axiosInstance) {
    // Ensure method is always defined and uppercase
    axiosInstance.interceptors.request.use(config => {
      if (!config.method) {
        config.method = 'get';
      }
      
      // Ensure method is a string to prevent "toUpperCase" error
      if (config.method && typeof config.method !== 'string') {
        config.method = String(config.method);
      }
      
      return config;
    });
  }
  
  /**
   * Create a default API client with standard configuration
   * @returns {Object} - Configured axios instance
   */
  createDefaultApiClient() {
    return this.createApiClient();
  }
  
  /**
   * Create a minimal API client with only essential interceptors
   * @returns {Object} - Configured axios instance
   */
  createMinimalApiClient() {
    return this.createApiClient({
      enableLoading: false,
      enableLogging: false,
      enableDevMode: false,
      enableOfflineMode: false
    });
  }
  
  /**
   * Create an API client for authentication requests
   * @returns {Object} - Configured axios instance
   */
  createAuthApiClient() {
    return this.createApiClient({
      enableAuth: false, // Don't add auth headers to auth requests
      loggingVerbosity: 'minimal'
    });
  }
  
  /**
   * Create an API client for offline-capable requests
   * @returns {Object} - Configured axios instance
   */
  createOfflineCapableApiClient() {
    return this.createApiClient({
      enableOfflineMode: true,
      timeout: 60000 // Longer timeout for offline-capable requests
    });
  }
}

// Create and export singleton instance
const apiClientFactory = new ApiClientFactory();

export default apiClientFactory;
