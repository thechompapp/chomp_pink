/**
 * HTTP Service Integration Tests
 * 
 * These tests verify the HTTP service's integration with the application,
 * including authentication, error handling, and real API interactions.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fetch from 'node-fetch';
import { apiClient } from '../../../src/services/http';

// API configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

// Simple fetch wrapper for API calls
const apiRequest = async (method, path, data = null, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Test-Request': 'true',
    ...options.headers
  };

  const config = {
    method,
    headers,
    credentials: 'include',
    ...options
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  if (response.ok) {
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  throw new Error(`API Error: ${response.status} ${response.statusText}`);
};

// Setup and teardown
beforeAll(async () => {
  // Set a timeout for the beforeAll hook
  await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay before starting tests
});

describe('HTTP Service Integration', () => {
  // Use real API endpoints for testing
  it('should make a GET request to a health endpoint', async () => {
    // Increase test timeout
    vi.setConfig({ testTimeout: TEST_TIMEOUT });
    
    try {
      // Make a request to the health endpoint
      const response = await apiClient.get('/health');
      
      // Assert that the response contains expected data
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  }, TEST_TIMEOUT);

  it('should handle authentication with the API', async () => {
    // Increase test timeout
    vi.setConfig({ testTimeout: TEST_TIMEOUT });
    
    try {
      // First, ensure we're using the test API endpoints
      const testUser = {
        username: `test_user_${Date.now()}`,
        password: 'test_password_123',
        email: `test_${Date.now()}@example.com`
      };
      
      // Register a test user
      await apiRequest('POST', '/auth/register', testUser);
      
      // Login with the test user
      const loginResponse = await apiRequest('POST', '/auth/login', {
        username: testUser.username,
        password: testUser.password
      });
      
      // Verify login response
      expect(loginResponse).toBeDefined();
      expect(loginResponse.token).toBeDefined();
      
      // Use the HTTP service to make an authenticated request
      const authResponse = await apiClient.get('/auth/status');
      
      // Verify the authenticated response
      expect(authResponse).toBeDefined();
      expect(authResponse.authenticated).toBe(true);
      
      // Clean up - logout
      await apiRequest('POST', '/auth/logout');
    } catch (error) {
      console.error('Authentication test error:', error);
      throw error;
    }
  }, TEST_TIMEOUT);

  it('should handle errors from the API', async () => {
    // Increase test timeout
    vi.setConfig({ testTimeout: TEST_TIMEOUT });
    
    try {
      // Attempt to access a non-existent endpoint
      await expect(apiClient.get('/non-existent-endpoint'))
        .rejects
        .toThrow();
    } catch (error) {
      console.error('Error test failure:', error);
      throw error;
    }
  }, TEST_TIMEOUT);
});
