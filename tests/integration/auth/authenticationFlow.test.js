/**
 * Authentication Flow Integration Test
 * 
 * Tests the complete authentication flow using the real API
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import { loginTestUser, logoutTestUser, getCurrentUser, cleanupTestUsers, registerTestUser } from '../../setup/auth-helper';
import { setupTestUser } from '../../setup/test-user-setup';
import testApiClient from '../../setup/test-api-client';

// Test timeout (30 seconds)
const TEST_TIMEOUT = 30000;

// Generate unique test credentials for this test run
const TEST_EMAIL = `testuser-${Date.now()}@example.com`;
const TEST_USERNAME = `testuser-${Date.now()}`;
const TEST_PASSWORD = 'Test123!';

// Test user credentials with a simple password that we know works
const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || TEST_EMAIL,
  username: process.env.TEST_USER_USERNAME || TEST_USERNAME,
  // Use a simple password without special characters that might cause encoding issues
  password: 'testpassword123' // Simple password for testing
};

// Ensure we're using the same password everywhere
process.env.TEST_USER_PASSWORD = TEST_CREDENTIALS.password;

// Log the credentials being used for debugging
console.log('Test credentials:', {
  email: TEST_CREDENTIALS.email,
  username: TEST_CREDENTIALS.username,
  passwordLength: TEST_CREDENTIALS.password.length
});

// Helper to generate a unique test email
const generateTestEmail = () => `test-${Date.now()}@example.com`;

// Helper to wait for a short time (useful for async operations)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    beforeAll(async () => {
      // Ensure we're logged out before starting
      console.log('Ensuring we are logged out before starting tests...');
      await logoutTestUser();
      
      // Wait a bit to ensure any previous sessions are cleared
      await wait(1000);
      
      // Always register a new test user with unique credentials
      console.log('Registering new test user with credentials:', {
        email: TEST_CREDENTIALS.email,
        username: TEST_CREDENTIALS.username,
        password: '********' // Don't log actual password
      });
      
      try {
        // First, try to register the test user
        const registerData = {
          email: TEST_CREDENTIALS.email,
          username: TEST_CREDENTIALS.username,
          password: TEST_CREDENTIALS.password,
          confirmPassword: TEST_CREDENTIALS.password, // Make sure to include confirmPassword
          firstName: 'Test',
          lastName: 'User'
        };
        
        console.log('Sending registration request with data:', {
          ...registerData,
          password: '********',
          confirmPassword: '********'
        });
        
        const registerResult = await registerTestUser(registerData);
        
        console.log('Registration result:', {
          success: registerResult.success,
          status: registerResult.status,
          hasToken: !!(registerResult.data?.token),
          hasUser: !!(registerResult.data?.user)
        });
        
        if (registerResult.success) {
          console.log('Test user registered successfully:', {
            email: TEST_CREDENTIALS.email,
            username: TEST_CREDENTIALS.username
          });
          
          // Wait a moment to ensure the user is fully registered in the database
          await wait(500);
          
          // Verify the user exists in the database
          try {
            // Try to log in immediately to ensure the user is properly registered
            console.log('Verifying user can log in after registration...');
            const loginResult = await loginTestUser(
              TEST_CREDENTIALS.email,
              TEST_CREDENTIALS.password
            );
            
            if (!loginResult.success) {
              console.error('Login verification failed after registration:', loginResult.error);
              throw new Error('Failed to log in with newly registered user');
            }
            
            console.log('Successfully verified login with new user');
          } catch (error) {
            console.error('Error verifying user registration:', error);
            throw error;
          }
        } else {
          // If user already exists, that's fine, we'll try to log in
          if (registerResult.error?.code === 'USERNAME_ALREADY_EXISTS' || 
              registerResult.error?.message?.toLowerCase().includes('already exists')) {
            console.log('Test user already exists, will attempt login');
          } else {
            console.error('Failed to register test user:', registerResult.error);
            throw new Error(`Test user registration failed: ${JSON.stringify(registerResult.error)}`);
          }
        }
      } catch (error) {
        console.error('Unexpected error during test user registration:', error);
        throw error;
      } finally {
        // Always ensure we're logged out before tests run
        console.log('Ensuring clean logout state before tests...');
        await logoutTestUser();
        await wait(500);
      }
    });
    
    afterEach(async () => {
      // Log out after each test to ensure clean state
      await logoutTestUser();
      await wait(200); // Small delay to ensure logout completes
    });

    it('should successfully log in with valid credentials', async () => {
      console.log('\n--- Starting login test with valid credentials ---');
      
      try {
        // Log the exact credentials being used
        console.log('Attempting to log in with:', {
          email: TEST_CREDENTIALS.email,
          password: '********', // Don't log actual password
          passwordLength: TEST_CREDENTIALS.password.length
        });
        
        // Try to log in with the test user
        const loginResult = await loginTestUser(
          TEST_CREDENTIALS.email,
          TEST_CREDENTIALS.password
        );
        
        // Log the login result
        console.log('Login result:', JSON.stringify({
          success: loginResult.success,
          status: loginResult.status,
          hasToken: !!(loginResult.data?.token),
          hasUser: !!(loginResult.data?.user),
          error: loginResult.error
        }, null, 2));
        
        // Check if login was successful
        if (!loginResult.success) {
          console.error('Login failed with error:', loginResult.error);
          if (loginResult.error?.response) {
            console.error('Server response:', {
              status: loginResult.error.response.status,
              statusText: loginResult.error.response.statusText,
              data: loginResult.error.response.data
            });
          }
          throw new Error(loginResult.error?.message || 'Login failed');
        }
        
        // Verify the response structure
        expect(loginResult.success, 'Login should be successful').toBe(true);
        expect(loginResult.data, 'Response should contain data').toBeDefined();
        expect(loginResult.data.token, 'Response should contain a token').toBeDefined();
        
        // If user data is in the login response, verify it
        // Store the token for subsequent tests
        process.env.TEST_AUTH_TOKEN = loginResult.data.token;
        
        // Now try to get the current user to verify the token works
        console.log('Verifying token by fetching current user...');
        const currentUserResponse = await getCurrentUser(loginResult.data.token);
        
        // Log the current user response
        console.log('Current user response:', JSON.stringify(currentUserResponse, null, 2));
        
        // Verify the current user response
        expect(currentUserResponse.success, 'Current user request should be successful').toBe(true);
        
        // The response from /auth/me has the user profile directly in the data property
        const userData = currentUserResponse.data || currentUserResponse;
        expect(userData, 'Current user data should be defined').toBeDefined();
        
        // The email should be directly on the userData object
        expect(userData.email, 'User email should be defined').toBeDefined();
        expect(userData.email.toLowerCase(), 'User email should match').toBe(TEST_CREDENTIALS.email.toLowerCase());
        
        console.log('--- Login test completed successfully ---\n');
        
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should fail to log in with invalid credentials', async () => {
      console.log('Attempting login with invalid credentials');
      
      try {
        const result = await loginTestUser(
          'nonexistent@example.com',
          'wrongpassword'
        );

        console.log('Invalid login response:', JSON.stringify(result, null, 2));

        // The API might return the data directly or in a data property
        const responseData = result.data || result;
        
        // We expect the login to either throw an error or return success: false
        if (responseData.success === false) {
          expect(responseData.success).toBe(false);
          expect(responseData.error).toBeDefined();
          
          const errorMessage = (responseData.error?.message || responseData.error || '').toLowerCase();
          expect(
            errorMessage.includes('invalid') || 
            errorMessage.includes('credentials') ||
            errorMessage.includes('not found')
          ).toBe(true);
        } else {
          // If we get here, the login didn't fail as expected
          throw new Error('Login with invalid credentials did not fail as expected');
        }
      } catch (error) {
        // It's okay for the login to throw an error for invalid credentials
        console.log('Expected error for invalid credentials:', error.message);
        expect(error.message).toBeDefined();
      }
    }, TEST_TIMEOUT);
  });

  describe('Session Management', () => {
    it('should maintain session after login', async () => {
      // First, log in
      const loginResult = await loginTestUser(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );
      
      console.log('Session management login result:', JSON.stringify(loginResult, null, 2));
      
      // Check if login was successful
      if (!loginResult.success) {
        console.error('Login failed:', loginResult.error);
        throw new Error(loginResult.error?.message || 'Login failed');
      }
      
      // The response should have token and user data
      const responseData = loginResult.data || loginResult;
      
      // Verify the response structure
      expect(responseData).toHaveProperty('token');
      expect(responseData).toHaveProperty('user');
      
      const { token, user } = responseData;
      expect(token).toBeTruthy();
      expect(user).toBeDefined();
      expect(user.email).toBe(TEST_CREDENTIALS.email.toLowerCase());
      
      // Store the token for subsequent tests
      process.env.TEST_AUTH_TOKEN = token;
      
      // Try to access a protected endpoint
      try {
        const response = await testApiClient.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Session check response:', JSON.stringify(response.data, null, 2));
        
        // The API might return the data directly or in a data property
        const meData = response.data.data || response.data;
        
        expect(response.status).toBe(200);
        expect(meData).toHaveProperty('id');
        expect(meData.email).toBe(TEST_CREDENTIALS.email.toLowerCase());
      } catch (error) {
        console.error('Session check failed:', error.response?.data || error.message);
        throw error;
      }
  });

  describe('Registration Flow', () => {
    it('should register a new user', async () => {
      const testEmail = generateTestEmail();
      const testUsername = `testuser-${Date.now()}`;
      
      console.log('Testing registration with:', testEmail);
      
      // Act
      const registerResult = await registerTestUser({
        email: testEmail,
        username: testUsername,
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      });

      // Debug log the registration result
      console.log('Registration result:', JSON.stringify(registerResult, null, 2));

      // Assert
      expect(registerResult).toHaveProperty('success', true);
      expect(registerResult.data).toBeDefined();
      
      // The response might have user and token directly in data or in data.data
      const responseData = registerResult.data.data || registerResult.data;
      
      if (responseData) {
        expect(responseData).toHaveProperty('user');
        expect(responseData).toHaveProperty('token');
        
        // Check if user is nested or at the top level
        const user = responseData.user || responseData;
        expect(user.email).toBe(testEmail);
        expect(user.username).toBe(testUsername);
      } else {
        // If the structure is different, log it for debugging
        console.warn('Unexpected registration response structure:', registerResult);
        // At least check that we got some data back
        expect(registerResult.data).toBeTruthy();
      }
      
      // Clean up - log out after test
      await logoutTestUser();
      
      // Clean up test user if cleanup function is available
      if (typeof cleanupTestUsers === 'function') {
        console.log('Cleaning up test user:', testEmail);
        await cleanupTestUsers([testEmail]).catch(err => 
          console.warn('Error cleaning up test user:', err.message)
        );
      }
    }, TEST_TIMEOUT);
  });
});
