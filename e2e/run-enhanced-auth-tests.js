#!/usr/bin/env node

/**
 * Enhanced Authentication E2E Test Runner
 * 
 * Specialized runner for the comprehensive authentication test suite
 * with detailed reporting, parallel execution options, and test filtering.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  TEST_FILE: 'enhanced-auth-e2e.spec.js',
  RESULTS_DIR: 'e2e-results',
  REPORT_FILE: 'auth-test-report.html',
  BROWSERS: ['chromium', 'firefox', 'webkit'],
  DEFAULT_BROWSER: 'chromium',
  PARALLEL_WORKERS: 3,
  RETRY_COUNT: 2,
  TIMEOUT: 60000
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

/**
 * Print colored output
 */
function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  const line = '='.repeat(60);
  colorLog('cyan', `\n${line}`);
  colorLog('cyan', `${title.toUpperCase()}`);
  colorLog('cyan', line);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    browser: CONFIG.DEFAULT_BROWSER,
    headless: true,
    workers: CONFIG.PARALLEL_WORKERS,
    grep: null,
    grepInvert: null,
    reporter: 'html',
    retries: CONFIG.RETRY_COUNT,
    debug: false,
    list: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--browser':
      case '-b':
        if (nextArg && CONFIG.BROWSERS.includes(nextArg)) {
          options.browser = nextArg;
          i++;
        }
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--workers':
      case '-w':
        if (nextArg && !isNaN(nextArg)) {
          options.workers = parseInt(nextArg);
          i++;
        }
        break;
      case '--grep':
      case '-g':
        if (nextArg) {
          options.grep = nextArg;
          i++;
        }
        break;
      case '--grep-invert':
        if (nextArg) {
          options.grepInvert = nextArg;
          i++;
        }
        break;
      case '--reporter':
      case '-r':
        if (nextArg) {
          options.reporter = nextArg;
          i++;
        }
        break;
      case '--retries':
        if (nextArg && !isNaN(nextArg)) {
          options.retries = parseInt(nextArg);
          i++;
        }
        break;
      case '--debug':
      case '-d':
        options.debug = true;
        break;
      case '--list':
      case '-l':
        options.list = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

/**
 * Show help information
 */
function showHelp() {
  printHeader('Enhanced Authentication E2E Test Runner');
  
  colorLog('white', '\nUsage:');
  colorLog('yellow', '  node run-enhanced-auth-tests.js [options]');
  
  colorLog('white', '\nOptions:');
  colorLog('yellow', '  -b, --browser <browser>     Browser to use (chromium, firefox, webkit)');
  colorLog('yellow', '  --headed                    Run in headed mode (show browser)');
  colorLog('yellow', '  -w, --workers <number>      Number of parallel workers');
  colorLog('yellow', '  -g, --grep <pattern>        Only run tests matching pattern');
  colorLog('yellow', '  --grep-invert <pattern>     Skip tests matching pattern');
  colorLog('yellow', '  -r, --reporter <reporter>   Test reporter (html, json, junit)');
  colorLog('yellow', '  --retries <number>          Number of retries for failed tests');
  colorLog('yellow', '  -d, --debug                 Enable debug mode');
  colorLog('yellow', '  -l, --list                  List available test suites');
  colorLog('yellow', '  -h, --help                  Show this help');
  
  colorLog('white', '\nExamples:');
  colorLog('green', '  # Run all auth tests in Chrome headless');
  colorLog('green', '  node run-enhanced-auth-tests.js');
  
  colorLog('green', '  # Run only basic auth flow tests in headed Firefox');
  colorLog('green', '  node run-enhanced-auth-tests.js --browser firefox --headed --grep "Basic Authentication Flows"');
  
  colorLog('green', '  # Run with 1 worker (sequential) and debug output');
  colorLog('green', '  node run-enhanced-auth-tests.js --workers 1 --debug');
  
  colorLog('green', '  # Skip performance tests');
  colorLog('green', '  node run-enhanced-auth-tests.js --grep-invert "Performance"');
}

/**
 * List available test suites
 */
