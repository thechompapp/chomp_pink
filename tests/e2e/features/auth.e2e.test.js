/**
 * Authentication E2E Tests
 * 
 * Tests authentication flows including login, logout, token handling,
 * and authorization for different user types.
 * 
 * Test Strategy:
 * - Uses real API endpoints with test database
 * - Tests both success and error scenarios
 * - Verifies proper error messages and status codes
 * - Tests token handling and validation
 * - Verifies role-based access control
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import apiClient, { 
  handleApiRequest, 
  setAuthToken, 
  clearAuthToken, 
  setCustomToken,
  validateResponse 
} from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { 
  initializeTestDatabase, 
  cleanupTestDatabase, 
  closeDbConnections,
  clearTestData 
} from '../setup/db-utils.js';

// Test timeout (10 seconds to account for potential API delays)
const TEST_TIMEOUT = 10000;

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
      // Test valid login with regular user
      const result = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login'
      );
      
      // Verify successful response
      expect(result.success, 'Login should be successful').toBe(true);
      expect(result.status, 'Status should be 200').toBe(200);
      expect(result.data, 'Response should contain token and user data').toMatchObject({
        token: expect.any(String),
        user: {
          id: expect.any(String),
          email: config.users.regular.email,
          role: 'user'
        }
      });
      
      // Verify token is valid and can be used
      const validateResult = await handleApiRequest(
        () => apiClient.get('/auth/validate-token'),
        'Token validation'
      );
      expect(validateResult.success, 'Token validation should be successful').toBe(true);
      expect(validateResult.data.valid, 'Token should be valid').toBe(true);
    });
    
    it('should successfully login with valid admin credentials', async () => {
      // Test valid login with admin user
      const result = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login'
      );
      
      // Verify successful response
      expect(result.success, 'Admin login should be successful').toBe(true);
      expect(result.status, 'Status should be 200').toBe(200);
      expect(result.data, 'Response should contain token and admin user data').toMatchObject({
        token: expect.any(String),
        user: {
          id: expect.any(String),
          email: config.users.admin.email,
          role: 'admin',
          isAdmin: true
        }
      });
      
      // Verify admin-specific access
      const adminCheck = await handleApiRequest(
        () => apiClient.get('/auth/admin-check'),
        'Admin access check'
      );
      expect(adminCheck.success, 'Admin should have access to admin routes').toBe(true);
    });
    
    it('should fail login with invalid credentials', async () => {
      // Test with non-existent user
      const invalidUser = await handleApiRequest(
        () => apiClient.post('/auth/login', {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }),
        'Login with non-existent user'
      );
      
      // Test with wrong password for existing user
      const wrongPassword = await handleApiRequest(
        () => apiClient.post('/auth/login', {
          email: config.users.regular.email,
          password: 'wrongpassword'
        }),
        'Login with wrong password'
      );
      
      // Test with malformed email
      const malformedEmail = await handleApiRequest(
        () => apiClient.post('/auth/login', {
          email: 'not-an-email',
          password: 'password'
        }),
        'Login with malformed email'
      );
      
      // Verify error responses
      [invalidUser, wrongPassword, malformedEmail].forEach((result, index) => {
        const testCase = ['non-existent user', 'wrong password', 'malformed email'][index];
        expect(result.success, `${testCase} should fail`).toBe(false);
        expect(result.status, `${testCase} status should be 401`).toBe(401);
        expect(result.data, `${testCase} should have error details`).toMatchObject({
          success: false,
          error: {
            code: expect.stringMatching(/INVALID_CREDENTIALS|VALIDATION_ERROR/),
            message: expect.any(String)
          }
        });
      });
    });
    
    it('should fail login with malformed credentials', async () => {
      // Test cases for various malformed inputs
      const testCases = [
        { 
          name: 'missing email', 
          credentials: { password: 'password' },
          expectedError: 'VALIDATION_ERROR'
        },
        { 
          name: 'missing password', 
          credentials: { email: 'test@example.com' },
          expectedError: 'VALIDATION_ERROR'
        },
        { 
          name: 'empty credentials', 
          credentials: {},
          expectedError: 'VALIDATION_ERROR'
        },
        { 
          name: 'invalid email format', 
          credentials: { email: 'not-an-email', password: 'password' },
          expectedError: 'VALIDATION_ERROR'
        },
        { 
          name: 'password too short', 
          credentials: { email: 'test@example.com', password: 'short' },
          expectedError: 'VALIDATION_ERROR'
        }
      ];

      // Run all test cases
      const results = await Promise.all(
        testCases.map(async (testCase) => {
          const result = await handleApiRequest(
            () => apiClient.post('/auth/login', testCase.credentials),
            `Malformed login: ${testCase.name}`
          );
          return { ...testCase, result };
        })
      );

      // Verify all test cases
      results.forEach(({ name, result, expectedError }) => {
        expect(result.success, `${name} should fail`).toBe(false);
        expect([400, 422], `${name} status should be 400 or 422`).toContain(result.status);
        expect(result.data, `${name} should have error details`).toMatchObject({
          success: false,
          error: {
            code: expectedError,
            message: expect.any(String)
          }
        });
      });
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
      
      // Verify login was successful
      expect(loginResult.success, 'Login should be successful').toBe(true);
      expect(loginResult.data, 'Response should contain token').toHaveProperty('token');
      
      // Set the token for subsequent requests
      const token = loginResult.data.token;
      setAuthToken(token);
      
      // Test multiple protected routes
      const protectedRoutes = [
        { path: '/lists', method: 'get' },
        { path: '/profile', method: 'get' },
        { path: '/user/preferences', method: 'get' }
      ];
      
      // Test each protected route
      const results = await Promise.all(
        protectedRoutes.map(async (route) => {
          const result = await handleApiRequest(
            () => apiClient[route.method](route.path),
            `Protected route: ${route.method.toUpperCase()} ${route.path}`
          );
          return { ...route, result };
        })
      );
      
      // Verify all protected routes are accessible with valid token
      results.forEach(({ path, method, result }) => {
        expect(result.success, `${method.toUpperCase()} ${path} should be accessible with valid token`).toBe(true);
        expect(result.status, `${method.toUpperCase()} ${path} should return 200`).toBe(200);
      });
      
      // Verify token details
      const tokenInfo = await handleApiRequest(
        () => apiClient.get('/auth/token-info'),
        'Get token info'
      );
      
      expect(tokenInfo.success, 'Should retrieve token info').toBe(true);
      expect(tokenInfo.data, 'Token info should contain user details').toMatchObject({
        userId: expect.any(String),
        email: config.users.regular.email,
        role: 'user',
        exp: expect.any(Number),
        iat: expect.any(Number)
      });
    });
    
    it('should fail to access protected routes without token', async () => {
      // Clear any existing token
      clearAuthToken();
      
      // Test multiple protected routes
      const protectedRoutes = [
        { path: '/lists', method: 'get' },
        { path: '/profile', method: 'get' },
        { path: '/user/preferences', method: 'get' }
      ];
      
      // Test each protected route without token
      const results = await Promise.all(
        protectedRoutes.map(async (route) => {
          const result = await handleApiRequest(
            () => apiClient[route.method](route.path),
            `Protected route without token: ${route.method.toUpperCase()} ${route.path}`,
            { expectError: true }
          );
          return { ...route, result };
        })
      );
      
      // Verify all protected routes are inaccessible without token
      results.forEach(({ path, method, result }) => {
        expect(result.success, `${method.toUpperCase()} ${path} should fail without token`).toBe(false);
        expect(result.status, `${method.toUpperCase()} ${path} should return 401`).toBe(401);
        expect(result.data, `${method.toUpperCase()} ${path} should have auth error`).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: expect.stringMatching(/token|authenticate/i)
          }
        });
      });
    });
    
    it('should fail to access protected routes with invalid tokens', async () => {
      // Test different invalid token scenarios
      const invalidTokens = [
        { token: 'invalid-token-123', desc: 'malformed token' },
        { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjJ9.invalid-signature', 
          desc: 'tampered token' },
        { token: 'Bearer invalid', desc: 'malformed bearer token' },
        { token: '   ', desc: 'whitespace token' },
        { token: null, desc: 'null token' },
        { token: undefined, desc: 'undefined token' }
      ];
      
      // Test each invalid token scenario
      const results = await Promise.all(
        invalidTokens.map(async ({ token, desc }) => {
          // Set the invalid token
          setAuthToken(token);
          
          // Try to access a protected route
          const result = await handleApiRequest(
            () => apiClient.get('/profile'),
            `Protected route with ${desc}`,
            { expectError: true }
          );
          return { desc, result };
        })
      );
      
      // Verify all invalid tokens are rejected
      results.forEach(({ desc, result }) => {
        expect(result.success, `Should reject ${desc}`).toBe(false);
        expect([401, 403], `${desc} should return 401 or 403`).toContain(result.status);
        expect(result.data, `${desc} should have auth error`).toMatchObject({
          success: false,
          error: {
            code: expect.stringMatching(/UNAUTHORIZED|INVALID_TOKEN|JWT_/i),
            message: expect.stringMatching(/token|invalid|expired|malformed/i)
          }
        });
      });
    });
    
    it('should handle expired tokens', async () => {
      // Set an expired token (assuming config.tokens.expired exists)
      if (config.tokens?.expired) {
        setCustomToken(config.tokens.expired);
        
        // Try to access a protected route
        const result = await handleApiRequest(
          () => apiClient.get('/profile'),
          'Protected route with expired token',
          { expectError: true }
        );
        
        expect(result.success, 'Should reject expired token').toBe(false);
        expect([401, 403], 'Should return 401 or 403 for expired token').toContain(result.status);
        expect(result.data, 'Should have token expired error').toMatchObject({
          success: false,
          error: {
            code: expect.stringMatching(/TOKEN_EXPIRED|JWT_EXPIRED/i),
            message: expect.stringMatching(/expired|invalid|token/i)
          }
        });
      } else {
        console.warn('Skipping expired token test - no expired token in config');
      }
    });
  });
  
  // Authorization tests
  describe('Authorization', () => {
      { token: 'invalid-token-123', desc: 'malformed token' },
      { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjJ9.invalid-signature', 
        desc: 'tampered token' },
      { token: 'Bearer invalid', desc: 'malformed bearer token' },
      { token: '   ', desc: 'whitespace token' },
      { token: null, desc: 'null token' },
      { token: undefined, desc: 'undefined token' }
    ];
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
