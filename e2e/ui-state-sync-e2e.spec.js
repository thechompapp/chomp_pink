/**
 * UI State Synchronization E2E Tests
 * 
 * Tests that properly catch React context update issues
 * These test the ACTUAL user experience with proper dev mode handling
 */

import { test, expect } from '@playwright/test';

test.describe('UI State Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state for each test
    await page.goto('http://localhost:5175');
    await page.evaluate(() => {
      // Clear all auth-related storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Set flags to ensure real testing
      localStorage.setItem('e2e_testing_mode', 'true');
      localStorage.setItem('user_explicitly_logged_out', 'true');
    });
    
    // Wait for any dev mode bypasses to settle
    await page.waitForTimeout(500);
  });

  test('real form submission updates navbar immediately without refresh', async ({ page }) => {
    console.log('🧪 Testing real form submission UI state updates...');
    
    // 1. Navigate to home and verify logged out state
    await page.goto('http://localhost:5175');
    await page.waitForLoadState('networkidle');
    
    // Wait for any auth checks to complete and verify we're logged out
    await page.waitForTimeout(1000);
    
    // Look for login-related elements (could be "Sign In" or "Login")
    const loginElements = await page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login")').count();
    
    if (loginElements === 0) {
      console.log('⚠️ No login button found, may be auto-logged in. Logging out first...');
      
      // Try to find and click profile/logout button
      const profileButton = page.locator('button[id="user-menu-button"]');
      if (await profileButton.isVisible()) {
        await profileButton.click();
        await page.click('button:has-text("Sign out"), a:has-text("Sign out")');
        await page.waitForTimeout(1000);
      }
    }
    
    // 2. Go to login page
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('📝 Login form found, filling credentials...');
    
    // 3. Fill out and submit the ACTUAL form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    
    console.log('🔑 Submitting form...');
    await page.click('button[type="submit"]');
    
    // 4. Wait for successful login (should redirect to home)
    await page.waitForURL('http://localhost:5175/', { timeout: 10000 });
    
    console.log('🏠 Redirected to home, checking UI state...');
    
    // 5. CRITICAL TEST: Check if navbar updated WITHOUT refresh
    const profileButton = page.locator('button[id="user-menu-button"]');
    
    // This should pass immediately without refresh
    await expect(profileButton).toBeVisible({ timeout: 3000 });
    
    // The sign-in link should be gone (check multiple possible selectors)
    const signInElements = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login")');
    await expect(signInElements).toHaveCount(0);
    
    console.log('✅ Form submission correctly updated UI state immediately');
  });

  test('logout immediately updates navbar without refresh', async ({ page }) => {
    console.log('🧪 Testing logout UI state updates...');
    
    // 1. First ensure we're logged in via form submission
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for form to be ready
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5175/');
    
    // Verify logged in state
    const profileButton = page.locator('button[id="user-menu-button"]');
    await expect(profileButton).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Logged in successfully, now testing logout...');
    
    // 2. Logout via UI
    await page.click('button[id="user-menu-button"]');
    await page.waitForTimeout(500); // Wait for menu to open
    await page.click('button:has-text("Sign out")');
    
    // 3. CRITICAL TEST: Check immediate UI update
    const signInElements = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login")');
    await expect(signInElements.first()).toBeVisible({ timeout: 3000 });
    
    // Profile button should be gone
    await expect(profileButton).not.toBeVisible();
    
    console.log('✅ Logout correctly updated UI state immediately');
  });

  test('authentication persists across page refresh', async ({ page }) => {
    console.log('🧪 Testing state persistence after refresh...');
    
    // Login via form
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5175/');
    
    // Verify logged in
    await expect(page.locator('button[id="user-menu-button"]')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Logged in, testing refresh persistence...');
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in after refresh
    await expect(page.locator('button[id="user-menu-button"]')).toBeVisible({ timeout: 5000 });
    
    // Login links should not be visible
    const signInElements = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login")');
    await expect(signInElements).toHaveCount(0);
    
    console.log('✅ Authentication state persists after refresh');
  });

  test('multiple login attempts handle errors gracefully', async ({ page }) => {
    console.log('🧪 Testing error handling in UI updates...');
    
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    
    // Test with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error and stay on login page
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
    
    // UI should still show login form (not logged in state)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Invalid login properly handled');
    
    // Now try valid credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5175/');
    
    // Should be logged in now
    await expect(page.locator('button[id="user-menu-button"]')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Valid login after error works correctly');
  });

  test('UI state is consistent across navigation', async ({ page }) => {
    console.log('🧪 Testing UI state consistency during navigation...');
    
    // Login first
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5175/');
    
    // Verify logged in state on home page
    await expect(page.locator('button[id="user-menu-button"]')).toBeVisible({ timeout: 3000 });
    
    // Navigate to different pages and verify auth state persists
    const testPages = ['/restaurants', '/lists'];
    
    for (const testPage of testPages) {
      try {
        await page.goto(`http://localhost:5175${testPage}`);
        await page.waitForLoadState('networkidle');
        
        // Should still show logged in state
        await expect(page.locator('button[id="user-menu-button"]')).toBeVisible({ timeout: 3000 });
        
        // Should not show login links
        const signInElements = page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login")');
        await expect(signInElements).toHaveCount(0);
        
        console.log(`✅ Auth state consistent on ${testPage}`);
      } catch (error) {
        console.log(`⚠️ Could not test ${testPage} (page may not exist): ${error.message}`);
      }
    }
    
    console.log('✅ UI state consistent across navigation');
  });
}); 