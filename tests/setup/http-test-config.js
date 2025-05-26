/**
 * HTTP Service Test Configuration
 * 
 * This file contains configuration settings for the HTTP service test suite.
 * It provides default values for required environment variables to allow tests to run.
 */

// Test environment configuration
export const httpTestConfig = {
  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5001/api',
    timeout: 10000, // 10 seconds
  },
  
  // Test user credentials with default values for testing
  testUsers: {
    regular: {
      email: process.env.TEST_USER_EMAIL || 'test_user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'test_password',
      username: process.env.TEST_USER_USERNAME || 'testuser'
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin_user@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin_password',
      username: process.env.TEST_ADMIN_USERNAME || 'adminuser'
    }
  },
  
  // No validation required - we provide defaults
  validate: () => {
    // No validation needed as we provide defaults
    return true;
  }
};

export default httpTestConfig;
