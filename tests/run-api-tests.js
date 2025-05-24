/**
 * API Test Runner
 * 
 * This script sets up the proper environment for API testing,
 * ensuring that the backend server is running and configured correctly.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKEND_URL = 'http://localhost:5001';
const TEST_FILES = [
  'tests/e2e/api/auth-endpoints.test.js',
  'tests/e2e/api/e2e-endpoints.test.js'
];

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>} - True if server is running
 */
async function isBackendRunning() {
  try {
    console.log('Checking if backend server is running...');
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 5000,
      headers: {
        'X-Test-Mode': 'true'
      }
    });
    
    console.log('Backend health check response:', {
      status: response.status,
      message: response.data.message || 'No message'
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Backend server health check failed:', error.message);
    return false;
  }
}

/**
 * Run a test file with the proper environment variables
 * @param {string} testFile - Path to the test file
 * @returns {Promise<boolean>} - True if tests passed
 */
async function runTest(testFile) {
  console.log(`\n🧪 Running tests for: ${testFile}`);
  
  // Set environment variables for testing
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    TEST_MODE: 'true',
    VITE_API_BASE_URL: BACKEND_URL
  };
  
  // Run the test using Vitest
  const testProcess = spawn('npx', ['vitest', 'run', testFile], {
    stdio: 'inherit',
    env,
    shell: true,
    cwd: path.resolve(__dirname, '..')
  });
  
  return new Promise((resolve) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Tests for ${testFile} completed successfully`);
        resolve(true);
      } else {
        console.error(`❌ Tests for ${testFile} failed with code ${code}`);
        resolve(false);
      }
    });
  });
}

/**
 * Main function to run all tests
 */
async function main() {
  console.log('🔍 API Test Runner');
  console.log('=================');
  
  // Check if backend server is running
  const backendRunning = await isBackendRunning();
  if (!backendRunning) {
    console.error('❌ Backend server is not running. Please start it before running tests.');
    process.exit(1);
  }
  
  console.log('✅ Backend server is running and responding to health checks');
  
  // Run all tests
  let allTestsPassed = true;
  for (const testFile of TEST_FILES) {
    const testPassed = await runTest(testFile);
    if (!testPassed) {
      allTestsPassed = false;
    }
  }
  
  // Exit with appropriate code
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
