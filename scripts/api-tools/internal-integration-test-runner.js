/**
 * Internal Integration Test Runner
 * 
 * Coordinates the execution of all internal integration tests
 * focusing on component-to-component interactions within tiers.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const runSection = args.find(arg => arg.startsWith('--section='))?.split('=')[1];
const verbose = args.includes('--verbose');
const fastMode = args.includes('--fast');
const coverage = args.includes('--coverage');

// Configuration
const CONFIG = {
  SECTION: runSection,
  VERBOSE: verbose,
  FAST_MODE: fastMode,
  COVERAGE: coverage,
  TIMEOUT_MS: fastMode ? 10000 : 20000,
  RETRY_COUNT: fastMode ? 0 : 1,
  PARALLEL: fastMode,
  VITEST_CONFIG: {
    testEnvironment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    testMatch: [
      './tests/*-integration-tests.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/**/*.{js,jsx}',
        'doof-backend/**/*.js'
      ],
      exclude: [
        'src/tests/**',
        '**/*.test.js',
        '**/*.config.js',
        'node_modules/**'
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  }
};

// Test suite definitions
const TEST_SUITES = {
  'Frontend Services': {
    file: 'tests/service-integration-tests.js',
    description: 'Service layer interactions and data flow',
    priority: 1,
    estimatedDuration: 120 // seconds
  },
  'React Hooks': {
    file: 'tests/hook-integration-tests.jsx',
    description: 'Hook interactions with services and state management',
    priority: 2,
    estimatedDuration: 180
  },
  'Real Data Diagnostics': {
    file: 'tests/real-data-integration-tests.js',
    description: 'Comprehensive diagnostics for real data rendering issues',
    priority: 3,
    estimatedDuration: 240
  },
  'Component Integration': {
    file: 'tests/component-integration-tests.js',
    description: 'Component and hook integration',
    priority: 4,
    estimatedDuration: 200
  },
  'Backend Integration': {
    file: 'tests/backend-integration-tests.js',
    description: 'Controller, service, and middleware interactions',
    priority: 5,
    estimatedDuration: 150
  }
};

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  coverage: {},
  suites: {},
  startTime: Date.now(),
  endTime: null
};

