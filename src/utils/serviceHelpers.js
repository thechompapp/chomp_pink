/* src/utils/serviceHelpers.js */
/**
 * Service helpers for standardized API client implementation
 * These utilities ensure consistent API response handling, error processing,
 * and data formatting across all service files.
 */
import { logDebug, logError, logWarn, logInfo } from './logger.js';

/**
 * Enhanced API response handler with standardized error handling and response normalization
 * 
 * @param {Function} apiCall - Async function that makes the API call using apiClient
 * @param {String} context - Context description for logging (e.g. 'ServiceName.methodName')
 * @param {Function} transformFn - Optional function to transform successful response data
 * @returns {Promise<any>} - Processed response data, never throws
 */
export const handleApiResponse = async (apiCall, context, transformFn = null) => {
  try {
    // Execute the API call
    const response = await apiCall();
    
    // Log response for debugging (at debug level to avoid excessive logs)
    logDebug(`[${context}] Response received:`, {
      status: response?.status,
      statusText: response?.statusText,
      hasData: !!response?.data,
      dataType: response?.data ? typeof response.data : 'none',
      dataKeys: response?.data ? Object.keys(response.data) : 'no data',
      success: response?.data?.success,
      fullResponse: response // Include full response for debugging
    });
    
    // Handle empty or null responses
    if (!response?.data) {
      logDebug(`[${context}] Empty or null response.data, returning empty result`);
      return {
        success: true,
        message: 'No data available',
        data: []
      };
    }
    
    // If the response is already in the expected format, return it directly
    if (typeof response.data === 'object' && 'success' in response.data) {
      // Ensure the response has all required fields
      const formattedResponse = {
        success: response.data.success !== undefined ? response.data.success : true,
        message: response.data.message || 'Operation successful',
        data: response.data.data !== undefined ? response.data.data : (Array.isArray(response.data) ? response.data : []),
        ...(response.data.pagination && { pagination: response.data.pagination })
      };
      
      // Apply transform function if provided
      if (transformFn && formattedResponse.data) {
        try {
          formattedResponse.data = transformFn(formattedResponse.data);
        } catch (transformError) {
          logError(`[${context}] Error applying transform function:`, transformError);
          // Continue with untransformed data
        }
      }
      
      return formattedResponse;
    }
    
    // Handle various response formats to normalize them
    // Format 1: { data: [...] } (direct data without success flag)
    if (response?.data !== undefined) {
      const responseData = response.data;
      const transformedData = transformFn ? transformFn(responseData) : responseData;
      return {
        success: true,
        message: 'Operation successful',
        data: transformedData,
        ...(response.pagination && { pagination: response.pagination })
      };
    }
    
    // Error case: No recognizable data format
    const errorMessage = 'Unrecognized API response format';
    logWarn(`[${context}] Unexpected response structure:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    return {
      success: false,
      message: errorMessage,
      error: {
        type: 'unexpected_format',
        details: 'API returned an unrecognized data format',
        response: {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        }
      }
    };
  } catch (error) {
    // Detailed error logging for troubleshooting
    const statusCode = error.response?.status;
    const responseData = error.response?.data;
    const errorMessage = error.message || 'Unknown error occurred';
    
    logError(`[${context}] API Error (${statusCode || 'unknown status'})`, {
      message: errorMessage,
      responseData: responseData || 'No response data',
      status: statusCode
    });
    
    // Return a structured error object instead of null
    return {
      success: false,
      message: responseData?.message || errorMessage,
      error: {
        type: 'api_error',
        status: statusCode,
        message: errorMessage,
        details: responseData || {}
      }
    };
  }
};

/**
 * Creates a URLSearchParams object from an object of parameters
 * Enhanced with better handling of empty values and array parameters
 * 
 * @param {Object} params - Object containing query parameters
 * @returns {URLSearchParams} Properly formatted query parameters
 */
export const createQueryParams = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (!params || typeof params !== 'object') {
    return queryParams;
  }
  
  Object.entries(params).forEach(([key, value]) => {
    // Only add parameters that have values (filter out undefined, null, empty string)
    if (value !== undefined && value !== null && value !== '') {
      // Handle arrays by adding multiple entries with the same key
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== undefined && item !== null && item !== '') {
            queryParams.append(key, item.toString());
          }
        });
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  return queryParams;
};

/**
 * Validates a numeric ID parameter
 * @param {string|number} id - ID to validate
 * @param {string} paramName - Name of the parameter for error message
 * @returns {number} - Validated numeric ID
 * @throws {Error} - If ID is invalid
 */
/**
 * Validate and convert an ID to a number
 * Enhanced to be more resilient with consistent error handling
 * @param {any} id - The ID to validate
 * @param {string} paramName - The name of the parameter for error messages
 * @param {boolean} throwOnError - Whether to throw an error or return fallback
 * @returns {number} - The validated numeric ID or default value
 */
export const validateId = (id, paramName = 'id', throwOnError = false) => {
  try {
    // Handle edge cases gracefully
    if (id === undefined || id === null) {
      const error = new Error(`Missing ${paramName}`);
      error.status = 400;
      if (throwOnError) throw error;
      logWarn(`[validateId] ${error.message}`);
      return -1;
    }
    
    // Convert to number if it's a string or other type
    const numericId = Number(id);
    
    // Validate the converted number
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error(`Invalid ${paramName} provided: ${id}`);
      error.status = 400;
      if (throwOnError) throw error;
      logWarn(`[validateId] ${error.message}`);
      return -1;
    }
    
    return numericId;
  } catch (error) {
    if (throwOnError) throw error;
    logError(`[validateId] Error validating ${paramName}:`, error);
    return -1;
  }
};

/**
 * Standardized response formatter to ensure consistent response structure
 * 
 * @param {boolean} success - Whether the operation was successful
 * @param {any} data - The data to return
 * @param {string} message - Optional message explaining the result
 * @param {Error|Object|null} error - Optional error object
 * @returns {Object} Standardized response object
 */
export const formatResponse = (success = true, data = null, message = '', error = null) => {
  return {
    success: !!success,
    data: data === undefined ? null : data,
    message: message || (success ? 'Operation successful' : 'Operation failed'),
    ...(error ? { error: {
      message: error.message || 'Unknown error',
      code: error.code || error.status || 500,
      details: error.details || null
    }} : {})
  };
};

/**
 * Standardized error response generator
 * 
 * @param {Error|string} error - Error object or error message
 * @param {number} statusCode - HTTP status code to associate with the error
 * @param {any} details - Additional error details
 * @returns {Object} Standardized error response
 */
export const formatErrorResponse = (error, statusCode = 500, details = null) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logError(`[formatErrorResponse] ${errorMessage}`, {
    statusCode, 
    details,
    stack: error instanceof Error ? error.stack : undefined
  });
  
  return formatResponse(
    false, 
    null,
    errorMessage,
    {
      message: errorMessage,
      code: statusCode,
      details
    }
  );
};

/**
 * A caching utility that returns a cached version of a value
 * with an expiration time to avoid repeated API calls
 * 
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} expiryMs - Expiry time in milliseconds
 * @returns {Object} Cached item with metadata
 */
const cacheStorage = new Map();

export const cacheValue = (key, value, expiryMs = 5 * 60 * 1000) => {
  const expiry = Date.now() + expiryMs;
  cacheStorage.set(key, { value, expiry });
  return value;
};

/**
 * Get a cached value by key
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if expired/missing
 */
export const getCachedValue = (key) => {
  const cached = cacheStorage.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cacheStorage.delete(key);
    return null;
  }
  
  return cached.value;
};
