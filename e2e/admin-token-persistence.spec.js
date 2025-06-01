/**
 * Admin Token Persistence Test
 * 
 * Tests authentication token persistence across page refreshes,
 * navigation, and different scenarios to diagnose any token-related issues.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

// Helper function to login
async function loginAsAdmin(page) {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('doof123');
  await page.waitForTimeout(1000);
  await page.locator('button[type="submit"]').click();
  
  // Wait for login to complete and redirect
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Login completed');
  return true;
}

// Helper function to check if user is authenticated
async function checkAuthenticationState(page) {
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  // Check if we're redirected to login page (indicating not authenticated)
  if (currentUrl.includes('/login')) {
    console.log('❌ User redirected to login page - NOT authenticated');
    return false;
  }
  
  // Check for admin panel elements
  const isAdminPage = currentUrl.includes('/admin');
  if (isAdminPage) {
    console.log('✅ User on admin page - authenticated');
    return true;
  }
  
  // Check if we can navigate to admin
  try {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    if (finalUrl.includes('/admin')) {
      console.log('✅ Successfully accessed admin panel - authenticated');
      return true;
    } else {
      console.log('❌ Redirected away from admin panel - NOT authenticated');
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing admin panel:', error.message);
    return false;
  }
}

// Helper function to check local storage tokens
async function checkStoredTokens(page) {
  const tokens = await page.evaluate(() => {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: localStorage.getItem('user'),
      authData: localStorage.getItem('authData')
    };
  });
  
  console.log('🔑 Stored tokens:', {
    accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : 'null',
    refreshToken: tokens.refreshToken ? `${tokens.refreshToken.substring(0, 20)}...` : 'null',
    user: tokens.user ? 'present' : 'null',
    authData: tokens.authData ? 'present' : 'null'
  });
  
  return tokens;
}

test.describe('Admin Token Persistence Tests', () => {
  
  test('Basic token persistence after page refresh', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🧪 === Test 1: Basic Token Persistence ===');
    
    // Step 1: Login
    await loginAsAdmin(page);
    
    // Step 2: Navigate to admin panel
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Step 3: Verify authentication and check tokens
    let isAuth = await checkAuthenticationState(page);
    expect(isAuth).toBe(true);
    
    let tokens = await checkStoredTokens(page);
    console.log('📊 Initial authentication state verified');
    
    // Step 4: Refresh the page
    console.log('\n🔄 Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Step 5: Check authentication after refresh
    isAuth = await checkAuthenticationState(page);
    console.log(`🔍 Authentication after refresh: ${isAuth ? 'MAINTAINED' : 'LOST'}`);
    
    tokens = await checkStoredTokens(page);
    
    // Step 6: Test admin functionality
    if (isAuth) {
      console.log('✅ Testing admin functionality...');
      
      // Navigate to different admin tabs
      const tabs = ['Restaurants', 'Cities', 'Users'];
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`).first();
        if (await tabButton.isVisible()) {
          await tabButton.click();
          await page.waitForTimeout(1000);
          console.log(`  ✅ ${tab} tab accessible`);
        }
      }
    } else {
      console.log('❌ Admin functionality not accessible after refresh');
    }
    
    expect(isAuth).toBe(true);
  });
  
  test('Multiple page refreshes', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🧪 === Test 2: Multiple Page Refreshes ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Perform multiple refreshes
    for (let i = 1; i <= 3; i++) {
      console.log(`\n🔄 Refresh ${i}/3...`);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const isAuth = await checkAuthenticationState(page);
      console.log(`  Auth status after refresh ${i}: ${isAuth ? 'MAINTAINED' : 'LOST'}`);
      
      if (!isAuth) {
        console.log(`❌ Authentication lost after refresh ${i}`);
        break;
      }
    }
    
    const finalAuth = await checkAuthenticationState(page);
    expect(finalAuth).toBe(true);
  });
  
  test('Page refresh during admin operations', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🧪 === Test 3: Refresh During Admin Operations ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Navigate to Cities tab
    const citiesTab = page.locator('button:has-text("Cities")').first();
    await citiesTab.click();
    await page.waitForTimeout(2000);
    console.log('📍 Navigated to Cities tab');
    
    // Refresh while on Cities tab
    console.log('🔄 Refreshing while on Cities tab...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const isAuth = await checkAuthenticationState(page);
    console.log(`🔍 Authentication after refresh: ${isAuth ? 'MAINTAINED' : 'LOST'}`);
    
    if (isAuth) {
      // Check if we're still on the admin panel
      const currentUrl = page.url();
      console.log(`📍 Current URL after refresh: ${currentUrl}`);
      
      // Try to open create form
      const addButton = page.locator('button:has-text("Add New")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Create form opened successfully');
        
        // Close the form
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
    
    expect(isAuth).toBe(true);
  });
  
  test('Navigation and refresh cycle', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🧪 === Test 4: Navigation and Refresh Cycle ===');
    
    await loginAsAdmin(page);
    
    // Test navigation between different pages
    const pages = [
      { name: 'Admin Panel', url: `${BASE_URL}/admin` },
      { name: 'Home Page', url: `${BASE_URL}/` },
      { name: 'Admin Panel', url: `${BASE_URL}/admin` }
    ];
    
    for (let i = 0; i < pages.length; i++) {
      const pageInfo = pages[i];
      console.log(`\n📍 Navigating to ${pageInfo.name}...`);
      
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const isAuth = await checkAuthenticationState(page);
      console.log(`  Auth status on ${pageInfo.name}: ${isAuth ? 'MAINTAINED' : 'LOST'}`);
      
      // Refresh on each page
      console.log(`  🔄 Refreshing ${pageInfo.name}...`);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const isAuthAfterRefresh = await checkAuthenticationState(page);
      console.log(`  Auth status after refresh: ${isAuthAfterRefresh ? 'MAINTAINED' : 'LOST'}`);
      
      if (pageInfo.name === 'Admin Panel') {
        expect(isAuthAfterRefresh).toBe(true);
      }
    }
  });
  
  test('Token expiration simulation', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🧪 === Test 5: Token Expiration Simulation ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    console.log('🔑 Current tokens before manipulation:');
    await checkStoredTokens(page);
    
    // Simulate token expiration by clearing tokens
    console.log('🔄 Simulating token expiration by clearing localStorage...');
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
    
    await checkStoredTokens(page);
    
    // Refresh page to see how app handles missing tokens
    console.log('🔄 Refreshing page with missing tokens...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const isAuth = await checkAuthenticationState(page);
    console.log(`🔍 Authentication after token removal: ${isAuth ? 'MAINTAINED' : 'LOST'}`);
    
    const currentUrl = page.url();
    console.log(`📍 Final URL: ${currentUrl}`);
    
    // We expect to be redirected to login page
    expect(currentUrl).toContain('/login');
  });
  
}); 