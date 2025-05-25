/**
 * Test configuration settings
 * 
 * This file contains configuration for tests that need to interact with real APIs.
 * It follows the project's rules by using real endpoints and data.
 */

// Base configuration
export const config = {
  // API configuration
  api: {
    // Base URL for API requests - always use the correct port (5001)
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5001/api',
    // Default timeout for API requests (in milliseconds)
    timeout: 30000,
    // Minimal headers to avoid CORS issues
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  
  // Test-specific settings
  test: {
    // Whether to run tests that require a real backend
    integration: process.env.RUN_INTEGRATION_TESTS === 'true',
    // Whether to log detailed debug information
    debug: process.env.DEBUG_TESTS === 'true',
    // Maximum retry attempts for flaky tests
    maxRetries: 3,
    // Delay between retries (ms)
    retryDelay: 1000
  }
};

/**
 * Skip test if integration tests are disabled
 */
export function skipIfNoIntegration(test) {
  return config.test.integration ? test : test.skip;
}

/**
 * Log debug information if debug mode is enabled
 */
export function debugLog(...args) {
  if (config.test.debug) {
    console.log('[DEBUG]', ...args);
  }
}
