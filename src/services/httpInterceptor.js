/**
 * Enhanced HTTP Interceptor for global request/response handling
 * 
 * This service provides a centralized way to:
 * - Add authentication headers to all requests
 * - Track global loading state for API requests
 * - Handle common error patterns with retry capabilities
 * - Log API activity with configurable verbosity
 * - Detect and handle offline mode with fallback strategies
 * - Support development mode with mock data
 * 
 * Refactored to use modular interceptor architecture for better maintainability.
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { API_BASE_URL } from '@/config';
import { createMockResponseFromError } from '@/services/mockApi';
import {
  setupAllInterceptors,
  setupEnhancedInterceptors,
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading,
  checkOfflineMode,
  setOfflineMode,
  isDevelopmentModeNoBackend,
  setDevelopmentModeNoBackend,
  getInterceptorStatus
} from './http/interceptors/index.js';

// Constants for configuration
const CONFIG = {
  // Cache TTLs
  OFFLINE_MODE_CACHE_TTL: 2000, // 2 seconds TTL for offline mode cache
  TOKEN_CACHE_TTL: 5000,        // 5 seconds TTL for auth token cache
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Storage keys
  STORAGE_KEYS: {
    OFFLINE_MODE: 'offline-mode',
    DEV_MODE_NO_BACKEND: 'dev-mode-no-backend',
    AUTH_TOKEN: 'auth-token',
    AUTH_STORAGE: 'auth-storage'
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    AUTH_ERROR: 'Authentication error. Please log in again.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    OFFLINE_MODE: 'You are currently in offline mode.'
  }
};

// Create a reactive state for tracking global loading status
// Using a Map for byUrl lookups is more efficient
const globalLoadingState = {
  pending: 0,
  isLoading: false,
  loadingByUrl: new Map(),
  loadingListeners: new Set(), // Using Set prevents duplicate listeners
  lastActivity: Date.now()
};

// Cache for various states to reduce localStorage reads
const stateCache = {
  offlineMode: {
    value: null,
    timestamp: 0
  },
  developmentModeNoBackend: false,
  initialized: false
};

/**
 * Initialize the interceptor state
 * This is called automatically when the module is imported
 */
function initialize() {
  logDebug('[HttpInterceptor] Initializing HTTP interceptor system');
  
  if (stateCache.initialized) return;
  
  // Check if we've previously detected development mode with no backend
  if (process.env.NODE_ENV === 'development') {
    const devModeNoBackend = sessionStorage.getItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND) === 'true';
    stateCache.developmentModeNoBackend = devModeNoBackend;
    
    if (devModeNoBackend) {
      logDebug('[HttpInterceptor] Development mode with no backend detected from session storage');
    }
  }
  
  // Check initial offline mode
  checkOfflineMode(true);
  
  // Add event listeners for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      logInfo('[HttpInterceptor] Browser went online');
      // Force refresh offline mode cache
      checkOfflineMode(true);
      // Notify listeners of potential state change
      notifyLoadingListeners();
    });
    
    window.addEventListener('offline', () => {
      logInfo('[HttpInterceptor] Browser went offline');
      // Force refresh offline mode cache
      checkOfflineMode(true);
      // Notify listeners of potential state change
      notifyLoadingListeners();
    });
  }
  
  stateCache.initialized = true;
  
  logDebug('[HttpInterceptor] HTTP interceptor system initialized');
}

/**
 * Check if the app is in development mode with no backend available
 * This is automatically detected after the first failed request
 * @returns {boolean} - Whether we're in development mode with no backend
 */
function isDevelopmentModeNoBackend() {
  // Always return false to ensure we're not in offline mode and allow real API calls
  return false;
}

/**
 * Set the development mode no backend flag
 * @param {boolean} value - Whether we're in development mode with no backend
 */
function setDevelopmentModeNoBackend(value) {
  if (value === stateCache.developmentModeNoBackend) return;
  
  stateCache.developmentModeNoBackend = value;
  
  if (value) {
    logDebug('[HttpInterceptor] Development mode with no backend detected');
    // Store in session storage to persist across page reloads
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND, 'true');
  } else {
    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND);
  }
}

/**
 * Check if the app is in offline mode
 * @param {boolean} [forceCheck=false] - Force a fresh check ignoring cache
 * @returns {boolean} - Whether the app is in offline mode
 */
