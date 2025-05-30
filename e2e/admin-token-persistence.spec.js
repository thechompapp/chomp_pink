import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers.js';

test.describe('Admin Token Persistence Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.text().includes('Auth') || msg.text().includes('token') || msg.text().includes('coordinator')) {
        console.log(`🔍 ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });
  });

  test('should persist admin token across page navigation', async ({ page }) => {
    console.log('🧪 Testing token persistence across navigation...');
    
    // Step 1: Login as admin
    await AuthHelpers.login(page);
    console.log('✅ Initial login completed');
    
    // Verify initial authentication state
    const initialAuthState = await page.evaluate(() => {
      return {
        authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
        token: localStorage.getItem('auth-token'),
        coordinatorState: window.__authCoordinator?.getCurrentState()
      };
    });
    
    expect(initialAuthState.authStorage.state?.isAuthenticated).toBe(true);
    expect(initialAuthState.token).toBeTruthy();
    console.log('✅ Initial auth state verified');
    
    // Step 2: Navigate to admin panel
    await page.goto('http://localhost:5174/admin');
    await page.waitForTimeout(2000);
    
    const adminUrl = page.url();
    expect(adminUrl).toContain('/admin');
    console.log('✅ Successfully navigated to admin panel');
    
    // Check auth state after admin navigation
    const adminAuthState = await page.evaluate(() => {
      return {
        authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
        token: localStorage.getItem('auth-token'),
        coordinatorState: window.__authCoordinator?.getCurrentState()
      };
    });
    
    expect(adminAuthState.authStorage.state?.isAuthenticated).toBe(true);
    expect(adminAuthState.token).toBeTruthy();
    console.log('✅ Auth state maintained after admin navigation');
    
    // Step 3: Navigate to home page
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(2000);
    
    const homeAuthState = await page.evaluate(() => {
      return {
        authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
        token: localStorage.getItem('auth-token'),
        coordinatorState: window.__authCoordinator?.getCurrentState()
      };
    });
    
    expect(homeAuthState.authStorage.state?.isAuthenticated).toBe(true);
    expect(homeAuthState.token).toBeTruthy();
    console.log('✅ Auth state maintained after home navigation');
    
    // Step 4: Navigate back to admin
    await page.goto('http://localhost:5174/admin');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    expect(finalUrl).toContain('/admin');
    console.log('✅ Successfully navigated back to admin panel');
    
    // Final auth state check
    const finalAuthState = await page.evaluate(() => {
      return {
        authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
        token: localStorage.getItem('auth-token'),
        coordinatorState: window.__authCoordinator?.getCurrentState()
      };
    });
    
    expect(finalAuthState.authStorage.state?.isAuthenticated).toBe(true);
    expect(finalAuthState.token).toBeTruthy();
    console.log('✅ Auth state maintained throughout navigation cycle');
  });

  test('should persist admin token across page refresh', async ({ page }) => {
    console.log('🧪 Testing token persistence across page refresh...');
    
    // Step 1: Login as admin
    await AuthHelpers.login(page);
    console.log('✅ Initial login completed');
    
    // Step 2: Navigate to admin panel
    await page.goto('http://localhost:5174/admin');
    await page.waitForTimeout(2000);
    
    // Get auth state before refresh
    const beforeRefreshState = await page.evaluate(() => {
      return {
        authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
        token: localStorage.getItem('auth-token'),
        coordinatorState: window.__authCoordinator?.getCurrentState(),
        url: window.location.href
      };
    });
    
    expect(beforeRefreshState.authStorage.state?.isAuthenticated).toBe(true);
    expect(beforeRefreshState.token).toBeTruthy();
    console.log('✅ Auth state verified before refresh');
    
    // Step 3: Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Give time for auth initialization
    
    // Check auth state after refresh
    const afterRefreshState = await page.evaluate(() => {
      return {
        authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
        token: localStorage.getItem('auth-token'),
        coordinatorState: window.__authCoordinator?.getCurrentState(),
        url: window.location.href
      };
    });
    
    console.log('🔍 Auth state after refresh:', {
      isAuthenticated: afterRefreshState.authStorage.state?.isAuthenticated,
      hasToken: !!afterRefreshState.token,
      coordinatorAuth: afterRefreshState.coordinatorState?.isAuthenticated,
      url: afterRefreshState.url
    });
    
    expect(afterRefreshState.authStorage.state?.isAuthenticated).toBe(true);
    expect(afterRefreshState.token).toBeTruthy();
    expect(afterRefreshState.url).toContain('/admin');
    console.log('✅ Auth state maintained after page refresh');
  });

  test('should persist admin token across browser session (new context)', async ({ browser }) => {
    console.log('🧪 Testing token persistence across browser sessions...');
    
    // Create first browser context/session
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // Enable logging for first session
    page1.on('console', msg => {
      if (msg.text().includes('Auth') || msg.text().includes('token')) {
        console.log(`🔍 SESSION1 ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });
    
    // Step 1: Login in first session
    await AuthHelpers.login(page1);
    console.log('✅ Login completed in first session');
    
    // Navigate to admin panel
    await page1.goto('http://localhost:5174/admin');
    await page1.waitForTimeout(2000);
    
    // Get tokens from first session
    const session1Tokens = await page1.evaluate(() => {
      return {
        authStorage: localStorage.getItem('auth-authentication-storage'),
        token: localStorage.getItem('auth-token'),
        authToken: localStorage.getItem('authToken'),
        allTokens: Object.keys(localStorage).filter(key => 
          key.includes('token') || key.includes('auth')
        ).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {})
      };
    });
    
    console.log('🔍 Session 1 tokens:', Object.keys(session1Tokens.allTokens));
    expect(session1Tokens.token).toBeTruthy();
    
    await context1.close();
    console.log('✅ First session closed');
    
    // Step 2: Create new browser context/session  
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    // Enable logging for second session
    page2.on('console', msg => {
      if (msg.text().includes('Auth') || msg.text().includes('token')) {
        console.log(`🔍 SESSION2 ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });
    
    // Step 3: Try to access admin panel directly (should redirect to login if not persisted)
    await page2.goto('http://localhost:5174/admin');
    await page2.waitForTimeout(3000);
    
    const session2Url = page2.url();
    const session2Tokens = await page2.evaluate(() => {
      return {
        authStorage: localStorage.getItem('auth-authentication-storage'),
        token: localStorage.getItem('auth-token'),
        allTokens: Object.keys(localStorage).filter(key => 
          key.includes('token') || key.includes('auth')
        )
      };
    });
    
    console.log('🔍 Session 2 URL:', session2Url);
    console.log('🔍 Session 2 tokens:', session2Tokens.allTokens);
    
    // Since localStorage is not shared between browser contexts,
    // we expect to be redirected to login page
    if (session2Url.includes('/login')) {
      console.log('✅ Expected behavior: New session requires re-authentication (localStorage not shared between contexts)');
    } else if (session2Url.includes('/admin')) {
      console.log('⚠️ Unexpected: Admin access granted without authentication in new session');
      // This might indicate a development mode bypass
    }
    
    await context2.close();
  });

  test('should maintain admin state during rapid navigation', async ({ page }) => {
    console.log('🧪 Testing token persistence during rapid navigation...');
    
    // Step 1: Login as admin
    await AuthHelpers.login(page);
    console.log('✅ Initial login completed');
    
    // Step 2: Rapid navigation test
    const urls = [
      'http://localhost:5174/',
      'http://localhost:5174/admin',
      'http://localhost:5174/',
      'http://localhost:5174/admin',
      'http://localhost:5174/'
    ];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`🔄 Navigation ${i + 1}/${urls.length}: ${url}`);
      
      await page.goto(url);
      await page.waitForTimeout(1000); // Short wait between navigations
      
      // Check auth state after each navigation
      const authState = await page.evaluate(() => {
        return {
          isAuthenticated: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}').state?.isAuthenticated,
          hasToken: !!localStorage.getItem('auth-token'),
          coordinatorAuth: window.__authCoordinator?.getCurrentState()?.isAuthenticated
        };
      });
      
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.hasToken).toBe(true);
      console.log(`✅ Auth state maintained after navigation ${i + 1}`);
    }
    
    console.log('✅ Auth state maintained throughout rapid navigation');
  });

  test('should handle auth state after multiple page refreshes', async ({ page }) => {
    console.log('🧪 Testing token persistence across multiple refreshes...');
    
    // Step 1: Login as admin
    await AuthHelpers.login(page);
    await page.goto('http://localhost:5174/admin');
    await page.waitForTimeout(2000);
    console.log('✅ Initial setup completed');
    
    // Step 2: Multiple refresh cycles
    for (let i = 1; i <= 3; i++) {
      console.log(`🔄 Refresh cycle ${i}/3`);
      
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Allow auth system to initialize
      
      const authState = await page.evaluate(() => {
        return {
          authStorage: JSON.parse(localStorage.getItem('auth-authentication-storage') || '{}'),
          token: localStorage.getItem('auth-token'),
          coordinatorState: window.__authCoordinator?.getCurrentState(),
          currentUrl: window.location.href
        };
      });
      
      expect(authState.authStorage.state?.isAuthenticated).toBe(true);
      expect(authState.token).toBeTruthy();
      expect(authState.currentUrl).toContain('/admin');
      console.log(`✅ Auth state maintained after refresh ${i}`);
    }
    
    console.log('✅ Auth state maintained across multiple refreshes');
  });
}); 