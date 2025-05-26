/**
 * Authentication E2E Tests
 * 
 * Tests authentication flows including login, logout, token handling,
 * and authorization for different user types.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken, setCustomToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Authentication', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Clear any existing tokens
    clearAuthToken();
  }, TEST_TIMEOUT);
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    
    // Close database connections
    await closeDbConnections();
  }, TEST_TIMEOUT);
  
  // Reset auth state before each test
  beforeEach(() => {
    clearAuthToken();
  });
  
  // Login tests
  describe('Login', () => {
    it('should successfully login with valid regular user credentials', async () => {
      const result = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('token');
      expect(result.data.user).toHaveProperty('role', 'user');
    });
    
    it('should successfully login with valid admin credentials', async () => {
      const result = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('token');
      expect(result.data.user).toHaveProperty('role', 'admin');
    });
    
    it('should fail login with invalid credentials', async () => {
      const result = await handleApiRequest(
        () => apiClient.post('/auth/login', {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }),
        'Invalid login'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
    
    it('should fail login with malformed credentials', async () => {
      const result = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.malformed),
        'Malformed login'
      );
      
      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });
  });
  
  // Token tests
  describe('Token Handling', () => {
    it('should access protected routes with valid token', async () => {
      // Login first to get token
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Login for token test'
      );
      
      expect(loginResult.success).toBe(true);
      
      // Set the token for subsequent requests
      setAuthToken(loginResult.data.token);
      
      // Try to access a protected route
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected route access'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
    
    it('should fail to access protected routes without token', async () => {
      // Clear any existing token
      clearAuthToken();
      
      // Try to access a protected route
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected route without token'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
    
    it('should fail to access protected routes with malformed token', async () => {
      // Set a malformed token
      setCustomToken(config.tokens.malformed);
      
      // Try to access a protected route
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected route with malformed token'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
    
    it('should fail to access protected routes with token having wrong signature', async () => {
      // Set a token with wrong signature
      setCustomToken(config.tokens.wrongSignature);
      
      // Try to access a protected route
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected route with wrong signature token'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });
  
  // Authorization tests
  describe('Authorization', () => {
    it('should allow admin to access admin-only routes', async () => {
      // Login as admin
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for authorization test'
      );
      
      expect(loginResult.success).toBe(true);
      
      // Set the admin token
      setAuthToken(loginResult.data.token);
      
      // Try to access an admin-only route
      const result = await handleApiRequest(
        () => apiClient.get('/admin/users'),
        'Admin route access as admin'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
    
    it('should prevent regular user from accessing admin-only routes', async () => {
      // Login as regular user
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login for authorization test'
      );
      
      expect(loginResult.success).toBe(true);
      
      // Set the regular user token
      setAuthToken(loginResult.data.token);
      
      // Try to access an admin-only route
      const result = await handleApiRequest(
        () => apiClient.get('/admin/users'),
        'Admin route access as regular user'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
    });
  });
  
  // Logout tests
  describe('Logout', () => {
    it('should successfully logout', async () => {
      // Login first
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Login for logout test'
      );
      
      expect(loginResult.success).toBe(true);
      
      // Set the token
      setAuthToken(loginResult.data.token);
      
      // Logout
      const logoutResult = await handleApiRequest(
        () => apiClient.post('/auth/logout'),
        'Logout'
      );
      
      expect(logoutResult.success).toBe(true);
      
      // Clear token after logout
      clearAuthToken();
      
      // Try to access a protected route after logout
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Protected route after logout'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
