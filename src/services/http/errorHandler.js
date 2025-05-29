/**
 * HTTP Error Handler
 * 
 * Handles HTTP request/response errors including:
 * - Error categorization and formatting
 * - Retry logic with exponential backoff
 * - Error logging and reporting
 * - User-friendly error messages
 */

import { toast } from 'react-hot-toast';
import { logDebug, logError, logWarn } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { HTTP_CONFIG } from './httpConfig';

/**
 * Handle response errors from HTTP requests
 * @param {Error} error - Axios error object
 * @returns {Promise} Rejected promise with formatted error
 */
export function handleResponseError(error) {
  logError('[HttpErrorHandler] Response error occurred:', error);
  
  // If no response, it's likely a network error
  if (!error.response) {
    return handleNetworkError(error);
  }
  
  const { status, data } = error.response;
  const config = error.config || {};
  
  // Handle different error status codes
  switch (status) {
    case 401:
      return handleAuthenticationError(error);
    case 403:
      return handleAuthorizationError(error);
    case 404:
      return handleNotFoundError(error);
    case 429:
      return handleRateLimitError(error);
    case 500:
    case 502:
    case 503:
    case 504:
      return handleServerError(error);
    default:
      return handleGenericError(error);
  }
}

/**
 * Handle network errors (no response received)
 * @param {Error} error - Network error
 * @returns {Promise} Rejected promise
 */
function handleNetworkError(error) {
  const errorMessage = HTTP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
  
  logError('[HttpErrorHandler] Network error:', {
    message: error.message,
    code: error.code,
    url: error.config?.url
  });
  
  // Show user-friendly toast
  toast.error(errorMessage);
  
  // Create formatted error for application
  const formattedError = {
    type: 'network_error',
    message: errorMessage,
    originalError: error,
    retryable: true,
    statusCode: null
  };
  
  return Promise.reject(formattedError);
}

/**
 * Handle authentication errors (401)
 * @param {Error} error - Authentication error
 * @returns {Promise} Rejected promise
 */
function handleAuthenticationError(error) {
  const errorMessage = HTTP_CONFIG.ERROR_MESSAGES.AUTH_ERROR;
  
  logWarn('[HttpErrorHandler] Authentication error:', {
    status: error.response.status,
    url: error.config?.url
  });
  
  // Clear authentication data
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(HTTP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(HTTP_CONFIG.STORAGE_KEYS.AUTH_STORAGE);
  }
  
  // Show error toast
  toast.error(errorMessage);
  
  // Redirect to login if in browser
  if (typeof window !== 'undefined' && window.location) {
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }
  
  const formattedError = {
    type: 'authentication_error',
    message: errorMessage,
    originalError: error,
    retryable: false,
    statusCode: 401
  };
  
  return Promise.reject(formattedError);
}

/**
 * Handle authorization errors (403)
 * @param {Error} error - Authorization error
 * @returns {Promise} Rejected promise
 */
function handleAuthorizationError(error) {
  const errorMessage = 'You do not have permission to access this resource.';
  
  logWarn('[HttpErrorHandler] Authorization error:', {
    status: error.response.status,
    url: error.config?.url
  });
  
  toast.error(errorMessage);
  
  const formattedError = {
    type: 'authorization_error',
    message: errorMessage,
    originalError: error,
    retryable: false,
    statusCode: 403
  };
  
  return Promise.reject(formattedError);
}

/**
 * Handle not found errors (404)
 * @param {Error} error - Not found error
 * @returns {Promise} Rejected promise
 */
function handleNotFoundError(error) {
  const errorMessage = 'The requested resource was not found.';
  
  logWarn('[HttpErrorHandler] Not found error:', {
    status: error.response.status,
    url: error.config?.url
  });
  
  // Don't show toast for 404s as they might be expected
  logDebug('[HttpErrorHandler] 404 error - not showing toast');
  
  const formattedError = {
    type: 'not_found_error',
    message: errorMessage,
    originalError: error,
    retryable: false,
    statusCode: 404
  };
  
  return Promise.reject(formattedError);
}

/**
 * Handle rate limit errors (429)
 * @param {Error} error - Rate limit error
 * @returns {Promise} Rejected promise
 */
