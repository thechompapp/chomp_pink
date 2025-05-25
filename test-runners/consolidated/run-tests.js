/**
 * Consolidated Test Runner
 * 
 * This is the main entry point for running tests in the application.
 * It consolidates all test runners into a single interface.
 */

import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import minimist from 'minimist';

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import test runners
import { runUnitTests } from './unit-test-runner.js';
import { runIntegrationTests } from './integration-test-runner.js';
import { runE2ETests } from './e2e-test-runner.js';

// Parse command line arguments
const args = minimist(process.argv.slice(2), {
  boolean: [
    'unit',
    'integration',
    'e2e',
    'watch',
    'coverage',
    'ui',
    'verbose'
  ],
  string: ['grep'],
  alias: {
    u: 'unit',
    i: 'integration',
    e: 'e2e',
    w: 'watch',
    c: 'coverage',
    v: 'verbose',
    g: 'grep'
  },
  default: {
    unit: false,
    integration: false,
    e2e: false,
    watch: false,
    coverage: false,
    ui: false,
    verbose: false
  }
});

// Configuration
const config = {
  watch: args.watch,
  coverage: args.coverage,
  ui: args.ui,
  verbose: args.verbose,
  grep: args.grep,
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.join(__dirname, 'setup', 'test-setup.js')],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverage: args.coverage,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

// Show help if no arguments provided
function showHelp() {
  console.log(`
📚 Test Runner Help

Usage: npm test -- [options]

Options:
  --unit, -u       Run unit tests
  --integration, -i Run integration tests
  --e2e, -e         Run end-to-end tests
  --watch, -w       Run in watch mode
  --coverage, -c    Generate coverage report
  --ui              Run in UI mode (if supported)
  --grep, -g        Only run tests matching pattern
  --verbose, -v     Show verbose output
  --help            Show this help message

Examples:
  npm test -- --unit
  npm test -- --integration --watch
  npm test -- --e2e --grep "auth"
  npm test -- --coverage
`);
  process.exit(0);
}

// Main function to run tests based on arguments
async function runTests() {
  try {
    // Show help if no test type specified
    if (args.help || (!args.unit && !args.integration && !args.e2e)) {
      showHelp();
      return;
    }

    console.log('🚀 Starting test runner...');
    
    // Run the requested test types
    let allPassed = true;
    
    if (args.unit) {
      console.log('\n🔍 Running unit tests...');
      allPassed = await runUnitTests(config) && allPassed;
    }
    
    if (args.integration) {
      console.log('\n🧪 Running integration tests...');
      allPassed = await runIntegrationTests(config) && allPassed;
    }
    
    if (args.e2e) {
      console.log('\n🌐 Running E2E tests...');
      allPassed = await runE2ETests(config) && allPassed;
    }
    
    if (!args.unit && !args.integration && !args.e2e) {
      // Default: run all tests
      console.log('\n🔍 Running all tests...');
      allPassed = await runUnitTests(config) && allPassed;
      allPassed = await runIntegrationTests(config) && allPassed;
      allPassed = await runE2ETests(config) && allPassed;
    }
    
    if (allPassed) {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

module.exports = {
  runTests,
  config
};