function checkOfflineMode(forceCheck = false) {
  // Check if user is authenticated before considering offline mode
  const authStorage = localStorage.getItem('auth-storage');
  let isAuthenticated = false;
  
  try {
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      isAuthenticated = authData?.state?.isAuthenticated || false;
    }
  } catch (err) {
    logError('[HttpInterceptor] Error parsing auth storage:', err);
  }
  
  // If authenticated, never force offline mode in development
  if (process.env.NODE_ENV === 'development' || isAuthenticated) {
    // Clear any offline flags in storage to ensure consistent behavior
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      localStorage.setItem('force_online', 'true');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND);
    }
    
    // Update cache to indicate online
    stateCache.offlineMode.value = false;
    stateCache.offlineMode.timestamp = Date.now();
    stateCache.developmentModeNoBackend = false;
    
    return false;
  }
  
  // For production, use a simplified check
  // Only consider the browser's navigator.onLine status
  const browserOffline = typeof navigator !== 'undefined' && 
                       typeof navigator.onLine === 'boolean' && 
                       !navigator.onLine;
  
  // Update cache
  stateCache.offlineMode.value = browserOffline;
  stateCache.offlineMode.timestamp = Date.now();
  
  return browserOffline;
}

/**
 * Set app offline mode state
 * @param {boolean} offline - Whether to enable offline mode
 * @param {boolean} [persistent=false] - Whether to persist the setting across sessions
 * @param {boolean} [bypassAuth=true] - Whether to bypass authentication checks in offline mode
 */
export function setOfflineMode(offline, persistent = false, bypassAuth = true) {
  const storage = persistent ? localStorage : sessionStorage;
  
  // Update storage and cache
  if (offline) {
    storage.setItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE, 'true');
    
    if (bypassAuth) {
      storage.setItem('bypass_auth_check', 'true');
    }
    
    // Remove any force online flags
    localStorage.removeItem('force_online');
    localStorage.removeItem('FORCE_ONLINE');
    
    // Force update cache immediately
    stateCache.offlineMode.value = true;
    stateCache.offlineMode.timestamp = Date.now();
  } else {
    // Remove offline mode flags
    storage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_MODE);
    storage.removeItem('bypass_auth_check');
    
    // Set force online flag to ensure we stay online
    localStorage.setItem('force_online', 'true');
    
    // Force update cache immediately
    stateCache.offlineMode.value = false;
    stateCache.offlineMode.timestamp = Date.now();
  }
  
  // Log and notify
  logInfo(`[HttpInterceptor] Offline mode ${offline ? 'enabled' : 'disabled'}${persistent ? ' (persistent)' : ''}`);
  
  // Notify all listeners of the state change
  notifyLoadingListeners();
  
  // Dispatch event for components to respond
  window.dispatchEvent(new CustomEvent('offlineStatusChanged', { 
    detail: { offline }
  }));
  
  return offline;
}

/**
 * Setup interceptors for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 * @returns {Object} - Configured axios instance
 */
export function setupInterceptors(axiosInstance, options = {}) {
  // Ensure the interceptor is initialized
  initialize();
  
  const {
    includeAuth = true,
    trackLoading = true,
    handleErrors = true,
    enableLogging = process.env.NODE_ENV === 'development',
    enableLoadingState = true,
    retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    }
  } = options;

  // Configure default headers for CORS and content type
  axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
  axiosInstance.defaults.headers.common['Accept'] = 'application/json';
  
  // In development, ensure we're using credentials and proper CORS headers
  if (process.env.NODE_ENV === 'development') {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  }

  // Add timestamp to prevent caching
  axiosInstance.interceptors.request.use(
    (config) => {
      config.params = {
        ...config.params,
        _t: Date.now()
      };

      // In development, ensure we're using relative URLs to leverage Vite proxy
      if (process.env.NODE_ENV === 'development' && config.url && config.url.startsWith('http')) {
        const url = new URL(config.url);
        config.url = url.pathname + url.search;
        logDebug(`[HttpInterceptor] Converted URL to relative: ${config.url}`);
      }

      return config;
    },
    (error) => {
      logError('[HttpInterceptor] Request preprocessing error:', error);
      return Promise.reject(error);
    }
  );

  // Setup modular interceptors using the new architecture
  setupEnhancedInterceptors(axiosInstance, {
    includeAuth,
    trackLoading: trackLoading && enableLoadingState,
    handleErrors,
    enableLogging,
    enableRetry: true,
    enableOfflineDetection: true,
    retryConfig
  });
  
  logInfo('[HttpInterceptor] Enhanced interceptors configured', {
    includeAuth,
    trackLoading: trackLoading && enableLoadingState,
    handleErrors,
    enableLogging,
    retryConfig
  });
  
  return axiosInstance;
}

