/**
 * Authentication Endpoints Test
 * 
 * This file contains tests for the authentication endpoints.
 * It tests login, registration, and logout functionality.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupVitestHooks } from '../../setup/setup-vitest-hooks.js';
import { 
  apiClient, 
  tokenStorage, 
  verifyBackendServer, 
  API_ENDPOINTS,
  TEST_TIMEOUT 
} from '../../setup/browser-test-config.js';

// Setup Vitest hooks for capturing API request/response data
setupVitestHooks();

// In-memory token storage is imported from enhanced-test-setup.js

// Test data for authentication endpoints
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
};

// We're now using the API_ENDPOINTS from api-test-config.js

// Test registration data with unique values to prevent conflicts
const registrationData = {
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  username: `testuser${Date.now()}`,
  firstName: 'Test',
  lastName: 'User'
};

// Increased timeout for API tests
const TEST_TIMEOUT = 15000; // 15 seconds

// This function is kept for backward compatibility but now throws an error if server is not available
async function isBackendAvailable() {
  return await verifyBackendServer(); // Will throw error if server is not available
}

describe('Authentication Endpoints', () => {
  // Ensure backend server is available before running any tests
  beforeAll(async () => {
    // Clear any existing tokens
    tokenStorage.clearToken();
    
    // Verify backend server is available - will throw error if not connected
    await verifyBackendServer();
    
    console.log('Starting authentication endpoint tests with backend server connected');
  });

  // Clear token after all tests
  afterAll(() => {
    tokenStorage.clearToken();
  });
  
  // Verify backend server is available before each test
  beforeEach(async () => {
    // Verify backend is available for every test
    await verifyBackendServer();
  });

  describe('Registration', () => {
    it('should register a new user', async () => {
      try {
        console.log('Attempting to register a new user...');
        
        // Generate a unique email to avoid conflicts
        const uniqueEmail = `user_${Date.now()}@example.com`;
        
        const newUser = {
          ...registrationData,
          email: uniqueEmail,
          username: `user_${Date.now()}`
        };
        
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, newUser);
        
        // Log response for debugging
        console.log('Registration response:', {
          status: response.status,
          success: response.data.success,
          message: response.data.message
        });
        
        // Verify response status
        expect(response.status).toBe(201);
        
        // Verify response data
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toContain('registered successfully');
        
        // Verify user data is returned (but not the password)
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('email', uniqueEmail);
        expect(response.data.user).not.toHaveProperty('password');
        
        // Verify token is returned
        expect(response.data).toHaveProperty('token');
        expect(typeof response.data.token).toBe('string');
        expect(response.data.token.length).toBeGreaterThan(0);
        
        console.log('Registration test passed!');
      } catch (error) {
        console.error('Registration test failed:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        throw error;
      }
    }, TEST_TIMEOUT);

    it.skip('should fail registration with invalid data', async () => {
      
      try {
        console.log('Attempting to register with invalid data...');
        
        // Missing required fields
        const invalidUser = {
          email: `invalid_${Date.now()}@example.com`,
          // Missing password and username
        };
        
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, invalidUser);
        
        // This should not happen - the request should fail
        console.error('Unexpected success response:', response.data);
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        // Log error for debugging
        console.log('Expected registration error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        
        // Verify error response
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('success', false);
        expect(error.response.data).toHaveProperty('message');
        
        console.log('Invalid registration test passed!');
      }
    }, TEST_TIMEOUT);
  });

  describe('Login', () => {
    it.skip('should successfully login with valid credentials', async () => {
      
      try {
        console.log('Attempting to login...');
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, testUser);
        
        console.log('Login response:', {
          status: response.status,
          success: response.data.success,
          message: response.data.message
        });
        
        // Verify response status
        expect(response.status).toBe(200);
        
        // Verify response data
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toContain('logged in successfully');
        
        // Verify token is returned
        expect(response.data).toHaveProperty('token');
        expect(typeof response.data.token).toBe('string');
        expect(response.data.token.length).toBeGreaterThan(0);
        
        // Store token for later tests
        tokenStorage.setToken(response.data.token);
        
        console.log('Login test passed!');
      } catch (error) {
        console.error('Login test failed:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        throw error;
      }
    }, TEST_TIMEOUT);

    it.skip('should fail login with invalid credentials', async () => {
      
      try {
        console.log('Attempting to login with invalid credentials...');
        const invalidCredentials = {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        };
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, invalidCredentials);
        
        // This should not happen - the request should fail
        console.error('Unexpected success response:', response.data);
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        // Log error for debugging
        console.log('Expected login error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        
        // Verify error response
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('success', false);
        expect(error.response.data).toHaveProperty('message');
        expect(error.response.data.message).toContain('Invalid credentials');
        
        console.log('Invalid login test passed!');
      }
    }, TEST_TIMEOUT);
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      // Verify backend is available
      await verifyBackendServer();
      
      try {
        // First login to get a token
        console.log('Logging in to get a token for logout test...');
        const loginResponse = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, testUser);
        
        // Store token
        tokenStorage.setToken(loginResponse.data.token);
        
        // Now logout
        console.log('Attempting to logout...');
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        
        // Verify logout was successful
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        
        // Clear token from storage
        tokenStorage.clearToken();
        
        console.log('Logout test passed!');
      } catch (error) {
        console.error('Error during logout test:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Auth Status', () => {
    it('should return auth status for authenticated user', async () => {
      
      try {
        // First login to get a token
        console.log('Logging in to get a token for auth status test...');
        const loginResponse = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, testUser);
        
        // Verify login was successful
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.data).toHaveProperty('token');
        
        // Store token
        tokenStorage.setToken(loginResponse.data.token);
        
        // Check auth status with token
        console.log('Checking auth status with token...');
        const statusResponse = await apiClient.get(API_ENDPOINTS.AUTH.STATUS);
        
        console.log('Auth status response:', {
          status: statusResponse.status,
          isAuthenticated: statusResponse.data.isAuthenticated
        });
        
        // Verify response status
        expect(response.status).toBe(200);
        
        // Verify response data
        expect(response.data).toHaveProperty('isAuthenticated', true);
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('email');
        
        console.log('Auth status test passed!');
        expect(response.data).toHaveProperty('isAuthenticated', true);
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('email', testUser.email);
      } catch (error) {
        console.error('Auth status test failed:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should return auth status for unauthenticated user', async () => {
      // Verify backend is available
      await verifyBackendServer();
      
      try {
        // Clear token
        tokenStorage.clearToken();
        
        // Check auth status without token
        console.log('Checking auth status without token...');
        const response = await apiClient.get(API_ENDPOINTS.AUTH.STATUS);
        
        console.log('Unauthenticated status response:', {
          status: response.status,
          isAuthenticated: response.data.isAuthenticated
        });
        
        // Verify response status
        expect(response.status).toBe(200);
        
        // Verify response data
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('isAuthenticated', false);
        
        console.log('Unauthenticated status test passed!');
      } catch (error) {
        console.error('Error during unauthenticated status test:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
  });
});
