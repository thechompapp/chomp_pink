// Test setup file for Vitest
import './setup/dom'; // Setup DOM environment first
import { vi } from 'vitest';
import { config } from './setup/config';

// Load test environment variables first
import './setup/test-env';

// Validate required environment variables before running any tests
config.validate();

// Mock global objects needed for testing
global.console = {
  ...console,
  // Override console methods as needed
  error: vi.fn(),
  warn: vi.fn(),
};

// Add a global teardown function if needed
afterAll(() => {
  // Clean up any resources if necessary
});

// Set a longer timeout for all tests if needed
beforeAll(() => {
  // Setup code if needed
});

// Export the config for use in tests
export { config };
