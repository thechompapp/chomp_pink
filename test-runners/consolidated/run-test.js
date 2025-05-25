#!/usr/bin/env node

/**
 * Enhanced test runner for all test types
 */

import Mocha from 'mocha';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Create a new Mocha instance
const mocha = new Mocha({
  timeout: 15000,
  ui: 'bdd',
  color: true
});

// Get the test file and type from command line arguments
const testFile = process.argv[2];
const testType = process.argv[3] || 'auto'; // Default to auto-detect

if (!testFile) {
  console.error('Please specify a test file to run');
  console.error('Usage: node run-test.js <test-file> [test-type]');
  console.error('  test-type can be: e2e, integration, unit, or auto (default)');
  process.exit(1);
}

// Determine the test path based on the test type and file
let testPath;
if (testType === 'auto') {
  // Auto-detect the test type based on the file name pattern
  if (testFile.includes('e2e')) {
    // Check if it's a feature test or an API test
    if (testFile.includes('api-') || testFile.includes('health')) {
      testPath = path.resolve(rootDir, 'e2e/api', testFile);
    } else {
      testPath = path.resolve(rootDir, 'e2e/features', testFile);
    }
  } else if (testFile.includes('simplified') || testFile.includes('simple-')) {
    testPath = path.resolve(rootDir, 'integration', testFile);
  } else {
    // Check if it's a service test
    if (testFile.includes('Service')) {
      testPath = path.resolve(rootDir, 'unit/services', testFile);
    } else {
      // Default to integration tests
      testPath = path.resolve(rootDir, 'integration', testFile);
    }
  }
} else {
  // Use the specified test type
  switch (testType) {
    case 'e2e-api':
      testPath = path.resolve(rootDir, 'e2e/api', testFile);
      break;
    case 'e2e-features':
      testPath = path.resolve(rootDir, 'e2e/features', testFile);
      break;
    case 'e2e':
      // Try both e2e directories
      const featuresPath = path.resolve(rootDir, 'e2e/features', testFile);
      const apiPath = path.resolve(rootDir, 'e2e/api', testFile);
      if (fs.existsSync(featuresPath)) {
        testPath = featuresPath;
      } else {
        testPath = apiPath;
      }
      break;
    case 'integration':
      testPath = path.resolve(rootDir, 'integration', testFile);
      break;
    case 'unit':
      testPath = path.resolve(rootDir, 'unit/services', testFile);
      break;
    default:
      console.error(`Unknown test type: ${testType}`);
      process.exit(1);
  }
}

console.log(`Running test: ${testPath}`);

// Check if the test file exists
if (!fs.existsSync(testPath)) {
  console.error(`Test file not found: ${testPath}`);
  process.exit(1);
}

// Add the test file to Mocha
mocha.addFile(testPath);

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
});
