/**
 * API Retry Logic
 *
 * Provides robust retry functionality for API requests:
 * - Configurable retry attempts
 * - Exponential backoff
 * - Conditional retry based on error type
 * - Comprehensive error handling
 */

import { logDebug, logError, logWarn } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { getApiBaseUrl, DEFAULT_CONFIG } from './apiClientCore';

/**
 * Perform a request with retry capability
 * 
 * @param {Function} requestFn - Function that performs the actual request
 * @param {Object} options - Request options
 * @param {string} context - Context for logging
 * @returns {Promise<any>} Response data
 */
export async function performRequestWithRetry(requestFn, options = {}, context = 'API') {
  try {
    // Create a safe copy of options to avoid modifying the original
    const safeOptions = { ...(options || {}) };
    
    // Validate options
    if (!safeOptions || typeof safeOptions !== 'object') {
      logError(`[${context}] Invalid options provided for API request:`, { receivedOptions: typeof safeOptions });
      throw new Error('Valid options object is required for API request');
    }

    // Ensure URL is provided
    if (!safeOptions.url) {
      logError(`[${context}] URL is required for API request`);
      throw new Error('URL is required for API request');
    }

    // Ensure method is provided and is a string
    if (!safeOptions.method) {
      logWarn(`[${context}] Method not specified, defaulting to GET`);
      safeOptions.method = 'get';
    } else if (typeof safeOptions.method !== 'string') {
      // Convert method to string if it's not already
      try {
        safeOptions.method = String(safeOptions.method).toLowerCase();
      } catch (e) {
        safeOptions.method = 'get';
        logWarn(`[${context}] Failed to convert method to string, defaulted to GET.`, { url: safeOptions.url });
      }
    }

    // Ensure baseURL is set
    if (!safeOptions.baseURL) {
      safeOptions.baseURL = getApiBaseUrl();
      logDebug(`[${context}] baseURL not specified, using default: ${safeOptions.baseURL}`);
    }

    // Ensure headers are set
    safeOptions.headers = {
      ...DEFAULT_CONFIG.headers,
      ...(safeOptions.headers || {})
    };

    // Configure retry settings
    const retryConfig = {
      ...DEFAULT_CONFIG.retry,
      ...(safeOptions.retry || {})
    };

    // Remove custom retry config from options to avoid axios warnings
    const axiosOptions = { ...safeOptions };
    delete axiosOptions.retry;

    // Initialize retry counter
    let retryCount = 0;
    let lastError = null;

    // Attempt the request with retries
    while (retryCount <= retryConfig.retries) {
      try {
        // Log attempt if not the first try
        if (retryCount > 0) {
          try {
            logDebug(`[${context}] Retry attempt ${retryCount}/${retryConfig.retries} for ${safeOptions.method.toUpperCase()} ${safeOptions.url}`);
          } catch (logError) {
            // Fail silently if logging fails
          }
        }

        // Validate axiosOptions before making the request
        if (!axiosOptions.url) {
          throw new Error('URL is required for API request');
        }
        
        if (!axiosOptions.method) {
          axiosOptions.method = 'get';
        }

        // Make the request
        const response = await requestFn(axiosOptions);

        // Return the response data
        return response.data;
      } catch (error) {
        lastError = error;

        // Check if we should retry
        const shouldRetry = retryCount < retryConfig.retries && 
                           retryConfig.retryCondition(error);

        if (shouldRetry) {
          // Calculate delay with exponential backoff
          const delay = retryConfig.retryDelay * Math.pow(2, retryCount);
          
          logDebug(`[${context}] Request failed, retrying in ${delay}ms: ${safeOptions.url}`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          retryCount++;
        } else {
          // No more retries, throw the error
          throw error;
        }
      }
    }

    // This should not be reached due to the throw in the catch block
    // but just in case, throw the last error
    throw lastError;
  } catch (error) {
    // Log the error
    logError(`[${context}] Request failed after retries:`, {
      url: options?.url || 'unknown',
      method: options?.method || 'unknown',
      error: error.message
    });

    // Rethrow with enhanced context
    throw ErrorHandler.enhanceError(error, {
      context,
      url: options?.url || 'unknown',
      method: options?.method || 'unknown'
    });
  }
}
