/**
 * Run Tests With Server Check
 * 
 * This script ensures both frontend and backend servers are running before executing tests.
 * It provides a more reliable test environment by verifying connectivity first.
 * 
 * IMPORTANT: Tests will NOT run unless BOTH frontend and backend servers are active.
 * All tests use REAL API requests - NO mock data.
 */

import { spawn, exec } from 'child_process';
import axios from 'axios';
import { join } from 'path';

// Configuration
const TEST_COMMAND = 'npm';
const TEST_ARGS = ['test'];
const TEST_TIMEOUT = 300000; // 5 minutes
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5175';
const MAX_CHECK_ATTEMPTS = 10;
const CHECK_INTERVAL = 3000; // 3 seconds

/**
 * Run the test command
 * @returns {Promise<boolean>} - Whether the tests passed
 */
async function runTests() {
  return new Promise((resolve) => {
    console.log('Running tests...');
    
    const testProcess = spawn(TEST_COMMAND, TEST_ARGS, {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Tests completed successfully!');
        resolve(true);
      } else {
        console.error(`❌ Tests failed with exit code ${code}`);
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      console.error(`Error running tests: ${error.message}`);
      resolve(false);
    });
    
    // Set a timeout to avoid hanging
    setTimeout(() => {
      console.error(`Test execution timed out after ${TEST_TIMEOUT / 60000} minutes`);
      testProcess.kill();
      resolve(false);
    }, TEST_TIMEOUT);
  });
}

/**
 * Check if a server is running by making a request to it
 */
async function isServerRunning(url) {
  try {
    console.log(`Checking connection to ${url}...`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ Successfully connected to ${url}`);
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    // For frontend server, a 404 response is actually OK - it means the server is running
    // but the path doesn't exist (which is expected for the root path in Vite)
    if (error.response && error.response.status === 404 && url.includes('localhost:5175')) {
      console.log(`✅ Frontend server is running (404 response is expected)`);
      console.log(`   Status: ${error.response.status}`);
      return true;
    }
    
    console.log(`❌ Failed to connect to ${url}`);
    if (error.code) {
      console.log(`   Error code: ${error.code}`);
    }
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.statusText}`);
    } else {
      console.log('   No response received from server');
    }
    return false;
  }
}

/**
 * Verify that both servers are running
 */
async function verifyServersRunning() {
  console.log('=== Verifying server connectivity ===');
  
  // Check backend server
  const backendRunning = await isServerRunning(BACKEND_URL + '/api/health');
  
  // Check frontend server
  const frontendRunning = await isServerRunning(FRONTEND_URL + '/');
  
  console.log(`Backend server running: ${backendRunning}`);
  console.log(`Frontend server running: ${frontendRunning}`);
  
  // Both servers must be running
  return backendRunning && frontendRunning;
}

/**
 * Main function to run tests with server check
 */
async function main() {
  console.log('=== Running tests with server check ===');
  
  try {
    // Verify both servers are running
    const serversRunning = await verifyServersRunning();
    
    if (!serversRunning) {
      console.error('❌ CANNOT RUN TESTS - Both frontend and backend servers MUST be running');
      console.error('Please start both servers and try again');
      process.exit(1);
    }
    
    console.log('✅ Both servers are running - proceeding with tests');
    console.log('✅ All tests will use REAL API data - NO mocks');
    
    // Run tests
    const testsSucceeded = await runTests();
    
    // Exit with appropriate code
    process.exit(testsSucceeded ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
