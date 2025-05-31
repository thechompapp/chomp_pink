/**
 * Dishes Admin Panel Diagnosis Test
 * 
 * Specifically tests the authentication flow and dishes display in admin panel
 * to diagnose why restaurant names aren't showing instead of IDs
 */

import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers.js';

const CONFIG = {
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  }
};

test.describe('Dishes Admin Panel Diagnosis', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable detailed logging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`🔍 [${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/admin/dishes') || 
          request.url().includes('/api/auth/')) {
        console.log(`🌐 [REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/dishes') || 
          response.url().includes('/api/auth/')) {
        console.log(`🌐 [RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test Authentication Flow and Admin Panel Access
   */
  test('should authenticate and access dishes admin panel', async ({ page }) => {
    console.log('🧪 Testing authentication and dishes admin panel access');
    
    // Step 1: Login with admin credentials
    console.log('📝 Step 1: Logging in...');
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    
    // Verify authentication success
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Step 2: Navigate to admin panel
    console.log('📝 Step 2: Navigating to admin panel...');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Check if we're actually on the admin page
    const adminUrl = page.url();
    console.log(`Admin panel URL: ${adminUrl}`);
    expect(adminUrl).toContain('/admin');
    
    // Step 3: Look for dishes tab/section
    console.log('📝 Step 3: Looking for dishes tab...');
    
    // Wait for the admin panel to load completely
    await page.waitForTimeout(3000);
    
    // Look for dishes tab with multiple possible selectors
    const dishesTabSelectors = [
      'text=Dishes',
      'text=dishes', 
      '[data-testid="dishes-tab"]',
      'button:has-text("Dishes")',
      'a:has-text("Dishes")',
      '.tab:has-text("Dishes")'
    ];
    
    let dishesTab = null;
    for (const selector of dishesTabSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        dishesTab = element;
        console.log(`✓ Found dishes tab with selector: ${selector}`);
        break;
      }
    }
    
    if (!dishesTab) {
      // Screenshot for debugging
      await page.screenshot({ path: 'e2e-results/admin-panel-tabs.png' });
      console.log('📸 Screenshot saved: admin-panel-tabs.png');
      
      // List all visible text for debugging
      const allText = await page.locator('body').textContent();
      console.log('🔍 All visible text on admin panel:');
      console.log(allText.substring(0, 500) + '...');
      
      throw new Error('Dishes tab not found in admin panel');
    }
    
    // Step 4: Click on dishes tab
    console.log('📝 Step 4: Clicking dishes tab...');
    await dishesTab.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for dishes data to load
    await page.waitForTimeout(3000);
    
    console.log('✓ Authentication and admin panel access completed');
  });

  /**
   * Test Dishes Data Loading and Restaurant Name Display
   */
  test('should load dishes with restaurant names, not IDs', async ({ page }) => {
    console.log('🧪 Testing dishes data loading and restaurant name display');
    
    // Login and navigate to dishes admin
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dishes tab
    const dishesTab = page.locator('text=Dishes, text=dishes, [data-testid="dishes-tab"]').first();
    await dishesTab.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for API calls to complete
    console.log('📝 Waiting for dishes API call...');
    
    // Monitor the specific API call
    const dishesApiPromise = page.waitForResponse(
      response => response.url().includes('/api/admin/dishes'),
      { timeout: 10000 }
    );
    
    let dishesResponse;
    try {
      dishesResponse = await dishesApiPromise;
      console.log(`✓ Dishes API call completed: ${dishesResponse.status()}`);
      
      // Get the response data
      const responseData = await dishesResponse.json();
      console.log('🔍 Dishes API Response Data:');
      console.log(JSON.stringify(responseData, null, 2));
      
      // Check if restaurant_name field is present
      if (responseData.data && responseData.data.length > 0) {
        const firstDish = responseData.data[0];
        console.log('🔍 First dish data:');
        console.log(JSON.stringify(firstDish, null, 2));
        
        if (firstDish.restaurant_name) {
          console.log(`✓ Restaurant name found in API response: ${firstDish.restaurant_name}`);
        } else {
          console.log(`❌ Restaurant name NOT found, only restaurant_id: ${firstDish.restaurant_id}`);
        }
      }
    } catch (error) {
      console.log(`❌ Failed to get dishes API response: ${error.message}`);
    }
    
    // Step 5: Check the actual table display
    console.log('📝 Step 5: Checking table display...');
    
    // Wait for table to render
    await page.waitForTimeout(2000);
    
    // Look for table with dishes
    const tableSelectors = [
      'table',
      '.admin-table',
      '.data-table',
      '[data-testid="dishes-table"]'
    ];
    
    let table = null;
    for (const selector of tableSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        table = element;
        console.log(`✓ Found table with selector: ${selector}`);
        break;
      }
    }
    
    if (!table) {
      await page.screenshot({ path: 'e2e-results/no-dishes-table.png' });
      throw new Error('Dishes table not found');
    }
    
    // Check restaurant column
    console.log('📝 Step 6: Analyzing restaurant column...');
    
    // Look for restaurant column header
    const restaurantHeaders = await page.locator('th:has-text("Restaurant"), th:has-text("restaurant")').count();
    console.log(`Found ${restaurantHeaders} restaurant column headers`);
    
    // Get all table cells that might contain restaurant info
    const restaurantCells = page.locator('td').filter({
      hasText: /Restaurant ID|restaurant/i
    });
    
    const cellCount = await restaurantCells.count();
    console.log(`Found ${cellCount} cells with restaurant references`);
    
    if (cellCount > 0) {
      // Get text from first few cells
      for (let i = 0; i < Math.min(cellCount, 3); i++) {
        const cellText = await restaurantCells.nth(i).textContent();
        console.log(`Cell ${i + 1}: "${cellText}"`);
        
        // Check if it's showing restaurant name or just ID
        if (cellText.includes('Restaurant ID:')) {
          console.log(`❌ Cell ${i + 1} shows restaurant ID instead of name`);
        } else if (/^\d+$/.test(cellText.trim())) {
          console.log(`❌ Cell ${i + 1} shows only numeric ID: ${cellText}`);
        } else {
          console.log(`✓ Cell ${i + 1} appears to show restaurant name`);
        }
      }
    }
    
    // Take screenshot of the dishes table
    await page.screenshot({ path: 'e2e-results/dishes-table.png' });
    console.log('📸 Screenshot saved: dishes-table.png');
    
    console.log('✓ Dishes data loading test completed');
  });

  /**
   * Test Authentication Token Persistence
   */
  test('should maintain authentication during admin panel navigation', async ({ page }) => {
    console.log('🧪 Testing authentication token persistence');
    
    // Monitor auth-related requests
    const authRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/auth/')) {
        authRequests.push({
          method: request.method(),
          url: request.url(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Login
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    
    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Navigate between tabs multiple times
    const tabs = ['Restaurants', 'Dishes', 'Users'];
    
    for (const tabName of tabs) {
      console.log(`📝 Navigating to ${tabName} tab...`);
      
      const tab = page.locator(`text=${tabName}`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Check if we're still authenticated (not redirected to login)
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log(`❌ Redirected to login when accessing ${tabName} tab`);
        } else {
          console.log(`✓ Successfully accessed ${tabName} tab`);
        }
      }
    }
    
    // Report auth request patterns
    console.log(`🔍 Total auth requests during navigation: ${authRequests.length}`);
    authRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
    });
    
    if (authRequests.length > 10) {
      console.log('⚠️ Excessive auth requests detected - possible auth loop');
    }
    
    console.log('✓ Authentication persistence test completed');
  });

  /**
   * Test Direct API Access vs Frontend Display
   */
  test('should compare API data with frontend display', async ({ page }) => {
    console.log('🧪 Comparing API data with frontend display');
    
    // Login
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    
    // Intercept and capture the dishes API response
    let apiResponseData = null;
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/admin/dishes')) {
        try {
          apiResponseData = await response.json();
          console.log('🔍 Captured API response');
        } catch (error) {
          console.log('❌ Failed to parse API response');
        }
      }
    });
    
    // Navigate to dishes admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const dishesTab = page.locator('text=Dishes').first();
    await dishesTab.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for API response
    await page.waitForTimeout(3000);
    
    if (apiResponseData && apiResponseData.data) {
      console.log('📊 API Data Analysis:');
      const firstDish = apiResponseData.data[0];
      
      console.log(`  - Dish ID: ${firstDish.id}`);
      console.log(`  - Dish Name: ${firstDish.name}`);
      console.log(`  - Restaurant ID: ${firstDish.restaurant_id}`);
      console.log(`  - Restaurant Name: ${firstDish.restaurant_name || 'NOT PRESENT'}`);
      
      // Now check what's displayed in the frontend
      const tableRows = page.locator('tbody tr');
      const rowCount = await tableRows.count();
      
      if (rowCount > 0) {
        console.log('📊 Frontend Display Analysis:');
        const firstRow = tableRows.first();
        const cells = firstRow.locator('td');
        const cellCount = await cells.count();
        
        for (let i = 0; i < cellCount; i++) {
          const cellText = await cells.nth(i).textContent();
          console.log(`  - Column ${i + 1}: "${cellText.trim()}"`);
        }
        
        // Specific check for restaurant column
        const restaurantCell = firstRow.locator('td').filter({
          hasText: /restaurant/i
        }).or(firstRow.locator('td').nth(2)); // Assuming restaurant is 3rd column
        
        if (await restaurantCell.count() > 0) {
          const restaurantText = await restaurantCell.textContent();
          console.log(`🎯 Restaurant cell content: "${restaurantText.trim()}"`);
          
          if (firstDish.restaurant_name && restaurantText.includes(firstDish.restaurant_name)) {
            console.log('✅ Frontend correctly displays restaurant name from API');
          } else if (restaurantText.includes(`${firstDish.restaurant_id}`)) {
            console.log('❌ Frontend displays restaurant ID instead of name');
          } else {
            console.log('❓ Unclear what frontend is displaying');
          }
        }
      }
    } else {
      console.log('❌ No API data captured');
    }
    
    console.log('✓ API vs Frontend comparison completed');
  });

  // Cleanup
  test.afterEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
  });
}); 