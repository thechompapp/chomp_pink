/**
 * Retry Interceptor
 * 
 * Handles request retry logic with exponential backoff:
 * - Configurable maximum retry attempts
 * - Exponential backoff delay calculation
 * - Retry on specific status codes and network errors
 * - Request tracking and retry count management
 */

import { logDebug, logError, logWarn } from '@/utils/logger';

// Default configuration
const DEFAULT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  exponentialBackoff: true,
  retryOnNetworkError: true
};

/**
 * Calculate retry delay with exponential backoff
 * @param {number} retryCount - Current retry attempt number
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {boolean} exponential - Whether to use exponential backoff
 * @returns {number} - Delay in milliseconds
 */
function calculateRetryDelay(retryCount, baseDelay, exponential = true) {
  if (!exponential) {
    return baseDelay;
  }
  
  // Exponential backoff: delay * 2^(retryCount - 1)
  return baseDelay * Math.pow(2, retryCount - 1);
}

/**
 * Check if an error should trigger a retry
 * @param {Object} error - Axios error object
 * @param {Object} config - Retry configuration
 * @returns {boolean} - Whether the error should trigger a retry
 */
function shouldRetry(error, config) {
  const { response, request } = error;
  const { retryStatusCodes, retryOnNetworkError } = config;
  
  // Retry on network errors (no response but request was made)
  if (!response && request && retryOnNetworkError) {
    return true;
  }
  
  // Retry on specific status codes
  if (response && retryStatusCodes.includes(response.status)) {
    return true;
  }
  
  return false;
}

/**
 * Create a unique key for tracking retries
 * @param {Object} config - Axios request config
 * @returns {string} - Unique key for the request
 */
function getRetryKey(config) {
  const { method, url, params } = config;
  const paramString = params ? JSON.stringify(params) : '';
  return `${method}_${url}_${paramString}`;
}

/**
 * Wait for a specified delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} - Promise that resolves after the delay
 */
function sleep(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Setup retry interceptor for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 */
export function setupRetryInterceptor(axiosInstance, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { enabled = true } = config;
  
  if (!enabled) {
    logDebug('[RetryInterceptor] Request retry disabled');
    return;
  }
  
  // Map to track retry counts for each request
  const retryCounts = new Map();
  
  // Response interceptor to handle retries
  axiosInstance.interceptors.response.use(
    (response) => {
      // Clear retry count on successful response
      const retryKey = getRetryKey(response.config);
      if (retryCounts.has(retryKey)) {
        retryCounts.delete(retryKey);
        logDebug('[RetryInterceptor] Request succeeded, cleared retry count', {
          url: response.config.url,
          method: response.config.method
        });
      }
      return response;
    },
    async (error) => {
      const { config: requestConfig } = error;
      
      if (!requestConfig) {
        return Promise.reject(error);
      }
      
      const retryKey = getRetryKey(requestConfig);
      const currentRetryCount = retryCounts.get(retryKey) || 0;
      
      // Check if we should retry this error
      const shouldAttemptRetry = (
        currentRetryCount < config.maxRetries &&
        shouldRetry(error, config)
      );
      
      if (shouldAttemptRetry) {
        const nextRetryCount = currentRetryCount + 1;
        retryCounts.set(retryKey, nextRetryCount);
        
        // Calculate delay with exponential backoff
        const delay = calculateRetryDelay(
          nextRetryCount, 
          config.retryDelay, 
          config.exponentialBackoff
        );
        
        logWarn(`[RetryInterceptor] Retrying request (${nextRetryCount}/${config.maxRetries}) in ${delay}ms`, {
          url: requestConfig.url,
          method: requestConfig.method,
          status: error.response?.status,
          error: error.message
        });
        
        // Wait before retrying
        await sleep(delay);
        
        // Retry the request
        try {
          const retryResponse = await axiosInstance(requestConfig);
          logDebug('[RetryInterceptor] Retry successful', {
            url: requestConfig.url,
            method: requestConfig.method,
            retryCount: nextRetryCount
          });
          return retryResponse;
        } catch (retryError) {
          // If the retry also fails, it will be caught by this same interceptor
          return Promise.reject(retryError);
        }
      } else {
        // No more retries, clean up retry count
        if (retryCounts.has(retryKey)) {
          retryCounts.delete(retryKey);
          logDebug('[RetryInterceptor] Max retries exceeded, giving up', {
            url: requestConfig.url,
            method: requestConfig.method,
            totalRetries: currentRetryCount,
            maxRetries: config.maxRetries
          });
        }
        
        return Promise.reject(error);
      }
    }
  );
  
  logDebug('[RetryInterceptor] Request retry interceptor configured', {
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay,
    retryStatusCodes: config.retryStatusCodes,
    exponentialBackoff: config.exponentialBackoff,
    retryOnNetworkError: config.retryOnNetworkError
  });
}

/**
 * Get retry statistics for debugging
 * @param {Object} axiosInstance - Axios instance (currently not used but kept for API consistency)
 * @returns {Object} - Retry statistics
 */
export function getRetryStats(axiosInstance) {
  // In a real implementation, we might track more detailed statistics
  // For now, return basic configuration info
  return {
    interceptorConfigured: true,
    // Note: Individual request retry counts are private to the interceptor closure
    message: 'Retry interceptor is active. Individual request retry counts are tracked internally.'
  };
}

/**
 * Create retry configuration object
 * @param {Object} options - Configuration options
 * @returns {Object} - Retry configuration
 */
export function createRetryConfig(options = {}) {
  return { ...DEFAULT_CONFIG, ...options };
}

/**
 * Check if a status code is retryable
 * @param {number} statusCode - HTTP status code
 * @param {Array} retryStatusCodes - Array of retryable status codes
 * @returns {boolean} - Whether the status code is retryable
 */
export function isRetryableStatusCode(statusCode, retryStatusCodes = DEFAULT_CONFIG.retryStatusCodes) {
  return retryStatusCodes.includes(statusCode);
}

/**
 * Check if an error is retryable
 * @param {Object} error - Axios error object
 * @param {Object} config - Retry configuration
 * @returns {boolean} - Whether the error is retryable
 */
export function isRetryableError(error, config = DEFAULT_CONFIG) {
  return shouldRetry(error, config);
} 