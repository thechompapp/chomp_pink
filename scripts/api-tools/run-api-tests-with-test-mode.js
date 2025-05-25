/**
 * API Test Runner with Test Mode
 * 
 * This script sets the TEST_MODE environment variable to true when running tests,
 * which enables special CORS settings in the backend server.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // Set environment variables to ensure correct API URLs and test mode
  const env = {
    ...process.env,
    VITE_API_BASE_URL: 'http://localhost:5001',
    VITE_FRONTEND_URL: 'http://localhost:5175',
    NODE_ENV: 'test',
    TEST_MODE: 'true'
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
  console.log('🔍 Running API tests with TEST_MODE enabled...');
  
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
