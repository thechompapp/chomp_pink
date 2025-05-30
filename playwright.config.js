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
  
  // Run tests in parallel
  fullyParallel: false, // Set to false to avoid database conflicts
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 2,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'e2e-results/html-report' }],
    ['json', { outputFile: 'e2e-results/test-results.json' }],
    ['junit', { outputFile: 'e2e-results/junit-results.xml' }],
    ['list']
  ],
  
  // Output directory for test artifacts
  outputDir: 'e2e-results/test-artifacts',
  
  // Global setup and teardown
  globalSetup: path.resolve(__dirname, './e2e/global-setup.js'),
  globalTeardown: path.resolve(__dirname, './e2e/global-teardown.js'),
  
  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: 'http://localhost:5174',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshots on failure
    screenshot: 'only-on-failure',
    
    // Browser context options
    ignoreHTTPSErrors: true,
    
    // Default timeout for actions
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use a specific viewport for consistency
        viewport: { width: 1280, height: 720 },
        // Enable JavaScript
        javaScriptEnabled: true,
        // Accept downloads
        acceptDownloads: true,
        // Permissions
        permissions: ['notifications', 'geolocation'],
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],

  // Web server configuration for local development
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'cd doof-backend && npm run dev',
      url: 'http://localhost:5001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    }
  ],
}); 