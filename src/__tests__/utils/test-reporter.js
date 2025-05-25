/**
 * Terminal-Based Test Results Reporter for Chomp/Doof
 * 
 * This script processes test results from the Chomp/Doof application's testing suite
 * and generates a clear, informative, and well-formatted terminal output.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import { fileURLToPath } from 'url';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Symbols for test status
const SYMBOLS = {
  PASS: chalk.green('✅'),
  FAIL: chalk.red('❌'),
  SKIP: chalk.gray('➖')
};

/**
 * Formats and displays test results in the terminal
 * @param {Object} results - The test results object
 * @param {Object} options - Display options
 */
function displayTestResults(results, options = { verbose: false }) {
  // Vitest JSON reporter format
  const { testResults, numFailedTests, numPassedTests, numPendingTests, numTotalTests } = results;
  
  // Display summary header
  console.log(boxen(
    chalk.bold('Chomp/Doof Test Run Summary\n\n') +
    `Total Tests: ${numTotalTests} | ${SYMBOLS.PASS} Passed: ${numPassedTests} | ${SYMBOLS.FAIL} Failed: ${numFailedTests} | ${SYMBOLS.SKIP} Skipped: ${numPendingTests}\n` +
    `Duration: ${(results.startTime ? ((Date.now() - results.startTime) / 1000).toFixed(1) : '?')}s`,
    { padding: 1, margin: 1, borderColor: 'blue' }
  ));
  
  // Process each test suite
  testResults.forEach(suite => {
    // Extract file name from the full path
    const suiteName = suite.name.split('/').pop();
    
    // Calculate pass/fail ratio for the suite
    const passedCount = suite.assertionResults.filter(test => test.status === 'passed').length;
    const totalCount = suite.assertionResults.length;
    const suiteStatus = suite.status === 'passed' ? 
      chalk.green(`(${passedCount}/${totalCount} passed)`) : 
      chalk.red(`(${passedCount}/${totalCount} passed)`);
    
    console.log(chalk.bold(`\nSuite: ${suiteName} ${suiteStatus}`));
    
    // Process each test case
    suite.assertionResults.forEach(test => {
      const status = test.status === 'passed' ? SYMBOLS.PASS : 
                     test.status === 'failed' ? SYMBOLS.FAIL : SYMBOLS.SKIP;
      
      const duration = test.duration ? `(${test.duration.toFixed(0)}ms)` : '';
      console.log(`  ${status} Test: ${test.title} ${chalk.gray(duration)}`);
      
      // Display API request/response details if available
      if ((test.status === 'failed' || options.verbose) && test.meta?.apiRequest) {
        displayApiDetails(test.meta.apiRequest, test.meta.apiResponse);
      }
      
      // Display error details for failed tests
      if (test.status === 'failed' && test.failureMessages && test.failureMessages.length > 0) {
        test.failureMessages.forEach(message => {
          console.log(chalk.red(`    Error: ${formatErrorMessage(message)}`));
        });
      }
    });
  });
}

/**
 * Formats and displays API request and response details
 * @param {Object} request - The API request object
 * @param {Object} response - The API response object
 */
function displayApiDetails(request, response) {
  if (request) {
    console.log(chalk.cyan('    API Request:'));
    console.log(`      ${request.method} ${request.url}`);
    
    if (request.headers && Object.keys(request.headers).length > 0) {
      console.log(chalk.cyan('      Headers:'));
      Object.entries(request.headers)
        .filter(([key]) => !key.toLowerCase().includes('authorization'))
        .forEach(([key, value]) => {
          console.log(`        ${key}: ${value}`);
        });
    }
    
    if (request.body) {
      console.log(chalk.cyan('      Body:'));
      console.log(`        ${formatJson(request.body)}`);
    }
  }
  
  if (response) {
    console.log(chalk.cyan('    API Response:'));
    console.log(`      Status: ${response.status}`);
    
    if (response.headers && Object.keys(response.headers).length > 0) {
      console.log(chalk.cyan('      Headers:'));
      Object.entries(response.headers).forEach(([key, value]) => {
        console.log(`        ${key}: ${value}`);
      });
    }
    
    if (response.data) {
      console.log(chalk.cyan('      Body:'));
      console.log(`        ${formatJson(response.data)}`);
    }
  }
}

/**
 * Formats JSON for display in the terminal
 * @param {Object} json - The JSON object to format
 * @returns {string} - Formatted JSON string
 */
function formatJson(json) {
  try {
    return JSON.stringify(json, null, 2)
      .split('\n')
      .map((line, i) => i === 0 ? line : `        ${line}`)
      .join('\n');
  } catch (error) {
    return String(json);
  }
}

/**
 * Formats error messages for display
 * @param {string} message - The error message
 * @returns {string} - Formatted error message
 */
function formatErrorMessage(message) {
  return message
    .split('\n')
    .filter(line => !line.includes('node_modules'))
    .slice(0, 3)
    .join('\n      ');
}

/**
 * Main function to process test results file and display output
 * @param {string} filePath - Path to the test results JSON file
 * @param {Object} options - Display options
 */
function processTestResultsFile(filePath, options = { verbose: false }) {
  try {
    const results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    displayTestResults(results, options);
  } catch (error) {
    console.error(chalk.red(`Error processing test results file: ${error.message}`));
    process.exit(1);
  }
}

// If this script is run directly from the command line
// In ES modules, we can check if this is the main module by comparing import.meta.url
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  if (!filePath) {
    console.error(chalk.red('Error: Please provide a path to the test results JSON file'));
    console.log('Usage: node test-reporter.js <path_to_results.json> [--verbose]');
    process.exit(1);
  }
  
  processTestResultsFile(filePath, { verbose });
}

export {
  displayTestResults,
  processTestResultsFile
};
