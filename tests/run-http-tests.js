/**
 * HTTP Service Test Runner
 * 
 * This script runs the HTTP service tests with mock environment variables
 * to avoid needing a .env file.
 */

// Set required environment variables
process.env.API_BASE_URL = 'http://localhost:5001/api';
process.env.TEST_USER_EMAIL = 'test_user@example.com';
process.env.TEST_USER_PASSWORD = 'test_password';
process.env.TEST_USER_USERNAME = 'testuser';
process.env.TEST_ADMIN_EMAIL = 'admin_user@example.com';
process.env.TEST_ADMIN_PASSWORD = 'admin_password';
process.env.TEST_ADMIN_USERNAME = 'adminuser';

// Import and run Vitest
import { defineConfig } from 'vitest/config';
import { execa } from 'execa';

async function runTests() {
  try {
    console.log('Running HTTP service tests...');
    
    // Run only the HTTP service tests
    await execa('npx', ['vitest', 'run', 'tests/unit/services/httpService.test.js'], {
      stdio: 'inherit',
      env: process.env
    });
    
    console.log('HTTP service tests completed successfully.');
  } catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
  }
}

runTests();
