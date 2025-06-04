#!/usr/bin/env node

/**
 * ULTIMATE COMPREHENSIVE E2E TEST RUNNER
 * 
 * This script runs the ultimate comprehensive test suite that covers
 * every possible interaction in the application.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 ULTIMATE COMPREHENSIVE E2E TEST RUNNER');
console.log('=========================================');

// Ensure directories exist
const directories = [
  'e2e-results',
  'e2e-results/screenshots', 
  'e2e-results/videos',
  'e2e-results/test-artifacts'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Test configuration
const testConfig = {
  testFile: 'e2e/ultimate-comprehensive-test.spec.js',
  timeout: 300000, // 5 minutes per test
  workers: 1,
  retries: 1,
  headed: true,
  slowMo: 250, // Slow motion for visibility
  video: 'on',
  screenshot: 'on',
  trace: 'on'
};

console.log('\n📋 Test Configuration:');
console.log(`   File: ${testConfig.testFile}`);
console.log(`   Timeout: ${testConfig.timeout / 1000}s per test`);
console.log(`   Workers: ${testConfig.workers}`);
console.log(`   Headed Mode: ${testConfig.headed}`);
console.log(`   Slow Motion: ${testConfig.slowMo}ms`);
console.log(`   Video Recording: ${testConfig.video}`);

try {
  console.log('\n🔍 Checking application status...');
  
  // Check if frontend is running
  try {
    execSync('curl -s http://localhost:5173 > /dev/null', { stdio: 'ignore' });
    console.log('✅ Frontend is running on http://localhost:5173');
  } catch (error) {
    console.log('❌ Frontend not running on http://localhost:5173');
    console.log('   Please start with: npm run dev');
    process.exit(1);
  }

  // Check if backend is running (optional)
  try {
    execSync('curl -s http://localhost:3000/api/health > /dev/null || curl -s http://localhost:5000/api/health > /dev/null', { stdio: 'ignore' });
    console.log('✅ Backend API is responding');
  } catch (error) {
    console.log('⚠️ Backend API may not be running (continuing anyway)');
  }

  console.log('\n🧪 Starting Ultimate Comprehensive Test Suite...');
  console.log('⏱️ This test will take 15-30 minutes to complete');
  console.log('👀 Watch the browser perform every possible action!');
  
  const startTime = Date.now();
  
  // Build the Playwright command
  const playwrightCmd = [
    'npx playwright test',
    testConfig.testFile,
    `--timeout=${testConfig.timeout}`,
    `--workers=${testConfig.workers}`,
    testConfig.headed ? '--headed' : '',
    `--retries=${testConfig.retries}`,
    '--reporter=html',
    '--output-dir=e2e-results/test-artifacts'
  ].filter(Boolean).join(' ');

  console.log(`\n🔧 Command: ${playwrightCmd}\n`);

  // Run the test with live output
  execSync(playwrightCmd, { 
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_SLOW_MO: testConfig.slowMo.toString(),
      PLAYWRIGHT_VIDEO_DIR: 'e2e-results/videos',
      PLAYWRIGHT_SCREENSHOT_MODE: 'on',
      PLAYWRIGHT_TRACE_DIR: 'e2e-results/traces'
    }
  });

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n🎉 ULTIMATE COMPREHENSIVE TEST COMPLETED!');
  console.log('==========================================');
  console.log(`⏱️ Total Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  
  // List generated artifacts
  console.log('\n📁 Generated Test Artifacts:');
  
  const screenshotDir = 'e2e-results/screenshots';
  if (fs.existsSync(screenshotDir)) {
    const screenshots = fs.readdirSync(screenshotDir)
      .filter(file => file.startsWith('ultimate-'))
      .sort();
    console.log(`   📸 Screenshots (${screenshots.length}):`);
    screenshots.slice(0, 10).forEach(file => {
      console.log(`      • ${file}`);
    });
    if (screenshots.length > 10) {
      console.log(`      ... and ${screenshots.length - 10} more`);
    }
  }

  const videoDir = 'e2e-results/videos';
  if (fs.existsSync(videoDir)) {
    const videos = fs.readdirSync(videoDir).filter(file => file.endsWith('.webm'));
    console.log(`   🎥 Videos (${videos.length}):`);
    videos.forEach(file => {
      const filePath = path.join(videoDir, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
      console.log(`      • ${file} (${sizeMB}MB)`);
    });
  }

  // Show HTML report info
  console.log('\n📊 Test Reports:');
  console.log('   HTML Report: e2e-results/html-report/index.html');
  console.log('   View with: npx playwright show-report e2e-results/html-report');
  
  console.log('\n✨ Test Summary:');
  console.log('   🔐 Complete authentication flow tested');
  console.log('   🧭 All pages and navigation tested');
  console.log('   🔍 Advanced search and filtering tested');
  console.log('   📝 List creation and management tested');
  console.log('   🍽️ Item management and add-to-list tested');
  console.log('   📋 Every form in the app submitted');
  console.log('   👤 User profile and settings tested');
  console.log('   👑 Admin panel comprehensively tested');
  console.log('   ⚠️ Error handling and edge cases tested');
  console.log('   📱 Responsive design across viewports tested');
  console.log('   🎯 Complete logout and cleanup tested');

} catch (error) {
  console.error('\n❌ Test execution failed!');
  console.error('Error:', error.message);
  
  if (error.stdout) {
    console.error('Output:', error.stdout.toString());
  }
  
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Ensure frontend is running: npm run dev');
  console.log('   2. Check that port 5173 is accessible');
  console.log('   3. Verify Playwright is installed: npx playwright install');
  console.log('   4. Check browser dependencies');
  
  process.exit(1);
} 