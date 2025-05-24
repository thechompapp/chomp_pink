/**
 * Run Efficient Tests Script
 * 
 * This script ensures both servers are running before executing tests,
 * making the testing process more efficient and reliable.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import boxen from 'boxen';
import { ensureServersRunning, cleanupServers } from './setup/ensure-servers.js';

// Parse command line arguments
const args = process.argv.slice(2);
const testPattern = args.length > 0 ? args[0] : 'tests/e2e/api';

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nCleaning up server processes...'));
  cleanupServers();
  process.exit(0);
});

// Main function
async function runTests() {
  console.log(chalk.blue('Setting up test environment...'));
  
  try {
    // Ensure both servers are running
    const serversRunning = await ensureServersRunning();
    
    if (!serversRunning) {
      console.error(chalk.red('Failed to ensure servers are running. Cannot run tests.'));
      process.exit(1);
    }
    
    console.log(chalk.green('Both servers are running and ready for tests.'));
    
    // Run tests
    console.log(chalk.blue(`Running tests matching pattern: ${testPattern}`));
    console.log(chalk.blue('This may take a moment...\n'));
    
    try {
      // Run tests using Vitest
      const result = execSync(`npx vitest run ${testPattern} --reporter=json --outputFile=test-results.json`, {
        stdio: 'inherit'
      });
      
      // Parse test results
      const testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));
      
      // Display summary
      displayTestResults(testResults);
    } catch (error) {
      // Even if tests fail, we still want to display results
      try {
        if (fs.existsSync('test-results.json')) {
          const testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));
          displayTestResults(testResults);
        } else {
          console.error(chalk.red('Test execution failed and no results file was generated.'));
        }
      } catch (resultError) {
        console.error(chalk.red('Error parsing test results:'), resultError.message);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error setting up test environment:'), error.message);
    process.exit(1);
  } finally {
    // No need to clean up servers here - we want to keep them running for faster subsequent test runs
  }
}

/**
 * Display test results in a nice format
 * @param {Object} results - The test results object
 */
function displayTestResults(results) {
  // Count total tests, passed tests, failed tests, and skipped tests
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  // Process test results
  results.testResults.forEach(fileResult => {
    fileResult.assertionResults.forEach(testResult => {
      totalTests++;
      
      if (testResult.status === 'passed') {
        passedTests++;
      } else if (testResult.status === 'failed') {
        failedTests++;
      } else if (testResult.status === 'skipped') {
        skippedTests++;
      }
    });
  });
  
  // Display summary
  const summaryBox = boxen(
    `Chomp/Doof Test Run Summary\n\n` +
    `Total Tests: ${totalTests} | ✅ Passed: ${passedTests} | ❌ Failed: ${failedTests} | ➖ Skipped: ${skippedTests}\n` +
    `Duration: ${(results.duration / 1000).toFixed(1)}s`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }
  );
  
  console.log(summaryBox);
  
  // Display detailed results
  console.log('\n');
  
  results.testResults.forEach(fileResult => {
    const fileName = path.basename(fileResult.name);
    const passedCount = fileResult.assertionResults.filter(r => r.status === 'passed').length;
    const totalCount = fileResult.assertionResults.length;
    
    console.log(chalk.bold(`Suite: ${fileName} (${passedCount}/${totalCount} passed)`));
    
    fileResult.assertionResults.forEach(testResult => {
      const testName = testResult.title;
      const duration = testResult.duration ? `(${testResult.duration}ms)` : '';
      
      if (testResult.status === 'passed') {
        console.log(`  ${chalk.green('✅')} Test: ${testName} ${chalk.dim(duration)}`);
      } else if (testResult.status === 'failed') {
        console.log(`  ${chalk.red('❌')} Test: ${testName} ${chalk.dim(duration)}`);
        
        if (testResult.failureMessages && testResult.failureMessages.length > 0) {
          const errorMessage = testResult.failureMessages[0]
            .split('\n')
            .slice(0, 3)
            .join('\n')
            .replace(/\n/g, '\n    ');
          
          console.log(`    ${chalk.red('Error:')} ${errorMessage}`);
        }
      } else if (testResult.status === 'skipped') {
        console.log(`  ${chalk.yellow('➖')} Test: ${testName} `);
      }
    });
    
    console.log('');
  });
}

// Run the tests
runTests();
