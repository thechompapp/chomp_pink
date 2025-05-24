import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Global test timeout (5 seconds)
    testTimeout: 5000,
    
    // Minimal retries for maximum speed
    retry: 0,
    
    // Use global setup and teardown - use absolute path
    globalSetup: path.resolve(__dirname, 'setup/global-setup.js'),
    
    // Environment variables to be available in tests
    env: {
      NODE_ENV: 'test',
    },
    
    // Reporter configuration
    reporters: ['default', 'json'],
    outputFile: 'test-results.json',
    
    // Fail fast - stop after first failure
    // Comment this out if you want all tests to run regardless of failures
    // failFast: true,
    
    // Include source location in test results
    includeSource: true,
    
    // Allow tests to run in parallel for maximum speed
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false, // Use multiple processes
        maxForks: 10, // Use up to 10 processes in parallel
      },
    },
  },
});
