/**
 * Debug Login Test
 * A standalone test to debug authentication issues
 */

import { chromium } from 'playwright';

async function debugLogin() {
  console.log('🚀 Starting debug login test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to all console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // Listen to network responses
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📡 API Response: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.screenshot({ path: 'debug-login.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Check if form elements exist
    const emailField = await page.locator('input[type="email"]').count();
    const passwordField = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log('🔍 Form elements found:');
    console.log(`  Email field: ${emailField > 0}`);
    console.log(`  Password field: ${passwordField > 0}`);
    console.log(`  Submit button: ${submitButton > 0}`);
    
    if (emailField === 0 || passwordField === 0 || submitButton === 0) {
      throw new Error('Login form elements not found');
    }
    
    // Fill the form
    console.log('📝 Filling login form...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    
    // Submit the form
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or auth state change
    await page.waitForTimeout(3000);
    
    // Check current state
    const currentUrl = page.url();
    const pageTitle = await page.title();
    
    console.log('📍 Current URL:', currentUrl);
    console.log('📄 Page title:', pageTitle);
    
    // Get authentication state from localStorage
    const authState = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authStorage = localStorage.getItem('auth-authentication-storage');
      const token = localStorage.getItem('auth-token') || localStorage.getItem('authToken');
      const user = localStorage.getItem('userData');
      
      return {
        authStorage: authStorage ? JSON.parse(authStorage) : null,
        token,
        user,
        allKeys: keys
      };
    });
    
    console.log('🗄️ Authentication state:');
    console.log(JSON.stringify(authState, null, 2));
    
    // Test manual coordinator sync
    console.log('🔄 Testing manual coordinator synchronization...');
    const manualSyncResult = await page.evaluate(() => {
      if (window.__authCoordinator) {
        const coordinator = window.__authCoordinator;
        const currentState = coordinator.getCurrentState();
        
        // Get the token and user from localStorage
        const token = localStorage.getItem('auth-token') || localStorage.getItem('authToken') || localStorage.getItem('token');
        const userStr = localStorage.getItem('userData') || localStorage.getItem('current_user');
        let user = null;
        
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.log('Failed to parse user data:', e);
          }
        }
        
        if (token && user) {
          // Manually trigger sync
          coordinator.syncAuthenticatedState(true, user, token);
          
          return {
            beforeSync: currentState,
            token,
            user,
            afterSyncTriggered: true
          };
        }
        
        return {
          beforeSync: currentState,
          token,
          user,
          error: 'No token or user found for manual sync'
        };
      }
      
      return { error: 'Coordinator not found' };
    });
    
    console.log('🔄 Manual sync result:');
    console.log(JSON.stringify(manualSyncResult, null, 2));
    
    // Check if the auth storage was updated after manual sync
    await page.waitForTimeout(1000);
    const authStateAfterSync = await page.evaluate(() => {
      return localStorage.getItem('auth-authentication-storage');
    });
    
    console.log('🗄️ Auth storage after manual sync:');
    if (authStateAfterSync) {
      console.log(JSON.stringify(JSON.parse(authStateAfterSync), null, 2));
    } else {
      console.log('null');
    }
    
    // Navigate directly to admin panel
    console.log('🔑 Attempting to access admin panel...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'debug-admin.png', fullPage: true });
    console.log('📸 Admin page screenshot saved');
    
    const adminUrl = page.url();
    const adminTitle = await page.title();
    
    console.log('📍 Admin page URL:', adminUrl);
    console.log('📄 Admin page title:', adminTitle);
    
    // Check for authentication state in React context
    const reactAuthState = await page.evaluate(() => {
      // Try to access React dev tools or global state
      const reactState = window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      return {
        hasReact: !!reactState,
        windowKeys: Object.keys(window).filter(key => key.includes('auth') || key.includes('Auth')),
        localStorage: {
          authToken: localStorage.getItem('auth-token') || localStorage.getItem('authToken'),
          authData: localStorage.getItem('test-auth-data'),
          userData: localStorage.getItem('userData')
        }
      };
    });
    
    console.log('⚛️ React authentication state:');
    console.log(JSON.stringify(reactAuthState, null, 2));
    
    // Check admin panel elements
    console.log('🏢 Admin page elements:');
    
    // Look for admin panel indicators
    const adminPanelText = await page.locator('text=Admin Panel').count();
    const restaurantTab = await page.locator('text=Restaurants').count();
    const enhancedFeatures = await page.locator('text=Enhanced Features').count();
    
    console.log(`🔧 Admin Panel text found: ${adminPanelText > 0}`);
    console.log(`🍽️ Restaurant tab found: ${restaurantTab > 0}`);
    console.log(`✨ Enhanced features found: ${enhancedFeatures > 0}`);
    
    // If we're still on login page, try to understand why
    if (adminUrl.includes('/login')) {
      console.log('⚠️ Still on login page after admin navigation - checking authentication flow');
      
      // Check if there are any authentication errors
      const errorMessages = await page.locator('[role="alert"], .error, .text-destructive').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Error messages found:', errorMessages);
      }
      
      // Try to trigger auth check manually
      await page.evaluate(() => {
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('forceAuthCheck'));
        }
      });
      
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      console.log('📍 Final URL after auth check:', finalUrl);
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
}

debugLogin(); 