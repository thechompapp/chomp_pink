/**
 * Login Debug Test
 * Focused test to debug login form submission
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

test.describe('Login Debug', () => {
  
  test('Debug login form submission', async ({ page }) => {
    test.setTimeout(60000);
    
    // Monitor network requests
    const requests = [];
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', (response) => {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    console.log('🔍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Step 2: Fill login form');
    
    // Fill email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('admin@example.com');
    console.log('📧 Email filled');
    
    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('doof123');
    console.log('🔒 Password filled');
    
    await page.waitForTimeout(1000);
    
    console.log('🔍 Step 3: Monitor form submission');
    
    // Clear previous requests
    requests.length = 0;
    
    // Find and click submit button
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('🔘 Clicking submit button...');
    await submitButton.click();
    
    // Wait and monitor for requests
    await page.waitForTimeout(5000);
    
    console.log('📊 Network requests made after form submission:');
    requests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`     POST Data: ${req.postData.substring(0, 200)}...`);
      }
    });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('🌐 Current URL after submission:', currentUrl);
    
    // Look for error messages
    const errorMessage = await page.locator('.error, .alert-error, [class*="error"]').textContent().catch(() => null);
    if (errorMessage) {
      console.log('⚠️ Error message:', errorMessage);
    }
    
    // Check if form is still visible (indicates submission failed)
    const formStillVisible = await page.locator('form').isVisible();
    console.log('📝 Form still visible:', formStillVisible);
    
    // Try direct API login to test backend
    console.log('🔍 Step 4: Test direct API login');
    
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'doof123'
          })
        });
        
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          data: data
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('📡 Direct API login result:', apiResponse);
    
    if (apiResponse.ok) {
      console.log('✅ Backend login works - issue is in frontend form');
      
      // Try to simulate successful login
      await page.evaluate(() => {
        window.safeDevLogin && window.safeDevLogin();
      });
      
      await page.waitForTimeout(2000);
      
      // Check if auth state changed
      const authState = await page.evaluate(() => {
        return window.checkAuthState && window.checkAuthState();
      });
      
      console.log('🔒 Auth state after dev login:', authState);
      
      // Try navigating to admin now
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log('🌐 Final URL after dev login:', finalUrl);
      
      if (finalUrl.includes('/admin') && !finalUrl.includes('/login')) {
        console.log('✅ Dev login worked - form submission is the issue');
      } else {
        console.log('❌ Still redirected to login - auth system issue');
      }
    } else {
      console.log('❌ Backend login failed - backend issue');
    }
    
    console.log('✅ Login debug completed');
  });
  
}); 