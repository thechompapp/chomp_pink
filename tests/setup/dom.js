// Setup DOM environment for tests
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

// Initialize global.window if it doesn't exist
if (typeof global.window === 'undefined') {
  global.window = {};
}

// Mock browser globals
if (typeof window !== 'undefined') {
  // Mock window.location
  const mockLocation = {
    href: 'http://localhost:5001',
    origin: 'http://localhost:5001',
    protocol: 'http:',
    host: 'localhost:5001',
    hostname: 'localhost',
    port: '5001',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
    replace: vi.fn(),
    assign: vi.fn(),
  };

  // Mock window object
  global.window = {
    ...global.window,
    localStorage: localStorageMock,
    location: mockLocation,
    navigator: {
      userAgent: 'node.js',
      onLine: true,
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    requestAnimationFrame: (callback) => setTimeout(callback, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
  };

  // Mock document object
  global.document = {
    ...global.document,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    createElement: vi.fn().mockImplementation((tagName) => ({
      tagName: tagName.toUpperCase(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    })),
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  };
}

// Mock global objects
global.requestAnimationFrame = global.window.requestAnimationFrame || ((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = global.window.cancelAnimationFrame || ((id) => clearTimeout(id));

// Mock fetch API if not available
if (!global.fetch) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  );
}
