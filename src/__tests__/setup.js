/**
 * Test Setup File
 * 
 * This file is executed before running any tests. It sets up the test environment,
 * configures global mocks, and ensures all necessary polyfills are in place.
 */

import { vi, beforeEach } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => {
      const keys = Object.keys(store);
      return keys[i] || null;
    }
  };
})();

// Set up global objects
global.localStorage = localStorageMock;
global.sessionStorage = {
  ...localStorageMock,
  // Add any sessionStorage specific mocks here
};

// Mock fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock window object
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  location: {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  // Add any other window properties needed for tests
};

// Mock document object
global.document = {
  createElement: vi.fn().mockReturnValue({
    setAttribute: vi.fn(),
    style: {},
    // Add any other element properties needed for tests
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    // Add any other body properties needed for tests
  },
  // Add any other document properties needed for tests
};

// Mock console methods to suppress expected warnings/errors in tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: vi.fn(originalConsole.log),
  warn: vi.fn(originalConsole.warn),
  error: vi.fn(originalConsole.error)
};

// Setup any global test configurations
beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  global.localStorage.clear();
  global.sessionStorage.clear();
  
  // Reset fetch mock
  global.fetch.mockClear();
  
  // Reset any other global state
});

// Export any mocks or utilities that might be needed in tests
export {
  localStorageMock as localStorage,
  // Export any other mocks or utilities
};
