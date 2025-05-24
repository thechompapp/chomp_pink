// Test setup configuration for Vitest
import { afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Make expect and vi globally available
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


// Setup localStorage and sessionStorage mocks
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window object for browser-specific code
if (!globalThis.window) {
  globalThis.window = {};
}

// Mock Date.now() for consistent testing
const now = Date.now();
vi.spyOn(Date, 'now').mockImplementation(() => now);

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

// Mock scrollTo
window.scrollTo = vi.fn();

// Set test environment variables
process.env.VITE_API_BASE_URL = 'http://localhost:3000';
process.env.VITE_ENABLE_MOCK_API = 'false'; // Use real API by default

// Suppress console output in tests
const originalConsole = { ...console };
beforeEach(() => {
  // Only suppress in CI or when not debugging
  if (process.env.CI || !process.env.DEBUG) {
    console.error = vi.fn();
    console.warn = vi.fn();
    console.log = vi.fn();
  }
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  
  // Restore console methods
  if (process.env.CI || !process.env.DEBUG) {
    Object.assign(console, originalConsole);
  }
});
