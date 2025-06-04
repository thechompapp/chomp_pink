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
  
  // Test timeout (5 minutes per test for comprehensive testing)
  timeout: 300000,
  
  // Expect timeout (30 seconds for assertions)
  expect: {
    timeout: 30000,
  },
  
  // Run tests in files in parallel
  fullyParallel: false, // Set to false for comprehensive test to run sequentially
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry once on failures
  retries: 1,
  
  // Run single worker for headed mode observation
  workers: 1,
  
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
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on',
    
    // Increased timeouts for React applications and headed mode
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    // Better error handling and debugging
    screenshot: 'on',
    video: 'on',
    
    // Slow down for headed mode visibility
    launchOptions: {
      slowMo: 300, // 300ms delay between actions for visibility
    },
  },

  // Configure only desktop Chrome for comprehensive testing
  projects: [
    {
      name: 'desktop-chrome-comprehensive',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Additional settings for comprehensive testing
        launchOptions: {
          slowMo: 300,
          args: [
            '--no-sandbox',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--start-maximized'
          ]
        }
      },
    }
  ],

  // Web server configuration is disabled since we're running manually
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:5173',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   }
  // ],
}); 