/**
 * Base Service
 * 
 * Provides a foundation for all service classes with standardized
 * error handling, response processing, and logging.
 */
import { apiClient } from '@/services/http';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Base Service class
 * All service classes should extend this base class
 */
class BaseService {
  /**
   * Constructor
   * @param {string} baseUrl - Base URL for API endpoints
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Make an API request with standardized error handling
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} options.endpoint - API endpoint (will be appended to baseUrl)
   * @param {Object} options.data - Request data (for POST, PUT)
   * @param {Object} options.params - Query parameters
   * @param {Object} options.headers - Additional headers
   * @param {boolean} options.withCredentials - Whether to include credentials
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {Function} options.transformResponse - Function to transform response data
   * @param {Function} options.onSuccess - Function to call on success
   * @param {Function} options.onError - Function to call on error
   * @returns {Promise<Object>} Response data or error object
   */
  async request({
    method = 'GET',
    endpoint = '',
    data = null,
    params = null,
    headers = {},
    withCredentials = true,
    timeout = 30000,
    transformResponse = null,
    onSuccess = null,
    onError = null
  }) {
    const url = `${this.baseUrl}${endpoint}`;
    
    logDebug(`[${this.constructor.name}] ${method} ${url}`);
    
    try {
      const response = await apiClient({
        method,
        url,
        data,
        params,
        headers,
        withCredentials,
        timeout
      });
      
      // Transform response if needed
      const responseData = transformResponse ? 
        transformResponse(response.data) : 
        response.data;
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      return {
        success: true,
        data: responseData,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      logError(`[${this.constructor.name}] Error in ${method} ${url}:`, error);
      
      // Prepare standardized error response
      const errorResponse = this.handleRequestError(error);
      
      // Call error callback if provided
      if (onError) {
        onError(errorResponse);
      }
      
      return errorResponse;
    }
  }
  
  /**
   * Handle request errors in a standardized way
   * @param {Error} error - Error object
   * @returns {Object} Standardized error response
   */
  handleRequestError(error) {
    // Default error response
    const errorResponse = {
      success: false,
      message: 'An unexpected error occurred',
      status: 500,
      error: error
    };
    
    // Handle Axios error
    if (error.response) {
      // Server responded with an error status code
      errorResponse.status = error.response.status;
      errorResponse.data = error.response.data;
      errorResponse.message = error.response.data?.message || 
                             `Request failed with status ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response received
      errorResponse.status = 0;
      errorResponse.message = 'No response received from server';
      
      // Check if offline
      if (!navigator.onLine) {
        errorResponse.offline = true;
        errorResponse.message = 'You are currently offline';
      }
    }
    
    return errorResponse;
  }
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data or error object
   */
  async get(endpoint, options = {}) {
    return this.request({
      method: 'GET',
      endpoint,
      ...options
    });
  }
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data or error object
   */
  async post(endpoint, data, options = {}) {
    return this.request({
      method: 'POST',
      endpoint,
      data,
      ...options
    });
  }
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data or error object
   */
  async put(endpoint, data, options = {}) {
    return this.request({
      method: 'PUT',
      endpoint,
      data,
      ...options
    });
  }
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data or error object
   */
  async delete(endpoint, options = {}) {
    return this.request({
      method: 'DELETE',
      endpoint,
      ...options
    });
  }
  
  /**
   * Create query parameters string
   * @param {Object} params - Query parameters
   * @returns {string} Query parameters string
   */
  createQueryParams(params) {
    if (!params) return '';
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(`${key}[]`, item));
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}

export default BaseService;
