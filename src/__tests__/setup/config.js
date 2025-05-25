/**
 * Test configuration
 * 
 * This file contains configuration for the test environment,
 * including test users, API endpoints, and other settings.
 */

// Base API URL - using port 5001 to match backend server configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

// Test users
export const testUsers = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'StrongAdminPassword123!',
    username: 'testadmin',
    firstName: 'Test',
    lastName: 'Admin'
  },
  regular: {
    email: process.env.TEST_USER_EMAIL || 'user@example.com',
    password: process.env.TEST_USER_PASSWORD || 'StrongUserPassword123!',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  }
};

// API endpoints
export const endpoints = {
  baseUrl: API_BASE_URL,
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    status: `${API_BASE_URL}/api/auth/status`
  },
  users: `${API_BASE_URL}/api/users`,
  restaurants: `${API_BASE_URL}/api/restaurants`,
  dishes: `${API_BASE_URL}/api/dishes`,
  search: `${API_BASE_URL}/api/search`,
  health: `${API_BASE_URL}/api/health`
};

// Test timeout (in milliseconds)
export const TEST_TIMEOUT = 10000; // 10 seconds

// Export configuration
export default {
  testUsers,
  endpoints,
  TEST_TIMEOUT
};
