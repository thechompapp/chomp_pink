import { chromium } from 'playwright';

async function testAdminAccess() {
  console.log('🚀 Testing admin panel access...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      console.log('📡 LOGIN REQUEST:', request.method(), request.url());
      console.log('📡 REQUEST BODY:', request.postData());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('📡 LOGIN RESPONSE:', response.status(), response.url());
      response.text().then(text => {
        console.log('📡 RESPONSE BODY:', text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      }).catch(() => console.log('📡 RESPONSE BODY: Could not read'));
    }
  });
  
  // Log console errors  
  page.on('console', msg => {
    if (msg.text().includes('AuthCoordinator') || msg.text().includes('coordinator') || msg.text().includes('Login') || msg.text().includes('auth')) {
      console.log(`🔍 ${msg.type().toUpperCase()}:`, msg.text());
    }
  });
  
  try {
    // Navigate to login
    console.log('📍 Going to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check current URL after login
    const afterLoginUrl = page.url();
    console.log('📍 After login URL:', afterLoginUrl);
    
    // Get detailed state comparison BEFORE manual sync
    console.log('🔍 Detailed state comparison BEFORE manual sync:');
    const detailedStateBefore = await page.evaluate(() => {
      const coordinator = window.__authCoordinator;
      const authStorage = localStorage.getItem('auth-authentication-storage');
      
      return {
        coordinatorState: coordinator ? coordinator.getCurrentState() : null,
        authStorage: authStorage ? JSON.parse(authStorage) : null,
        tokens: {
          token: localStorage.getItem('token'),
          authToken: localStorage.getItem('auth-token'),
          authTokenAlt: localStorage.getItem('authToken')
        },
        userData: localStorage.getItem('userData')
      };
    });
    
    console.log(JSON.stringify(detailedStateBefore, null, 2));
    
    // Manually trigger coordinator sync
    console.log('🔄 Triggering manual coordinator sync...');
    await page.evaluate(() => {
      if (window.__authCoordinator) {
        const coordinator = window.__authCoordinator;
        const token = localStorage.getItem('auth-token') || localStorage.getItem('authToken') || localStorage.getItem('token');
        const userStr = localStorage.getItem('userData') || localStorage.getItem('current_user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            coordinator.syncAuthenticatedState(true, user, token);
            console.log('✅ Manual sync triggered');
          } catch (e) {
            console.log('❌ Manual sync failed:', e);
          }
        }
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check auth storage after sync
    const authState = await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-authentication-storage');
      return authStorage ? JSON.parse(authStorage) : null;
    });
    
    console.log('🗄️ Auth state after sync:', JSON.stringify(authState, null, 2));
    
    // Now navigate to admin
    console.log('🔑 Navigating to admin panel...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(5000);
    
    const adminUrl = page.url();
    console.log('📍 Admin panel URL:', adminUrl);
    
    // Check for admin panel elements
    const adminPanelTitle = await page.locator('h1, h2').filter({ hasText: /admin/i }).first().isVisible();
    const restaurantTab = await page.locator('button:has-text("Restaurants")').first().isVisible();
    const table = await page.locator('table').first().isVisible();
    
    console.log('🏢 Admin panel elements:');
    console.log('  - Admin title:', adminPanelTitle);
    console.log('  - Restaurant tab:', restaurantTab);
    console.log('  - Table:', table);
    
    if (restaurantTab) {
      console.log('🍽️ Clicking restaurants tab...');
      await page.locator('button:has-text("Restaurants")').first().click();
      await page.waitForTimeout(3000);
      
      const tableAfterTab = await page.locator('table').first().isVisible();
      const enhancedTable = await page.locator('.enhanced-admin-table').first().isVisible();
      
      console.log('📊 After restaurant tab click:');
      console.log('  - Regular table:', tableAfterTab);
      console.log('  - Enhanced table:', enhancedTable);
    }
    
    await page.screenshot({ path: 'debug-admin-access.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-admin-access.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminAccess(); 