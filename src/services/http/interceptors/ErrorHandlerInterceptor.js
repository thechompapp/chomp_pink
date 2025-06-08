/**
 * Error Handler Interceptor
 * 
 * Handles comprehensive error processing and user notifications:
 * - HTTP status code handling (401, 403, 404, 429, 500+)
 * - Network error detection and handling
 * - Development-specific error handling
 * - User notification management
 * - Error recovery and mock responses
 */

import { toast } from 'react-hot-toast';
import { logDebug, logError, logWarn } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { createMockResponseFromError } from '@/services/mockApi';

// Configuration constants
const CONFIG = {
  ERROR_MESSAGES: {
    AUTH_EXPIRED: 'Your session has expired. Please log in again.',
    PERMISSION_DENIED: 'You don\'t have permission to access this resource.',
    RATE_LIMITED: 'Too many requests. Please wait and try again later.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    GENERIC_ERROR: 'An error occurred while processing the request. Please try again.'
  },
  TOAST_IDS: {
    AUTH_EXPIRED: 'auth-expired-toast',
    PERMISSION_DENIED: 'permission-denied-toast',
    RATE_LIMITED: 'rate-limit-toast',
    SERVER_ERROR: 'server-error-toast',
    NETWORK_ERROR: 'network-error-toast',
    TYPE_ERROR: 'type-error-toast',
    CORS_ERROR: 'cors-error-toast'
  }
};

/**
 * Handle authentication-related errors (401, 403)
 * @param {Object} error - Axios error object
 * @param {number} status - HTTP status code
 * @returns {boolean} - Whether this was an auth error that was handled
 */
function handleAuthErrors(error, status) {
  if (status === 401) {
    // Unauthorized - token might be expired
    toast.error(CONFIG.ERROR_MESSAGES.AUTH_EXPIRED, {
      id: CONFIG.TOAST_IDS.AUTH_EXPIRED
    });
    
    // Redirect to login if needed
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      // Store the current path to redirect back after login
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
      
      // Use React Router's history if available
      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', '/login');
        // Trigger a popstate event to notify React Router
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.location.href = '/login';
      }
    }
    return true;
  } else if (status === 403) {
    // Forbidden - user doesn't have permission
    toast.error(CONFIG.ERROR_MESSAGES.PERMISSION_DENIED, {
      id: CONFIG.TOAST_IDS.PERMISSION_DENIED
    });
    return true;
  }
  
  return false;
}

/**
 * Handle client errors (4xx status codes)
 * @param {Object} error - Axios error object
 * @param {number} status - HTTP status code
 * @returns {boolean} - Whether this was a client error that was handled
 */
function handleClientErrors(error, status) {
  if (status === 404) {
    // Not found - resource doesn't exist
    // Don't show toast for 404s to reduce noise
    logDebug('[ErrorHandlerInterceptor] Resource not found', { 
      path: error.config?.url 
    });
    return true;
  } else if (status === 429) {
    // Rate limited
    toast.error(CONFIG.ERROR_MESSAGES.RATE_LIMITED, {
      id: CONFIG.TOAST_IDS.RATE_LIMITED
    });
    return true;
  }
  
  return false;
}

/**
 * Handle server errors (5xx status codes)
 * @param {Object} error - Axios error object
 * @param {number} status - HTTP status code
 * @returns {Promise|boolean} - Promise for mock response or boolean if handled
 */
function handleServerErrors(error, status) {
  if (status >= 500) {
    // Server error
    toast.error(CONFIG.ERROR_MESSAGES.SERVER_ERROR, {
      id: CONFIG.TOAST_IDS.SERVER_ERROR
    });
    
    logError(`[ErrorHandlerInterceptor] Server error (${status}):`, {
      url: error.config?.url,
      status: status,
      data: error.response?.data
    });
    
    // Use mock API for server errors in development
    if (process.env.NODE_ENV === 'development') {
      const mockResponse = createMockResponseFromError(error);
      
      return Promise.reject({
        response: mockResponse,
        message: 'Server Error (Using Mock Response)',
        isAxiosError: true,
        isHandled: true,
        usedMockResponse: true,
        originalError: error
      });
    }
    
    return true;
  }
  
  return false;
}

