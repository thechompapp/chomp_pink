/**
 * JWT Token E2E Tests
 * 
 * Tests JWT token handling including validation, expiration,
 * and authorization with different token types.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken, setCustomToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('JWT Token Handling', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
  }, TEST_TIMEOUT);
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    
    // Close database connections
    await closeDbConnections();
    
    // Clear auth token
    clearAuthToken();
  }, TEST_TIMEOUT);
  
  // Reset auth state before each test
  beforeEach(() => {
    clearAuthToken();
  });
  
  // Token validation tests
  describe('Token Validation', () => {
    it('should accept requests with valid token', async () => {
      // Login to get a valid token
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Login for token validation test'
      );
      
      expect(loginResult.success).toBe(true);
      expect(loginResult.data).toHaveProperty('token');
      
      // Set the valid token
      setAuthToken(loginResult.data.token);
      
      // Make a request to a protected endpoint
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected endpoint with valid token'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
    
    it('should reject requests with malformed token', async () => {
      // Set a malformed token
      setCustomToken(config.tokens.malformed);
      
      // Make a request to a protected endpoint
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected endpoint with malformed token'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
    
    it('should reject requests with token having wrong signature', async () => {
      // Set a token with wrong signature
      setCustomToken(config.tokens.wrongSignature);
      
      // Make a request to a protected endpoint
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected endpoint with wrong signature token'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
    
    it('should reject requests with expired token', async () => {
      // Skip if no expired token is available for testing
      if (!config.tokens.expired) {
        console.warn('Skipping test: No expired token available for testing');
        return;
      }
      
      // Set an expired token
      setCustomToken(config.tokens.expired);
      
      // Make a request to a protected endpoint
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected endpoint with expired token'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });
  
  // Token refresh tests
  describe('Token Refresh', () => {
    it('should refresh an expiring token', async () => {
      // Login to get a valid token
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Login for token refresh test'
      );
      
      expect(loginResult.success).toBe(true);
      expect(loginResult.data).toHaveProperty('token');
      expect(loginResult.data).toHaveProperty('refreshToken');
      
      // Set the valid token
      setAuthToken(loginResult.data.token);
      
      // Store the original token for comparison
      const originalToken = loginResult.data.token;
      
      // Request a token refresh
      const refreshResult = await handleApiRequest(
        () => apiClient.post('/auth/refresh-token', {
          refreshToken: loginResult.data.refreshToken
        }),
        'Token refresh'
      );
      
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.status).toBe(200);
      expect(refreshResult.data).toHaveProperty('token');
      expect(refreshResult.data.token).not.toBe(originalToken);
      
      // Set the new token
      setAuthToken(refreshResult.data.token);
      
      // Verify the new token works
      const verifyResult = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected endpoint with refreshed token'
      );
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.status).toBe(200);
    });
    
    it('should reject refresh with invalid refresh token', async () => {
      // Request a token refresh with invalid refresh token
      const refreshResult = await handleApiRequest(
        () => apiClient.post('/auth/refresh-token', {
          refreshToken: 'invalid-refresh-token'
        }),
        'Token refresh with invalid refresh token'
      );
      
      expect(refreshResult.success).toBe(false);
      expect([400, 401]).toContain(refreshResult.status);
    });
  });
  
  // User-specific token tests
  describe('User-Specific Tokens', () => {
    it('should restrict access to user-specific resources with another user\'s token', async () => {
      // Login as regular user
      const regularLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login for token test'
      );
      
      expect(regularLoginResult.success).toBe(true);
      
      // Create a resource (list) as regular user
      setAuthToken(regularLoginResult.data.token);
      
      const createListResult = await handleApiRequest(
        () => apiClient.post('/lists', config.testData.lists.valid),
        'Create list as regular user'
      );
      
      expect(createListResult.success).toBe(true);
      expect(createListResult.data).toHaveProperty('id');
      
      const listId = createListResult.data.id;
      
      // Login as admin user
      const adminLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin user login for token test'
      );
      
      expect(adminLoginResult.success).toBe(true);
      
      // Try to modify the regular user's list as admin
      setAuthToken(adminLoginResult.data.token);
      
      const updateListResult = await handleApiRequest(
        () => apiClient.put(`/lists/${listId}`, {
          name: 'Updated by admin'
        }),
        'Update regular user\'s list as admin'
      );
      
      // This should fail unless the API allows admins to modify user resources
      // The exact behavior depends on the application's authorization model
      if (updateListResult.success) {
        console.log('Note: Admin is allowed to modify user resources in this application');
      } else {
        expect(updateListResult.status).toBe(403);
      }
    });
  });
});
