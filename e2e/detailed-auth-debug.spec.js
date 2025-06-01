// Detailed authentication debugging test
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

test.describe('Detailed Authentication Debug', () => {
  test('debug login process with console logs and network capture', async ({ page }) => {
    console.log('\n🔍 === DETAILED AUTH DEBUG ===\n');
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Capture network requests
    const networkRequests = [];
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    // Capture network responses
    const networkResponses = [];
    page.on('response', async (response) => {
      let responseBody = null;
      try {
        if (response.request().url().includes('/api/auth/login')) {
          responseBody = await response.text();
        }
      } catch (error) {
        console.log('Could not capture response body:', error.message);
      }
      
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        body: responseBody
      });
    });
    
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Fill login form
    console.log('📍 Step 2: Fill login form');
    await page.fill('input[name="email"]', 'test@dooftown.com');
    await page.fill('input[name="password"]', 'password123');
    
    console.log('📍 Step 3: Submit login form');
    
    // Listen for navigation changes
    let navigationPromise = page.waitForURL(/.*/, { timeout: 10000 }).catch(() => null);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for either navigation or timeout
    await navigationPromise;
    
    // Give some time for async operations
    await page.waitForTimeout(3000);
    
    console.log('📍 Step 4: Check results');
    
    // Current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check localStorage
    const storageState = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('current_user'),
        logoutFlag: localStorage.getItem('user_explicitly_logged_out'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('Storage State:', storageState);
    
    // Check coordinator state
    const coordinatorState = await page.evaluate(() => {
      if (window.__authCoordinator) {
        return window.__authCoordinator.getCurrentState();
      }
      return null;
    });
    
    console.log('Coordinator State:', coordinatorState);
    
    // Print relevant console logs
    console.log('\n📋 CONSOLE LOGS:');
    const authRelatedLogs = consoleLogs.filter(log => 
      log.includes('auth') || 
      log.includes('login') || 
      log.includes('token') || 
      log.includes('coordinator') ||
      log.includes('error') ||
      log.includes('warn')
    );
    authRelatedLogs.forEach(log => console.log(log));
    
    // Print network requests
    console.log('\n🌐 NETWORK REQUESTS:');
    const authRequests = networkRequests.filter(req => 
      req.url.includes('/api/auth') || req.url.includes('/login')
    );
    authRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
    });
    
    // Print network responses
    console.log('\n📨 NETWORK RESPONSES:');
    const authResponses = networkResponses.filter(resp => 
      resp.url.includes('/api/auth') || resp.url.includes('/login')
    );
    authResponses.forEach(resp => {
      console.log(`${resp.status} ${resp.url}`);
      if (resp.body) {
        console.log('Response body:', resp.body);
      }
    });
    
    // Check for any JavaScript errors
    const jsErrors = consoleLogs.filter(log => log.includes('[error]'));
    if (jsErrors.length > 0) {
      console.log('\n❌ JAVASCRIPT ERRORS:');
      jsErrors.forEach(error => console.log(error));
    }
    
    console.log('\n🔍 DEBUG COMPLETE');
  });
}); 