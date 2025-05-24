/**
 * Simplified API Client for E2E Tests
 * 
 * This file provides a lightweight API client for E2E tests
 * without database dependencies.
 */

import axios from 'axios';

// Create a simple in-memory storage for tokens
const tokenStorage = {
  token: null,
  setItem(key, value) {
    this[key] = value;
  },
  getItem(key) {
    return this[key] || null;
  },
  removeItem(key) {
    this[key] = null;
  }
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:5173/api',
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Request': 'true'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log detailed error information for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

/**
 * API request wrapper with standardized error handling
 * @param {Function} requestFn - Function that returns a promise from axios
 * @param {string} context - Context for error messages
 * @returns {Promise<Object>} - Standardized response object
 */
export const handleApiRequest = async (requestFn, context = 'API Request') => {
  try {
    const response = await requestFn();
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || error.message,
      data: error.response?.data,
      context
    };
  }
};

/**
 * Set authentication token for subsequent requests
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    tokenStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    tokenStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Clear authentication token
 */
export const clearAuthToken = () => {
  tokenStorage.removeItem('token');
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Set a custom token for testing invalid auth scenarios
 * @param {string} token - Custom token to use
 */
export const setCustomToken = (token) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default apiClient;
