/**
 * Chomp Application Wiring Test Runner
 * 
 * This is the main entry point for running all application wiring tests.
 * It coordinates the execution of all test modules and generates a comprehensive report.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import test modules dynamically
const authTests = await import('./tests/auth-integration-tests.js').then(m => m.default);
const listTests = await import('./tests/list-integration-tests.js').then(m => m.default);
const enhancedListTests = await import('./tests/enhanced-list-integration-tests.js').then(m => m.default);
const itemTests = await import('./tests/item-integration-tests.js').then(m => m.default);
const bulkAddTests = await import('./tests/bulk-add-integration-tests.js').then(m => m.default);
const searchTests = await import('./tests/search-integration-tests.js').then(m => m.default);
const offlineTests = await import('./tests/offline-integration-tests.js').then(m => m.default);
const uiTests = await import('./tests/ui-integration-tests.js').then(m => m.default);

// Import additional test modules
const hashtagTests = await import('./tests/hashtag-integration-tests.js').then(m => m.default);
const adminTests = await import('./tests/admin-integration-tests.js').then(m => m.default);
const neighborhoodTests = await import('./tests/neighborhood-integration-tests.js').then(m => m.default);

// Parse command line arguments
const args = process.argv.slice(2);
const runSection = args.find(arg => arg.startsWith('--section='))?.split('=')[1];
const verbose = args.includes('--verbose');
const fastMode = args.includes('--fast');
const skipServerCheck = args.includes('--skip-server-check');

// Configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:5001',
  FRONTEND_URL: 'http://localhost:5173',
  AUTH: {
    admin: {
      email: 'admin@example.com',
      password: 'doof123'
    },
    user: {
      email: 'user@example.com', 
      password: 'password123'
    }
  },
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'doof123',
  USER_EMAIL: 'user@example.com',
  USER_PASSWORD: 'password123',
  SECTION: runSection,
  VERBOSE: verbose,
  FAST_MODE: fastMode,
  SKIP_SERVER_CHECK: skipServerCheck,
  MOCK_MODE: args.includes('--mock'),   // Use mock responses instead of real API calls
  TIMEOUT_MS: fastMode ? 15000 : 30000,  // Increased timeout for API calls
  RETRY_COUNT: fastMode ? 0 : 2,        // No retries in fast mode
  RETRY_DELAY_MS: 500                   // Shorter delay between retries
};

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  sections: {}
};

// Logger utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  error: (message, error) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    if (error) {
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        if (CONFIG.VERBOSE) {
          console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
          console.error(`  Message: ${error.response.data?.message || 'No error message provided'}`);
        }
      } else if (error.request) {
        console.error(`  No response received`);
      } else {
        console.error(`  Error details: ${error.message}`);
      }
    }
  },
  debug: (message, data) => {
    if (CONFIG.VERBOSE) {
      console.log(`[DEBUG] ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  },
  section: (name) => {
    console.log('\n' + '='.repeat(80));
    console.log(`SECTION: ${name}`);
    console.log('='.repeat(80));
    
    // Initialize section in results
    testResults.sections[name] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: {}
    };
    
    return name;
  },
  test: (section, name, status, duration, message) => {
    testResults.total++;
    testResults.sections[section].total++;
    
    if (status === 'PASSED') {
      testResults.passed++;
      testResults.sections[section].passed++;
      console.log(`\x1b[32m✓\x1b[0m ${name} (${duration}ms)`);
    } 
    else if (status === 'FAILED') {
      testResults.failed++;
      testResults.sections[section].failed++;
      console.log(`\x1b[31m✗\x1b[0m ${name} (${duration}ms)`);
      if (message) console.log(`  \x1b[31m${message}\x1b[0m`);
    }
    else if (status === 'SKIPPED') {
      testResults.skipped++;
      testResults.sections[section].skipped++;
      console.log(`\x1b[33m-\x1b[0m ${name} (skipped)`);
    }
    
    // Store test result
    testResults.sections[section].tests[name] = {
      status,
      duration,
      message
    };
  }
};

// Create test directories if they don't exist
async function setupTestEnvironment() {
  const testDir = path.join(__dirname, 'tests');
  try {
    await fs.access(testDir);
  } catch {
    await fs.mkdir(testDir);
  }
  
  const reportsDir = path.join(__dirname, 'test-reports');
  try {
    await fs.access(reportsDir);
  } catch {
    await fs.mkdir(reportsDir);
  }
}

// Check if servers are running
async function checkServers() {
  // Skip server check if specified
  if (CONFIG.SKIP_SERVER_CHECK) {
    logger.info('Skipping server checks as requested');
    return { backendRunning: true, frontendRunning: true };
  }
  
  logger.info('Checking if backend and frontend servers are running...');
  
  let backendRunning = false;
  let frontendRunning = false;
  
  // Use Promise.all to run checks in parallel
  await Promise.all([
    // Check backend
    (async () => {
      try {
        execSync(`curl -s -o /dev/null -w "%{http_code}" ${CONFIG.BACKEND_URL} --connect-timeout 2`);
        backendRunning = true;
        logger.success('Backend server is running');
      } catch (error) {
        logger.error('Backend server is not running. Please start it before running tests.');
      }
    })(),
    
    // Check frontend
    (async () => {
      try {
        execSync(`curl -s -o /dev/null -w "%{http_code}" ${CONFIG.FRONTEND_URL} --connect-timeout 2`);
        frontendRunning = true;
        logger.success('Frontend server is running');
      } catch (error) {
        logger.error('Frontend server is not running. Please start it before running tests.');
      }
    })()
  ]);
  
  return { backendRunning, frontendRunning };
}

// Generate test summary report
async function generateTestSummary(duration) {
  console.log('\n' + '*'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('*'.repeat(80));
  
  console.log(`\nTotal duration: ${duration} seconds`);
  console.log(`Tests: ${testResults.total} total, ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped\n`);
  
  // Section summaries
  Object.entries(testResults.sections).forEach(([section, results]) => {
    const passRate = results.total > 0 ? Math.round((results.passed / (results.total - results.skipped)) * 100) : 0;
    console.log(`${section}: ${results.passed}/${results.total - results.skipped} passed (${passRate}%)`);
    
    // List failed tests in this section
    const failedTests = Object.entries(results.tests)
      .filter(([_, test]) => test.status === 'FAILED')
      .map(([name, test]) => `  - ${name}: ${test.message}`);
    
    if (failedTests.length > 0) {
      console.log('  Failed tests:');
      failedTests.forEach(test => console.log(test));
    }
  });
  
  // Overall assessment
  console.log('\nOverall Assessment:');
  
  if (testResults.failed === 0) {
    if (testResults.skipped > 0) {
      console.log('✅ All executed tests passed, but some tests were skipped.');
    } else {
      console.log('✅ All tests passed! The application wiring is working correctly.');
    }
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
    
    // Provide specific recommendations based on failures
    const recommendations = [];
    
    if (testResults.sections['Authentication']?.failed > 0) {
      recommendations.push('- Review authentication flow and token management');
    }
    
    if (testResults.sections['List Management']?.failed > 0) {
      recommendations.push('- Check list API endpoints and frontend list components');
    }
    
    if (testResults.sections['Item Management']?.failed > 0) {
      recommendations.push('- Verify item creation and management functionality');
    }
    
    if (testResults.sections['Bulk Add']?.failed > 0) {
      recommendations.push('- Review bulk add processor and Google Places API integration');
    }
    
    if (testResults.sections['Search & Discovery']?.failed > 0) {
      recommendations.push('- Check search functionality and API integration');
    }
    
    if (testResults.sections['Offline Mode']?.failed > 0) {
      recommendations.push('- Verify offline storage and synchronization');
    }
    
    if (testResults.sections['UI Components']?.failed > 0) {
      recommendations.push('- Review component interactions and state management');
    }
    
    if (recommendations.length > 0) {
      console.log('\nRecommendations:');
      recommendations.forEach(rec => console.log(rec));
    }
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, 'test-reports', `wiring-test-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  console.log('\n' + '*'.repeat(80));
}

// Main function to run all tests
async function runAllTests() {
  console.log('\n' + '*'.repeat(80));
  console.log('CHOMP APPLICATION WIRING TEST SUITE');
  console.log(`${CONFIG.FAST_MODE ? 'FAST MODE' : 'STANDARD MODE'}`);
  console.log('*'.repeat(80) + '\n');
  
  const startTime = performance.now();
  
  try {
    // Setup test environment
    await setupTestEnvironment();
    
    // Check if servers are running
    const { backendRunning, frontendRunning } = await checkServers();
    if (!backendRunning || !frontendRunning && !CONFIG.SKIP_SERVER_CHECK) {
      console.log('\n❌ Cannot proceed with tests - servers are not running.');
      process.exit(1);
    }
    
    // Determine which tests to run
    const testsToRun = [];
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'auth') {
      testsToRun.push({ module: authTests, name: 'auth' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'lists') {
      testsToRun.push({ module: listTests, name: 'lists' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'items') {
      testsToRun.push({ module: itemTests, name: 'items' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'bulkadd') {
      testsToRun.push({ module: bulkAddTests, name: 'bulkadd' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'search') {
      testsToRun.push({ module: searchTests, name: 'search' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'offline') {
      testsToRun.push({ module: offlineTests, name: 'offline' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'ui') {
      testsToRun.push({ module: uiTests, name: 'ui' });
    }
    
    // Add new test modules
    if (!CONFIG.SECTION || CONFIG.SECTION === 'hashtags') {
      testsToRun.push({ module: hashtagTests, name: 'hashtags' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'admin') {
      testsToRun.push({ module: adminTests, name: 'admin' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'neighborhoods') {
      testsToRun.push({ module: neighborhoodTests, name: 'neighborhoods' });
    }
    
    if (!CONFIG.SECTION || CONFIG.SECTION === 'enhanced-lists') {
      testsToRun.push({ module: enhancedListTests, name: 'enhanced-lists' });
    }
    
    // Run tests in parallel if in fast mode, otherwise sequentially
    if (CONFIG.FAST_MODE) {
      logger.info(`Running ${testsToRun.length} test modules in parallel (FAST MODE)`);
      await Promise.all(testsToRun.map(test => test.module.run(CONFIG, logger)));
    } else {
      logger.info(`Running ${testsToRun.length} test modules sequentially`);
      for (const test of testsToRun) {
        await test.module.run(CONFIG, logger);
      }
    }
    
    // Generate summary report
    const duration = Math.round((performance.now() - startTime) / 1000);
    await generateTestSummary(duration);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Test execution failed', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
