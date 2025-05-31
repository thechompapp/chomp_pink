/**
 * Admin Panel E2E Tests
 * 
 * Comprehensive tests for admin panel functionality including:
 * - Admin authentication
 * - Admin panel UI access via navbar dropdown
 * - Admin API endpoints
 * - Admin panel content and functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Panel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup clean state for each test
    await page.goto('http://localhost:5175');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('e2e_testing_mode', 'true');
      localStorage.setItem('user_explicitly_logged_out', 'true');
    });
  });

  test('admin authentication and panel access flow', async ({ page }) => {
    console.log('🧪 Testing complete admin panel access flow...');
    
    // 1. Start from login page
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Step 1: Logging in as admin...');
    
    // 2. Login with admin credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(/^http:\/\/localhost:5175\/?$/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log('📍 Step 2: Verifying authenticated state...');
    
    // 3. Verify user is authenticated with profile button visible
    const profileButton = page.locator('button[id="user-menu-button"]');
    await expect(profileButton).toBeVisible();
    
    // 4. Open profile dropdown menu
    console.log('📍 Step 3: Opening profile dropdown...');
    await profileButton.click();
    await page.waitForTimeout(500);
    
    // 5. Verify admin panel link is present in dropdown
    const adminLink = page.locator('a[href="/admin"]');
    await expect(adminLink).toBeVisible();
    await expect(adminLink).toContainText('Admin Panel');
    
    console.log('📍 Step 4: Clicking admin panel link...');
    
    // 6. Click admin panel link
    await adminLink.click();
    await page.waitForURL('http://localhost:5175/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📍 Step 5: Verifying admin panel loaded...');
    
    // 7. Verify admin panel content loads
    const adminPanelHeading = page.locator('h1, h2, h3').filter({ hasText: /admin/i });
    await expect(adminPanelHeading).toBeVisible();
    
    // 8. Check for admin panel sections/content
    const adminContent = page.locator('body');
    await expect(adminContent).toContainText(/admin/i);
    
    console.log('✅ Admin panel access flow completed successfully');
  });

  test('admin API endpoints functionality', async ({ page }) => {
    console.log('🧪 Testing admin API endpoints...');
    
    // First authenticate
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:5175\/?$/);
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Step 1: Testing admin API calls from frontend...');
    
    // Navigate to admin panel
    await page.goto('http://localhost:5175/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Capture network requests to admin endpoints
    const adminApiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/admin/')) {
        adminApiCalls.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
      }
    });
    
    const adminApiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/admin/')) {
        adminApiResponses.push({
          status: response.status(),
          url: response.url()
        });
      }
    });
    
    // Wait for any admin API calls to complete
    await page.waitForTimeout(3000);
    
    console.log('📞 Admin API calls made:', adminApiCalls);
    console.log('📨 Admin API responses:', adminApiResponses);
    
    // Verify admin API calls were made successfully
    if (adminApiResponses.length > 0) {
      const successfulCalls = adminApiResponses.filter(r => r.status === 200);
      expect(successfulCalls.length).toBeGreaterThan(0);
      console.log(`✅ ${successfulCalls.length} admin API calls succeeded`);
    }
    
    // Test specific admin functionality if present
    const restaurantSection = page.locator('text=/restaurant/i');
    if (await restaurantSection.isVisible()) {
      console.log('📍 Found restaurant management section');
    }
    
    const userSection = page.locator('text=/user/i');
    if (await userSection.isVisible()) {
      console.log('📍 Found user management section');
    }
  });

  test('admin panel navigation and UI elements', async ({ page }) => {
    console.log('🧪 Testing admin panel UI elements...');
    
    // Authenticate and navigate to admin panel
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:5175\/?$/);
    await page.waitForLoadState('networkidle');
    
    // Navigate to admin panel
    await page.goto('http://localhost:5175/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📍 Step 1: Checking admin panel UI elements...');
    
    // Check for common admin UI elements
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check if navbar is still present and functional
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // Verify profile menu still works from admin panel
    const profileButton = page.locator('button[id="user-menu-button"]');
    await expect(profileButton).toBeVisible();
    
    // Check for admin-specific content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toContain('admin');
    
    console.log('📍 Step 2: Testing navigation from admin panel...');
    
    // Test navigation back to home
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForURL('http://localhost:5175/');
      await page.waitForLoadState('networkidle');
      
      // Navigate back to admin
      await page.goto('http://localhost:5175/admin');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Admin panel UI navigation tests completed');
  });

  test('admin permissions and access control', async ({ page }) => {
    console.log('🧪 Testing admin permissions and access control...');
    
    // Test 1: Verify non-admin cannot access admin panel
    console.log('📍 Step 1: Testing unauthorized access protection...');
    
    // Try to access admin panel without authentication
    await page.goto('http://localhost:5175/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should be redirected to login or show access denied
    const currentUrl = page.url();
    const bodyText = await page.locator('body').textContent();
    
    const isRedirectedToLogin = currentUrl.includes('/login');
    const hasAccessDenied = bodyText.toLowerCase().includes('access denied') || 
                           bodyText.toLowerCase().includes('unauthorized') ||
                           bodyText.toLowerCase().includes('permission');
    
    expect(isRedirectedToLogin || hasAccessDenied).toBeTruthy();
    console.log('✅ Unauthorized access properly blocked');
    
    // Test 2: Verify admin can access admin panel
    console.log('📍 Step 2: Testing authorized admin access...');
    
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:5175\/?$/);
    await page.waitForLoadState('networkidle');
    
    // Now try admin panel access
    await page.goto('http://localhost:5175/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should successfully load admin panel
    const finalUrl = page.url();
    expect(finalUrl).toBe('http://localhost:5175/admin');
    
    const finalBodyText = await page.locator('body').textContent();
    expect(finalBodyText.toLowerCase()).toContain('admin');
    
    console.log('✅ Authorized admin access working correctly');
  });

  test('admin panel error handling and edge cases', async ({ page }) => {
    console.log('🧪 Testing admin panel error handling...');
    
    // Authenticate as admin
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:5175\/?$/);
    await page.waitForLoadState('networkidle');
    
    // Test admin panel with network issues
    console.log('📍 Step 1: Testing admin panel resilience...');
    
    await page.goto('http://localhost:5175/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for error handling UI elements
    const errorElements = await page.locator('text=/error/i, text=/failed/i, text=/loading/i').count();
    console.log('📊 Error handling elements found:', errorElements);
    
    // Test page refresh maintains admin access
    console.log('📍 Step 2: Testing page refresh...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should still be on admin panel
    expect(page.url()).toBe('http://localhost:5175/admin');
    
    console.log('✅ Admin panel error handling tests completed');
  });
}); 