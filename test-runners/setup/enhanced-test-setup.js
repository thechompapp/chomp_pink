/**
 * Enhanced Test Setup for Chomp/Doof API Tests
 * 
 * This module sets up the enhanced test environment with improved reporting capabilities.
 */

import { createDirectClient, setupTestContextTracking } from './enhanced-direct-http-client.js';

// Create the API client
const API_BASE_URL = 'http://localhost:5001';
export const apiClient = createDirectClient(API_BASE_URL);

// Export the backend URL for other modules to use
export const BACKEND_URL = API_BASE_URL;

// Set up test context tracking for capturing API requests and responses
setupTestContextTracking();

// Simple token storage for authentication tests
export const tokenStorage = {
  token: null,
  
  setToken(token) {
    this.token = token;
  },
  
  getToken() {
    return this.token;
  },
  
  clearToken() {
    this.token = null;
  },
  
  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
};

// Add authentication header to all requests if token is available
export function withAuth(options = {}) {
  return {
    ...options,
    headers: {
      ...options.headers,
      ...tokenStorage.getAuthHeader(),
      // Add test mode headers for local development and testing
      'X-Test-Mode': 'true',
      'X-Bypass-Auth': 'true',
      'X-Test-Request': 'true'
    }
  };
}

// Export a default timeout for tests
export const TEST_TIMEOUT = 5000; // 5 seconds

export default apiClient;
