/**
 * Test Setup Configuration
 * 
 * This file sets up the test environment before running tests.
 * It's loaded before any test files are executed.
 */

// Set up global test environment variables
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:8080';

// Configure global test utilities
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';

/**
 * Configure test library settings
 * @see https://testing-library.com/docs/react-testing-library/api#configure
 */
configure({
  testIdAttribute: 'data-testid',
  // Add any other global test configurations here
});

/**
 * Global test setup
 * Runs once before all tests
 */
beforeAll(() => {
  console.log('\n🔧 Setting up test environment...');
  
  // Add any global setup code here
  // Example: Start a test server, seed the database, etc.
});

/**
 * Global test teardown
 * Runs once after all tests complete
 */
afterAll(() => {
  console.log('\n🧹 Cleaning up test environment...');
  
  // Add any global cleanup code here
  // Example: Stop test server, clean up test database, etc.
});

/**
 * Test teardown
 * Runs after each test
 */
afterEach(() => {
  // Clear all mocks and timers after each test
  jest.clearAllMocks();
  jest.useRealTimers();
  
  // Reset any global state if needed
  jest.resetModules();
});

// Mock global objects if needed
// Note: Only mock what's necessary for testing
global.console = {
  ...console,
  // Uncomment to track console calls in tests
  // error: jest.fn(),
  // warn: jest.fn(),
  // log: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};

// Add any global test utilities or helpers
// Example: global.testUtils = { ... };

// Polyfill for requestAnimationFrame
// This is needed for some testing libraries
if (typeof window !== 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0);
  };
  
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}
