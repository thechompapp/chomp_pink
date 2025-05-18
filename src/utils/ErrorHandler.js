/**
 * ErrorHandler.js - Centralized error handling utility
 * 
 * This utility provides standardized error handling across the application
 * with features like consistent logging, toast notifications, and error formatting.
 */
import { logError, logWarn, logInfo } from './logger';
import { toast } from 'react-hot-toast';

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
   * @returns {Object} - Standardized error info object
   */
  static handle(error, context, options = {}) {
    const { 
      showToast = true, 
      logLevel = 'error',
      defaultMessage = 'An unexpected error occurred',
      includeStack = false
    } = options;
    
    // Extract error details
    const errorMessage = ErrorHandler.getErrorMessage(error, defaultMessage);
    const statusCode = error?.response?.status || error?.statusCode || error?.status || 500;
    const responseData = error?.response?.data;
    
    // Create structured error info
    const errorInfo = {
      message: errorMessage,
      statusCode,
      responseData,
      stack: (process.env.NODE_ENV === 'development' || includeStack) ? error?.stack : undefined
    };
    
    // Log the error with appropriate level
    if (logLevel === 'error') {
      logError(`[${context}] Error:`, errorInfo);
    } else if (logLevel === 'warn') {
      logWarn(`[${context}] Warning:`, errorInfo);
    } else if (logLevel === 'info') {
      logInfo(`[${context}] Info:`, errorInfo);
    }
    
    // Show toast notification if needed
    if (showToast) {
      toast.error(errorInfo.message);
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
    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }
    
    // Handle null/undefined
    if (!error) {
      return defaultMessage;
    }
    
    // Regular error objects
    if (error.message) {
      return error.message;
    }
    
    // Handle axios/API error responses
    if (error.response) {
      // Try to get message from response data
      if (typeof error.response.data === 'object') {
        return error.response.data.message || error.response.data.error || `Error ${error.response.status}: ${error.response.statusText}`;
      }
      
      // If response data is a string, use it
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
      
      // Fallback to HTTP status
      return `Error ${error.response.status}: ${error.response.statusText}`;
    }
    
    // Handle non-standard error objects
    if (typeof error === 'object') {
      const possibleMessageKeys = ['message', 'error', 'errorMessage', 'description', 'reason'];
      for (const key of possibleMessageKeys) {
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
      includeStatusCode = false 
    } = options;
    
    const errorMessage = ErrorHandler.getErrorMessage(error, defaultMessage);
    const statusCode = error?.response?.status || error?.statusCode || error?.status;
    
    const result = {
      message: errorMessage,
      hasError: true
    };
    
    if (includeStatusCode && statusCode) {
      result.statusCode = statusCode;
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
    return (
      error?.message?.includes('Network Error') ||
      error?.code === 'ECONNABORTED' ||
      error?.response?.status === 0 ||
      (!error?.response && error?.request) ||
      (typeof window !== 'undefined' && !window.navigator.onLine)
    );
  }
  
  /**
   * Check if an error is a server-side error (5xx status)
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether it's a server error
   */
  static isServerError(error) {
    return (
      error?.response?.status >= 500 && 
      error?.response?.status < 600
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
}

export default ErrorHandler; 