// File: src/utils/apiUtils.js
import axios from 'axios';
import * as config from '@/config';
import { logError, logDebug, logWarn, logInfo } from '@/utils/logger';
import { parseApiError } from '@/utils/parseApiError';
import { retryWithBackoff, isNetworkError } from '@/utils/errorHandling';
import { ApiError } from '@/utils/ApiError';

/**
 * Creates a delay for a given amount of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Default configuration for API requests
 */
const DEFAULT_REQUEST_CONFIG = {
  maxRetries: config.MAX_API_RETRIES || 3,
  baseDelay: config.API_RETRY_DELAY_MS || 1000,
  shouldRetry: (error) => isNetworkError(error) || (error.response && error.response.status >= 500)
};

/**
 * Creates a request handler with retry capabilities for a specific HTTP method
 * @param {string} method - HTTP method (get, post, put, delete, patch)
 * @returns {Function} - Request handler function
 */
const createRequestHandler = (method) => {
  /**
   * Generic request handler with enhanced retry functionality
   * @param {string} url - The endpoint URL
   * @param {object} [dataOrParams={}] - Data for POST/PUT/PATCH or params for GET/DELETE
   * @param {object} [options={}] - Additional options for retries and request configuration
   * @returns {Promise<object>} - API response data
   */
  return async (url, dataOrParams = {}, options = {}) => {
    const methodUpper = method.toUpperCase();
    const requestName = options.requestName || `${methodUpper} ${url}`;
    const isReadMethod = method === 'get' || method === 'delete';
    const logParams = isReadMethod ? dataOrParams : { dataKeys: Object.keys(dataOrParams || {}) };
    
    // Extract axios-specific options from options
    const { 
      headers, 
      timeout, 
      withCredentials,
      responseType,
      baseURL = config.API_BASE_URL,
      ...retryOptions 
    } = options;
    
    const apiCall = async () => {
      try {
        logDebug(`[apiUtils.${method}] Calling ${url}${isReadMethod ? ' with params:' : ' with data:'}`, logParams);
        
        // Build axios request config
        const axiosConfig = {
          headers,
          timeout,
          withCredentials,
          responseType
        };
        
        // Add method-specific parameters
        if (isReadMethod && method === 'get') {
          axiosConfig.params = dataOrParams;
        }
        
        let response;
        const fullUrl = `${baseURL}${url}`;
        
        if (isReadMethod) {
          response = await axios[method](fullUrl, axiosConfig);
        } else {
          response = await axios[method](fullUrl, dataOrParams, axiosConfig);
        }
        
        logDebug(`[apiUtils.${method}] Success for ${url}`, { status: response.status });
        return response.data;
      } catch (error) {
        // Log the error with context
        logError(`[apiUtils.${method}] Error for ${url}:`, error);
        
        // Rethrow to be handled by retry mechanism
        throw error;
      }
    };
    
    return retryWithBackoff(apiCall, {
      ...DEFAULT_REQUEST_CONFIG,
      ...retryOptions,
      shouldRetry: retryOptions.shouldRetry || DEFAULT_REQUEST_CONFIG.shouldRetry
    });
  };
};

/**
 * Generic GET request helper with enhanced retry functionality.
 * @param {string} url - The URL to fetch.
 * @param {object} [params={}] - Query parameters.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const get = createRequestHandler('get');

/**
 * Generic POST request helper with enhanced retry functionality.
 * @param {string} url - The URL to post to.
 * @param {object} data - The data to send in the request body.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const post = createRequestHandler('post');

/**
 * Generic PUT request helper with enhanced retry functionality.
 * @param {string} url - The URL to put to.
 * @param {object} data - The data to send in the request body.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const put = createRequestHandler('put');

/**
 * Generic DELETE request helper with enhanced retry functionality.
 * @param {string} url - The URL to delete.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const del = createRequestHandler('delete'); // 'delete' is a reserved keyword

/**
 * Generic PATCH request helper with enhanced retry functionality.
 * @param {string} url - The URL to patch.
 * @param {object} data - The data to send in the request body.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const patch = createRequestHandler('patch');

/**
 * Format query parameters for URL
 * 
 * @param {Object} params - Object containing query parameters
 * @returns {string} - Formatted query string (without leading ?)
 */
export const formatQueryParams = (params) => {
  if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
    return '';
  }
  
  const parts = [];
  
  // Process each parameter
  for (const [key, value] of Object.entries(params)) {
    // Skip undefined and null values
    if (value === undefined || value === null) {
      continue;
    }
    
    const encodedKey = encodeURIComponent(key);
    
    // Handle arrays by repeating the key for each value
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          parts.push(`${encodedKey}=${encodeURIComponent(item)}`);
        }
      }
      continue;
    }
    
    // Handle objects by converting to JSON string
    if (typeof value === 'object') {
      parts.push(`${encodedKey}=${encodeURIComponent(JSON.stringify(value))}`);
      continue;
    }
    
    // Handle primitive values
    parts.push(`${encodedKey}=${encodeURIComponent(value)}`);
  }
  
  return parts.join('&');
};

/**
 * Get a properly formatted query string with ? prefix if needed
 * 
 * @param {Object} params - Object containing query parameters
 * @returns {string} - Query string with leading ? if params exist
 */
export const getQueryString = (params) => {
  const queryString = formatQueryParams(params);
  return queryString ? `?${queryString}` : '';
};

/**
 * Check if a response is successful based on status code
 * 
 * @param {Object} response - API response object
 * @returns {boolean} - Whether the response is successful
 */
export const isSuccessResponse = (response) => {
  if (!response) return false;
  
  // Check for success flag in the response
  if (typeof response.success === 'boolean') {
    return response.success;
  }
  
  // Check status code if available
  if (response.status) {
    return response.status >= 200 && response.status < 300;
  }
  
  // By default, assume success if no error is present
  return !response.error;
};

/**
 * Parse API response and extract data or throw an error
 * 
 * @param {Object} response - API response object
 * @returns {any} - Extracted data from response
 * @throws {ApiError} - If response indicates an error
 */
export const parseResponse = (response) => {
  // Handle null or undefined response
  if (!response) {
    throw new ApiError('No response received from server', 500);
  }

  // Check if response indicates an error
  if (!isSuccessResponse(response)) {
    // Extract error details
    const message = response.message || response.error || 'API request failed';
    const statusCode = response.status || 500;
    const errorCode = response.code || response.errorCode;
    
    // Log the error for debugging
    logError('API Error:', { message, statusCode, errorCode, response });
    
    // Throw a standardized ApiError
    throw new ApiError(message, statusCode, response, errorCode);
  }
  
  // Return data property if exists, otherwise return the entire response
  return response.data !== undefined ? response.data : response;
};

/**
 * Export ApiError for use in API service modules
 */
export { ApiError };

/**
 * Default export of all utility functions and HTTP methods
 */
export default {
  // HTTP methods
  get,
  post,
  put,
  del,
  patch,
  
  // Utility functions
  formatQueryParams,
  getQueryString,
  isSuccessResponse,
  parseResponse,
  
  // Error handling
  ApiError,
  retryWithBackoff,
  isNetworkError
};

// You can add other HTTP methods (HEAD, OPTIONS, etc.) if needed.