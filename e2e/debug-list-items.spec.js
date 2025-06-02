import { test, expect } from '@playwright/test';

test.describe('Debug List Items Issue', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to see what's happening
    await page.route('**/api/**', (route) => {
      console.log(`🌐 API Call: ${route.request().method()} ${route.request().url()}`);
      
      // Log request headers for auth debugging
      const headers = route.request().headers();
      if (headers.authorization) {
        console.log(`🔑 Auth header present: ${headers.authorization.substring(0, 20)}...`);
      } else {
        console.log(`❌ No auth header found`);
      }
      
      route.continue();
    });

    // Listen for response events to see API responses
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const url = response.url();
        console.log(`📥 API Response: ${status} ${url}`);
        
        // Log response body for list-related endpoints
        if (url.includes('/lists/') && (url.includes('/items') || url.match(/\/lists\/\d+$/))) {
          try {
            const body = await response.json();
            console.log(`📋 List API Response Body:`, JSON.stringify(body, null, 2));
          } catch (e) {
            console.log(`📋 Could not parse response body for ${url}`);
          }
        }
      }
    });

    // Listen for console logs from the browser
    page.on('console', (msg) => {
      if (msg.text().includes('[ListDetail]') || msg.text().includes('🔍') || msg.text().includes('🚨')) {
        console.log(`🖥️  Frontend Log: ${msg.text()}`);
      }
    });
  });

  test('should show list items after login and navigation', async ({ page }) => {
    console.log('🚀 Starting test: Debug List Items Issue');
    
    // Step 1: Go to the app
    await page.goto('http://localhost:5175'); // Use one of the available ports
    await page.waitForLoadState('networkidle');
    
    console.log('✅ App loaded');
    
    // Step 2: Login with admin credentials
    await page.click('text=Login');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'doof123');
    
    console.log('📝 Filled login form');
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('🔐 Login submitted, waiting for redirect');
    
    // Wait for successful login (should redirect or show dashboard)
    await page.waitForTimeout(2000);
    
    // Step 3: Navigate to Lists
    await page.click('text=Lists');
    await page.waitForLoadState('networkidle');
    
    console.log('📋 Navigated to Lists page');
    
    // Step 4: Look for our test list
    const testListSelector = 'text=Test QuickAdd List';
    
    try {
      await page.waitForSelector(testListSelector, { timeout: 10000 });
      console.log('✅ Found "Test QuickAdd List"');
      
      // Check if it shows the correct item count
      const listElement = await page.locator(testListSelector).locator('..').locator('..');
      const listText = await listElement.textContent();
      console.log('📄 List element text:', listText);
      
      // Click on the list to view details
      await page.click(testListSelector);
      await page.waitForLoadState('networkidle');
      
      console.log('🔍 Clicked on list, waiting for details to load');
      
      // Step 5: Check the list detail page
      await page.waitForSelector('h1', { timeout: 10000 });
      const pageTitle = await page.textContent('h1');
      console.log('📋 List detail page title:', pageTitle);
      
      // Wait a bit more for the API calls to complete
      await page.waitForTimeout(3000);
      
      // Check if items are displayed
      const itemsContainer = await page.locator('ul.space-y-2, .space-y-2');
      const itemCount = await itemsContainer.locator('li').count();
      console.log(`📊 Found ${itemCount} items in the list`);
      
      // Check for empty state message
      const emptyMessage = await page.locator('text=This list is empty');
      const hasEmptyMessage = await emptyMessage.count() > 0;
      console.log('🈳 Has empty message:', hasEmptyMessage);
      
      // Get all text content to see what's actually being rendered
      const bodyText = await page.textContent('body');
      console.log('🖼️  Page contains "dish 1":', bodyText.includes('dish 1'));
      console.log('🖼️  Page contains "restaurant 1":', bodyText.includes('restaurant 1'));
      
      // Check network tab to see if API calls are being made
      const itemsApiUrl = `http://localhost:5001/api/lists/59/items`;
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-list-items.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-list-items.png');
      
      // Final assertion
      if (itemCount === 0 && hasEmptyMessage) {
        console.log('❌ ISSUE CONFIRMED: List shows as empty but should have 2 items');
        console.log('🔍 This suggests a frontend data loading or caching issue');
        
        // Let's manually trigger a refetch by refreshing
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const afterRefreshCount = await page.locator('ul.space-y-2 li, .space-y-2 li').count();
        console.log(`🔄 After refresh: ${afterRefreshCount} items found`);
      } else {
        console.log(`✅ Items are showing correctly: ${itemCount} items`);
      }
      
    } catch (error) {
      console.log('❌ Could not find "Test QuickAdd List":', error.message);
      
      // List all available lists for debugging
      const allListTexts = await page.locator('a, button, div').allTextContents();
      const listsFound = allListTexts.filter(text => text.includes('List') || text.includes('list'));
      console.log('📋 All list-related text found:', listsFound);
      
      await page.screenshot({ path: 'debug-lists-page.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-lists-page.png');
    }
  });
}); 