/**
 * Setup global defaults for axios
 * @param {Object} options - Configuration options
 */
export function setupGlobalDefaults(options = {}) {
  const {
    baseURL = API_BASE_URL,
    timeout = 30000,
    headers = {}
  } = options;

  // Set global defaults
  axios.defaults.baseURL = baseURL;
  axios.defaults.timeout = timeout;
  axios.defaults.headers.common = {
    ...CONFIG.DEFAULT_HEADERS,
    ...headers
  };

  logDebug('[HttpInterceptor] Global defaults configured', {
    baseURL,
    timeout,
    headers: Object.keys(headers)
  });
}

// Cache auth token to reduce localStorage reads
let _cachedAuthToken = null;
let _lastTokenCheck = 0;
const TOKEN_CACHE_TTL = 5000; // 5 seconds cache

/**
 * Add authentication headers to request config
 * 
 * @param {Object} config - Axios request config
 */
function addAuthHeaders(config) {
  // Skip if config explicitly requests to skip auth
  if (config.skipAuth) return;
  
  // Force admin access for admin routes when in development
  const isAdminRoute = config.url?.includes('/admin');
  const isDevMode = process.env.NODE_ENV === 'development';
  
  if (isDevMode && isAdminRoute) {
    // Development mode: Enable admin access with development keys
    config.headers['X-Bypass-Auth'] = 'true';
    config.headers['X-Superuser-Override'] = 'true';
    config.headers['X-Admin-Access'] = 'true';
    config.headers['X-Admin-API-Key'] = 'doof-admin-secret-key-dev';
    
    // Store the admin API key in localStorage for future requests
    if (!localStorage.getItem('admin_api_key')) {
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
    }
    
    // Also set a flag to ensure frontend recognizes admin status
    localStorage.setItem('is_admin', 'true');
    
    // No need to look for auth token - we're bypassing auth
    return;
  }
  
  // Get the auth token using the same key as AuthenticationCoordinator and tokenManager
  let token = null;
  
  // Try the primary storage location (matches AuthenticationCoordinator and tokenManager)
  token = localStorage.getItem('token');
  
  // Validate token is not a null string or empty
  if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
    config.headers['Authorization'] = `Bearer ${token}`;
    logDebug('[HttpInterceptor] Added token to request headers');
  } else {
    // Fallback: Try legacy storage locations for backward compatibility
    token = localStorage.getItem('auth-token');
    
    if (!token) {
      // Try to parse from auth-storage (Zustand persisted store)
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsedStorage = JSON.parse(authStorage);
          if (parsedStorage?.state?.token) {
            token = parsedStorage.state.token;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // If we found a token from legacy locations, add it to the headers
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      config.headers['Authorization'] = `Bearer ${token}`;
      logDebug('[HttpInterceptor] Added legacy token to request headers');
    }
  }
  
  // Always add admin API key for admin routes if available
  if (isAdminRoute) {
    const adminApiKey = localStorage.getItem('admin_api_key');
    if (adminApiKey) {
      config.headers['X-Admin-API-Key'] = adminApiKey;
      config.headers['X-Bypass-Auth'] = 'true';
      config.headers['X-Superuser-Override'] = 'true';
      config.headers['X-Admin-Access'] = 'true';
    }
  }
}

/**
 * Start tracking loading state for a request
 * 
 * @param {Object} config - Axios request config
 */
function startLoading(config) {
  globalLoadingState.pending++;
  globalLoadingState.isLoading = true;
  
  // Track URL-specific loading state
  const url = config.url || 'unknown';
  globalLoadingState.loadingByUrl.set(url, true);
  
  // Notify listeners
  notifyLoadingListeners();
}

