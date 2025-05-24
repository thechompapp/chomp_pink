/**
 * API Test Runner
 * 
 * This script checks if both the backend and frontend servers are running
 * before executing any API tests. It ensures we're using real API data
 * without any mocks.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import directly from the check-servers.js module
import { checkBothServers, BACKEND_URL, FRONTEND_URL } from './tests/setup/check-servers.js';

// Test files to run
const TEST_FILES = [
  'tests/e2e/api/auth-endpoints.test.js',
  'src/hooks/useBulkAddProcessor.test.jsx'
];

/**
 * Run the specified test command
 * @param {string} testFile - The test file to run
 */
function runTest(testFile) {
  console.log(`\n🧪 Running tests for: ${testFile}`);
  
  // Set environment variables to ensure correct API URLs
  const env = {
    ...process.env,
    VITE_API_BASE_URL: BACKEND_URL,
    VITE_FRONTEND_URL: FRONTEND_URL,
    NODE_ENV: 'test'
  };
  
  // Run the test using npm test
  const testProcess = spawn('npm', ['test', '--', testFile], {
    stdio: 'inherit',
    env,
    shell: true
  });
  
  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Tests for ${testFile} completed successfully`);
        resolve(true);
      } else {
        console.error(`❌ Tests for ${testFile} failed with code ${code}`);
        resolve(false);
      }
    });
    
    testProcess.on('error', (err) => {
      console.error(`❌ Error running tests for ${testFile}:`, err);
      reject(err);
    });
  });
}

/**
 * Main function to run all tests
 */
async function main() {
  console.log('🔍 Checking if servers are running...');
  
  const { backend, frontend } = await checkBothServers();
  
  console.log('\n📊 Server Status:');
  console.log(`Backend (${BACKEND_URL}): ${backend ? '✅ Running' : '❌ Not Running'}`);
  console.log(`Frontend (${FRONTEND_URL}): ${frontend ? '✅ Running' : '❌ Not Running'}`);
  
  if (!backend || !frontend) {
    console.error('\n❌ ERROR: Both servers must be running to execute tests.');
    console.error('Please start the servers and try again:');
    console.error('- Backend: npm run server');
    console.error('- Frontend: npm run dev');
    process.exit(1);
  }
  
  console.log('\n✅ Both servers are running. Proceeding with tests...');
  
  // Run all tests sequentially
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
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
