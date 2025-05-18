/**
 * HTTP Interceptor for global request/response handling
 * 
 * This service provides a centralized way to:
 * - Add authentication headers to all requests
 * - Track global loading state for API requests
 * - Handle common error patterns
 * - Log API activity
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { logDebug, logError } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import config from '@/config';

// Create a reactive state for tracking global loading status
let globalLoadingState = {
  pending: 0,
  isLoading: false,
  loadingByUrl: new Map(),
  loadingListeners: []
};

// Global headers configuration
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Initialize HTTP interceptors on an axios instance
 * 
 * @param {Object} axiosInstance - The axios instance to configure
 * @param {Object} options - Configuration options
 * @returns {Object} - The configured axios instance
 */
export function setupInterceptors(axiosInstance, options = {}) {
  const {
    includeAuth = true,
    trackLoading = true,
    handleErrors = true,
    logRequests = process.env.NODE_ENV !== 'production'
  } = options;
  
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Track request loading state
      if (trackLoading) {
        startLoading(config);
      }
      
      // Add authentication if needed
      if (includeAuth) {
        addAuthHeaders(config);
      }
      
      // Log outgoing requests in non-production
      if (logRequests) {
        logRequest(config);
      }
      
      return config;
    },
    (error) => {
      // Handle request setup errors
      if (trackLoading) {
        stopLoading(error.config || {});
      }
      
      if (handleErrors) {
        ErrorHandler.handle(error, 'HttpInterceptor.request', {
          showToast: false,
          logLevel: 'error'
        });
      }
      
      return Promise.reject(error);
    }
  );
  
  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      // Stop tracking loading state
      if (trackLoading) {
        stopLoading(response.config);
      }
      
      // Log successful responses in debug mode
      if (logRequests) {
        logResponse(response);
      }
      
      return response;
    },
    (error) => {
      // Stop tracking loading state
      if (trackLoading && error.config) {
        stopLoading(error.config);
      }
      
      if (handleErrors) {
        handleResponseError(error);
      }
      
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
}

/**
 * Apply global defaults to axios
 */
export function setupGlobalDefaults() {
  // Set default headers
  Object.entries(defaultHeaders).forEach(([key, value]) => {
    axios.defaults.headers.common[key] = value;
  });
  
  // Set reasonable timeouts
  axios.defaults.timeout = 30000; // 30 seconds
  
  // Set base URL if configured
  if (config.API_BASE_URL) {
    axios.defaults.baseURL = config.API_BASE_URL;
  }
  
  // Setup interceptors on the global axios instance
  setupInterceptors(axios);
}

/**
 * Add authentication headers to request config
 * 
 * @param {Object} config - Axios request config
 */
function addAuthHeaders(config) {
  // Get auth token from localStorage
  const authToken = localStorage.getItem('auth-token') || 
                    (localStorage.getItem('auth-storage') ? 
                     JSON.parse(localStorage.getItem('auth-storage'))?.state?.token : 
                     null);
  
  // Add Authorization header if token exists
  if (authToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${authToken}`;
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
  globalLoadingState.loadingListeners.forEach(listener => {
    try {
      listener(getLoadingState());
    } catch (e) {
      logError('Error in loading state listener', e);
    }
  });
}

/**
 * Log request details
 * 
 * @param {Object} config - Axios request config
 */
function logRequest(config) {
  const method = config.method?.toUpperCase() || 'GET';
  const url = config.url || 'unknown';
  
  logDebug(`📤 [${method}] ${url}`, {
    params: config.params,
    data: config.data,
    headers: config.headers
  });
}

/**
 * Log response details
 * 
 * @param {Object} response - Axios response
 */
function logResponse(response) {
  const method = response.config?.method?.toUpperCase() || 'GET';
  const url = response.config?.url || 'unknown';
  const status = response.status;
  
  logDebug(`📥 [${method}] ${url} (${status})`, {
    data: response.data,
    headers: response.headers
  });
}

/**
 * Handle common API error scenarios
 * 
 * @param {Error} error - Axios error
 */
function handleResponseError(error) {
  // Get standardized error info
  const errorInfo = ErrorHandler.handle(error, 'HttpInterceptor.response', {
    showToast: false // We'll manually decide if we should show a toast
  });
  
  const status = error.response?.status;
  
  // Handle based on status code
  if (status === 401) {
    // Unauthorized - token might be expired
    toast.error('Your session has expired. Please log in again.');
    
    // Redirect to login if needed
    if (window.location.pathname !== '/login') {
      // Store the current path to redirect back after login
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
      
      // Delay slightly to ensure the toast is seen
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  } 
  else if (status === 403) {
    // Forbidden - user doesn't have permissions
    toast.error('You don\'t have permission to access this resource.');
  }
  else if (status === 404) {
    // Not found
    toast.error('The requested resource was not found.');
  }
  else if (status >= 500) {
    // Server error
    toast.error('The server encountered an error. Please try again later.');
  }
  else if (ErrorHandler.isNetworkError(error)) {
    // Network error
    toast.error('Network error. Please check your connection and try again.');
  }
  else {
    // Other errors - only show toast for significant errors
    if (errorInfo.message && errorInfo.message !== 'canceled') {
      toast.error(errorInfo.message);
    }
  }
}

/**
 * Get current loading state
 * 
 * @returns {Object} Current loading state
 */
export function getLoadingState() {
  return {
    isLoading: globalLoadingState.isLoading,
    pending: globalLoadingState.pending,
    loadingByUrl: new Map(globalLoadingState.loadingByUrl)
  };
}

/**
 * Subscribe to loading state changes
 * 
 * @param {Function} callback - Function to call when loading state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToLoadingState(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Loading state subscriber must be a function');
  }
  
  globalLoadingState.loadingListeners.push(callback);
  
  // Call immediately with current state
  callback(getLoadingState());
  
  // Return unsubscribe function
  return () => {
    globalLoadingState.loadingListeners = globalLoadingState.loadingListeners
      .filter(listener => listener !== callback);
  };
}

/**
 * Check if a specific URL is loading
 * 
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL is currently loading
 */
export function isUrlLoading(url) {
  return globalLoadingState.loadingByUrl.has(url);
}

/**
 * React hook for using loading state
 * 
 * @returns {Object} Loading state utilities
 */
export function useHttpLoading() {
  const [loadingState, setLoadingState] = React.useState(getLoadingState());
  
  React.useEffect(() => {
    return subscribeToLoadingState(setLoadingState);
  }, []);
  
  return {
    isLoading: loadingState.isLoading,
    pending: loadingState.pending,
    isUrlLoading: (url) => loadingState.loadingByUrl.has(url)
  };
}

export default {
  setupInterceptors,
  setupGlobalDefaults,
  getLoadingState,
  subscribeToLoadingState,
  isUrlLoading,
  useHttpLoading
}; 