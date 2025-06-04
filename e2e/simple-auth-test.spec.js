// Simple authentication test to verify coordinator integration fix
import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:5173';

// Helper function to login
async function login(page) {
  console.log('🔐 Starting login process...');
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Login') || msg.text().includes('Auth')) {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`[Browser Error]:`, error.message);
  });
  
  // Listen for network requests
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`[Network] Login API response: ${response.status()}`);
    }
  });
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be ready
  await page.waitForSelector('#email', { timeout: 10000 });
  
  // Fill in login form with working admin credentials
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'doof123');
  
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
  
  // Check if auth system is ready
  const authReady = await page.evaluate(() => {
    // Try to access the auth context state if available
    if (window.__authContext) {
      return window.__authContext.authReady;
    }
    return true; // Assume ready if we can't check
  });
  
  // Check for any error states in localStorage or DOM
  const errorElements = await page.locator('[role="alert"], .error, .alert-error').count();
  const errorText = errorElements > 0 ? await page.locator('[role="alert"], .error, .alert-error').first().textContent() : null;
  
  console.log('🏪 Storage State:', {
    hasToken: !!token && token !== 'null',
    hasUser: !!user && user !== 'null',
    logoutFlag,
    tokenLength: token ? token.length : 0,
    authReady,
    errorCount: errorElements,
    errorText
  });
  
  return {
    token,
    user,
    logoutFlag,
    authReady,
    errorText,
    isAuthenticated: !!token && token !== 'null' && !!user && user !== 'null' && logoutFlag !== 'true'
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
      console.log('Error text:', authState.errorText);
      
      // Let's check what page we're on
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check if the form shows any validation errors
      const formErrors = await page.locator('input:invalid, .border-red-300, .text-red-600').count();
      console.log('Form validation errors:', formErrors);
      
      // Check for network errors
      const networkErrorExists = await page.evaluate(() => {
        return !!window.navigator.onLine && !window.navigator.onLine;
      });
      console.log('Network status:', !networkErrorExists ? 'online' : 'offline');
      
      throw new Error('User is not authenticated after login');
    }
    
    console.log('✅ User is authenticated after login');
    
    // Step 4: Try to access admin panel
    console.log('\n📍 Step 4: Try to access admin panel');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for auth checks
    
    // Step 5: Verify we're on admin panel, not redirected to login
    console.log('\n📍 Step 5: Verify admin panel access');
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Check auth state again after navigation
    const postNavigationAuthState = await checkAuthState(page);
    console.log('Auth state after navigation:', {
      isAuthenticated: postNavigationAuthState.isAuthenticated,
      hasToken: !!postNavigationAuthState.token,
      tokenLength: postNavigationAuthState.token ? postNavigationAuthState.token.length : 0
    });
    
    if (finalUrl.includes('/login')) {
      console.log('❌ User was redirected to login page after successful authentication');
      console.log('Final auth state:', postNavigationAuthState);
      
      throw new Error('User redirected to login despite successful authentication');
    }
    
    // Check for admin panel content or loading states
    const hasAdminContent = await page.locator('.admin-panel, [data-testid="admin-panel"], h1:has-text("Admin"), h2:has-text("Admin")').isVisible({ timeout: 5000 }).catch(() => false);
    const hasLoadingIndicator = await page.locator('[class*="loading"], [class*="spinner"], [class*="loader"]').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasAdminContent) {
      console.log('✅ Admin panel content loaded successfully');
    } else if (hasLoadingIndicator) {
      console.log('ℹ️ Admin panel is still loading');
    } else {
      console.log('ℹ️ Admin panel content may have different structure');
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
    
    // Check auth state before refresh
    const preRefreshAuthState = await checkAuthState(page);
    console.log('Auth state before refresh:', {
      isAuthenticated: preRefreshAuthState.isAuthenticated,
      tokenLength: preRefreshAuthState.token ? preRefreshAuthState.token.length : 0
    });
    
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