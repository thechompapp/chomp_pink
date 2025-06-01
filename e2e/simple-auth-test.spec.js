// Simple authentication test to verify coordinator integration fix
import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:5176';

// Helper function to login
async function login(page) {
  console.log('🔐 Starting login process...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill in login form with working admin credentials
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'doof123');
  
  // Submit form and wait for response
  console.log('📤 Submitting login form...');
  await page.click('button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForTimeout(3000);
  
  console.log('✅ Login form submitted');
}

// Helper function to check authentication state
async function checkAuthState(page) {
  console.log('🔍 Checking authentication state...');
  
  // Check localStorage tokens
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const user = await page.evaluate(() => localStorage.getItem('current_user'));
  const logoutFlag = await page.evaluate(() => localStorage.getItem('user_explicitly_logged_out'));
  
  // Check coordinator state if available
  const coordinatorState = await page.evaluate(() => {
    if (window.__authCoordinator) {
      return window.__authCoordinator.getCurrentState();
    }
    return null;
  });
  
  console.log('🏪 Storage State:', {
    hasToken: !!token && token !== 'null',
    hasUser: !!user && user !== 'null',
    logoutFlag,
    tokenLength: token ? token.length : 0
  });
  
  console.log('🎯 Coordinator State:', coordinatorState);
  
  return {
    token,
    user,
    logoutFlag,
    coordinatorState,
    isAuthenticated: coordinatorState?.isAuthenticated || (!!token && token !== 'null' && !!user && user !== 'null' && logoutFlag !== 'true')
  };
}

test.describe('Simple Authentication Test', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should successfully authenticate and access admin panel', async ({ page }) => {
    console.log('\n🧪 === SIMPLE AUTH TEST: Login & Admin Access ===\n');
    
    // Step 1: Verify we start unauthenticated
    console.log('📍 Step 1: Verify initial state');
    let authState = await checkAuthState(page);
    expect(authState.isAuthenticated).toBe(false);
    console.log('✅ Started unauthenticated as expected');
    
    // Step 2: Perform login
    console.log('\n📍 Step 2: Perform login');
    await login(page);
    
    // Step 3: Check authentication state after login
    console.log('\n📍 Step 3: Check auth state after login');
    authState = await checkAuthState(page);
    
    if (!authState.isAuthenticated) {
      console.log('❌ Authentication failed after login');
      console.log('Token:', authState.token);
      console.log('User:', authState.user);
      console.log('Coordinator:', authState.coordinatorState);
      
      // Let's check what page we're on
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      throw new Error('User is not authenticated after login');
    }
    
    console.log('✅ User is authenticated after login');
    
    // Step 4: Try to access admin panel
    console.log('\n📍 Step 4: Try to access admin panel');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give coordinator time to check
    
    // Step 5: Verify we're on admin panel, not redirected to login
    console.log('\n📍 Step 5: Verify admin panel access');
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    if (finalUrl.includes('/login')) {
      console.log('❌ User was redirected to login page after successful authentication');
      
      // Let's check auth state again
      const finalAuthState = await checkAuthState(page);
      console.log('Final auth state:', finalAuthState);
      
      // Check if ProtectedRoute logs are available
      const logs = await page.evaluate(() => {
        return console.log.calls || [];
      });
      console.log('Recent logs:', logs);
      
      throw new Error('User redirected to login despite successful authentication');
    }
    
    // Check for success indicators on admin panel
    const hasAdminContent = await page.locator('.admin-panel, [data-testid="admin-panel"], h1:has-text("Admin"), h2:has-text("Admin")').isVisible({ timeout: 5000 });
    
    if (hasAdminContent) {
      console.log('✅ Admin panel loaded successfully');
    } else {
      console.log('ℹ️ Admin panel content may still be loading or have different structure');
    }
    
    console.log('✅ Authentication test completed successfully');
  });
  
  test('should handle page refresh correctly', async ({ page }) => {
    console.log('\n🧪 === PAGE REFRESH TEST ===\n');
    
    // Login first
    console.log('📍 Step 1: Login');
    await login(page);
    
    // Verify authentication
    let authState = await checkAuthState(page);
    expect(authState.isAuthenticated).toBe(true);
    console.log('✅ User authenticated');
    
    // Navigate to admin panel
    console.log('\n📍 Step 2: Navigate to admin panel');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Refresh the page
    console.log('\n📍 Step 3: Refresh page');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if still on admin panel
    console.log('\n📍 Step 4: Verify still on admin panel after refresh');
    const finalUrl = page.url();
    console.log('Final URL after refresh:', finalUrl);
    
    if (finalUrl.includes('/login')) {
      // Check auth state after refresh
      const refreshAuthState = await checkAuthState(page);
      console.log('Auth state after refresh:', refreshAuthState);
      
      throw new Error('User redirected to login after page refresh');
    }
    
    console.log('✅ Page refresh test completed successfully');
  });
}); 