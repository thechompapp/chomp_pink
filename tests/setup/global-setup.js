/**
 * Test Setup Configuration
 * 
 * This file sets up the test environment before running tests.
 * It's loaded before any test files are executed.
 */

// Set up global test environment variables
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:5001';

// Import Vitest's expect and vi (Vitest's jest-like API)
import { expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { configure } from '@testing-library/react';

/**
 * Configure test library settings
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
  console.log('🔧 Setting up test environment...');
  // Add any global setup code here
});

/**
 * Global test teardown
 * Runs once after all tests complete
 */
afterAll(() => {
  console.log('🧹 Cleaning up test environment...');
  // Add any global cleanup code here
});

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Make expect and vi globally available
global.expect = expect;
global.vi = vi;

// Mock any browser APIs used in tests
if (typeof window !== 'undefined') {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
