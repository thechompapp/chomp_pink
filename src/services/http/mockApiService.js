/**
 * Mock API Service
 * 
 * Provides mock API responses for development mode including:
 * - Mock response generation
 * - Development mode detection
 * - Fallback data handling
 */

import { logDebug, logInfo } from '@/utils/logger';

/**
 * Check if we should use mock API responses
 * @returns {boolean} Whether to use mock responses
 */
export function shouldUseMockApi() {
  // Safe environment variable access for browser compatibility
  const getEnvVar = (key) => {
    // Check Vite environment variables first (import.meta is always available in ES modules)
    if (import.meta && import.meta.env) {
      return import.meta.env[key];
    }
    
    // Check process.env if available (Node.js/webpack environments)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    
    // Check window environment variables as fallback
    if (typeof window !== 'undefined' && window.__ENV__) {
      return window.__ENV__[key];
    }
    
    return undefined;
  };

  // Only use mock API in development mode when specifically enabled
  const nodeEnv = getEnvVar('NODE_ENV') || getEnvVar('VITE_MODE') || 'development';
  if (nodeEnv !== 'development') {
    return false;
  }
  
  // Check environment variables for mock API enablement
  return getEnvVar('REACT_APP_USE_MOCK_API') === 'true' || 
         getEnvVar('VITE_USE_MOCK_API') === 'true' ||
         getEnvVar('USE_MOCK_API') === 'true';
}

/**
 * Create a mock response from an error
 * @param {Error} error - Original error
 * @returns {Object} Mock response object
 */
export function createMockResponseFromError(error) {
  const url = error.config?.url || 'unknown';
  const method = error.config?.method || 'get';
  
  logInfo(`[MockApiService] Creating mock response for ${method.toUpperCase()} ${url}`);
  
  // Generate mock data based on the endpoint
  const mockData = generateMockDataForEndpoint(url, method);
  
  return {
    data: mockData,
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json',
      'x-mock-response': 'true'
    },
    config: error.config
  };
}

/**
 * Generate mock data for a specific endpoint
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @returns {Object} Mock data
 */
function generateMockDataForEndpoint(url, method) {
  // Remove query parameters for matching
  const cleanUrl = url.split('?')[0];
  
  // Handle different endpoints
  if (cleanUrl.includes('/auth/login')) {
    return {
      success: true,
      data: {
        user: {
          id: 1,
          username: 'mock_user',
          email: 'mock@example.com',
          account_type: 'user'
        },
        token: 'mock_jwt_token_' + Date.now()
      }
    };
  }
  
  if (cleanUrl.includes('/restaurants')) {
    return generateMockRestaurants(method);
  }
  
  if (cleanUrl.includes('/lists')) {
    return generateMockLists(method);
  }
  
  if (cleanUrl.includes('/admin')) {
    return generateMockAdminData(cleanUrl, method);
  }
  
  if (cleanUrl.includes('/users')) {
    return generateMockUsers(method);
  }
  
  // Default mock response
  return {
    success: true,
    data: [],
    message: 'Mock response generated',
    pagination: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0
    }
  };
}

/**
 * Generate mock restaurant data
 * @param {string} method - HTTP method
 * @returns {Object} Mock restaurant data
 */
function generateMockRestaurants(method) {
  if (method === 'post' || method === 'put') {
    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        name: 'Mock Restaurant',
        address: '123 Mock Street, New York, NY 10001',
        cuisine: 'Mock Cuisine',
        created_at: new Date().toISOString()
      }
    };
  }
  
  // GET request
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Mock Restaurant 1',
        address: '123 Mock Street, New York, NY 10001',
        cuisine: 'Italian',
        rating: 4.5
      },
      {
        id: 2,
        name: 'Mock Restaurant 2',
        address: '456 Test Avenue, New York, NY 10002',
        cuisine: 'Mexican',
        rating: 4.2
      }
    ],
    pagination: {
      page: 1,
      limit: 25,
      total: 2,
      totalPages: 1
    }
  };
}

/**
 * Generate mock list data
 * @param {string} method - HTTP method
 * @returns {Object} Mock list data
 */
function generateMockLists(method) {
  if (method === 'post' || method === 'put') {
    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        name: 'Mock List',
        description: 'A mock list for testing',
        created_at: new Date().toISOString()
      }
    };
  }
  
  // GET request
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'My Favorite Restaurants',
        description: 'A curated list of my favorite places',
        item_count: 5
      },
      {
        id: 2,
        name: 'Want to Try',
        description: 'Places I want to visit',
        item_count: 12
      }
    ],
    pagination: {
      page: 1,
      limit: 25,
      total: 2,
      totalPages: 1
    }
  };
}

/**
 * Generate mock admin data
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @returns {Object} Mock admin data
 */
function generateMockAdminData(url, method) {
  if (url.includes('/submissions')) {
    return {
      success: true,
      data: [
        {
          id: 1,
          restaurant_name: 'Mock Submission',
          status: 'pending',
          submitted_at: new Date().toISOString()
        }
      ]
    };
  }
  
  return {
    success: true,
    data: [],
    message: 'Mock admin data'
  };
}

/**
 * Generate mock user data
 * @param {string} method - HTTP method
 * @returns {Object} Mock user data
 */
function generateMockUsers(method) {
  if (method === 'post' || method === 'put') {
    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        username: 'mock_user_' + Date.now(),
        email: 'mock@example.com',
        created_at: new Date().toISOString()
      }
    };
  }
  
  // GET request
  return {
    success: true,
    data: [
      {
        id: 1,
        username: 'mock_user_1',
        email: 'user1@example.com',
        account_type: 'user'
      },
      {
        id: 2,
        username: 'mock_user_2',
        email: 'user2@example.com',
        account_type: 'admin'
      }
    ],
    pagination: {
      page: 1,
      limit: 25,
      total: 2,
      totalPages: 1
    }
  };
}

/**
 * Add delay to mock responses to simulate network latency
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise} Promise that resolves after delay
 */
export function addMockDelay(min = 100, max = 500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Create a mock interceptor for axios instance
 * @param {Object} axiosInstance - Axios instance
 */
export function setupMockInterceptor(axiosInstance) {
  if (!shouldUseMockApi()) {
    return;
  }
  
  logInfo('[MockApiService] Setting up mock API interceptor for development');
  
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Only mock if it's a network error or 500+ status
      if (!error.response || error.response.status >= 500) {
        logDebug('[MockApiService] Intercepting error for mock response');
        
        // Add realistic delay
        await addMockDelay();
        
        // Create and return mock response
        const mockResponse = createMockResponseFromError(error);
        return Promise.resolve(mockResponse);
      }
      
      // Let other errors pass through
      return Promise.reject(error);
    }
  );
} 