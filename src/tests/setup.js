// Test setup file for Vitest
import { afterEach, beforeEach, vi, expect } from 'vitest';

// Make expect globally available
globalThis.expect = expect;
globalThis.vi = vi;

// Basic DOM matchers for our tests
expect.extend({
  toBeInTheDocument(received) {
    const pass = received != null;
    return {
      message: () => `expected element ${pass ? 'not to be' : 'to be'} in the document`,
      pass,
    };
  },
  toBeTruthy(received) {
    const pass = Boolean(received);
    return {
      message: () => `expected ${received} ${pass ? 'not to be' : 'to be'} truthy`,
      pass,
    };
  },
});

// Setup global fetch if not available
if (!globalThis.fetch) {
  globalThis.fetch = async (url, options = {}) => {
    throw new Error(`Fetch not implemented in test environment for ${url}`);
  };
}

// Setup localStorage and sessionStorage for Node environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock performance API if not available
if (!globalThis.performance) {
  globalThis.performance = {
    now: () => Date.now(),
  };
}

// Mock window object for browser-specific code
if (!globalThis.window) {
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: {
        origin: 'http://localhost:5173',
        href: 'http://localhost:5173',
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    },
    writable: true,
  });
}

// Quiet console output during tests
const originalConsole = globalThis.console;
globalThis.console = {
  ...originalConsole,
  warn: (...args) => {
    const message = args.join(' ');
    if (message.includes('TEST') || message.includes('FAIL')) {
      originalConsole.warn(...args);
    }
  },
  debug: () => {}, // Suppress debug messages
  log: (...args) => {
    const message = args.join(' ');
    if (message.includes('TEST') || message.includes('FAIL') || message.includes('PASS')) {
      originalConsole.log(...args);
    }
  },
};

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Setup for each test
beforeEach(() => {
  // Clear all mock call history
  Object.values(localStorageMock).forEach(fn => fn.mockClear());
  Object.values(sessionStorageMock).forEach(fn => fn.mockClear());
});
