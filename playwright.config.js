/**
 * Playwright Configuration for DOOF E2E Tests
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Test timeout (30 seconds per test)
  timeout: 30000,
  
  // Expect timeout (10 seconds for assertions)
  expect: {
    timeout: 10000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [
    ['html', { outputFolder: 'e2e-results/html-report' }],
    ['json', { outputFile: 'e2e-results/test-results.json' }],
    ['junit', { outputFile: 'e2e-results/junit-report.xml' }],
    ['list']
  ],
  
  // Output directory for test artifacts
  outputDir: 'e2e-results/test-artifacts',
  
  // Global setup and teardown
  // globalSetup: './e2e/global-setup.js',
  // globalTeardown: './e2e/global-teardown.js',
  
  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5174',
    
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    
    // Increased timeouts for React applications
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Better error handling
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and mobile devices
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Increased timeouts for mobile
        actionTimeout: 20000,
        navigationTimeout: 45000,
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        // Increased timeouts for mobile
        actionTimeout: 20000,
        navigationTimeout: 45000,
      },
    },
    
    // Tablet testing
    {
      name: 'tablet-ipad',
      use: { 
        ...devices['iPad Pro'],
        actionTimeout: 20000,
        navigationTimeout: 45000,
      },
    },
  ],

  // Web server configuration for local development
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:5174',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   },
  //   {
  //     command: 'cd doof-backend && npm run dev',
  //     url: 'http://localhost:5001/api/health',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   }
  // ],
}); 