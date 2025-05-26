#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * 
 * This script runs all E2E tests with proper setup and teardown.
 * It ensures the backend server is running, sets up the test environment,
 * and provides detailed reporting of test results.
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setTimeout } from 'timers/promises';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const backendDir = path.join(projectRoot, 'doof-backend');

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
 * Check if a port is in use
 */
function isPortInUse(port) {
  try {
    const result = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' });
    return result.trim() !== '';
  } catch (error) {
    return false;
  }
}

/**
 * Kill a process running on a specific port
 */
function killProcessOnPort(port) {
  try {
    log(`Killing process on port ${port}...`, colors.yellow);
    execSync(`kill -9 $(lsof -i :${port} -t)`, { stdio: 'inherit' });
    log(`Port ${port} is now available`, colors.green);
    return true;
  } catch (error) {
    log(`Failed to kill process on port ${port}: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Start the backend server
 */
async function startBackendServer(port) {
  return new Promise((resolve, reject) => {
    // Check if backend directory exists
    if (!fs.existsSync(backendDir)) {
      log(`Backend directory not found at ${backendDir}`, colors.red);
      reject(new Error('Backend directory not found'));
      return;
    }
    
    // Check if the server is already running
    if (isPortInUse(port)) {
      log(`Backend server is already running on port ${port}`, colors.green);
      resolve({ alreadyRunning: true });
      return;
    }
    
    // Set environment variables for the backend server
    const env = {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    };
    
    // Start the backend server
    log(`Starting backend server on port ${port}...`, colors.blue);
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true,
      env,
      detached: true
    });
    
    // Handle process events
    backendProcess.on('error', (error) => {
      log(`Error starting backend server: ${error.message}`, colors.red);
      reject(error);
    });
    
    // Wait for the server to start
    setTimeout(5000).then(() => {
      if (isPortInUse(port)) {
        log(`Backend server started on port ${port}`, colors.green);
        resolve({ process: backendProcess, alreadyRunning: false });
      } else {
        reject(new Error(`Backend server failed to start on port ${port}`));
      }
    });
  });
}

/**
 * Run a single test file
 */
async function runTest(testFilePath) {
  return new Promise((resolve, reject) => {
    log(`Running test: ${path.basename(testFilePath)}`, colors.blue);
    
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
        log(`Test completed successfully: ${path.basename(testFilePath)}`, colors.green);
        resolve({ success: true, file: path.basename(testFilePath) });
      } else {
        log(`Test failed: ${path.basename(testFilePath)}`, colors.red);
        resolve({ success: false, file: path.basename(testFilePath), code });
      }
    });
  });
}

/**
 * Find all test files in the tests directory
 */
function findTestFiles() {
  const testsDir = path.join(__dirname, 'tests');
  const files = fs.readdirSync(testsDir);
  
  // Filter for test files
  return files
    .filter(file => file.endsWith('.test.js') || file.endsWith('.e2e.test.js'))
    .map(file => path.join(testsDir, file));
}

/**
 * Run all tests
 */
async function runAllTests() {
  const testFiles = findTestFiles();
  log(`Found ${testFiles.length} test files`, colors.blue);
  
  const results = {
    total: testFiles.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    files: []
  };
  
  for (const testFile of testFiles) {
    try {
      const result = await runTest(testFile);
      results.files.push({
        file: path.basename(testFile),
        success: result.success,
        code: result.code
      });
      
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      log(`Error running test ${testFile}: ${error.message}`, colors.red);
      results.files.push({
        file: path.basename(testFile),
        success: false,
        error: error.message
      });
      results.failed++;
    }
  }
  
  return results;
}

/**
 * Print test results
 */
function printResults(results) {
  logSection('Test Results');
  
  log(`Total: ${results.total}`, colors.bright);
  log(`Passed: ${results.passed}`, results.passed > 0 ? colors.green : colors.dim);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.dim);
  log(`Skipped: ${results.skipped}`, results.skipped > 0 ? colors.yellow : colors.dim);
  
  console.log('\n');
  log('Test Files:', colors.bright);
  
  results.files.forEach(file => {
    const color = file.success ? colors.green : colors.red;
    const status = file.success ? 'PASS' : 'FAIL';
    log(`[${status}] ${file.file}`, color);
  });
}

/**
 * Main function
 */
async function main() {
  const BACKEND_PORT = 5001;
  
  logSection('Doof E2E Test Runner');
  log(`Starting at: ${new Date().toLocaleString()}`, colors.dim);
  
  try {
    // Start the backend server
    logSection('Starting Backend Server');
    const serverResult = await startBackendServer(BACKEND_PORT);
    
    // Run the tests
    logSection('Running Tests');
    const results = await runAllTests();
    
    // Print the results
    printResults(results);
    
    // Exit with the appropriate code
    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
