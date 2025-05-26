/**
 * Authentication Flow Integration Test
 * 
 * Tests the complete authentication flow using the real API
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { loginTestUser, logoutTestUser, getCurrentUser, cleanupTestUsers, registerTestUser } from '../../setup/auth-helper';
import { setupTestUser } from '../../setup/test-user-setup';

// Test timeout (30 seconds)
const TEST_TIMEOUT = 30000;

// Test user credentials from environment variables
const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
  username: process.env.TEST_USER_USERNAME
};

// Helper to generate a unique test email
const generateTestEmail = () => `test-${Date.now()}@example.com`;

describe('Authentication Flow Integration', () => {
  // Store original console methods
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    debug: console.debug
  };

  beforeAll(() => {
    // Suppress console output during tests
    console.error = vi.fn();
    console.warn = vi.fn();
    console.log = vi.fn();
    console.debug = vi.fn();
  });

  afterAll(() => {
    // Restore original console methods
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
  });

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', async () => {
      // Act
      const { success, data, error } = await loginTestUser(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      // Assert
      expect(success).toBe(true);
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      
      // Verify the user data structure
      const { user, token } = data;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', TEST_CREDENTIALS.email);
      expect(user).toHaveProperty('username');
      expect(token).toBeDefined();
      
      // Clean up - log out after test
      await logoutTestUser();
    }, TEST_TIMEOUT);

    it('should fail to log in with invalid credentials', async () => {
      // Act
      const { success, data, error } = await loginTestUser(
        'nonexistent@example.com',
        'wrongpassword'
      );

      // Assert
      expect(success).toBe(false);
      expect(data).toBeNull();
      expect(error).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Session Management', () => {
    it('should maintain session after login', async () => {
      // First login
      const loginResult = await loginTestUser(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );
      
      expect(loginResult.success).toBe(true);
      const { token, user: { id: userId } } = loginResult.data;
      
      // Get current user to verify session
      const userResult = await getCurrentUser();
      
      // Assert
      expect(userResult.success).toBe(true);
      expect(userResult.user).toBeDefined();
      expect(userResult.user.id).toBe(userId);
      
      // Clean up - log out after test
      await logoutTestUser();
    }, TEST_TIMEOUT);
  });

  describe('Logout Flow', () => {
    it('should successfully log out', async () => {
      // First login
      await loginTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
      
      // Log out
      const logoutResult = await logoutTestUser();
      
      // Assert
      expect(logoutResult.success).toBe(true);
      
      // Verify the session is really cleared
      const userResult = await getCurrentUser();
      expect(userResult.success).toBe(false);
      expect(userResult.user).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('Registration Flow', () => {
    it('should register a new user', async () => {
      const testEmail = generateTestEmail();
      const testUsername = `testuser-${Date.now()}`;
      
      // Act
      const registerResult = await registerTestUser({
        email: testEmail,
        username: testUsername,
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      });

      // Assert
      expect(registerResult.success).toBe(true);
      expect(registerResult.data).toHaveProperty('user');
      expect(registerResult.data.user.email).toBe(testEmail);
      expect(registerResult.data.user.username).toBe(testUsername);
      
      // Clean up - log out after test
      await logoutTestUser();
      
      // Clean up test user (if your API supports this)
      // await cleanupTestUsers([testEmail]);
    }, TEST_TIMEOUT);
  });
});
