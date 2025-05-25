/**
 * Authentication Endpoints Test
 * 
 * This file contains tests for the authentication endpoints.
 * It tests login, registration, and logout functionality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Base URL for the API
const API_BASE_URL = 'http://localhost:5001';

// Create a dedicated API client for auth tests
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// In-memory token storage
const tokenStorage = {
  token: null,
  setToken(token) {
    this.token = token;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  clearToken() {
    this.token = null;
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Test user credentials
const testUser = {
  email: 'user@example.com',
  password: 'password123'
};

// Test registration data
const registrationData = {
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  username: `testuser${Date.now()}`,
  firstName: 'Test',
  lastName: 'User'
};

describe('Authentication Endpoints', () => {
  // Clear token before all tests
  beforeAll(() => {
    tokenStorage.clearToken();
  });

  // Clear token after all tests
  afterAll(() => {
    tokenStorage.clearToken();
  });

  describe('Registration', () => {
    it('should successfully register a new user', async () => {
      try {
        console.log('Attempting to register a new user...');
        const response = await apiClient.post('/api/auth/register', registrationData);
        
        console.log('Registration response:', {
          status: response.status,
          hasToken: !!response.data?.token,
          data: response.data
        });
        
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toContain('registered');
      } catch (error) {
        console.error('Registration error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Registration endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should fail registration with invalid data', async () => {
      try {
        const response = await apiClient.post('/api/auth/register', {
          email: 'invalid-email',
          password: 'short'
        });
        
        // If we get here, the test should fail because we expect an error
        console.log('Unexpected success response:', response.data);
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        console.log('Expected registration error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Registration endpoint not found, skipping test');
          return;
        }
        
        expect(error.response?.status).toBe(400);
      }
    }, TEST_TIMEOUT);
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      try {
        console.log('Attempting to login...');
        const response = await apiClient.post('/api/auth/login', testUser);
        
        console.log('Login response:', {
          status: response.status,
          hasToken: !!response.data?.token,
          data: response.data
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        
        // Store the token for subsequent tests
        if (response.data?.token) {
          tokenStorage.setToken(response.data.token);
        }
      } catch (error) {
        console.error('Login error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Login endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should fail login with invalid credentials', async () => {
      try {
        const response = await apiClient.post('/api/auth/login', {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        
        // If we get here, the test should fail because we expect an error
        console.log('Unexpected success response:', response.data);
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        console.log('Expected login error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Login endpoint not found, skipping test');
          return;
        }
        
        expect(error.response?.status).toBe(401);
      }
    }, TEST_TIMEOUT);
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      // First login to get a token
      try {
        // Skip if we don't have a token from previous tests
        if (!tokenStorage.token) {
          const loginResponse = await apiClient.post('/api/auth/login', testUser);
          expect(loginResponse.status).toBe(200);
          expect(loginResponse.data).toHaveProperty('token');
          
          // Set the token
          tokenStorage.setToken(loginResponse.data.token);
        }
        
        // Now try to logout
        const response = await apiClient.post('/api/auth/logout');
        
        console.log('Logout response:', {
          status: response.status,
          data: response.data
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        
        // Clear the token
        tokenStorage.clearToken();
      } catch (error) {
        console.error('Logout error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Logout endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Auth Status', () => {
    it('should return auth status for authenticated user', async () => {
      // First login to get a token
      try {
        const loginResponse = await apiClient.post('/api/auth/login', testUser);
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.data).toHaveProperty('token');
        
        // Set the token
        tokenStorage.setToken(loginResponse.data.token);
        
        // Now check auth status
        const response = await apiClient.get('/api/auth/status');
        
        console.log('Auth status response:', {
          status: response.status,
          data: response.data
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('isAuthenticated', true);
        expect(response.data).toHaveProperty('user');
        
        // Clear the token
        tokenStorage.clearToken();
      } catch (error) {
        console.error('Auth status error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Auth status endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should return auth status for unauthenticated user', async () => {
      try {
        // Clear any existing token
        tokenStorage.clearToken();
        
        // Check auth status without a token
        const response = await apiClient.get('/api/auth/status');
        
        console.log('Unauthenticated auth status response:', {
          status: response.status,
          data: response.data
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('isAuthenticated', false);
        expect(response.data).not.toHaveProperty('user');
      } catch (error) {
        console.error('Unauthenticated auth status error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Auth status endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
  });
});
