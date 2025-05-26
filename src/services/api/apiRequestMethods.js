/**
 * API Request Methods
 *
 * Provides standardized methods for making API requests:
 * - get, post, put, patch, delete
 * - Each method includes validation and error handling
 * - Ensures proper configuration for each request type
 */

import { logError, logWarn } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import apiClient from './apiClientCore';
import { getApiBaseUrl } from './apiClientCore';
import { performRequestWithRetry } from './apiRetryLogic';

/**
 * API utility methods
 */
export const apiUtils = {
  /**
   * Perform a GET request
   * 
   * @param {string} url - Request URL
   * @param {Object} params - URL parameters
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async get(url, params = {}, options = {}) {
    if (!url) {
      logError('[ApiClient.get] URL is required');
      throw new Error('URL is required for API request');
    }

    // Ensure params is an object
    const safeParams = params && typeof params === 'object' ? params : {};

    // Merge options with defaults
    const requestOptions = {
      ...options,
      method: 'get',
      url,
      params: safeParams,
      baseURL: options.baseURL || getApiBaseUrl()
    };

    // Perform the request with retry capability
    return performRequestWithRetry(
      (config) => {
        // Final validation before sending
        if (!config.url) {
          throw new Error('URL is required for API request');
        }
        return apiClient(config);
      },
      requestOptions,
      'ApiClient.get'
    );
  },

  /**
   * Perform a POST request
   * 
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async post(url, body, options = {}) {
    if (!url) {
      logError('[ApiClient.post] URL is required');
      throw new Error('URL is required for API request');
    }

    // Merge options with defaults
    const requestOptions = {
      ...options,
      method: 'post',
      url,
      data: body,
      baseURL: options.baseURL || getApiBaseUrl()
    };

    // Perform the request with retry capability
    return performRequestWithRetry(
      (config) => {
        // Final validation before sending
        if (!config.url) {
          throw new Error('URL is required for API request');
        }
        return apiClient(config);
      },
      requestOptions,
      'ApiClient.post'
    );
  },

  /**
   * Perform a PUT request
   * 
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async put(url, body, options = {}) {
    if (!url) {
      logError('[ApiClient.put] URL is required');
      throw new Error('URL is required for API request');
    }

    // Merge options with defaults
    const requestOptions = {
      ...options,
      method: 'put',
      url,
      data: body,
      baseURL: options.baseURL || getApiBaseUrl()
    };

    // Perform the request with retry capability
    return performRequestWithRetry(
      (config) => {
        // Final validation before sending
        if (!config.url) {
          throw new Error('URL is required for API request');
        }
        return apiClient(config);
      },
      requestOptions,
      'ApiClient.put'
    );
  },

  /**
   * Perform a PATCH request
   * 
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async patch(url, body, options = {}) {
    if (!url) {
      logError('[ApiClient.patch] URL is required');
      throw new Error('URL is required for API request');
    }

    // Merge options with defaults
    const requestOptions = {
      ...options,
      method: 'patch',
      url,
      data: body,
      baseURL: options.baseURL || getApiBaseUrl()
    };

    // Perform the request with retry capability
    return performRequestWithRetry(
      (config) => {
        // Final validation before sending
        if (!config.url) {
          throw new Error('URL is required for API request');
        }
        return apiClient(config);
      },
      requestOptions,
      'ApiClient.patch'
    );
  },

  /**
   * Perform a DELETE request
   * 
   * @param {string} url - Request URL
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async delete(url, options = {}) {
    if (!url) {
      logError('[ApiClient.delete] URL is required');
      throw new Error('URL is required for API request');
    }

    // Merge options with defaults
    const requestOptions = {
      ...options,
      method: 'delete',
      url,
      baseURL: options.baseURL || getApiBaseUrl()
    };

    // Perform the request with retry capability
    return performRequestWithRetry(
      (config) => {
        // Final validation before sending
        if (!config.url) {
          throw new Error('URL is required for API request');
        }
        return apiClient(config);
      },
      requestOptions,
      'ApiClient.delete'
    );
  },

  /**
   * Get the raw axios instance
   * 
   * @returns {Object} Axios instance
   */
  getRawInstance() {
    return apiClient;
  }
};

// Export individual methods
export const { get, post, put, patch, delete: del, getRawInstance } = apiUtils;

// Export default
export default apiUtils;
