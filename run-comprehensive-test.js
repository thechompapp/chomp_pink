#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * 
 * Runs the comprehensive application test in headed mode with full monitoring
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Comprehensive E2E Test Suite');
console.log('========================================');
console.log('');
console.log('📋 Test Configuration:');
console.log('   🖥️  Mode: Headed (visible browser)');
console.log('   📊 Coverage: Complete application');
console.log('   🎥 Recording: Videos enabled');
console.log('   📸 Screenshots: Full page captures');
console.log('   🔍 Error Detection: Console & Network');
console.log('   ⏱️  Timeout: Extended for stability');
console.log('');

// Configuration for the test run
const testConfig = {
  testFile: 'e2e/comprehensive-app-test.spec.js',
  browser: 'chromium',
  headed: true,
  slowMo: 250, // Slow down actions for visibility
  video: 'on',
  screenshot: 'on',
  trace: 'on',
  workers: 1, // Run tests sequentially for better observation
};

// Build the Playwright command
const command = 'npx';
const args = [
  'playwright',
  'test',
  testConfig.testFile,
  '--project=chromium-desktop',
  '--headed',
  '--workers=1',
  `--timeout=60000`, // 60 second timeout per test
  '--reporter=list,html',
  `--output-dir=e2e-results/test-artifacts`
];

// Add environment variables
const env = {
  ...process.env,
  E2E_BASE_URL: 'http://localhost:5173',
  PLAYWRIGHT_BROWSERS_PATH: '0', // Use default browser location
  // Enable debug logs
  DEBUG: process.env.DEBUG || '',
};

console.log('🔧 Running command:');
console.log(`   ${command} ${args.join(' ')}`);
console.log('');

// Start the test process
const testProcess = spawn(command, args, {
  env,
  stdio: 'inherit',
  cwd: __dirname
});

// Handle process events
testProcess.on('error', (error) => {
  console.error('❌ Failed to start test process:', error.message);
  process.exit(1);
});

testProcess.on('close', (code) => {
  console.log('');
  console.log('========================================');
  if (code === 0) {
    console.log('🎉 Comprehensive E2E Test Suite COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📊 Test Artifacts:');
    console.log('   📸 Screenshots: e2e-results/screenshots/');
    console.log('   🎥 Videos: e2e-results/videos/');
    console.log('   📋 HTML Report: e2e-results/html-report/index.html');
    console.log('   📃 Traces: e2e-results/test-artifacts/');
    console.log('');
    console.log('🔍 To view detailed results:');
    console.log('   npx playwright show-report e2e-results/html-report');
  } else {
    console.log(`❌ Test suite completed with exit code: ${code}`);
    console.log('');
    console.log('📊 Check test artifacts for debugging:');
    console.log('   📸 Screenshots: e2e-results/screenshots/');
    console.log('   🎥 Videos: e2e-results/videos/');
    console.log('   📋 HTML Report: e2e-results/html-report/index.html');
  }
  console.log('========================================');
  process.exit(code);
});

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Test interrupted by user');
  testProcess.kill('SIGINT');
});

console.log('⏳ Starting test execution...');
console.log('   (Press Ctrl+C to interrupt)');
console.log(''); 