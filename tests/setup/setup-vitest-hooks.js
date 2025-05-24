/**
 * Setup Vitest Hooks for Enhanced API Test Reporting
 * 
 * This module sets up Vitest hooks to capture API request and response data
 * for improved test reporting.
 */

// Setup global hooks for Vitest to capture test context
export function setupVitestHooks() {
  // Store the current test context
  let currentTest = null;
  
  // Before each test
  beforeEach((context) => {
    // Make the current test context available globally
    global.currentTest = context;
    
    // Initialize meta object if it doesn't exist
    if (!context.meta) {
      context.meta = {};
    }
  });
  
  // After each test
  afterEach(() => {
    // Clear the current test context
    global.currentTest = null;
  });
}

export default setupVitestHooks;
