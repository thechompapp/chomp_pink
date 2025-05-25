/**
 * Simplified API Client for E2E Tests
 * 
 * This file provides a lightweight API client for E2E tests
 * without database dependencies.
 * 
 * @module test/setup/simplified-api-client
 */

import axios from 'axios';

/**
 * In-memory token storage for testing purposes
 * @type {Object}
 * @property {string|null} token - The authentication token
 * @property {Function} setItem - Set a key-value pair in storage
 * @property {Function} getItem - Get a value from storage by key
 * @property {Function} removeItem - Remove a key from storage
 */
const tokenStorage = {
  token: null,
  
  /**
   * Set a key-value pair in storage
   * @param {string} key - The key to set
   * @param {string} value - The value to store
   */
  setItem(key, value) {
    this[key] = value;
  },
  
  /**
   * Get a value from storage by key
   * @param {string} key - The key to retrieve
   * @returns {string|null} The stored value or null if not found
   */
  getItem(key) {
    return this[key] || null;
  },
  
  /**
   * Remove a key from storage
   * @param {string} key - The key to remove
   */
  removeItem(key) {
    this[key] = null;
  }
};

/**
 * Create an axios instance with default configuration
 * @type {import('axios').AxiosInstance}
 */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token
apiClient.interceptors.request.use(
  /**
   * Add authorization token to request headers if available
   * @param {import('axios').AxiosRequestConfig} config - The request config
   * @returns {import('axios').AxiosRequestConfig} The modified request config
   */
  (config) => {
    const token = tokenStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  /**
   * Handle request error
   * @param {Error} error - The error that occurred
   * @returns {Promise<never>} A rejected promise with the error
   */
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  /**
   * Process successful responses
   * @param {import('axios').AxiosResponse} response - The response object
   * @returns {any} The response data
   */
  (response) => response.data,
  /**
   * Process error responses
   * @param {import('axios').AxiosError} error - The error object
   * @returns {Promise<never>} A rejected promise with the error
   */
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Handle API request with improved error handling
 * @template T
 * @param {() => Promise<T>} requestFn - The async function that makes the API request
 * @param {string} description - Description of the request for logging
 * @returns {Promise<T>} The response data
 * @throws {Error} Enhanced error with additional context
 */
const handleApiRequest = async (requestFn, description) => {
  try {
    console.log(`Starting: ${description}`);
    const startTime = Date.now();
    
    const response = await requestFn();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Success (${duration}ms): ${description}`);
    
    return response;
  } catch (error) {
    console.error(`❌ Error in ${description}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    
    // Add more context to the error
    const enhancedError = new Error(`API Request Failed: ${description} - ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.responseData = error.response?.data;
    
    throw enhancedError;
  }
};

/**
 * Set authentication token for subsequent requests
 * @param {string} token - The JWT token
 */
const setAuthToken = (token) => {
  if (!token) {
    console.warn('Setting empty auth token');
  }
  
  tokenStorage.setItem('token', token);
  
  // Also set the default Authorization header
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

/**
 * Clear authentication token
 */
const clearAuthToken = () => {
  tokenStorage.removeItem('token');
  delete apiClient.defaults.headers.common.Authorization;
};

/**
 * Set a custom token for testing invalid auth scenarios
 * @param {string} token - Custom token to use for testing
 */
const setCustomToken = (token) => {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
};

// Export the API client and utility functions
export {
  apiClient,
  tokenStorage,
  handleApiRequest,
  setAuthToken,
  clearAuthToken,
  setCustomToken
};

export default {
  apiClient,
  tokenStorage,
  handleApiRequest,
  setAuthToken,
  clearAuthToken,
  setCustomToken
};
