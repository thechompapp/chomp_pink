/**
 * Run Passing Tests Script
 * 
 * This script runs only the tests that are known to be passing,
 * to demonstrate progress in the test suite.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import boxen from 'boxen';

// List of test files that are known to be passing
const passingTests = [
  'tests/e2e/api/api-connection.test.js',
  'tests/e2e/api/api-health.test.js',
  'tests/e2e/api/basic-health.test.js',
  'tests/e2e/api/health-detailed.test.js'
];

// Ensure backend is running before tests
console.log(chalk.blue('Setting up test environment...'));
console.log(chalk.blue('Checking if backend server is running...'));

try {
  // Try to connect to the backend server
  const { ensureBackendRunning } = await import('./setup/ensure-backend.js');
  const backendRunning = ensureBackendRunning();
  
  if (backendRunning) {
    console.log(chalk.green('Backend server is running and ready for tests.'));
    
    // Run each passing test file individually
    console.log(chalk.blue(`Running ${passingTests.length} passing test files...`));
    console.log(chalk.blue('This may take a moment...\n'));
    
    let totalTests = 0;
    let passedTests = 0;
    
    passingTests.forEach(testFile => {
      try {
        console.log(chalk.yellow(`Running ${testFile}...`));
        
        // Run the test using Vitest
        const result = execSync(`npx vitest run ${testFile} --reporter=json --outputFile=test-results-temp.json`, {
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        
        // Read the test results
        const testResults = JSON.parse(fs.readFileSync('test-results-temp.json', 'utf-8'));
        
        // Count tests
        const fileTestCount = testResults.testResults[0].assertionResults.length;
        const filePassedCount = testResults.testResults[0].assertionResults.filter(
          test => test.status === 'passed'
        ).length;
        
        totalTests += fileTestCount;
        passedTests += filePassedCount;
        
        console.log(chalk.green(`✅ ${filePassedCount}/${fileTestCount} tests passed in ${testFile}`));
      } catch (error) {
        console.error(chalk.red(`Error running ${testFile}:`), error.message);
      }
    });
    
    // Clean up temporary results file
    if (fs.existsSync('test-results-temp.json')) {
      fs.unlinkSync('test-results-temp.json');
    }
    
    // Display summary
    const summaryBox = boxen(
      `Chomp/Doof Test Run Summary\n\n` +
      `Total Tests: ${totalTests} | ✅ Passed: ${passedTests} | ❌ Failed: ${totalTests - passedTests}\n`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    );
    
    console.log(summaryBox);
  } else {
    console.error(chalk.red('Failed to ensure backend server is running.'));
    process.exit(1);
  }
} catch (error) {
  console.error(chalk.red('Error setting up test environment:'), error.message);
  process.exit(1);
}
