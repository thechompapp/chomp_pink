/**
 * Robust API Client for Testing
 * 
 * This module provides a robust API client for testing the application.
 * It includes functions for making API requests with proper error handling,
 * authentication, and response processing.
 */

import axios from 'axios';
import { endpoints, testUsers } from './config.js';

// In-memory storage for testing in Node.js environment
const memoryStorage = {
  _store: {},
  getItem(key) {
    return this._store[key] || null;
  },
  setItem(key, value) {
    this._store[key] = value;
  },
  removeItem(key) {
    delete this._store[key];
  }
};

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Token storage that works in both browser and Node.js
const tokenStorage = {
  getToken() {
    if (isBrowser) {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    } else {
      return memoryStorage.getItem('authToken');
    }
  },
  setToken(token, remember = false) {
    if (isBrowser) {
      if (remember) {
        localStorage.setItem('authToken', token);
      } else {
        sessionStorage.setItem('authToken', token);
      }
    } else {
      memoryStorage.setItem('authToken', token);
    }
  },
  clearToken() {
    if (isBrowser) {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    } else {
      memoryStorage.removeItem('authToken');
    }
  }
};

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: endpoints.baseUrl,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Allow absolute URLs to be used in tests
  allowAbsoluteUrls: true
});

console.log('API Client configured with baseURL:', apiClient.defaults.baseURL);

// Add tokenStorage to the apiClient instance
apiClient.tokenStorage = tokenStorage;

// Request interceptor to add auth token
apiClient.interceptors.request.use(config => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        config: {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Login a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {boolean} remember - Whether to remember the user
 * @returns {Promise<Object>} User data and token
 */
const login = async (credentials) => {
  try {
    // Handle both object and individual parameters
    const email = typeof credentials === 'object' ? credentials.email : credentials;
    const password = typeof credentials === 'object' ? credentials.password : arguments[1];
    const remember = typeof credentials === 'object' ? credentials.remember : arguments[2] || false;

    console.log('Attempting login with:', { 
      email, 
      endpoint: endpoints.auth.login,
      requestBody: { email, password: '***' } // Don't log actual password
    });
    
    const response = await apiClient.post(
      endpoints.auth.login,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      }
    );
    
    console.log('Login response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    
    // Store the token if login was successful
    if (response.data?.token) {
      apiClient.tokenStorage.setToken(response.data.token);
      return {
        success: true,
        status: response.status,
        data: response.data,
        error: null
      };
    }
    
    // Handle error responses
    return {
      success: false,
      status: response.status,
      data: response.data,
      error: response.data?.error || {
        code: 'LOGIN_FAILED',
        message: response.data?.message || 'Login failed',
        details: response.data
      }
    };
    
  } catch (error) {
    console.error('Login failed with error:', error);
    
    // Handle network errors or other exceptions
    let errorDetails = {};
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        message: error.response.data?.message || 'Login failed',
        code: error.response.data?.error?.code || 'LOGIN_ERROR'
      };
      console.error('Response error details:', errorDetails);
    } else if (error.request) {
      // The request was made but no response was received
      errorDetails = {
        message: 'No response from server',
        code: 'NO_RESPONSE'
      };
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      errorDetails = {
        message: error.message,
        code: 'REQUEST_ERROR',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      console.error('Request setup error:', error.message);
    }
    
    return {
      success: false,
      status: error.response?.status || 0,
      error: errorDetails,
      data: error.response?.data
    };
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registered user data
 */
const register = async (userData) => {
  try {
    console.log('Attempting registration with:', { email: userData.email, endpoint: endpoints.auth.register });
    
    const response = await apiClient.post(endpoints.auth.register, userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Resolve only if the status code is less than 500
      }
    });

    console.log('Registration response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });

    // Return both the status and data for the test to use
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      error: response.data.error
    };
  } catch (error) {
    console.error('Registration failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
const logout = async () => {
  try {
    await apiClient.post(endpoints.auth.logout);
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    tokenStorage.clearToken();
  }
};

/**
 * Get the current user's status
 * @returns {Promise<Object>} User status data
 */
const getStatus = async () => {
  try {
    const response = await apiClient.get(endpoints.auth.status);
    return response.data;
  } catch (error) {
    console.error('Failed to get user status:', error);
    throw error;
  }
};

/**
 * Get health status of the API
 * @returns {Promise<Object>} Health status data
 */
const getHealth = async () => {
  try {
    // Use a direct HTTP request with the same parameters as the working curl command
    const response = await fetch('http://localhost:5001/api/health', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'curl/8.7.1'
      }
    });
    
    const data = await response.json();
    
    console.log('Health check response:', {
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // The API returns the health data directly, not wrapped in a data property
    return {
      success: response.ok,
      status: response.status,
      ...data // Spread the response data directly
    };
  } catch (error) {
    console.error('Health check failed:', {
      message: error.message,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      },
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      },
      stack: error.stack
    });
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.message,
      ...(error.response?.data || {})
    };
  }
};

// Export the API client and utility functions
export {
  apiClient,
  tokenStorage,
  login,
  logout,
  register,
  getStatus,
  getHealth
};

export default apiClient;