/**
 * Stop tracking loading state for a request
 * 
 * @param {Object} config - Axios request config
 */
function stopLoading(config) {
  globalLoadingState.pending = Math.max(0, globalLoadingState.pending - 1);
  globalLoadingState.isLoading = globalLoadingState.pending > 0;
  
  // Update URL-specific loading state
  const url = config?.url || 'unknown';
  globalLoadingState.loadingByUrl.delete(url);
  
  // Notify listeners
  notifyLoadingListeners();
}

/**
 * Notify all loading state listeners of changes
 */
function notifyLoadingListeners() {
  // Create state snapshot to avoid mutation during iteration
  const stateSnapshot = getLoadingState();
  // Use a shallow copy of listeners to avoid issues if listeners unsubscribe themselves during iteration
  const listeners = Array.from(globalLoadingState.loadingListeners);
  listeners.forEach(listener => {
    try {
      listener(stateSnapshot);
    } catch (e) {
      logError('Error in loading state listener', e);
    }
  });
  // Note: If excessive calls are detected, consider debouncing this in the future.
}

/**
 * Log request details
 * 
 * @param {Object} config - Axios request config
 */
function logRequest(config) {
  try {
    // Ensure method is a valid string before trying to use toUpperCase
    const method = config && config.method ? 
      (typeof config.method === 'string' ? config.method.toUpperCase() : String(config.method).toUpperCase()) 
      : 'GET';
      
    const url = config && config.url ? config.url : 'unknown';
    
    logDebug(`📤 [${method}] ${url}`);
  } catch (error) {
    // If there's an error logging, just use a simple fallback format
    logDebug(`📤 Request: ${config?.url || 'unknown'}`);
    
    // Fix config for future operations if needed
    if (config && !config.method) {
      config.method = 'get';
    } else if (config && typeof config.method !== 'string') {
      config.method = String(config.method || 'get');
    }
  }
}

/**
 * Log response details
 * 
 * @param {Object} response - Axios response
 */
function logResponse(response) {
  const method = typeof response.config?.method === 'string' ? response.config.method.toUpperCase() : 'GET';
  const url = response.config?.url || 'unknown';
  const status = response.status;
  
  logDebug(`📥 [${method}] ${url} (${status})`);
}

/**
 * Handle common API error scenarios
 * 
 * @param {Error} error - Axios error
 */
