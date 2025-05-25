#!/usr/bin/env node

/**
 * Single E2E Test Runner
 * 
 * This script runs a single E2E test file with verbose logging
 * to help diagnose issues with the test.
 * 
 * Usage: node run-single-test.js <test-file-path>
 * Example: node run-single-test.js tests/auth.e2e.test.js
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted message to the console
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Print a section header
 */
function logSection(title) {
  console.log('\n');
  log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('\n');
}

/**
 * Get the test file path from command line arguments
 */
function getTestFilePath() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    log('No test file specified. Please provide a test file path.', colors.red);
    log('Usage: node run-single-test.js <test-file-path>', colors.yellow);
    log('Example: node run-single-test.js tests/auth.e2e.test.js', colors.yellow);
    process.exit(1);
  }
  
  let testFilePath = args[0];
  
  // If the path doesn't start with a slash or dot, assume it's relative to the tests directory
  if (!testFilePath.startsWith('/') && !testFilePath.startsWith('.')) {
    testFilePath = path.join(__dirname, 'tests', testFilePath);
  }
  
  // If the path doesn't include the tests directory, assume it's in the tests directory
  if (!testFilePath.includes('tests')) {
    testFilePath = path.join(__dirname, 'tests', testFilePath);
  }
  
  // If the path doesn't end with .js, add it
  if (!testFilePath.endsWith('.js')) {
    testFilePath = `${testFilePath}.js`;
  }
  
  // Check if the file exists
  if (!fs.existsSync(testFilePath)) {
    log(`Test file not found: ${testFilePath}`, colors.red);
    process.exit(1);
  }
  
  return testFilePath;
}

/**
 * Run a single test file
 */
function runTest(testFilePath) {
  return new Promise((resolve, reject) => {
    logSection(`Running Test: ${path.basename(testFilePath)}`);
    
    // Build the command arguments
    const args = [
      'vitest',
      'run',
      '--config',
      path.join(__dirname, 'vitest.config.js'),
      '--reporter',
      'verbose',
      testFilePath
    ];
    
    log(`Running command: npx ${args.join(' ')}`, colors.dim);
    
    // Spawn the process
    const testProcess = spawn('npx', args, {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process events
    testProcess.on('error', (error) => {
      log(`Error running test: ${error.message}`, colors.red);
      reject(error);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        log('Test completed successfully', colors.green);
        resolve({ success: true });
      } else {
        log(`Test failed with exit code: ${code}`, colors.red);
        resolve({ success: false, code });
      }
    });
  });
}

/**
 * Main function
 */
async function main() {
  log(`${colors.bright}${colors.magenta}Doof E2E Single Test Runner${colors.reset}`, colors.magenta);
  log(`Starting at: ${new Date().toLocaleString()}`, colors.dim);
  
  try {
    // Get the test file path
    const testFilePath = getTestFilePath();
    
    // Run the test
    const result = await runTest(testFilePath);
    
    // Output final result
    logSection('Test Run Complete');
    if (result.success) {
      log('Test passed successfully! 🎉', colors.green);
      process.exit(0);
    } else {
      log('Test failed. Please check the output above for details.', colors.red);
      process.exit(1);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