/**
 * Handle TypeError exceptions (often related to undefined properties)
 * @param {Object} error - Error object
 * @returns {Promise|boolean} - Promise for mock response or boolean if handled
 */
function handleTypeErrors(error) {
  // Fix for TypeError: Cannot read properties of undefined (reading 'toUpperCase')
  if (error && error.message && error.message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
    logWarn('[ErrorHandlerInterceptor] TypeError detected: Cannot read properties of undefined (reading \'toUpperCase\')');
    
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
    
    // Use mock API service to create a realistic mock response
    const mockResponse = createMockResponseFromError(error);
    
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
  
  // Handle other TypeErrors
  if (error instanceof TypeError) {
    logWarn(`[ErrorHandlerInterceptor] TypeError detected: ${error.message}`);
    
    // Add more context to the error for better debugging
    error.isTypeError = true;
    error.userMessage = CONFIG.ERROR_MESSAGES.GENERIC_ERROR;
    
    // Log helpful information for developers
    console.warn(
      `%c🔶 TypeError Detected 🔶\n` +
      `Message: ${error.message}\n` +
      `This is likely due to a configuration issue in the API client.\n` +
      `Check that all request parameters are properly defined.`,
      'background: #fff3e0; color: #e65100; font-weight: bold; padding: 5px;'
    );
    
    // Show a toast message to the user
    toast.error(CONFIG.ERROR_MESSAGES.GENERIC_ERROR, {
      id: CONFIG.TOAST_IDS.TYPE_ERROR,
      duration: 5000
    });
    
    return true;
  }
  
  return false;
}

/**
 * Handle network errors (likely CORS issues in development)
 * @param {Object} error - Axios error object
 * @returns {Promise|boolean} - Promise for mock response or boolean if handled
 */
function handleNetworkErrors(error) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Special handling for network errors (likely CORS issues in development)
  if (error.message === 'Network Error' && isDevelopment) {
    // Get request details for debugging (with safe access to avoid further TypeErrors)
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = error.config?.method ? String(error.config.method).toUpperCase() : 'unknown';
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const apiBaseUrl = error.config?.baseURL || 'unknown';
    const currentPort = currentOrigin.split(':').pop();
    
    // Log detailed information about the CORS issue
    logWarn(`[ErrorHandlerInterceptor] Network error detected - likely a CORS issue:`);
    logWarn(`  - Request: ${requestMethod} ${requestUrl}`);
    logWarn(`  - Frontend origin: ${currentOrigin} (port ${currentPort})`);
    logWarn(`  - API base URL: ${apiBaseUrl}`);
    
    // Show a helpful message in the console for developers
    console.warn(
      `%c🔴 CORS Error Detected 🔴\n` +
      `Frontend: ${currentOrigin}\n` +
      `Backend: ${apiBaseUrl}\n\n` +
      `This is likely a CORS issue. Check your backend CORS configuration.`,
      'background: #ffeeee; color: #990000; font-weight: bold; padding: 5px;'
    );
    
    // Show a toast message to the user
    toast.error(
      'API connection error. Check console for details.',
      { id: CONFIG.TOAST_IDS.CORS_ERROR, duration: 8000 }
    );
    
    // Use mock API service to create a realistic mock response for development
    const mockResponse = createMockResponseFromError(error);
    
    return Promise.reject({
      response: mockResponse,
      message: 'Network Error (Using Mock Response)',
      isAxiosError: true,
      isHandled: true,
      usedMockResponse: true,
      originalError: error
    });
  }
  
  // Handle other network errors
  const isNetworkError = !error.response && ErrorHandler.isNetworkError(error);
  if (isNetworkError) {
    // Network error - show a toast only in production
    if (!isDevelopment) {
      toast.error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, {
        id: CONFIG.TOAST_IDS.NETWORK_ERROR
      });
    }
    
    // Use mock API for network errors in development
    if (isDevelopment) {
      const mockResponse = createMockResponseFromError(error);
      
      return Promise.reject({
        response: mockResponse,
        message: 'Network Error (Using Mock Response)',
        isAxiosError: true,
        isHandled: true,
        usedMockResponse: true,
        originalError: error
      });
    }
    
    return true;
  }
  
  return false;
}

