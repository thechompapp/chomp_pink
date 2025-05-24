#!/usr/bin/env node
/**
 * Test Runner with Enhanced Reporting for Chomp/Doof
 * 
 * This script runs tests and displays results using the custom terminal reporter.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { processTestResultsFile } from './utils/test-reporter.js';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEST_RESULTS_PATH = path.join(__dirname, '..', 'test-results.json');
const DEFAULT_TEST_PATTERN = 'tests/e2e/api';

/**
 * Run tests and capture results
 * @param {string} testPattern - Pattern to match test files
 * @returns {boolean} - Whether tests passed
 */
function runTests(testPattern) {
  console.log(chalk.blue(`Running tests matching pattern: ${testPattern}`));
  console.log(chalk.gray('This may take a moment...\n'));
  
  try {
    // Run tests with JSON reporter to capture results
    execSync(
      `npm test -- ${testPattern} --reporter=json --outputFile=${TEST_RESULTS_PATH}`,
      { stdio: 'inherit' }
    );
    return true;
  } catch (error) {
    // Tests failed but we still want to show the report
    return false;
  }
}

/**
 * Main function
 */
function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  // Remove verbose flags to get the test pattern
  const testPatternArgs = args.filter(arg => !arg.startsWith('-'));
  const testPattern = testPatternArgs.length > 0 ? testPatternArgs.join(' ') : DEFAULT_TEST_PATTERN;
  
  // Run tests
  const testsPassed = runTests(testPattern);
  
  // Display results if available
  if (fs.existsSync(TEST_RESULTS_PATH)) {
    console.log(chalk.blue('\nTest Results:'));
    processTestResultsFile(TEST_RESULTS_PATH, { verbose });
    
    // Clean up results file
    fs.unlinkSync(TEST_RESULTS_PATH);
    
    // Exit with appropriate code
    process.exit(testsPassed ? 0 : 1);
  } else {
    console.error(chalk.red('No test results found. Tests may have failed to run.'));
    process.exit(1);
  }
}

// Run the script
main();
