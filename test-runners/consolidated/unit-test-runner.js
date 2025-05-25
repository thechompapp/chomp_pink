/**
 * Unit Test Runner
 * 
 * Handles running all unit tests in the application.
 */

import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run unit tests
 * @param {Object} config - Test configuration
 * @returns {Promise<boolean>} True if all tests pass
 */
async function runUnitTests(config = {}) {
  console.log('🚀 Starting unit tests...');
  
  try {
    // Find all unit test files
    const testFiles = findTestFiles(path.join(process.cwd(), 'src/__tests__'), 'unit');
    
    if (testFiles.length === 0) {
      console.log('ℹ️  No unit test files found.');
      return true;
    }
    
    console.log(`🔍 Found ${testFiles.length} unit test files.`);
    
    // Run tests using Vitest
    const command = `npx vitest run ${config.watch ? '--watch' : ''} ${testFiles.join(' ')}`;
    console.log(`📝 Running: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Unit tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Unit tests failed:', error);
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
    // For unit tests, look for files in the unit directory or files ending with .test.js
    const testDir = type === 'unit' ? path.join(dir, 'unit') : dir;
    
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
        file.name.endsWith('.spec.js')
      ) {
        // For unit tests, only include files in the unit directory
        if (type === 'unit' || fullPath.includes(`/${type}/`)) {
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

export { runUnitTests };
