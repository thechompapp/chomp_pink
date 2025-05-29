// Re-export all test utilities
export * from './test-utils';
export * from './render';
export * from './api';
export * from './wait';

// Test constants
export const TEST_TIMEOUT = 60000; // 60 second timeout for all tests
export const API_BASE_URL = 'http://localhost:5001/api';

// Test user credentials
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'doof123',
    username: 'admin',
    role: 'admin'
  },
  user: {
    email: 'test@example.com',
    password: 'test123',
    username: 'testuser',
    role: 'user'
  }
};
