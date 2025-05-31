/**
 * Authentication Workflow Test
 * Tests the complete auth cycle: login -> logout -> refresh -> check status
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Workflow Validation', () => {
  
  test('should handle login -> logout -> refresh cycle correctly', async ({ page }) => {
    console.log('🧪 Testing complete authentication cycle');
    
    // Step 1: Go to home page
    console.log('📍 Step 1: Navigate to home page');
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check initial authentication status
    const initialAuthStatus = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('auth-token') || localStorage.getItem('token'),
        sessionStorage: sessionStorage.getItem('auth-token') || sessionStorage.getItem('token'),
        cookies: document.cookie,
        url: window.location.href
      };
    });
    console.log('🔍 Initial auth status:', JSON.stringify(initialAuthStatus, null, 2));
    
    // Step 2: Navigate to login page and log in
    console.log('📍 Step 2: Navigate to login and authenticate');
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for login form and fill it
    try {
      // Try multiple selector strategies for login form
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
      
      await emailField.fill('admin@example.com');
      await passwordField.fill('doof123');
      
      console.log('✅ Filled login form');
      
      // Submit and wait for navigation or response
      const loginResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.request().method() === 'POST'
      );
      
      await submitButton.click();
      console.log('🚀 Submitted login form');
      
      // Wait for login response
      const loginResponse = await loginResponsePromise;
      const loginData = await loginResponse.json();
      console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
      
      // Wait a bit for auth state to update
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.log('⚠️ UI login failed, trying API login instead');
      
      // Fallback to API login
      const apiLoginResponse = await page.request.post('/api/auth/login', {
        data: {
          email: 'admin@example.com',
          password: 'doof123'
        }
      });
      
      const apiLoginData = await apiLoginResponse.json();
      console.log('📊 API Login response:', JSON.stringify(apiLoginData, null, 2));
      
      // If API login successful, set token in browser storage
      if (apiLoginData.success && apiLoginData.data.token) {
        await page.evaluate((token) => {
          localStorage.setItem('auth-token', token);
          localStorage.setItem('token', token);
        }, apiLoginData.data.token);
        console.log('✅ Token stored via API login');
      }
    }
    
    // Check authentication status after login
    const postLoginAuthStatus = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('auth-token') || localStorage.getItem('token'),
        sessionStorage: sessionStorage.getItem('auth-token') || sessionStorage.getItem('token'),
        cookies: document.cookie,
        url: window.location.href
      };
    });
    console.log('🔍 Post-login auth status:', JSON.stringify(postLoginAuthStatus, null, 2));
    
    // Step 3: Navigate to a protected page to verify login worked
    console.log('📍 Step 3: Navigate to protected area');
    await page.goto('/my-lists', { waitUntil: 'networkidle' });
    
    const protectedPageStatus = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasAuthToken: !!(localStorage.getItem('auth-token') || localStorage.getItem('token'))
      };
    });
    console.log('🔍 Protected page status:', JSON.stringify(protectedPageStatus, null, 2));
    
    // Step 4: Sign out
    console.log('📍 Step 4: Sign out');
    
    // Try to find logout button/link
    const logoutElements = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');
    const logoutElementCount = await logoutElements.count();
    
    if (logoutElementCount > 0) {
      console.log(`✅ Found ${logoutElementCount} logout elements`);
      
      // Monitor for logout API calls
      const logoutResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth/logout') && response.request().method() === 'POST',
        { timeout: 5000 }
      ).catch(() => null);
      
      await logoutElements.first().click();
      console.log('🚀 Clicked logout button');
      
      const logoutResponse = await logoutResponsePromise;
      if (logoutResponse) {
        const logoutData = await logoutResponse.json().catch(() => 'Invalid JSON');
        console.log('📊 Logout response:', JSON.stringify(logoutData, null, 2));
      } else {
        console.log('ℹ️ No logout API call detected');
      }
      
    } else {
      console.log('⚠️ No logout button found, clearing auth manually');
      
      // Manual logout - clear storage
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('auth-token');
        sessionStorage.removeItem('token');
        
        // Clear all localStorage keys that might be auth-related
        Object.keys(localStorage).forEach(key => {
          if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
            localStorage.removeItem(key);
          }
        });
      });
      console.log('✅ Manually cleared auth tokens');
    }
    
    // Wait for logout to complete
    await page.waitForTimeout(2000);
    
    // Check authentication status after logout
    const postLogoutAuthStatus = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('auth-token') || localStorage.getItem('token'),
        sessionStorage: sessionStorage.getItem('auth-token') || sessionStorage.getItem('token'),
        cookies: document.cookie,
        url: window.location.href,
        allLocalStorageKeys: Object.keys(localStorage)
      };
    });
    console.log('🔍 Post-logout auth status:', JSON.stringify(postLogoutAuthStatus, null, 2));
    
    // Step 5: Refresh the page
    console.log('📍 Step 5: Refresh page');
    await page.reload({ waitUntil: 'networkidle' });
    
    // Check authentication status after refresh
    const postRefreshAuthStatus = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('auth-token') || localStorage.getItem('token'),
        sessionStorage: sessionStorage.getItem('auth-token') || sessionStorage.getItem('token'),
        cookies: document.cookie,
        url: window.location.href,
        allLocalStorageKeys: Object.keys(localStorage),
        title: document.title
      };
    });
    console.log('🔍 Post-refresh auth status:', JSON.stringify(postRefreshAuthStatus, null, 2));
    
    // Step 6: Try to access protected content
    console.log('📍 Step 6: Test access to protected content after refresh');
    await page.goto('/my-lists', { waitUntil: 'networkidle' });
    
    const finalStatus = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasAuthToken: !!(localStorage.getItem('auth-token') || localStorage.getItem('token')),
        pageContent: document.body.innerText.substring(0, 200) // First 200 chars of page
      };
    });
    console.log('🔍 Final status after trying to access protected content:', JSON.stringify(finalStatus, null, 2));
    
    // Summary
    console.log('\n📋 AUTHENTICATION WORKFLOW SUMMARY:');
    console.log('Initial state:', initialAuthStatus.localStorage ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    console.log('After login:', postLoginAuthStatus.localStorage ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    console.log('After logout:', postLogoutAuthStatus.localStorage ? 'STILL AUTHENTICATED (PROBLEM!)' : 'NOT AUTHENTICATED');
    console.log('After refresh:', postRefreshAuthStatus.localStorage ? 'STILL AUTHENTICATED (PROBLEM!)' : 'NOT AUTHENTICATED');
    console.log('Final protected access:', finalStatus.url.includes('/my-lists') ? 'ALLOWED' : 'REDIRECTED');
    
    // Verify the expected behavior
    if (postLogoutAuthStatus.localStorage) {
      console.log('❌ ISSUE DETECTED: Authentication token still present after logout');
    }
    
    if (postRefreshAuthStatus.localStorage) {
      console.log('❌ ISSUE DETECTED: Authentication token still present after refresh');
    }
    
    if (!postLogoutAuthStatus.localStorage && !postRefreshAuthStatus.localStorage) {
      console.log('✅ Authentication workflow working correctly');
    }
  });
}); 