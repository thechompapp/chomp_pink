/**
 * Vitest Browser Configuration
 * 
 * This configuration sets up Vitest to run tests in a browser environment
 * instead of Node.js, which helps avoid CORS issues with API tests.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom', // Use a browser-like environment
    globals: true,
    setupFiles: ['./tests/setup/browser-setup.js'],
    testTimeout: 30000, // 30 seconds
    environmentOptions: {
      // Configure the browser environment
      happyDOM: {
        // Allow cross-origin requests
        settings: {
          enableCrossOriginRequests: true,
          disableCORS: true
        }
      }
    }
  },
  define: {
    // Define environment variables
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.TEST_MODE': JSON.stringify('true'),
    'process.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:5001')
  }
});
