// Setup for integration tests
import { vi, beforeAll, afterEach } from 'vitest';
import axios from 'axios';
import { config } from './config';

// Simple in-memory storage for tests
const testStorage = {
  _store: new Map(),
  setItem(key, value) {
    this._store.set(key, value);
  },
  getItem(key) {
    return this._store.get(key) || null;
  },
  removeItem(key) {
    this._store.delete(key);
  },
  clear() {
    this._store.clear();
  }
};

// Configure axios defaults
axios.defaults.baseURL = config.api.baseUrl;
axios.defaults.timeout = config.api.timeout;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Global test setup
global.axios = axios;

// Mock localStorage for tests
const localStorage = {
  ...testStorage
};

global.localStorage = localStorage;

// Add request interceptor to include auth token if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Clean up after each test
afterEach(() => {
  // Clear any test data
  testStorage.clear();
});

// Helper function to authenticate and get token
const authenticate = async (credentials) => {
  try {
    const response = await axios.post('/auth/login', credentials);
    if (response.data?.token) {
      const token = response.data.token;
      tokenStorage.setToken(token);
      return {
        success: true,
        data: {
          token,
          user: response.data.user
        }
      };
    }
    throw new Error('No token received');
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return {
      success: false,
      error: error.message,
      data: error.response?.data
    };
  }
};

// Helper function to register a new user
const registerUser = async (userData) => {
  try {
    const response = await axios.post('/auth/register', userData);
    if (response.data?.token) {
      const token = response.data.token;
      tokenStorage.setToken(token);
      return {
        success: true,
        data: {
          token,
          user: response.data.user
        }
      };
    }
    throw new Error('Registration failed: No token received');
  } catch (error) {
    console.error('Registration failed:', error.message);
    return {
      success: false,
      error: error.message,
      data: error.response?.data
    };
  }
};

// Make authenticate available globally for tests
global.authenticate = authenticate;

// Add any global test utilities here
global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle API responses
global.handleApiResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  }
  return {
    success: false,
    status: response.status,
    error: response.data?.message || 'Request failed',
    data: response.data
  };
};

// Helper function for retrying flaky operations
global.withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};
