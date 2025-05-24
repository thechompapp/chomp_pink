#!/usr/bin/env node

/**
 * Main test runner for the Doof application
 * This script can run all tests or specific test types
 */

import Mocha from 'mocha';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import glob from 'glob';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a new Mocha instance
const mocha = new Mocha({
  timeout: 15000,
  ui: 'bdd',
  color: true
});

// Get the test type from command line arguments
const testType = process.argv[2] || 'all'; // Default to all tests
const specificTest = process.argv[3]; // Optional specific test file

// Define test directories
const testDirs = {
  e2e: {
    api: path.resolve(__dirname, 'e2e/api'),
    features: path.resolve(__dirname, 'e2e/features')
  },
  integration: path.resolve(__dirname, 'integration'),
  unit: {
    services: path.resolve(__dirname, 'unit/services')
  }
};

// Function to add test files to Mocha
function addTestFiles(pattern, options = {}) {
  const files = glob.sync(pattern, options);
  console.log(`Found ${files.length} test files matching pattern: ${pattern}`);
  files.forEach(file => {
    console.log(`Adding test file: ${file}`);
    mocha.addFile(file);
  });
  return files.length;
}

// Run tests based on the specified type
let testCount = 0;

switch (testType) {
  case 'all':
    console.log('Running all tests...');
    testCount += addTestFiles(path.join(testDirs.e2e.api, '**/*.test.js'));
    testCount += addTestFiles(path.join(testDirs.e2e.api, '**/*-e2e-test.js'));
    testCount += addTestFiles(path.join(testDirs.e2e.features, '**/*.test.js'));
    testCount += addTestFiles(path.join(testDirs.e2e.features, '**/*-e2e-test.js'));
    testCount += addTestFiles(path.join(testDirs.integration, '**/*.test.js'));
    testCount += addTestFiles(path.join(testDirs.unit.services, '**/*.test.js'));
    break;
  case 'e2e':
    console.log('Running all E2E tests...');
    if (specificTest) {
      // Try to find the specific test in both e2e directories
      const apiPattern = path.join(testDirs.e2e.api, `**/*${specificTest}*.js`);
      const featuresPattern = path.join(testDirs.e2e.features, `**/*${specificTest}*.js`);
      testCount += addTestFiles(apiPattern);
      testCount += addTestFiles(featuresPattern);
    } else {
      testCount += addTestFiles(path.join(testDirs.e2e.api, '**/*.test.js'));
      testCount += addTestFiles(path.join(testDirs.e2e.api, '**/*-e2e-test.js'));
      testCount += addTestFiles(path.join(testDirs.e2e.features, '**/*.test.js'));
      testCount += addTestFiles(path.join(testDirs.e2e.features, '**/*-e2e-test.js'));
    }
    break;
  case 'e2e-api':
    console.log('Running E2E API tests...');
    if (specificTest) {
      testCount += addTestFiles(path.join(testDirs.e2e.api, `**/*${specificTest}*.js`));
    } else {
      testCount += addTestFiles(path.join(testDirs.e2e.api, '**/*.test.js'));
      testCount += addTestFiles(path.join(testDirs.e2e.api, '**/*-e2e-test.js'));
    }
    break;
  case 'e2e-features':
    console.log('Running E2E feature tests...');
    if (specificTest) {
      testCount += addTestFiles(path.join(testDirs.e2e.features, `**/*${specificTest}*.js`));
    } else {
      testCount += addTestFiles(path.join(testDirs.e2e.features, '**/*.test.js'));
      testCount += addTestFiles(path.join(testDirs.e2e.features, '**/*-e2e-test.js'));
    }
    break;
  case 'integration':
    console.log('Running integration tests...');
    if (specificTest) {
      testCount += addTestFiles(path.join(testDirs.integration, `**/*${specificTest}*.js`));
    } else {
      testCount += addTestFiles(path.join(testDirs.integration, '**/*.test.js'));
    }
    break;
  case 'unit':
    console.log('Running unit tests...');
    if (specificTest) {
      testCount += addTestFiles(path.join(testDirs.unit.services, `**/*${specificTest}*.js`));
    } else {
      testCount += addTestFiles(path.join(testDirs.unit.services, '**/*.test.js'));
    }
    break;
  default:
    // Assume it's a specific test file
    const testFile = testType;
    console.log(`Looking for test file: ${testFile}`);
    
    // Try to find the test file in all test directories
    let found = false;
    
    // Check in e2e/api
    const apiPattern = path.join(testDirs.e2e.api, `**/*${testFile}*.js`);
    found = addTestFiles(apiPattern) > 0 || found;
    
    // Check in e2e/features
    const featuresPattern = path.join(testDirs.e2e.features, `**/*${testFile}*.js`);
    found = addTestFiles(featuresPattern) > 0 || found;
    
    // Check in integration
    const integrationPattern = path.join(testDirs.integration, `**/*${testFile}*.js`);
    found = addTestFiles(integrationPattern) > 0 || found;
    
    // Check in unit/services
    const unitPattern = path.join(testDirs.unit.services, `**/*${testFile}*.js`);
    found = addTestFiles(unitPattern) > 0 || found;
    
    if (!found) {
      console.error(`No test files found matching: ${testFile}`);
      process.exit(1);
    }
    
    testCount = 1; // At least one test was found
}

if (testCount === 0) {
  console.error('No test files found');
  process.exit(1);
}

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
});
