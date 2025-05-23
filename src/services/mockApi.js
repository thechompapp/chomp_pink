/**
 * Mock API Service
 * 
 * This module provides mock responses for API endpoints when real requests fail
 * (such as with the "Cannot read properties of undefined (reading 'toUpperCase')" error).
 * 
 * It's designed as a fallback to ensure the application doesn't crash due to API errors.
 */

import { logDebug, logWarn } from '@/utils/logger';

/**
 * Map of endpoint patterns to mock response generators
 * Each function returns a mock response based on the request parameters
 */
const mockResponses = {
  // Lists endpoint
  '/lists': (params = {}) => {
    logDebug('[MockAPI] Generating mock response for /lists', params);
    
    return {
      lists: [],
      totalLists: 0,
      page: parseInt(params.page) || 1,
      limit: parseInt(params.limit) || 25,
      total: 0
    };
  },
  
  // Restaurants endpoint
  '/restaurants': (params = {}) => {
    logDebug('[MockAPI] Generating mock response for /restaurants', params);
    
    return {
      restaurants: [],
      totalRestaurants: 0,
      page: parseInt(params.page) || 1,
      limit: parseInt(params.limit) || 25,
      total: 0
    };
  },
  
  // Dishes endpoint
  '/dishes': (params = {}) => {
    logDebug('[MockAPI] Generating mock response for /dishes', params);
    
    return {
      dishes: [],
      totalDishes: 0,
      page: parseInt(params.page) || 1,
      limit: parseInt(params.limit) || 25,
      total: 0
    };
  },
  
  // Cities endpoint
  '/cities': () => {
    logDebug('[MockAPI] Generating mock response for /cities');
    
    return [
      { id: 1, name: 'New York', slug: 'new-york' },
      { id: 2, name: 'Los Angeles', slug: 'los-angeles' },
      { id: 3, name: 'Chicago', slug: 'chicago' },
      { id: 4, name: 'Miami', slug: 'miami' }
    ];
  },
  
  // Neighborhoods endpoint
  '/neighborhoods': () => {
    logDebug('[MockAPI] Generating mock response for /neighborhoods');
    
    return {
      boroughs: [
        { id: 1, name: 'Manhattan', slug: 'manhattan' },
        { id: 2, name: 'Brooklyn', slug: 'brooklyn' },
        { id: 3, name: 'Queens', slug: 'queens' },
        { id: 4, name: 'Bronx', slug: 'bronx' },
        { id: 5, name: 'Staten Island', slug: 'staten-island' }
      ],
      neighborhoods: []
    };
  },
  
  // Default mock response for any other endpoint
  'default': () => {
    logWarn('[MockAPI] No specific mock response defined for this endpoint');
    
    return {
      success: false,
      message: 'Mock API response - endpoint not specifically mocked',
      data: []
    };
  }
};

/**
 * Get a mock response for a specific endpoint
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} params - Request parameters
 * @returns {Object} - Mock response data
 */
export function getMockResponse(url, params = {}) {
  // Clean up URL to match patterns
  const cleanUrl = url.split('?')[0]; // Remove query parameters
  const trimmedUrl = cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl; // Remove trailing slash
  
  // Find the matching mock response generator
  for (const [pattern, generator] of Object.entries(mockResponses)) {
    if (trimmedUrl.endsWith(pattern) || trimmedUrl === pattern) {
      return {
        success: true,
        data: generator(params),
        _isMockResponse: true
      };
    }
  }
  
  // No specific match found, use default
  return {
    success: false,
    data: mockResponses.default(params),
    _isMockResponse: true
  };
}

/**
 * Create a mock response for a failed axios request
 * 
 * @param {Object} error - Axios error
 * @returns {Object} - Mock response object
 */
export function createMockResponseFromError(error) {
  try {
    // Extract request information from the error
    const config = error.config || {};
    const url = config.url || '';
    const params = config.params || {};
    
    // Get the appropriate mock response
    const mockResponse = getMockResponse(url, params);
    
    // Create a response-like object
    return {
      data: mockResponse,
      status: 200,
      statusText: 'OK (Mock)',
      headers: {},
      config,
      request: error.request,
      _isMockResponse: true
    };
  } catch (mockError) {
    logWarn('[MockAPI] Error creating mock response:', mockError);
    
    // Return a minimal response to prevent crashes
    return {
      data: {
        success: false,
        message: 'Error creating mock response',
        data: []
      },
      status: 500,
      statusText: 'Mock Error',
      headers: {},
      config: error.config || {},
      request: error.request,
      _isMockResponse: true
    };
  }
}

export default {
  getMockResponse,
  createMockResponseFromError
}; 