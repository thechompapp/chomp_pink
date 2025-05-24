/**
 * API Client for E2E Testing
 * 
 * This client provides robust error handling and logging for API requests.
 */

import axios from 'axios';

// Base URL and timeout for API requests
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 3000; // Shorter timeout for faster test execution

// Create a simple in-memory storage for tokens
const tokenStorage = {
  token: null,
  setToken(token) {
    this.token = token;
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
  clearToken() {
    this.token = null;
    delete axiosInstance.defaults.headers.common['Authorization'];
  },
  getToken() {
    return this.token;
  }
};

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, 
        error.response.data?.message || error.response.data || error.message);
    } else if (error.request) {
      console.error('[API Error] No response received:', error.message);
    } else {
      console.error('[API Error] Request setup failed:', error.message);
    }
    return Promise.reject(error);
  }
);

// API client with utility methods
const apiClient = {
  // Set auth token for requests
  setAuthToken(token) {
    tokenStorage.setToken(token);
  },
  
  // Clear auth token
  clearAuthToken() {
    tokenStorage.clearToken();
  },
  
  // Get current auth token
  getAuthToken() {
    return tokenStorage.getToken();
  },
  
  // Perform GET request
  async get(url, config = {}) {
    try {
      return await axiosInstance.get(url, config);
    } catch (error) {
      // Handle and rethrow
      throw error;
    }
  },
  
  // Perform POST request
  async post(url, data = {}, config = {}) {
    try {
      return await axiosInstance.post(url, data, config);
    } catch (error) {
      // Handle and rethrow
      throw error;
    }
  },
  
  // Perform PUT request
  async put(url, data = {}, config = {}) {
    try {
      return await axiosInstance.put(url, data, config);
    } catch (error) {
      // Handle and rethrow
      throw error;
    }
  },
  
  // Perform PATCH request
  async patch(url, data = {}, config = {}) {
    try {
      return await axiosInstance.patch(url, data, config);
    } catch (error) {
      // Handle and rethrow
      throw error;
    }
  },
  
  // Perform DELETE request
  async delete(url, config = {}) {
    try {
      return await axiosInstance.delete(url, config);
    } catch (error) {
      // Handle and rethrow
      throw error;
    }
  }
};

export default apiClient;
