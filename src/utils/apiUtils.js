/* src/utils/apiUtils.js - Centralized API utilities */

/**
 * Custom API Error class for standardized error handling
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
import { logError, logWarn, logDebug } from './logger.js';
import config from '../config.js';

/**
 * Standardized error handler for API responses
 * @param {Object} error - The error object
 * @param {String} context - The context/location where the error occurred
 * @returns {Object} - Standardized error object with message and details
 */
export const handleApiError = (error, context = 'API') => {
  // Axios error structure
  const status = error.response?.status;
  const data = error.response?.data;
  
  // Get meaningful error message
  let message = error.message || 'Unknown error occurred';
  if (data?.message) {
    message = data.message;
  } else if (status) {
    message = `Request failed with status ${status}`;
  }
  
  // Log appropriate level based on status
  if (status === 401 || status === 403) {
    logWarn(`[${context}] Authorization error: ${message}`);
  } else if (status === 404) {
    logWarn(`[${context}] Resource not found: ${message}`);
  } else {
    logError(`[${context}] Error: ${message}`, error);
  }
  
  // Return standardized error object
  return {
    message,
    status,
    details: data?.details || null,
    code: data?.code || null,
    originalError: error
  };
};

/**
 * Enhanced logger for API requests
 * @param {String} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {String} method - HTTP method
 * @param {String} context - Context for logging
 */
export const logApiRequest = (endpoint, params, method = 'GET', context = 'API') => {
  logDebug(`[${context}] ${method.toUpperCase()} Request to "${endpoint}"`, 
    params ? { parameters: params } : '');
};

/**
 * Enhanced logger for API responses
 * @param {Object} response - API response
 * @param {String} endpoint - API endpoint
 * @param {String} context - Context for logging
 */
export const logApiResponse = (response, endpoint, context = 'API') => {
  const { status, data } = response;
  logDebug(`[${context}] Response from "${endpoint}": Status ${status}`, data);
};

/**
 * Helper to determine if we should use specific port for API calls
 * Used to resolve CORS issues between frontend and backend
 * @returns {Boolean} True if specific port should be enforced
 */
export const shouldForceApiPort = () => {
  return config.NODE_ENV === 'development' && 
    config.VITE_API_BASE_URL.includes('localhost');
};

/**
 * Get the appropriate API base URL based on environment
 * @returns {String} The API base URL to use
 */
export const getApiBaseUrl = () => {
  if (shouldForceApiPort()) {
    // Ensure we're using port 5173 when needed
    return config.VITE_API_BASE_URL.replace(/localhost:\d+/, 'localhost:5173');
  }
  return config.VITE_API_BASE_URL;
};

export default {
  handleApiError,
  logApiRequest,
  logApiResponse,
  shouldForceApiPort,
  getApiBaseUrl
};
