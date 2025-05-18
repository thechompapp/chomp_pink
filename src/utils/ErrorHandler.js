/**
 * ErrorHandler.js - Centralized error handling utility
 * 
 * This utility provides standardized error handling across the application
 * with features like consistent logging, toast notifications, and error formatting.
 */
import { logDebug, logWarn, logError, logInfo } from './logger';
import { toast } from 'react-hot-toast';

// Cache common error patterns as regular expressions for better performance
const NETWORK_ERROR_PATTERNS = [
  /network error/i,
  /timeout/i,
  /abort/i,
  /econnaborted/i,
  /offline/i,
  /failed to fetch/i,
  /connection refused/i
];

// Development mode error patterns that should be handled gracefully
const DEV_MODE_ERROR_PATTERNS = [
  /network error/i,
  /connection refused/i,
  /failed to fetch/i,
  /cors error/i,
  /no route to host/i
];

// Use a WeakMap to cache error messages for objects
// This prevents having to recompute messages for the same error objects
const errorMessageCache = new WeakMap();

/**
 * Centralized error handling utility class
 */
export class ErrorHandler {
  /**
   * Process and handle an error with standardized logging and notifications
   * 
   * @param {Error|Object|string} error - The error to handle
   * @param {string} context - Context where the error occurred (e.g., 'UserService.login')
   * @param {Object} options - Handling options
   * @param {boolean} [options.showToast=true] - Whether to show a toast notification
   * @param {string} [options.logLevel='error'] - Log level ('error', 'warn', or 'info')
   * @param {string} [options.defaultMessage='An unexpected error occurred'] - Default message if none is found
   * @param {boolean} [options.includeStack=false] - Whether to include stack trace in non-dev environments
   * @param {string} [options.toastId] - ID for the toast to prevent duplicates
   * @returns {Object} - Standardized error info object
   */
  static handle(error, context, options = {}) {
    const { 
      showToast = true, 
      logLevel = 'error',
      defaultMessage = 'An unexpected error occurred',
      includeStack = false,
      toastId = null
    } = options;
    
    // Check for cached message if error is an object
    let errorMessage;
    if (error && typeof error === 'object') {
      errorMessage = errorMessageCache.get(error);
      if (!errorMessage) {
        errorMessage = ErrorHandler.getErrorMessage(error, defaultMessage);
        errorMessageCache.set(error, errorMessage);
      }
    } else {
      errorMessage = ErrorHandler.getErrorMessage(error, defaultMessage);
    }
    
    // Efficiently extract status code
    const statusCode = typeof error === 'object' ? 
      (error?.response?.status || error?.statusCode || error?.status || 500) : 500;
    
    // Only include response data if it's small enough, to avoid bloating logs
    let responseData = error?.response?.data;
    if (responseData && typeof responseData === 'object') {
      try {
        const jsonString = JSON.stringify(responseData);
        if (jsonString.length > 1000) {
          responseData = {
            _truncated: true,
            message: responseData.message || responseData.error,
            size: jsonString.length
          };
        }
      } catch (e) {
        // Ignore stringify errors
        responseData = { _unstringifiable: true };
      }
    }
    
    // Create structured error info - only include stack in development
    const errorInfo = {
      message: errorMessage,
      statusCode,
      responseData,
      context
    };
    
    // Only include stack if specified and available
    if ((process.env.NODE_ENV === 'development' || includeStack) && error?.stack) {
      errorInfo.stack = error.stack;
    }
    
    // Log the error with appropriate level using direct import for better tree-shaking
    const logPrefix = `[${context}]`;
    switch (logLevel) {
      case 'error':
        logError(`${logPrefix} Error:`, errorInfo);
        break;
      case 'warn':
        logWarn(`${logPrefix} Warning:`, errorInfo);
        break;
      case 'info':
        logInfo(`${logPrefix} Info:`, errorInfo);
        break;
      case 'debug':
        logDebug(`${logPrefix} Debug:`, errorInfo);
        break;
      default:
        logError(`${logPrefix} Error:`, errorInfo);
    }
    
    // Show toast notification if needed, with optional ID to prevent duplicates
    if (showToast && errorMessage) {
      const toastOptions = {};
      if (toastId) {
        toastOptions.id = toastId;
      }
      
      // Set duration based on message length - longer for longer messages
      toastOptions.duration = Math.min(2000 + errorMessage.length * 50, 8000);
      
      toast.error(errorMessage, toastOptions);
    }
    
    return errorInfo;
  }
  
