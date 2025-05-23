/* src/utils/auth/errorHandler.js */
/**
 * Authentication Error Handler
 * 
 * Provides standardized error handling for authentication operations with:
 * - Consistent error formatting
 * - User-friendly error messages
 * - Detailed logging for debugging
 * - Error categorization
 */
import { logError, logWarn } from '@/utils/logger';

// Error categories for authentication
export const AUTH_ERROR_TYPES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  TOKEN_ERROR: 'token_error',
  PERMISSION_ERROR: 'permission_error',
  VALIDATION_ERROR: 'validation_error',
  UNKNOWN_ERROR: 'unknown_error',
  OFFLINE_ERROR: 'offline_error'
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: 'Network error. Please check your connection',
  [AUTH_ERROR_TYPES.SERVER_ERROR]: 'Server error. Please try again later',
  [AUTH_ERROR_TYPES.TOKEN_ERROR]: 'Authentication error. Please log in again',
  [AUTH_ERROR_TYPES.PERMISSION_ERROR]: 'You do not have permission to perform this action',
  [AUTH_ERROR_TYPES.VALIDATION_ERROR]: 'Please check your information and try again',
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred',
  [AUTH_ERROR_TYPES.OFFLINE_ERROR]: 'Cannot perform this action while offline'
};

/**
 * Determine error type from error object
 * @param {Error|Object} error - The error object
 * @param {string} operation - The operation being performed
 * @returns {string} The error type
 */
const getErrorType = (error, operation) => {
  // Handle axios errors
  if (error.response) {
    const { status } = error.response;
    
    // Handle specific status codes
    switch (status) {
      case 401:
        return operation === 'login' 
          ? AUTH_ERROR_TYPES.INVALID_CREDENTIALS 
          : AUTH_ERROR_TYPES.TOKEN_ERROR;
      case 403:
        return AUTH_ERROR_TYPES.PERMISSION_ERROR;
      case 422:
        return AUTH_ERROR_TYPES.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return AUTH_ERROR_TYPES.SERVER_ERROR;
      default:
        return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
    }
  }
  
  // Handle network errors
  if (error.isAxiosError && !error.response) {
    return AUTH_ERROR_TYPES.NETWORK_ERROR;
  }
  
  // Handle offline errors
  if (error.isOffline || error.message?.includes('offline')) {
    return AUTH_ERROR_TYPES.OFFLINE_ERROR;
  }
  
  // Handle validation errors
  if (error.message?.includes('required') || error.message?.includes('invalid')) {
    return AUTH_ERROR_TYPES.VALIDATION_ERROR;
  }
  
  // Default to unknown error
  return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
};

/**
 * Extract detailed error message from error object
 * @param {Error|Object} error - The error object
 * @returns {string} The detailed error message
 */
const getDetailedErrorMessage = (error) => {
  // Handle axios errors
  if (error.response?.data) {
    const { data } = error.response;
    
    // Check for error message in response data
    if (typeof data === 'string') {
      return data;
    }
    
    if (data.message) {
      return data.message;
    }
    
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
  }
  
  // Use error message if available
  if (error.message) {
    return error.message;
  }
  
  // Fallback to stringifying the error
  return String(error);
};

const authErrorHandler = {
  /**
   * Handle authentication errors
   * @param {Error|Object} error - The error object
   * @param {string} operation - The operation being performed (login, logout, etc.)
   * @returns {Object} Standardized error object
   */
  handleError: (error, operation = 'auth') => {
    // Determine error type
    const errorType = getErrorType(error, operation);
    
    // Get user-friendly message
    const userMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[AUTH_ERROR_TYPES.UNKNOWN_ERROR];
    
    // Get detailed error message for logging
    const detailedMessage = getDetailedErrorMessage(error);
    
    // Log the error
    logError(`[Auth Error] ${operation}: ${errorType}`, {
      message: detailedMessage,
      operation,
      errorType,
      originalError: error
    });
    
    // Return standardized error object
    return {
      type: errorType,
      message: userMessage,
      details: detailedMessage,
      operation
    };
  },
  
  /**
   * Create a validation error
   * @param {string} message - The validation error message
   * @returns {Object} Standardized error object
   */
  createValidationError: (message) => {
    logWarn(`[Auth Validation] ${message}`);
    
    return {
      type: AUTH_ERROR_TYPES.VALIDATION_ERROR,
      message: message || ERROR_MESSAGES[AUTH_ERROR_TYPES.VALIDATION_ERROR],
      details: message,
      operation: 'validation'
    };
  }
};

export default authErrorHandler;