// Logger utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  error: (message, error) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    if (error && CONFIG.VERBOSE) {
      console.error(error);
    }
  },
  debug: (message, data) => {
    if (CONFIG.VERBOSE) {
      console.log(`[DEBUG] ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  },
  suite: (name, status, duration, details) => {
    const statusColor = status === 'PASSED' ? '\x1b[32m' : 
                       status === 'FAILED' ? '\x1b[31m' : '\x1b[33m';
    
    console.log(`${statusColor}${status}\x1b[0m ${name} (${duration}ms)`);
    
    if (details && (CONFIG.VERBOSE || status === 'FAILED')) {
      console.log(`  Tests: ${details.tests || 0}, Assertions: ${details.assertions || 0}`);
      if (details.failures && details.failures.length > 0) {
        details.failures.forEach(failure => {
          console.log(`  ❌ ${failure.name}: ${failure.message}`);
        });
      }
    }
  },
  progress: (current, total, suite) => {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    process.stdout.write(`\r[${bar}] ${percentage}% - ${suite}`);
  }
};

// Setup test environment
async function setupTestEnvironment() {
  logger.info('Setting up test environment...');

  // Create test directories if they don't exist
  const directories = ['tests', 'test-reports', 'coverage'];
  for (const dir of directories) {
    try {
      await fs.access(path.join(__dirname, dir));
    } catch {
      await fs.mkdir(path.join(__dirname, dir), { recursive: true });
    }
  }

  // Create setup file if it doesn't exist
  const setupDir = path.join(__dirname, 'src', 'tests');
  try {
    await fs.access(setupDir);
  } catch {
    await fs.mkdir(setupDir, { recursive: true });
  }

  const setupFile = path.join(setupDir, 'setup.js');
  try {
    await fs.access(setupFile);
  } catch {
    const setupContent = `// Test setup file
import '@testing-library/jest-dom';

// Mock axios globally
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Create a global mock adapter
global.mockAxios = new MockAdapter(axios);

// Reset mocks after each test
afterEach(() => {
  global.mockAxios.reset();
});
`;
    await fs.writeFile(setupFile, setupContent);
  }

  // Create Vitest configuration for internal tests
  const vitestConfig = {
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.js'],
      include: [
        './tests/*-integration-tests.{js,jsx}'
      ],
      timeout: CONFIG.TIMEOUT_MS
    },
    coverage: CONFIG.COVERAGE ? {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/**/*.{js,jsx}',
        'doof-backend/**/*.js'
      ],
      exclude: [
        'src/tests/**',
        '**/*.test.js',
        '**/*.config.js',
        'node_modules/**'
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    } : undefined
  };

  await fs.writeFile(
    path.join(__dirname, 'vitest.internal.config.js'),
    `export default ${JSON.stringify(vitestConfig, null, 2)};`
  );

  logger.success('Test environment setup complete');
}

// Run a specific test suite
async function runTestSuite(suiteName, suiteConfig) {
  const startTime = performance.now();
  
  try {
    logger.info(`Running ${suiteName}...`);
    
    // Check if test file exists
    const testFilePath = path.join(__dirname, suiteConfig.file);
    try {
      await fs.access(testFilePath);
    } catch {
      logger.error(`Test file not found: ${suiteConfig.file}`);
      return { success: false, error: 'Test file not found' };
    }
    
    const vitestCommand = [
      'npx vitest run',
      `"${suiteConfig.file}"`,
      '--config vitest.internal.config.js',
      CONFIG.COVERAGE ? '--coverage' : ''
    ].filter(Boolean).join(' ');

    const result = execSync(vitestCommand, {
      encoding: 'utf8',
      timeout: CONFIG.TIMEOUT_MS + 10000,
      stdio: CONFIG.VERBOSE ? 'inherit' : 'pipe'
    });

    const duration = Math.round(performance.now() - startTime);
    
    // Parse Vitest output for details
    const details = parseVitestOutput(result);
    
    testResults.suites[suiteName] = {
      status: 'PASSED',
      duration,
      details,
      tests: details.tests,
      assertions: details.assertions
    };

    testResults.passed += details.tests;
    testResults.total += details.tests;

    logger.suite(suiteName, 'PASSED', duration, details);
    
    return { success: true, details };
    
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const details = parseVitestOutput(error.stdout || error.stderr || '');
    
    testResults.suites[suiteName] = {
      status: 'FAILED',
      duration,
      details,
      error: error.message,
      tests: details.tests,
      assertions: details.assertions
    };

    testResults.failed += details.failedTests || 0;
    testResults.passed += details.passedTests || 0;
    testResults.total += details.tests || 0;

    logger.suite(suiteName, 'FAILED', duration, details);
    logger.error(`Suite ${suiteName} failed`, CONFIG.VERBOSE ? error : null);
    
    return { success: false, error: error.message, details };
  }
}

// Parse Vitest output for test statistics
function parseVitestOutput(output) {
  if (!output) {
    return {
      tests: 0,
      passedTests: 0,
      failedTests: 0,
      assertions: 0,
      failures: []
    };
  }

  const lines = output.split('\n');
  const details = {
    tests: 0,
    passedTests: 0,
    failedTests: 0,
    assertions: 0,
    failures: []
  };

  for (const line of lines) {
    // Parse individual test file results: " ✓ tests/service-integration-tests.js (7 tests) 15ms"
    const fileTestMatch = line.match(/✓\s+tests\/.*\.js\s+\((\d+)\s+tests?\)/);
    if (fileTestMatch) {
      const testCount = parseInt(fileTestMatch[1]);
      details.tests = testCount;
      details.passedTests = testCount; // Assume all passed if we see the ✓
    }

    // Parse summary line: "      Tests  7 passed (7)"
    const testSummaryMatch = line.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (testSummaryMatch) {
      details.passedTests = parseInt(testSummaryMatch[1]);
      details.tests = parseInt(testSummaryMatch[2]);
    }

    // Parse failed tests: "Tests  2 failed | 5 passed (7)"
    const testMixedMatch = line.match(/Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (testMixedMatch) {
      details.failedTests = parseInt(testMixedMatch[1]);
      details.passedTests = parseInt(testMixedMatch[2]);
      details.tests = parseInt(testMixedMatch[3]);
    }

    // Parse test files: "Test Files  1 passed (1)"
    const fileMatch = line.match(/Test Files\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (fileMatch && details.tests === 0) {
      // If we haven't found test counts yet, use a reasonable estimate
      details.tests = details.passedTests || 1;
    }

    // Parse failures
    if (line.includes('FAIL') && line.includes('.js')) {
      const failureMatch = line.match(/FAIL\s+(.+)/);
      if (failureMatch) {
        details.failures.push({
          name: failureMatch[1],
          message: 'Test failed'
        });
      }
    }
  }

  return details;
}

// Run all test suites
async function runAllSuites() {
  const suitesToRun = CONFIG.SECTION 
    ? Object.entries(TEST_SUITES).filter(([name]) => 
        name.toLowerCase().includes(CONFIG.SECTION.toLowerCase()))
    : Object.entries(TEST_SUITES);

  const sortedSuites = suitesToRun.sort(([,a], [,b]) => a.priority - b.priority);

  logger.info(`Running ${sortedSuites.length} test suites...`);
  
  if (CONFIG.PARALLEL && !CONFIG.SECTION) {
    // Run suites in parallel (for fast mode)
    const promises = sortedSuites.map(([name, config]) => 
      runTestSuite(name, config).catch(error => ({ name, error }))
    );
    
    const results = await Promise.all(promises);
    
    // Handle any parallel execution errors
    results.forEach(result => {
      if (result.error) {
        logger.error(`Parallel execution error in ${result.name}`, result.error);
      }
    });
  } else {
    // Run suites sequentially
    for (let i = 0; i < sortedSuites.length; i++) {
      const [suiteName, suiteConfig] = sortedSuites[i];
      logger.progress(i + 1, sortedSuites.length, suiteName);
      await runTestSuite(suiteName, suiteConfig);
    }
  }

  process.stdout.write('\n'); // Clear progress line
}

// Generate comprehensive test report
async function generateTestReport() {
  testResults.endTime = Date.now();
  const totalDuration = testResults.endTime - testResults.startTime;

  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      totalTests: testResults.total,
      passedTests: testResults.passed,
      failedTests: testResults.failed,
      skippedTests: testResults.skipped,
      successRate: testResults.total > 0 ? 
        Math.round((testResults.passed / testResults.total) * 100) : 0
    },
    suites: testResults.suites,
    configuration: {
      fastMode: CONFIG.FAST_MODE,
      coverage: CONFIG.COVERAGE,
      section: CONFIG.SECTION,
      parallel: CONFIG.PARALLEL
    },
    recommendations: generateRecommendations()
  };

  // Save detailed report
  const reportPath = path.join(__dirname, 'test-reports', 
    `internal-integration-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('INTERNAL INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: \x1b[32m${testResults.passed}\x1b[0m`);
  console.log(`Failed: \x1b[31m${testResults.failed}\x1b[0m`);
  console.log(`Success Rate: ${report.summary.successRate}%`);
  
  if (CONFIG.COVERAGE && testResults.coverage) {
    console.log(`Coverage: ${testResults.coverage.statements}% statements, ${testResults.coverage.functions}% functions`);
  }

  console.log(`\nDetailed report saved to: ${reportPath}`);

  // Display recommendations
  const recommendations = report.recommendations;
  if (recommendations.length > 0) {
    console.log('\n' + '⚠️  RECOMMENDATIONS:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  return report;
}

// Generate recommendations based on test results
function generateRecommendations() {
  const recommendations = [];
  const failedSuites = Object.entries(testResults.suites)
    .filter(([, suite]) => suite.status === 'FAILED');

  if (failedSuites.length > 0) {
    recommendations.push(`${failedSuites.length} test suite(s) failed. Review error logs and fix failing tests.`);
  }

  const slowSuites = Object.entries(testResults.suites)
    .filter(([, suite]) => suite.duration > 180000) // 3 minutes
    .map(([name]) => name);

  if (slowSuites.length > 0) {
    recommendations.push(`Slow test suites detected: ${slowSuites.join(', ')}. Consider optimizing or splitting these tests.`);
  }

  if (testResults.total < 50) {
    recommendations.push('Consider adding more integration tests to improve coverage of component interactions.');
  }

  const successRate = testResults.total > 0 ? 
    (testResults.passed / testResults.total) * 100 : 0;

  if (successRate < 80) {
    recommendations.push('Test success rate is below 80%. Focus on stabilizing failing tests before adding new ones.');
  }

  return recommendations;
}

// Main execution
async function main() {
  console.log('🧪 Internal Integration Test Runner (Vitest)');
  console.log('===========================================\n');

  try {
    await setupTestEnvironment();
    await runAllSuites();
    const report = await generateTestReport();

    // Exit with appropriate code
    const exitCode = testResults.failed > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    logger.error('Test runner failed', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Test execution interrupted');
  await generateTestReport();
  process.exit(130);
});

// Run if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  main();
} 