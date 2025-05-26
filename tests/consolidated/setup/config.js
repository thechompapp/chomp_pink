/**
 * Test configuration
 * 
 * This file contains configuration for the test environment,
 * including test users, API endpoints, database settings, and other configurations.
 */

// Base API URL - using port 5001 to match backend server configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

// Database configuration
export const db = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  database: process.env.TEST_DB_NAME || 'doof_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  // Connection pool settings
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
};

// Test users
export const testUsers = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'StrongAdminPassword123!',
    username: process.env.TEST_ADMIN_USERNAME || 'adminuser',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin'
  },
  regular: {
    email: process.env.TEST_USER_EMAIL || 'user@example.com',
    password: process.env.TEST_USER_PASSWORD || 'StrongUserPassword123!',
    username: process.env.TEST_USER_USERNAME || 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  }
};

// API endpoints
export const endpoints = {
  baseUrl: API_BASE_URL,
  apiUrl: `${API_BASE_URL}/api`,
  auth: {
    login: `/auth/login`,
    register: `/auth/register`,
    logout: `/auth/logout`,
    status: `/auth/status`
  },
  users: `/users`,
  restaurants: `/restaurants`,
  e2eRestaurants: `/e2e/restaurants`,
  dishes: `/dishes`,
  e2eDishes: `/e2e/dishes`,
  lists: `/lists`,
  search: `/search`,
  health: `/health`,
  // E2E specific endpoints
  e2e: {
    clearAll: `/e2e/clear-all`,
    setup: `/e2e/setup`
  }
};

// Test configuration
export const testConfig = {
  // Timeouts
  apiTimeout: 30000, // 30 seconds for API calls
  testTimeout: 60000, // 60 seconds for entire test
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  // Test data settings
  useRealApiData: true, // Set to false to use mocks (not recommended for E2E)
  // Logging
  logLevel: process.env.TEST_LOG_LEVEL || 'info' // error, warn, info, debug
};

// Test timeout constant for backward compatibility
export const TEST_TIMEOUT = testConfig.testTimeout;

// Export configuration
export default {
  api: {
    baseUrl: API_BASE_URL,
    ...endpoints
  },
  db,
  testUsers,
  testConfig,
  TEST_TIMEOUT
};
