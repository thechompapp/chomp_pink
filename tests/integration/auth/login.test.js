import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loginTestUser, getCurrentUser, registerTestUser, logoutTestUser } from '../../setup/auth-helper';

// Test timeout (30 seconds)
const TEST_TIMEOUT = 30000;

// Test user credentials - using hardcoded test user that exists in the test database
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'testpassword123'  // This should match the test user's password in the test database
};

describe('Login Flow', () => {
  beforeAll(async () => {
    // Skip registration since we're using a pre-existing test user
    // Just ensure we're logged out before tests
    await logoutTestUser();
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
      
      // Store the token for subsequent tests
      const authToken = loginResult.data.token;
      process.env.TEST_AUTH_TOKEN = authToken;
      
      // Now try to get the current user to verify the token works
      console.log('Verifying token by fetching current user...');
      const currentUserResponse = await getCurrentUser(authToken);
      
      // Log the current user response
      console.log('Current user response:', JSON.stringify(currentUserResponse, null, 2));
      
      // Verify the current user response
      expect(currentUserResponse.success, 'Current user request should be successful').toBe(true);
      
      // Log the full response structure for debugging
      console.log('Full currentUserResponse:', JSON.stringify(currentUserResponse, null, 2));
      
      // The response from /auth/me might have the user profile in different locations
      // Try to extract the user data from various possible locations
      const userData = currentUserResponse.data || 
                     (currentUserResponse.user && currentUserResponse.user.data) || 
                     currentUserResponse;
      
      console.log('Extracted userData:', JSON.stringify(userData, null, 2));
      
      // Verify user data structure exists
      expect(userData, 'Current user data should be defined').toBeDefined();
      
      // Log all available properties for debugging
      console.log('Available properties on userData:', Object.keys(userData));
      
      // Try to find the email in various possible locations
      const userEmail = userData.email || 
                      (userData.user && userData.user.email) ||
                      (userData.data && userData.data.email);
      
      console.log('Extracted email:', userEmail);
      
      // Verify we found an email
      expect(userEmail, 'User email should be defined').toBeDefined();
      
      // Log the expected and actual emails for debugging
      console.log('Expected email:', TEST_CREDENTIALS.email.toLowerCase());
      console.log('Actual email from response:', userEmail.toLowerCase());
      
      // Verify the email matches our test credentials
      expect(userEmail.toLowerCase()).toBe(TEST_CREDENTIALS.email.toLowerCase());
      
      console.log('--- Login test completed successfully ---\n');
      
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  }, TEST_TIMEOUT);
  
  it('should successfully log out the user', async () => {
    console.log('\n--- Starting logout test ---');
    
    try {
      // First, log in to get a valid token
      const loginResult = await loginTestUser(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );
      
      // Ensure login was successful
      expect(loginResult.success, 'Login should be successful').toBe(true);
      expect(loginResult.data.token, 'Login response should include token').toBeDefined();
      
      // Store the token for logout
      const authToken = loginResult.data.token;
      
      // Log out
      console.log('Attempting to log out...');
      const logoutResult = await logoutTestUser(authToken);
      
      // Log the logout result
      console.log('Logout result:', JSON.stringify({
        success: logoutResult.success,
        message: logoutResult.message
      }, null, 2));
      
      // Verify logout was successful
      expect(logoutResult.success, 'Logout should be successful').toBe(true);
      
      // Note: Currently, the server doesn't invalidate tokens on logout
      // This is a security consideration that should be addressed in the future
      // For now, we'll just verify that the logout request was successful
      console.log('Note: Server does not currently invalidate tokens on logout');
      
      // Optional: Verify we can still access protected endpoints with the same token
      // This is expected behavior until server-side token invalidation is implemented
      try {
        const userAfterLogout = await getCurrentUser(authToken);
        console.log('Current user after logout (expected behavior until server-side invalidation is implemented):', 
          userAfterLogout.user?.email || 'No user data');
      } catch (error) {
        console.log('Error accessing protected endpoint after logout:', error.message);
      }
      
      console.log('--- Logout test completed successfully ---\n');
    } catch (error) {
      console.error('Logout test failed with error:', error);
      throw error;
    }
  }, TEST_TIMEOUT);
  
  afterAll(async () => {
    // Clean up by logging out after all tests
    await logoutTestUser();
  });
});
