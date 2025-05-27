// Test setup file for Vitest
import { vi, beforeAll, afterAll } from 'vitest';
import { config } from './setup/config';

// Setup DOM environment first
import './setup/dom-environment';

// Load test environment variables
import './setup/test-env';

// Validate required environment variables before running any tests
config.validate();

// Mock global console methods
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
};

// Global test setup
beforeAll(() => {
  // Add any global test setup here
  vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
      ...actual,
      useLayoutEffect: actual.useEffect,
    };
  });
});

// Global test teardown
afterAll(() => {
  // Clean up any resources if necessary
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

// Export the config for use in tests
export { config };
