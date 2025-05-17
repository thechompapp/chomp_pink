/**
 * Utility functions for standardized error handling across the application
 */
import { logError, logWarn } from './logger';

/**
 * Standard error handler for API requests
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} options - Additional options
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @param {boolean} [options.rethrow=true] - Whether to rethrow the error
 * @param {Function} [options.onError] - Callback to run on error
 * @returns {Object} - Standardized error object
 */
export const handleError = (error, context, options = {}) => {
  const { silent = false, rethrow = true, onError } = options;
  
  // Extract useful information from the error
  const errorInfo = {
    message: error.message || 'Unknown error',
    status: error.response?.status,
    data: error.response?.data,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
  
  // Log the error (unless silent)
  if (!silent) {
    logError(`[${context}] Error:`, errorInfo);
  }
  
  // Execute callback if provided
  if (typeof onError === 'function') {
    onError(errorInfo);
  }
  
  // Rethrow if needed
  if (rethrow) {
    throw error;
  }
  
  return {
    error: true,
    ...errorInfo
  };
};

/**
 * Check if an error is network-related
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is network-related
 */
export const isNetworkError = (error) => {
  return (
    error.message?.includes('Network Error') ||
    error.code === 'ECONNABORTED' ||
    error.response?.status === 0 ||
    !navigator.onLine
  );
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.baseDelay=500] - Base delay in ms
 * @param {Function} [options.shouldRetry] - Function to determine if retry should happen
 * @returns {Promise<any>} - Result of the function
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const { 
    maxRetries = 3, 
    baseDelay = 500,
    shouldRetry = isNetworkError
  } = options;
  
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, retries - 1);
      logWarn(`Retry ${retries}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Store an operation for offline processing
 * @param {string} key - Local storage key
 * @param {Object} operation - Operation to store
 */
export const storeOfflineOperation = (key, operation) => {
  try {
    const operations = JSON.parse(localStorage.getItem(key) || '[]');
    operations.push({
      ...operation,
      timestamp: Date.now()
    });
    localStorage.setItem(key, JSON.stringify(operations));
    return true;
  } catch (error) {
    logError(`Failed to store offline operation for ${key}:`, error);
    return false;
  }
};
