/**
 * Service Helpers
 * 
 * Utility functions for standardizing API service behavior.
 * These helpers ensure consistent error handling, parameter validation,
 * and response processing across all services.
 */
import { logDebug, logError, logWarn } from '@/utils/logger';

/**
 * Validate an ID parameter
 * @param {string|number} id - ID to validate
 * @param {string} entityName - Name of the entity (for error messages)
 * @returns {number|null} Validated ID as a number, or null if invalid
 */
export const validateId = (id, entityName = 'resource') => {
  if (id === undefined || id === null) {
    logWarn(`[serviceHelpers] Invalid ${entityName} ID: ${id}`);
    return null;
  }
  
  // Convert to number if it's a string
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  // Check if it's a valid number
  if (isNaN(numericId) || numericId <= 0) {
    logWarn(`[serviceHelpers] Invalid ${entityName} ID: ${id}`);
    return null;
  }
  
  return numericId;
};

/**
 * Create query parameters string from an object
 * @param {Object} params - Query parameters
 * @returns {string} Query string (without leading ?)
 */
export const createQueryParams = (params) => {
  if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
    return '';
  }
  
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle arrays
      if (Array.isArray(value)) {
        return value
          .map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join('&');
      }
      
      // Handle boolean values
      if (typeof value === 'boolean') {
        return `${encodeURIComponent(key)}=${value ? 'true' : 'false'}`;
      }
      
      // Handle other values
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
};

/**
 * Handle API response consistently
 * @param {Promise} apiCall - API call promise
 * @param {Object} options - Options
 * @param {string} options.entity - Entity name for logging
 * @param {string} options.operation - Operation name for logging
 * @param {*} options.defaultValue - Default value to return on error
 * @param {Function} options.transform - Transform function for response data
 * @returns {Promise<*>} Processed response data or default value on error
 */
export const handleApiResponse = async (
  apiCall,
  {
    entity = 'resource',
    operation = 'fetch',
    defaultValue = null,
    transform = (data) => data
  } = {}
) => {
  try {
    logDebug(`[serviceHelpers] ${operation} ${entity} - API call started`);
    
    const response = await apiCall;
    
    // Check if response exists
    if (!response) {
      logWarn(`[serviceHelpers] ${operation} ${entity} - Empty response`);
      return defaultValue;
    }
    
    // Handle different response formats
    let data;
    
    if (response.data !== undefined) {
      // Standard axios response
      data = response.data;
    } else if (response.success !== undefined) {
      // Custom response format with success flag
      if (!response.success) {
        throw new Error(response.message || `Failed to ${operation} ${entity}`);
      }
      data = response.data;
    } else {
      // Assume the response itself is the data
      data = response;
    }
    
    // Transform the data if needed
    const transformedData = transform(data);
    
    logDebug(`[serviceHelpers] ${operation} ${entity} - Success`);
    return transformedData;
  } catch (error) {
    logError(`[serviceHelpers] ${operation} ${entity} - Error:`, error);
    
    // Return default value instead of throwing
    return defaultValue;
  }
};

/**
 * Parse API error to get a user-friendly message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const parseApiError = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }
  
  // Check for axios error with response
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle different status codes
    if (status === 401 || status === 403) {
      return 'Authentication error. Please log in again.';
    }
    
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (status === 422) {
      return 'Validation error. Please check your input.';
    }
    
    if (status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    // Try to extract error message from response data
    if (data) {
      if (typeof data === 'string') {
        return data;
      }
      
      if (data.message) {
        return data.message;
      }
      
      if (data.error) {
        return typeof data.error === 'string' ? data.error : 'An error occurred';
      }
    }
  }
  
  // Handle network errors
  if (error.request && !error.response) {
    return 'Network error. Please check your connection.';
  }
  
  // Use error message as fallback
  return error.message || 'An unknown error occurred';
};

export default {
  validateId,
  createQueryParams,
  handleApiResponse,
  parseApiError
};
