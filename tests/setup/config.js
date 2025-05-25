/**
 * E2E Testing Configuration
 * 
 * This file contains configuration settings for the E2E test suite.
 */

// Test environment configuration
export const config = {
  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5001/api',
    timeout: 10000, // 10 seconds - increased from 2 seconds to handle potential network latency
  },
  
  // Test user credentials - must be provided via environment variables
  testUsers: {
    regular: {
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
      username: process.env.TEST_USER_USERNAME
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD,
      username: process.env.TEST_ADMIN_USERNAME
    }
  },
  
  // Validate required environment variables
  validate: () => {
    const requiredVars = [
      'API_BASE_URL',
      'TEST_USER_EMAIL',
      'TEST_USER_PASSWORD',
      'TEST_USER_USERNAME',
      'TEST_ADMIN_EMAIL',
      'TEST_ADMIN_PASSWORD',
      'TEST_ADMIN_USERNAME'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  },
  
  // Test data
  testData: {
    restaurants: {
      valid: {
        name: 'Test Restaurant',
        cuisine: 'Italian',
        address: '123 Test Street',
        city_id: 1,
        neighborhood_id: 1
      }
    },
    dishes: {
      valid: {
        name: 'Test Dish',
        restaurant_id: 1,
        price: 15.99,
        description: 'A delicious test dish'
      }
    },
    lists: {
      valid: {
        name: 'Test List',
        description: 'A test list for e2e testing',
        is_public: true,
        list_type: 'restaurant'
      }
    },
    hashtags: [
      'italian',
      'pizza',
      'pasta',
      'dessert'
    ]
  },
  
  // JWT tokens for testing
  tokens: {
    valid: process.env.TEST_VALID_TOKEN,
    expired: process.env.TEST_EXPIRED_TOKEN,
    malformed: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    wrongSignature: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  }
};

// Test database configuration
export const dbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'doof_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
};

// Test execution configuration
export const testConfig = {
  retries: 1, // Reduced retries for speed
  timeout: 3000, // 3 seconds - lightning fast
  bail: true, // Bail on first failure for speed
  parallel: true, // Run tests in parallel for speed
};

export default config;
