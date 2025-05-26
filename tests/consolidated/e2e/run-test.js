#!/usr/bin/env node

/**
 * Simple test runner for E2E tests
 */

import Mocha from 'mocha';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a new Mocha instance
const mocha = new Mocha({
  timeout: 15000,
  ui: 'bdd',
  color: true
});

// Get the test file from command line arguments
const testFile = process.argv[2];

if (!testFile) {
  console.error('Please specify a test file to run');
  process.exit(1);
}

const testPath = path.resolve(__dirname, 'tests', testFile);
console.log(`Running test: ${testPath}`);

// Add the test file to Mocha
mocha.addFile(testPath);

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
});