function handleRateLimitError(error) {
  const retryAfter = error.response.headers['retry-after'] || 60;
  const errorMessage = `Too many requests. Please try again in ${retryAfter} seconds.`;
  
  logWarn('[HttpErrorHandler] Rate limit error:', {
    status: error.response.status,
    retryAfter,
    url: error.config?.url
  });
  
  toast.error(errorMessage);
  
  const formattedError = {
    type: 'rate_limit_error',
    message: errorMessage,
    originalError: error,
    retryable: true,
    retryAfter: parseInt(retryAfter) * 1000, // Convert to milliseconds
    statusCode: 429
  };
  
  return Promise.reject(formattedError);
}

/**
 * Handle server errors (5xx)
 * @param {Error} error - Server error
 * @returns {Promise} Rejected promise
 */
function handleServerError(error) {
  const errorMessage = HTTP_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
  
  logError('[HttpErrorHandler] Server error:', {
    status: error.response.status,
    data: error.response.data,
    url: error.config?.url
  });
  
  toast.error(errorMessage);
  
  const formattedError = {
    type: 'server_error',
    message: errorMessage,
    originalError: error,
    retryable: true,
    statusCode: error.response.status
  };
  
  return Promise.reject(formattedError);
}

/**
 * Handle generic errors
 * @param {Error} error - Generic error
 * @returns {Promise} Rejected promise
 */
function handleGenericError(error) {
  const statusCode = error.response?.status || 0;
  const errorData = error.response?.data;
  
  // Try to extract meaningful error message
  let errorMessage = 'An unexpected error occurred.';
  if (errorData?.message) {
    errorMessage = errorData.message;
  } else if (errorData?.error) {
    errorMessage = errorData.error;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  logError('[HttpErrorHandler] Generic error:', {
    status: statusCode,
    message: errorMessage,
    data: errorData,
    url: error.config?.url
  });
  
  toast.error(errorMessage);
  
  const formattedError = {
    type: 'generic_error',
    message: errorMessage,
    originalError: error,
    retryable: statusCode >= 500, // Only retry server errors
    statusCode
  };
  
  return Promise.reject(formattedError);
}

/**
 * Check if an error is retryable
 * @param {Object} error - Formatted error object
 * @returns {boolean} Whether the error can be retried
 */
export function isRetryableError(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  // Check explicit retryable flag
  if (typeof error.retryable === 'boolean') {
    return error.retryable;
  }
  
  // Check status code
  const statusCode = error.statusCode || error.status;
  if (statusCode) {
    // Retry on server errors and some client errors
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }
  
  // Check error type
  const retryableTypes = ['network_error', 'server_error', 'rate_limit_error', 'timeout_error'];
  return retryableTypes.includes(error.type);
}

/**
 * Get retry delay for an error
 * @param {Object} error - Error object
 * @param {number} attempt - Current retry attempt (1-based)
 * @returns {number} Delay in milliseconds
 */
export function getRetryDelay(error, attempt) {
  // Use explicit retry-after header if available
  if (error.retryAfter && typeof error.retryAfter === 'number') {
    return error.retryAfter;
  }
  
  // Exponential backoff with jitter
  const baseDelay = HTTP_CONFIG.RETRY.BASE_DELAY;
  const maxDelay = HTTP_CONFIG.RETRY.MAX_DELAY;
  
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Create a retry interceptor for axios
 * @param {Object} axiosInstance - Axios instance
 * @param {Object} options - Retry options
 */
export function setupRetryInterceptor(axiosInstance, options = {}) {
  const maxRetries = options.maxRetries || HTTP_CONFIG.RETRY.MAX_ATTEMPTS;
  
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config || {};
      
      // Initialize retry count
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }
      
      // Check if we should retry
      if (config.__retryCount < maxRetries && isRetryableError(error)) {
        config.__retryCount++;
        
        const delay = getRetryDelay(error, config.__retryCount);
        
        logDebug(`[HttpErrorHandler] Retrying request (attempt ${config.__retryCount}/${maxRetries}) after ${delay}ms`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return axiosInstance(config);
      }
      
      // Handle the error if not retrying
      return handleResponseError(error);
    }
  );
} 