  /**
   * Extract a user-friendly error message from various error formats
   * 
   * @param {Error|Object|string} error - The error to extract a message from
   * @param {string} [defaultMessage='An unexpected error occurred'] - Default message if none is found
   * @returns {string} - User-friendly error message
   */
  static getErrorMessage(error, defaultMessage = 'An unexpected error occurred') {
    // Fast path for common cases
    if (typeof error === 'string' && error) {
      return error;
    }
    
    if (!error) {
      return defaultMessage;
    }
    
    // Regular error objects - most common case
    if (error.message) {
      return error.message;
    }
    
    // Handle axios/API error responses
    if (error.response) {
      const { data, status, statusText } = error.response;
      
      // Try to get message from response data
      if (typeof data === 'object' && data !== null) {
        // Check common message field patterns
        if (data.message) return data.message;
        if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        if (data.errorMessage) return data.errorMessage;
        if (data.detail) return data.detail;
      }
      
      // If response data is a string, use it
      if (typeof data === 'string' && data) {
        return data;
      }
      
      // Fallback to HTTP status
      return `Error ${status}: ${statusText || 'Unknown Error'}`;
    }
    
    // Handle other object-based errors
    if (typeof error === 'object') {
      // Check common message field names in prioritized order
      for (const key of ['message', 'error', 'errorMessage', 'description', 'reason', 'detail']) {
        if (error[key] && typeof error[key] === 'string') {
          return error[key];
        }
      }
      
      // Try to stringify the object if small enough
      try {
        const errorString = JSON.stringify(error);
        if (errorString.length < 100) {
          return errorString;
        }
      } catch (e) {
        // Ignore stringification errors
      }
    }
    
    // Default fallback
    return defaultMessage;
  }
  
  /**
   * Format error details for consistent display in UI components
   * 
   * @param {Error|Object|string} error - The error to format
   * @param {Object} options - Formatting options
   * @param {string} [options.defaultMessage] - Default message if none is found
   * @param {boolean} [options.includeStack=false] - Whether to include stack trace
   * @param {boolean} [options.includeStatusCode=false] - Whether to include HTTP status code
   * @returns {Object} - Formatted error object for UI display
   */
  static formatForDisplay(error, options = {}) {
    const { 
      defaultMessage,
      includeStack = false, 
      includeStatusCode = false,
      includeContext = false
    } = options;
    
    // Try to get cached message
    let errorMessage;
    if (error && typeof error === 'object') {
      errorMessage = errorMessageCache.get(error);
      if (!errorMessage) {
        errorMessage = ErrorHandler.getErrorMessage(error, defaultMessage);
        errorMessageCache.set(error, errorMessage);
      }
    } else {
      errorMessage = ErrorHandler.getErrorMessage(error, defaultMessage);
    }
    
    const statusCode = typeof error === 'object' ? 
      (error?.response?.status || error?.statusCode || error?.status) : null;
    
    const result = {
      message: errorMessage,
      hasError: true
    };
    
    if (includeStatusCode && statusCode) {
      result.statusCode = statusCode;
    }
    
    if (includeContext && error?.context) {
      result.context = error.context;
    }
    
    if (includeStack && error?.stack && (process.env.NODE_ENV === 'development' || options.forceStack)) {
      result.stack = error.stack;
    }
    
    return result;
  }
  
  /**
   * Check if an error is a network connectivity issue
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether it's a network error
   */
  static isNetworkError(error) {
    if (!error) return false;
    
    // Fast check for browser online status
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return true;
    }
    
    // Check for common network error indicators
    if (error.message) {
      for (const pattern of NETWORK_ERROR_PATTERNS) {
        if (pattern.test(error.message)) {
          return true;
        }
      }
    }
    
    // Check for specific network error conditions
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.response?.status === 0 ||
      (!error.response && error.request) // Request made but no response received
    );
  }
  
  /**
   * Check if an error is a server-side error (5xx status)
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether it's a server error
   */
  static isServerError(error) {
    if (!error || !error.response || typeof error.response.status !== 'number') {
      return false;
    }
    
    return error.response.status >= 500 && error.response.status < 600;
  }
  
  /**
   * Check if an error is likely a development-mode specific error
   * (like missing backend server or CORS issues)
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether it's a development-mode specific error
   */
  static isDevelopmentModeError(error) {
    if (!error) return false;
    
    // Only relevant in development mode
    if (process.env.NODE_ENV !== 'development') {
      return false;
    }
    
    // Check for common development error indicators
    if (error.message) {
      for (const pattern of DEV_MODE_ERROR_PATTERNS) {
        if (pattern.test(error.message)) {
          return true;
        }
      }
    }
    
    // Check for specific development error conditions
    return (
      // Connection refused is common when backend isn't running
      error.code === 'ECONNREFUSED' ||
      // CORS errors in development
      (error.message && error.message.includes('CORS')) ||
      // If we're in development and it's a network error, it's likely a dev mode issue
      (process.env.NODE_ENV === 'development' && ErrorHandler.isNetworkError(error))
    );
  }
  
  /**
   * Check if an error is retriable (network issue or server error)
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether the error is retriable
   */
  static isRetriable(error) {
    return ErrorHandler.isNetworkError(error) || ErrorHandler.isServerError(error);
  }
  
  /**
   * Check if an error is an authentication/authorization error
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether it's an auth error
   */
  static isAuthError(error) {
    if (!error || !error.response) {
      return false;
    }
    
    return error.response.status === 401 || error.response.status === 403;
  }
  
  /**
   * Create a standardized error object
   * 
   * @param {string} message - Error message
   * @param {Object} options - Additional error properties
   * @returns {Error} - Standardized error object
   */
  static createError(message, options = {}) {
    const error = new Error(message);
    
    // Add additional properties
    Object.entries(options).forEach(([key, value]) => {
      error[key] = value;
    });
    
    return error;
  }
}

export default ErrorHandler; 