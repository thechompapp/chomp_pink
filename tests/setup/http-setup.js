/**
 * HTTP Service Test Setup
 * 
 * This file sets up the test environment for HTTP service tests,
 * including mocks and global configurations.
 */

import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Create a mock server instance
const server = setupServer(
  // Add default request handlers here
  rest.get('*/api/auth/status', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ authenticated: false })
    );
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

// Setup before all tests
beforeAll(() => {
  // Start the mock server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Mock global objects
  global.localStorage = localStorageMock;
  global.navigator = {
    onLine: true,
    userAgent: 'node',
  };
});

afterEach(() => {
  // Reset handlers and clear all mocks between tests
  server.resetHandlers();
  vi.clearAllMocks();
  localStorage.clear();
});

afterAll(() => {
  // Clean up after all tests are done
  server.close();
});

// Export the server for use in tests
export { server, rest };

// Add a global teardown function if needed
if (typeof global.teardown === 'function') {
  afterAll(global.teardown);
}

// This ensures that files that import this file will have access to the server
export default server;