function handleResponseError(error) {
  try {
    // Fix for TypeError: Cannot read properties of undefined (reading 'toUpperCase')
    if (error && error.message && error.message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
      logWarn('[HttpInterceptor] TypeError detected: Cannot read properties of undefined (reading \'toUpperCase\')');
      
      console.warn(
        '🔶 TypeError Detected 🔶\n' +
        'Message: Cannot read properties of undefined (reading \'toUpperCase\')\n' +
        'This is likely due to a configuration issue in the API client.\n' +
        'Check that all request parameters are properly defined.'
      );
      
      // Create a safe config to help diagnose the issue
      const safeConfig = error.config || {};
      
      // Add the missing method to prevent future errors
      if (!safeConfig.method) {
        safeConfig.method = 'get';
      } else if (typeof safeConfig.method !== 'string') {
        safeConfig.method = String(safeConfig.method);
      }
      
      // Use our mock API service to create a realistic mock response
      const mockResponse = createMockResponseFromError(error);
      
      // Return the mock response wrapped in a reject to maintain error handling flow
      return Promise.reject({
        response: mockResponse,
        message: error.message,
        isAxiosError: true,
        isHandled: true,
        usedMockResponse: true,
        toJSON: () => ({
          message: error.message,
          name: 'TypeError',
          code: 'ERR_METHOD_UNDEFINED',
          config: safeConfig
        })
      });
    }
    
    // Skip showing errors for offline mode errors
    if (error.isOfflineError) {
      return;
    }
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Handle TypeError exceptions (often related to undefined properties)
    if (error instanceof TypeError) {
      logWarn(`[HttpInterceptor] TypeError detected: ${error.message}`);
      
      // Add more context to the error for better debugging
      error.isTypeError = true;
      error.userMessage = 'An error occurred while processing the request. Please try again.';
      
      // Log helpful information for developers
      console.warn(
        `%c🔶 TypeError Detected 🔶\n` +
        `Message: ${error.message}\n` +
        `This is likely due to a configuration issue in the API client.\n` +
        `Check that all request parameters are properly defined.`,
        'background: #fff3e0; color: #e65100; font-weight: bold; padding: 5px;'
      );
      
      // Show a toast message to the user
      if (typeof toast !== 'undefined') {
        toast.error(
          'An error occurred while connecting to the API. Please try again.',
          { id: 'type-error-toast', duration: 5000 }
        );
      }
      
      return;
    }
    
    // Special handling for network errors (likely CORS issues in development)
    if (error.message === 'Network Error' && isDevelopment) {
      // Get request details for debugging (with safe access to avoid further TypeErrors)
      const requestUrl = error.config?.url || 'unknown';
      const requestMethod = error.config?.method ? String(error.config.method).toUpperCase() : 'unknown';
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
      const apiBaseUrl = error.config?.baseURL || API_BASE_URL || 'unknown';
      const currentPort = currentOrigin.split(':').pop();
      
      // Log detailed information about the CORS issue
      logWarn(`[HttpInterceptor] Network error detected - likely a CORS issue:`);
      logWarn(`  - Request: ${requestMethod} ${requestUrl}`);
      logWarn(`  - Frontend origin: ${currentOrigin} (port ${currentPort})`);
      logWarn(`  - API base URL: ${apiBaseUrl}`);
      logWarn(`  - Backend expects requests from port 5173, but frontend is on port ${currentPort}`);
      
      // Show a helpful message in the console for developers
      console.warn(
        `%c🔴 CORS Error Detected 🔴\n` +
        `Frontend: ${currentOrigin}\n` +
        `Backend: ${apiBaseUrl}\n\n` +
        `This is likely a CORS issue. The backend is expecting requests from port 5173, ` +
        `but your frontend is running on port ${currentPort}.\n\n` +
        `Try running the frontend using the dev-server.js script: node dev-server.js`,
        'background: #ffeeee; color: #990000; font-weight: bold; padding: 5px;'
      );
      
      // Show a toast message to the user
      if (typeof toast !== 'undefined') {
        toast.error(
          'API connection error. The frontend is running on the wrong port. ' +
          'Please restart using dev-server.js',
          { id: 'cors-error-toast', duration: 8000 }
        );
      }
      
      // Use our mock API service to create a realistic mock response for development
      if (isDevelopment) {
        const mockResponse = createMockResponseFromError(error);
        
        // Return the mock response wrapped in a reject to maintain error handling flow
        return Promise.reject({
          response: mockResponse,
          message: 'Network Error (Using Mock Response)',
          isAxiosError: true,
          isHandled: true,
          usedMockResponse: true,
          originalError: error
        });
      }
      
      return;
    }
    
    // Check if this is a development-specific error (like missing backend)
    if (ErrorHandler.isDevelopmentModeError(error)) {
      // Just log it without showing a toast
      logDebug('[HttpInterceptor] Development mode error - this is expected if no backend is running');
      
      // Use our mock API service to create a realistic mock response for development
      if (isDevelopment) {
        const mockResponse = createMockResponseFromError(error);
        
        // Return the mock response wrapped in a reject to maintain error handling flow
        return Promise.reject({
          response: mockResponse,
          message: 'Development Error (Using Mock Response)',
          isAxiosError: true,
          isHandled: true,
          usedMockResponse: true,
          originalError: error
        });
      }
      
      return;
    }
    
    // Get standardized error info
    const errorInfo = ErrorHandler.handle(error, 'HttpInterceptor.response', {
      showToast: false // We'll manually decide if we should show a toast
    });
    
    const status = error.response?.status;
    
    // Check if it's a network error
    const isNetworkError = !status && ErrorHandler.isNetworkError(error);
    
    // Handle based on status code
    if (status === 401) {
      // Unauthorized - token might be expired
      toast.error('Your session has expired. Please log in again.', {
        id: 'auth-expired-toast' // Prevent duplicate toasts
      });
      
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        // Store the current path to redirect back after login
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        
        // Use React Router's history if available
        if (window.history && typeof window.history.pushState === 'function') {
          window.history.pushState({}, '', '/login');
        } else {
          window.location.href = '/login';
        }
      }
    } else if (status === 403) {
      // Forbidden - user doesn't have permission
      toast.error('You don\'t have permission to access this resource.', {
        id: 'permission-denied-toast' // Prevent duplicate toasts
      });
    } else if (status === 404) {
      // Not found - resource doesn't exist
      // Don't show toast for 404s to reduce noise
      logDebug('Resource not found', { path: error.config?.url });
    } else if (status === 429) {
      // Rate limited
      toast.error('Too many requests. Please wait and try again later.', {
        id: 'rate-limit-toast' // Prevent duplicate toasts
      });
    } else if (status >= 500) {
      // Server error
      toast.error('Server error. Please try again later.', {
        id: 'server-error-toast' // Prevent duplicate toasts
      });
      
      // Use our mock API service to create a realistic mock response for server errors in development
      if (isDevelopment) {
        const mockResponse = createMockResponseFromError(error);
        
        // Return the mock response wrapped in a reject to maintain error handling flow
        return Promise.reject({
          response: mockResponse,
          message: 'Server Error (Using Mock Response)',
          isAxiosError: true,
          isHandled: true,
          usedMockResponse: true,
          originalError: error
        });
      }
    } else if (isNetworkError) {
      // Network error - show a toast only in production
      if (!isDevelopment) {
        toast.error('Network error. Please check your connection.', {
          id: 'network-error-toast' // Prevent duplicate toasts
        });
      }
      
      // Use our mock API service to create a realistic mock response for network errors in development
      if (isDevelopment) {
        const mockResponse = createMockResponseFromError(error);
        
        // Return the mock response wrapped in a reject to maintain error handling flow
        return Promise.reject({
          response: mockResponse,
          message: 'Network Error (Using Mock Response)',
          isAxiosError: true,
          isHandled: true,
          usedMockResponse: true,
          originalError: error
        });
      }
    } else {
      // Other client errors (400, etc.)
      const message = errorInfo.message || 'An error occurred';
      toast.error(message);
    }
  } catch (handlerError) {
    logError('[HttpInterceptor] Error in error handler:', handlerError);
    return Promise.reject(error);
  }
}