/**
 * Handle development-specific errors
 * @param {Object} error - Axios error object
 * @returns {Promise|boolean} - Promise for mock response or boolean if handled
 */
function handleDevelopmentErrors(error) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if this is a development-specific error (like missing backend)
  if (ErrorHandler.isDevelopmentModeError(error)) {
    // Just log it without showing a toast
    logDebug('[ErrorHandlerInterceptor] Development mode error - this is expected if no backend is running');
    
    // Use mock API service to create a realistic mock response for development
    if (isDevelopment) {
      const mockResponse = createMockResponseFromError(error);
      
      return Promise.reject({
        response: mockResponse,
        message: 'Development Error (Using Mock Response)',
        isAxiosError: true,
        isHandled: true,
        usedMockResponse: true,
        originalError: error
      });
    }
    
    return true;
  }
  
  return false;
}

/**
 * Handle response errors comprehensively
 * @param {Object} error - Axios error object
 * @returns {Promise} - Rejected promise (may include mock response)
 */
export function handleResponseError(error) {
  try {
    // Skip showing errors for offline mode errors
    if (error.isOfflineError) {
      return Promise.reject(error);
    }
    
    // Handle TypeError exceptions first
    const typeErrorResult = handleTypeErrors(error);
    if (typeErrorResult !== false) {
      return typeErrorResult === true ? Promise.reject(error) : typeErrorResult;
    }
    
    // Handle network errors
    const networkErrorResult = handleNetworkErrors(error);
    if (networkErrorResult !== false) {
      return networkErrorResult === true ? Promise.reject(error) : networkErrorResult;
    }
    
    // Handle development-specific errors
    const devErrorResult = handleDevelopmentErrors(error);
    if (devErrorResult !== false) {
      return devErrorResult === true ? Promise.reject(error) : devErrorResult;
    }
    
    // Get standardized error info
    const errorInfo = ErrorHandler.handle(error, 'ErrorHandlerInterceptor.response', {
      showToast: false // We'll manually decide if we should show a toast
    });
    
    const status = error.response?.status;
    
    // Handle based on status code
    if (status) {
      // Authentication errors (401, 403)
      if (handleAuthErrors(error, status)) {
        return Promise.reject(error);
      }
      
      // Client errors (404, 429, etc.)
      if (handleClientErrors(error, status)) {
        return Promise.reject(error);
      }
      
      // Server errors (5xx)
      const serverErrorResult = handleServerErrors(error, status);
      if (serverErrorResult !== false) {
        return serverErrorResult === true ? Promise.reject(error) : serverErrorResult;
      }
      
      // Other client errors (400, etc.)
      const message = errorInfo.message || CONFIG.ERROR_MESSAGES.GENERIC_ERROR;
      toast.error(message);
    }
    
    return Promise.reject(error);
  } catch (handlerError) {
    logError('[ErrorHandlerInterceptor] Error in error handler:', handlerError);
    return Promise.reject(error);
  }
}

/**
 * Setup error handling interceptor for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 */
export function setupErrorHandlerInterceptor(axiosInstance, options = {}) {
  const { enabled = true } = options;
  
  if (!enabled) {
    logDebug('[ErrorHandlerInterceptor] Error handling disabled');
    return;
  }
  
  // Response interceptor to handle errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      return handleResponseError(error);
    }
  );
  
  logDebug('[ErrorHandlerInterceptor] Error handler interceptor configured');
} 