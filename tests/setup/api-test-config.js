/**
 * API Testing Configuration
 * 
 * This module provides centralized configuration for API testing,
 * including endpoint definitions, server URLs, and test utilities.
 */

import axios from 'axios';
import http from 'http';

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
  },
  
  // Bulk operations
  BULK: {
    ADD: '/api/bulk/add',
    VALIDATE: '/api/bulk/validate'
  }
};

// Create API client with correct configuration
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000, // Increased timeout for slower test environments
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Test-Mode': 'true' // Signal to backend this is a test request
  }
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
 * Check if a server is running using Node's native http module
 * @param {string} url - Full URL to check
 * @param {string} path - Path to check (e.g., '/api/health')
 * @returns {Promise<boolean>} - True if server is running
 */
export function checkServer(url, path = '/') {
  return new Promise((resolve) => {
    // Parse the URL to get host and port
    const urlObj = new URL(url + path);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };
    
    console.log(`Checking server at ${url}${path}...`);
    
    const req = http.request(options, (res) => {
      console.log(`Server at ${url}${path} responded with status: ${res.statusCode}`);
      
      // Consider 2xx and 3xx status codes as success
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve(success);
      
      // Consume response data to free up memory
      res.resume();
    });
    
    req.on('error', (err) => {
      console.error(`Error connecting to ${url}${path}: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error(`Connection to ${url}${path} timed out`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Verify that the backend server is running
 * @returns {Promise<boolean>} - True if backend server is running
 * @throws {Error} If backend server is not running
 */
export async function verifyBackendServer() {
  const isRunning = await checkServer(BACKEND_URL, API_ENDPOINTS.SYSTEM.HEALTH);
  
  if (!isRunning) {
    throw new Error('Backend server MUST be running to execute these tests. Please start the server and try again.');
  }
  
  console.log('✅ Backend server is connected and ready for tests');
  return true;
}

/**
 * Verify that the frontend server is running
 * @returns {Promise<boolean>} - True if frontend server is running
 * @throws {Error} If frontend server is not running
 */
export async function verifyFrontendServer() {
  const isRunning = await checkServer(FRONTEND_URL);
  
  if (!isRunning) {
    throw new Error('Frontend server MUST be running to execute these tests. Please start the server and try again.');
  }
  
  console.log('✅ Frontend server is connected and ready for tests');
  return true;
}

/**
 * Verify that both backend and frontend servers are running
 * @returns {Promise<boolean>} - True if both servers are running
 * @throws {Error} If either server is not running
 */
export async function verifyBothServers() {
  await verifyBackendServer();
  await verifyFrontendServer();
  return true;
}

// Test timeout - increased for real API calls
export const TEST_TIMEOUT = 15000; // 15 seconds
