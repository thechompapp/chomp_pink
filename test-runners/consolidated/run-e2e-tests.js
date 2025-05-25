#!/usr/bin/env node

/**
 * E2E Test Runner
 * 
 * This script runs all E2E tests for the Doof application.
 * It handles test setup, execution, and reporting.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const config = {
  testDir: path.join(__dirname, 'tests'),
  setupDir: path.join(__dirname, 'setup'),
  timeout: 5000, // 5 seconds - lightning fast
  reporters: ['default', 'json'],
  outputFile: path.join(__dirname, 'test-results.json')
};

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
 * Check if required setup files exist
 */
function checkSetupFiles() {
  logSection('Checking Setup Files');
  
  const requiredFiles = [
    'api-client.js',
    'config.js',
    'db-utils.js'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(config.setupDir, file);
    if (fs.existsSync(filePath)) {
      log(`✓ ${file} exists`, colors.green);
    } else {
      log(`✗ ${file} does not exist`, colors.red);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Get all test files
 */
function getTestFiles() {
  logSection('Finding Test Files');
  
  // Look for both .e2e.test.js and -e2e-test.js files
  const testFiles = fs.readdirSync(config.testDir)
    .filter(file => file.endsWith('.e2e.test.js') || file.endsWith('-e2e-test.js'))
    .map(file => path.join(config.testDir, file));
  
  if (testFiles.length === 0) {
    log('No test files found', colors.yellow);
    return [];
  }
  
  log(`Found ${testFiles.length} test files:`, colors.green);
  testFiles.forEach(file => {
    log(`- ${path.basename(file)}`, colors.dim);
  });
  
  return testFiles;
}

/**
 * Run the tests using Vitest
 */
function runTests(testFiles) {
  return new Promise((resolve, reject) => {
    logSection('Running E2E Tests');
    
    if (testFiles.length === 0) {
      log('No test files to run', colors.yellow);
      resolve({ success: false, message: 'No test files found' });
      return;
    }
    
    // Build the command arguments
    const args = [
      'vitest',
      'run',
      '--config',
      path.join(__dirname, 'vitest.config.js'),
      ...testFiles
    ];
    
    log(`Running command: npx ${args.join(' ')}`, colors.dim);
    
    // Spawn the process
    const testProcess = spawn('npx', args, {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process events
    testProcess.on('error', (error) => {
      log(`Error running tests: ${error.message}`, colors.red);
      reject(error);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        log('All tests completed successfully', colors.green);
        resolve({ success: true });
      } else {
        log(`Tests failed with exit code: ${code}`, colors.red);
        resolve({ success: false, code });
      }
    });
  });
}

/**
 * Main function
 */
async function main() {
  log(`${colors.bright}${colors.magenta}Doof E2E Test Runner${colors.reset}`, colors.magenta);
  log(`Starting at: ${new Date().toLocaleString()}`, colors.dim);
  
  try {
    // Check setup files
    const setupFilesExist = checkSetupFiles();
    if (!setupFilesExist) {
      log('Missing required setup files. Please check the setup directory.', colors.red);
      process.exit(1);
    }
    
    // Get test files
    const testFiles = getTestFiles();
    
    // Run tests
    const result = await runTests(testFiles);
    
    // Output final result
    logSection('Test Run Complete');
    if (result.success) {
      log('All tests passed successfully! 🎉', colors.green);
      process.exit(0);
    } else {
      log('Some tests failed. Please check the output above for details.', colors.red);
      process.exit(1);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