function listTestSuites() {
  printHeader('Available Test Suites');
  
  const testSuites = [
    'Basic Authentication Flows',
    'Error Handling and Validation', 
    'Token Persistence and Management',
    'Admin Authentication and Authorization',
    'Cross-Tab Authentication Synchronization',
    'Performance and Stress Testing',
    'Security Validation',
    'Integration with Application Features',
    'Cleanup and Recovery'
  ];
  
  testSuites.forEach((suite, index) => {
    colorLog('yellow', `  ${index + 1}. ${suite}`);
  });
  
  colorLog('white', '\nUse --grep "<suite name>" to run specific test suite');
}

/**
 * Ensure results directory exists
 */
function ensureResultsDir() {
  if (!fs.existsSync(CONFIG.RESULTS_DIR)) {
    fs.mkdirSync(CONFIG.RESULTS_DIR, { recursive: true });
    colorLog('green', `Created results directory: ${CONFIG.RESULTS_DIR}`);
  }
}

/**
 * Build Playwright command
 */
function buildPlaywrightCommand(options) {
  const command = ['npx', 'playwright', 'test'];
  
  // Test file
  command.push(CONFIG.TEST_FILE);
  
  // Config file
  command.push('--config', '../playwright.config.js');
  
  // Browser
  command.push('--project', options.browser);
  
  // Headless mode
  if (!options.headless) {
    command.push('--headed');
  }
  
  // Workers
  command.push('--workers', options.workers.toString());
  
  // Grep patterns
  if (options.grep) {
    command.push('--grep', options.grep);
  }
  
  if (options.grepInvert) {
    command.push('--grep-invert', options.grepInvert);
  }
  
  // Reporter
  if (options.reporter === 'html') {
    command.push('--reporter', 'html');
  } else {
    command.push('--reporter', options.reporter);
  }
  
  // Retries
  command.push('--retries', options.retries.toString());
  
  // Timeout
  command.push('--timeout', CONFIG.TIMEOUT.toString());
  
  // Debug mode
  if (options.debug) {
    command.push('--debug');
  }
  
  return command;
}

/**
 * Run the authentication tests
 */
async function runTests(options) {
  printHeader('Running Enhanced Authentication E2E Tests');
  
  colorLog('white', 'Configuration:');
  colorLog('yellow', `  Browser: ${options.browser}`);
  colorLog('yellow', `  Headless: ${options.headless}`);
  colorLog('yellow', `  Workers: ${options.workers}`);
  colorLog('yellow', `  Reporter: ${options.reporter}`);
  colorLog('yellow', `  Retries: ${options.retries}`);
  if (options.grep) colorLog('yellow', `  Filter: ${options.grep}`);
  if (options.grepInvert) colorLog('yellow', `  Exclude: ${options.grepInvert}`);
  
  ensureResultsDir();
  
  const command = buildPlaywrightCommand(options);
  colorLog('blue', `\nExecuting: ${command.join(' ')}`);
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command[0], command.slice(1), {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    childProcess.on('close', (code) => {
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      colorLog('white', `\nTest execution completed in ${duration}s`);
      
      if (code === 0) {
        colorLog('green', '✅ All authentication tests passed!');
        
        if (options.reporter === 'html') {
          colorLog('cyan', `📊 HTML Report: ${path.join(CONFIG.RESULTS_DIR, CONFIG.REPORT_FILE)}`);
        }
        
        resolve(code);
      } else {
        colorLog('red', `❌ Tests failed with exit code: ${code}`);
        
        if (options.reporter === 'html') {
          colorLog('cyan', `📊 Failure Report: ${path.join(CONFIG.RESULTS_DIR, CONFIG.REPORT_FILE)}`);
        }
        
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      colorLog('red', `Failed to start test process: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Main execution function
 */
async function main() {
  try {
    const options = parseArgs();
    
    if (options.help) {
      showHelp();
      return;
    }
    
    if (options.list) {
      listTestSuites();
      return;
    }
    
    // Check if test file exists
    const testFilePath = path.join(__dirname, CONFIG.TEST_FILE);
    if (!fs.existsSync(testFilePath)) {
      colorLog('red', `❌ Test file not found: ${testFilePath}`);
      process.exit(1);
    }
    
    await runTests(options);
    
  } catch (error) {
    colorLog('red', `❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  colorLog('yellow', '\n⚠️ Test execution interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  colorLog('yellow', '\n⚠️ Test execution terminated');
  process.exit(143);
});

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTests, parseArgs, CONFIG }; 