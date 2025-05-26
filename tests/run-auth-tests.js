/**
 * Auth Tests Runner
 * 
 * This script runs all unit and integration tests for the authentication system.
 * It provides a convenient way to verify the refactored authentication system.
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file and directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  unitTestsDir: path.resolve(__dirname, 'unit/stores/auth'),
  integrationTestsDir: path.resolve(__dirname, 'integration/stores/auth'),
  jestBin: path.resolve(__dirname, '../node_modules/.bin/jest'),
  testTimeout: 10000, // 10 seconds
  verbose: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Prints a section header
 * @param {string} title - Section title
 */
function printHeader(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + ' ' + title + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

/**
 * Prints a subsection header
 * @param {string} title - Subsection title
 */
function printSubHeader(title) {
  console.log('\n' + colors.bright + colors.yellow + '-'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.yellow + ' ' + title + colors.reset);
  console.log(colors.bright + colors.yellow + '-'.repeat(60) + colors.reset + '\n');
}

/**
 * Gets all test files in a directory
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of test file paths
 */
function getTestFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.error(colors.red + `Directory not found: ${dir}` + colors.reset);
    return [];
  }
  
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join(dir, file));
}

/**
 * Runs a test file
 * @param {string} testFile - Path to test file
 * @returns {boolean} - Whether the test passed
 */
function runTest(testFile) {
  const fileName = path.basename(testFile);
  printSubHeader(`Running ${fileName}`);
  
  try {
    const command = `${config.jestBin} ${testFile} --testTimeout=${config.testTimeout} ${config.verbose ? '--verbose' : ''}`;
    execSync(command, { stdio: 'inherit' });
    console.log(colors.green + `✓ ${fileName} passed` + colors.reset);
    return true;
  } catch (error) {
    console.error(colors.red + `✗ ${fileName} failed` + colors.reset);
    return false;
  }
}

/**
 * Runs all tests in a directory
 * @param {string} dir - Directory containing tests
 * @param {string} title - Title for the test section
 * @returns {Object} - Test results
 */
function runTestsInDirectory(dir, title) {
  printHeader(title);
  
  const testFiles = getTestFiles(dir);
  if (testFiles.length === 0) {
    console.log(colors.yellow + 'No test files found' + colors.reset);
    return { total: 0, passed: 0, failed: 0 };
  }
  
  let passed = 0;
  let failed = 0;
  
  testFiles.forEach(testFile => {
    const success = runTest(testFile);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  });
  
  return { total: testFiles.length, passed, failed };
}

// Main execution
function main() {
  printHeader('Auth Tests Runner');
  console.log('Running tests for the refactored authentication system...\n');
  
  // Run unit tests
  const unitResults = runTestsInDirectory(config.unitTestsDir, 'Unit Tests');
  
  // Run integration tests
  const integrationResults = runTestsInDirectory(config.integrationTestsDir, 'Integration Tests');
  
  // Print summary
  printHeader('Test Summary');
  console.log(colors.bright + 'Unit Tests:' + colors.reset);
  console.log(`Total: ${unitResults.total}, Passed: ${colors.green}${unitResults.passed}${colors.reset}, Failed: ${colors.red}${unitResults.failed}${colors.reset}`);
  
  console.log(colors.bright + '\nIntegration Tests:' + colors.reset);
  console.log(`Total: ${integrationResults.total}, Passed: ${colors.green}${integrationResults.passed}${colors.reset}, Failed: ${colors.red}${integrationResults.failed}${colors.reset}`);
  
  console.log(colors.bright + '\nOverall:' + colors.reset);
  const totalTests = unitResults.total + integrationResults.total;
  const totalPassed = unitResults.passed + integrationResults.passed;
  const totalFailed = unitResults.failed + integrationResults.failed;
  console.log(`Total: ${totalTests}, Passed: ${colors.green}${totalPassed}${colors.reset}, Failed: ${colors.red}${totalFailed}${colors.reset}`);
  
  // Exit with appropriate code
  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the main function
main();
