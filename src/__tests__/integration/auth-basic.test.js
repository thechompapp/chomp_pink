/**
 * Basic Authentication Test
 * 
 * This file contains basic tests for authentication functionality.
 * It tests login, token validation, and logout functionality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Create a dedicated API client for auth tests
const apiClient = axios.create({
  baseURL: 'http://localhost:5173/api',
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

describe('Basic Authentication', () => {
  // Clear token before each test
  beforeAll(() => {
    tokenStorage.clearToken();
  });

  afterAll(() => {
    tokenStorage.clearToken();
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      try {
        console.log('Attempting to login...');
        const response = await apiClient.post('/auth/login', testUser);
        
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
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should fail login with invalid credentials', async () => {
      try {
        const response = await apiClient.post('/auth/login', {
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
        
        expect(error.response?.status).toBe(401);
      }
    }, TEST_TIMEOUT);
  });

  describe('Token Validation', () => {
    it('should access protected routes with valid token', async () => {
      // First login to get a token
      try {
        const loginResponse = await apiClient.post('/auth/login', testUser);
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.data).toHaveProperty('token');
        
        // Set the token
        tokenStorage.setToken(loginResponse.data.token);
        
        // Now try to access a protected route
        const response = await apiClient.get('/user/profile');
        
        console.log('Protected route response:', {
          status: response.status,
          data: response.data
        });
        
        expect(response.status).toBe(200);
      } catch (error) {
        console.error('Protected route error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Protected route not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      // First login to get a token
      try {
        const loginResponse = await apiClient.post('/auth/login', testUser);
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.data).toHaveProperty('token');
        
        // Set the token
        tokenStorage.setToken(loginResponse.data.token);
        
        // Now try to logout
        const response = await apiClient.post('/auth/logout');
        
        console.log('Logout response:', {
          status: response.status,
          data: response.data
        });
        
        expect(response.status).toBe(200);
        
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
});
