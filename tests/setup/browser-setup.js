/**
 * Browser Test Setup
 * 
 * This file configures the browser environment for API tests,
 * disabling CORS restrictions and setting up global variables.
 */

// Configure the global environment for browser tests
window.process = window.process || {};
window.process.env = window.process.env || {};

// Set environment variables
window.process.env.NODE_ENV = 'test';
window.process.env.TEST_MODE = 'true';
window.process.env.VITE_API_BASE_URL = 'http://localhost:5001';

// Disable CORS restrictions in the test environment
const originalFetch = window.fetch;
window.fetch = function(...args) {
  // Add CORS headers to all requests
  if (args[1] && typeof args[1] === 'object') {
    args[1].mode = 'cors';
    args[1].credentials = 'include';
    
    // Add headers if they don't exist
    args[1].headers = args[1].headers || {};
    args[1].headers['X-Test-Mode'] = 'true';
  }
  
  return originalFetch.apply(this, args);
};

// Configure XMLHttpRequest to ignore CORS
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(...args) {
  // Add withCredentials to all XHR requests
  this.withCredentials = true;
  return originalXHROpen.apply(this, args);
};

// Log setup completion
console.log('Browser test environment configured');
