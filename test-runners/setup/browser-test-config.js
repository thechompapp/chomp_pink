/**
 * Browser Test Configuration
 * 
 * This module provides configuration for running API tests in a real browser environment
 * instead of JSDOM, which helps avoid CORS issues.
 */

import axios from 'axios';

// Server URLs
export const BACKEND_URL = 'http://localhost:5001';
export const FRONTEND_URL = 'http://localhost:5175';

// API Endpoints for testing
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    STATUS: '/api/auth/status',
    REFRESH_TOKEN: '/api/auth/refresh-token'
  },
  
  // E2E testing endpoints
  E2E: {
    RESTAURANTS: '/api/e2e/restaurants',
    RESTAURANT_BY_ID: (id) => `/api/e2e/restaurants/${id}`,
    DISHES: '/api/e2e/dishes',
    DISH_BY_ID: (id) => `/api/e2e/dishes/${id}`
  },
  
  // Health and system endpoints
  SYSTEM: {
    HEALTH: '/api/health',
    DB_TEST: '/api/db-test'
  }
};

// Create API client with correct configuration
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // Increased timeout for slower test environments
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Test-Mode': 'true', // Signal to backend this is a test request
    'X-Bypass-Auth': 'true' // Bypass authentication for testing
  },
  // Important: withCredentials allows cookies to be sent cross-domain
  withCredentials: true,
  // Disable CORS checks in the client
  proxy: false
});

// Token storage for authentication tests
export const tokenStorage = {
  token: null,
  
  setToken(token) {
    this.token = token;
    // Update the apiClient headers with the new token
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },
  
  getToken() {
    return this.token;
  },
  
  clearToken() {
    this.token = null;
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Verify that the backend server is running
 * @returns {Promise<boolean>} - True if backend server is running
 * @throws {Error} If backend server is not running
 */
export async function verifyBackendServer() {
  try {
    console.log('Verifying backend server...');
    const response = await apiClient.get(API_ENDPOINTS.SYSTEM.HEALTH);
    
    if (response.status === 200 && response.data && response.data.status === 'UP') {
      console.log('Backend server is running:', response.data.message);
      return true;
    } else {
      throw new Error(`Backend server health check failed: ${response.status} ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Backend server verification failed:', error.message);
    throw new Error(`Backend server is not running or not responding: ${error.message}`);
  }
}

// Test timeout - increased for real API calls
export const TEST_TIMEOUT = 30000; // 30 seconds
