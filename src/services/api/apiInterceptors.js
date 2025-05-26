/**
 * API Interceptors
 *
 * Provides request and response interceptors for API clients:
 * - Request validation
 * - Authentication header injection
 * - Error handling
 * - Response normalization
 */

import { logDebug, logError, logWarn } from '@/utils/logger';
import { enhanceError, classifyError, logApiError } from './apiErrorUtils';
import { getApiBaseUrl } from './apiClientCore';
import { isOfflineMode, setOfflineMode } from './apiOfflineMode';
import { toast } from 'react-hot-toast';

/**
 * Create a request interceptor
 * 
 * @param {Object} options - Interceptor options
 * @returns {Function} Request interceptor
 */
export function createRequestInterceptor(options = {}) {
  return (config) => {
    try {
      // Create a safe copy of the config to avoid modifying the original
      const safeConfig = { ...(config || {}) };
      
      // Add robust check for config object and essential properties
      if (!safeConfig || typeof safeConfig !== 'object') {
        const criticalError = new Error('[API Interceptor] Request config object is undefined or not an object.');
        logError(criticalError.message, { receivedConfig: typeof safeConfig });
        
        // Create a minimal valid config to prevent crashes
        return {
          method: 'get',
          url: '/error',
          baseURL: getApiBaseUrl(),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          _isErrorConfig: true
        };
      }
      
      // Ensure URL is defined
      if (!safeConfig.url) {
        logError('[API Interceptor] Request URL is missing in config.', { configMethod: safeConfig.method });
        safeConfig.url = '/error';
        safeConfig._hasInvalidUrl = true;
      }
      
      // Ensure method is defined and is a string
      if (typeof safeConfig.method === 'undefined' || safeConfig.method === null) {
        safeConfig.method = 'get';
        logWarn('[API Interceptor] Request method was undefined, defaulted to GET.', { url: safeConfig.url });
      } else if (typeof safeConfig.method !== 'string') {
        // Convert method to string if it's not already
        try {
          safeConfig.method = String(safeConfig.method).toLowerCase();
        } catch (e) {
          safeConfig.method = 'get';
          logWarn('[API Interceptor] Failed to convert method to string, defaulted to GET.', { url: safeConfig.url });
        }
      }

      // Ensure baseURL is properly set
      if (!safeConfig.baseURL) {
        safeConfig.baseURL = getApiBaseUrl();
      } else {
        // Remove trailing slashes
        safeConfig.baseURL = safeConfig.baseURL.replace(/\/+$/, '');
      }
      
      // Normalize URL (remove leading slash if present)
      if (typeof safeConfig.url === 'string' && safeConfig.url.startsWith('/')) {
        safeConfig.url = safeConfig.url.substring(1);
      }
      
      // Ensure headers object exists
      safeConfig.headers = {
        ...(safeConfig.headers || {}),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Add timestamp to prevent caching
      safeConfig.params = {
        ...safeConfig.params,
        _t: Date.now()
      };
      
      // Log the request (safely)
      try {
        logDebug(`[API] Making ${safeConfig.method.toUpperCase()} request to: ${safeConfig.baseURL}/${safeConfig.url}`);
      } catch (logError) {
        // Fail silently if logging fails
      }
      
      return safeConfig;
    } catch (error) {
      logError('[API Interceptor] Error in request interceptor:', { 
        originalErrorMessage: error.message,
        configUrl: config?.url,
        stack: error.stack
      });
      
      // Return a safe config instead of rejecting to prevent crashes
      return {
        method: 'get',
        url: '/error',
        baseURL: getApiBaseUrl(),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        _isRecoveryConfig: true
      };
    }
  };
}

/**
 * Create a response interceptor
 * 
 * @param {Object} options - Interceptor options
 * @returns {Object} Response interceptor with success and error handlers
 */
export function createResponseInterceptor(options = {}) {
  return {
    // Success handler
    success: (response) => {
      try {
        // Log the response
        logDebug(`[API] Received response from: ${response.config?.url}`, {
          status: response.status,
          statusText: response.statusText
        });
        
        return response;
      } catch (error) {
        logError('[API Interceptor] Error in response success handler:', error);
        return response;
      }
    },
    
    // Error handler
    error: (error) => {
      try {
        // Log the error
        logApiError(error, 'API');
        
        // Check for network errors
        if (!error.response && error.request) {
          // Check if we should enable offline mode
          if (!isOfflineMode()) {
            setOfflineMode(true, false);
            toast.error('Network error. Please check your connection.', {
              duration: 5000,
              id: 'offline-mode-toast'
            });
          }
        }
        
        // Check for authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Clear any cached auth tokens
          localStorage.removeItem('auth-token');
          
          // Show toast message
          toast.error('Authentication error. Please log in again.', {
            duration: 5000,
            id: 'auth-error-toast'
          });
        }
        
        // Enhance the error with additional context
        const enhancedError = enhanceError(error, {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        });
        
        return Promise.reject(enhancedError);
      } catch (handlerError) {
        logError('[API Interceptor] Error in response error handler:', handlerError);
        return Promise.reject(error);
      }
    }
  };
}

/**
 * Apply interceptors to an axios instance
 * 
 * @param {Object} axiosInstance - Axios instance
 * @param {Object} options - Interceptor options
 * @returns {Object} Axios instance with interceptors
 */
export function applyInterceptors(axiosInstance, options = {}) {
  if (!axiosInstance) {
    logError('[API Interceptors] Invalid axios instance provided');
    return null;
  }
  
  try {
    // Create request interceptor
    const requestInterceptor = createRequestInterceptor(options);
    
    // Create response interceptor
    const responseInterceptor = createResponseInterceptor(options);
    
    // Apply request interceptor
    axiosInstance.interceptors.request.use(
      requestInterceptor,
      (error) => {
        logError('[API Interceptors] Error in request interceptor:', error);
        return Promise.reject(enhanceError(error));
      }
    );
    
    // Apply response interceptor
    axiosInstance.interceptors.response.use(
      responseInterceptor.success,
      responseInterceptor.error
    );
    
    return axiosInstance;
  } catch (error) {
    logError('[API Interceptors] Error applying interceptors:', error);
    return axiosInstance;
  }
}

export default {
  createRequestInterceptor,
  createResponseInterceptor,
  applyInterceptors
};