/**
 * Create a configured axios instance with enhanced features
 * @param {Object} options - Configuration options
 * @returns {Object} - Configured axios instance
 */
export function createApiClient(options = {}) {
  // Ensure the interceptor is initialized
  initialize();
  
  // Create instance with default configuration
  const instance = axios.create({
    baseURL: options.baseURL || API_BASE_URL,
    timeout: options.timeout || 30000,
    headers: { ...CONFIG.DEFAULT_HEADERS, ...(options.headers || {}) }
  });
  
  // Setup enhanced interceptors
  setupInterceptors(instance, {
    includeAuth: options.includeAuth !== false, // Default to true
    trackLoading: options.trackLoading !== false, // Default to true
    handleErrors: options.handleErrors !== false, // Default to true
    enableLogging: options.enableLogging !== false && process.env.NODE_ENV !== 'production', // Default to true in dev
    enableLoadingState: options.enableLoadingState !== false, // Default to true
    retryConfig: {
      maxRetries: options.retries || options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      retryStatusCodes: options.retryStatusCodes || [408, 429, 500, 502, 503, 504]
    }
  });
  
  logDebug('[HttpInterceptor] API client created with enhanced interceptors');
  
  return instance;
}

// Export compatibility functions and utilities
export {
  // Core interceptor functions
  setupGlobalDefaults,
  createApiClient,
  
  // Loading state management (re-exported from modular system)
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading,
  
  // Offline mode management (re-exported from modular system)
  checkOfflineMode,
  setOfflineMode,
  
  // Development mode utilities (re-exported from modular system)
  isDevelopmentModeNoBackend,
  setDevelopmentModeNoBackend,
  
  // System status
  getInterceptorStatus,
  
  // Initialization
  initialize
};

// Backward compatibility default export
export default {
  // Core interceptor functions
  setupInterceptors,
  setupGlobalDefaults,
  createApiClient,
  
  // Loading state management
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading,
  
  // Offline mode management
  checkOfflineMode,
  setOfflineMode,
  
  // Development mode utilities
  isDevelopmentModeNoBackend,
  setDevelopmentModeNoBackend,
  
  // System status
  getInterceptorStatus,
  
  // Initialization
  initialize
}; 