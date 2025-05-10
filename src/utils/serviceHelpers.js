/* src/utils/serviceHelpers.js */
import { logDebug, logError, logWarn } from './logger.js';

/**
 * Standardized API response handler for services
 * @param {Function} apiCall - Async function that makes the API call using apiClient
 * @param {String} context - Context description for logging
 * @param {Function} transformFn - Optional function to transform successful response data
 * @returns {Promise<any>} - Processed response data
 */
export const handleApiResponse = async (apiCall, context, transformFn = null) => {
  try {
    const response = await apiCall();
    logDebug(`[${context}] Response:`, response);
    
    // apiClient should return { data: { success: boolean, data: any, message: string } }
    if (response?.data?.success) {
      const responseData = response.data.data;
      return transformFn ? transformFn(responseData) : responseData;
    } else {
      const errorMessage = response?.data?.message || 'Request failed';
      logWarn(`[${context}] Request unsuccessful: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  } catch (error) {
    logError(`[${context}] Error:`, error);
    throw error;
  }
};

/**
 * Creates standardized query params from a params object
 * @param {Object} params - Parameters to convert to query string
 * @returns {URLSearchParams} - URLSearchParams object for API calls
 */
export const createQueryParams = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== null && item !== undefined) {
          queryParams.append(key, item.toString());
        }
      });
    } else {
      queryParams.append(key, value.toString());
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
      console.warn(`[validateId] ${error.message}`);
      return -1;
    }
    
    // Convert to number if it's a string or other type
    const numericId = Number(id);
    
    // Validate the converted number
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error(`Invalid ${paramName} provided: ${id}`);
      error.status = 400;
      if (throwOnError) throw error;
      console.warn(`[validateId] ${error.message}`);
      return -1;
    }
    
    return numericId;
  } catch (error) {
    if (throwOnError) throw error;
    console.error(`[validateId] Error validating ${paramName}:`, error);
    return -1;
  }
};
