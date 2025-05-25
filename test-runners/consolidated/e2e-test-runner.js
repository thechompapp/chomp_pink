/**
 * E2E Test Runner
 * 
 * Handles running all end-to-end tests in the application.
 */

import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run E2E tests
 * @param {Object} config - Test configuration
 * @returns {Promise<boolean>} True if all tests pass
 */
async function runE2ETests(config = {}) {
  console.log('🚀 Starting E2E tests...');
  
  try {
    // Find all E2E test files
    const testFiles = findTestFiles(path.join(process.cwd(), 'src/__tests__/e2e'), 'e2e');
    
    if (testFiles.length === 0) {
      console.log('ℹ️  No E2E test files found.');
      return true;
    }
    
    console.log(`🔍 Found ${testFiles.length} E2E test files.`);
    
    // Run tests using the appropriate test runner
    const command = `npx playwright test ${testFiles.join(' ')}`;
    console.log(`📝 Running: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ E2E tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ E2E tests failed:', error);
    return false;
  }
}

/**
 * Find test files in the specified directory
 * @param {string} dir - Directory to search
 * @param {string} type - Test type (unit, integration, e2e)
 * @returns {string[]} Array of test file paths
 */
function findTestFiles(dir, type) {
  try {
    // For E2E tests, look for files in the e2e directory or files ending with .e2e.test.js
    const testDir = type === 'e2e' ? path.join(dir, 'e2e') : dir;
    
    if (!fs.existsSync(testDir)) {
      console.log(`ℹ️  Directory not found: ${testDir}`);
      return [];
    }

    const files = fs.readdirSync(testDir, { withFileTypes: true });
    let testFiles = [];

    for (const file of files) {
      const fullPath = path.join(testDir, file.name);
      
      if (file.isDirectory()) {
        testFiles = testFiles.concat(findTestFiles(fullPath, type));
      } else if (
        file.name.endsWith('.test.js') ||
        file.name.endsWith('.spec.js') ||
        file.name.endsWith('.e2e.test.js') ||
        file.name.endsWith('.e2e.spec.js')
      ) {
        // For E2E tests, include all test files in the e2e directory
        if (type === 'e2e' || fullPath.includes(`/${type}/`)) {
          testFiles.push(fullPath);
        }
      }
    }

    return testFiles;
  } catch (error) {
    console.error(`Error finding test files in ${dir}:`, error);
    return [];
  }
}

export { runE2ETests };
