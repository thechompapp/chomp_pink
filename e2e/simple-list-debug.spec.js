import { test, expect } from '@playwright/test';

test.describe('Simple List Debug', () => {
  test('should directly check list items for Test QuickAdd List', async ({ page }) => {
    console.log('🚀 Starting simple list debug test');
    
    // Intercept API calls to see what's happening
    await page.route('**/api/**', (route) => {
      console.log(`🌐 API Call: ${route.request().method()} ${route.request().url()}`);
      route.continue();
    });

    // Listen for response events
    page.on('response', async (response) => {
      if (response.url().includes('/api/lists/59')) {
        const status = response.status();
        const url = response.url();
        console.log(`📋 List 59 API Response: ${status} ${url}`);
        
        try {
          const body = await response.json();
          console.log(`📋 List 59 Response Body:`, JSON.stringify(body, null, 2));
        } catch (e) {
          console.log(`📋 Could not parse response body for ${url}`);
        }
      }
    });

    // Listen for frontend console logs
    page.on('console', (msg) => {
      if (msg.text().includes('[ListDetail]') || msg.text().includes('🔍')) {
        console.log(`🖥️  Frontend Log: ${msg.text()}`);
      }
    });
    
    // Step 1: Navigate directly to our test list
    console.log('📋 Navigating directly to list 59...');
    await page.goto('http://localhost:5175/lists/59');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot immediately
    await page.screenshot({ path: 'simple-list-debug-initial.png', fullPage: true });
    console.log('📸 Initial screenshot saved');
    
    // Wait for potential React loading
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check if we see any list content
    const bodyText = await page.textContent('body');
    console.log('🔍 Page contains "Test QuickAdd List":', bodyText.includes('Test QuickAdd List'));
    console.log('🔍 Page contains "dish":', bodyText.includes('dish'));
    console.log('🔍 Page contains "restaurant":', bodyText.includes('restaurant'));
    console.log('🔍 Page contains "empty":', bodyText.includes('empty'));
    
    // Check for various list-related elements
    const h1Elements = await page.locator('h1').allTextContents();
    console.log('📋 H1 elements:', h1Elements);
    
    const listItems = await page.locator('li').count();
    console.log(`📊 Total <li> elements found: ${listItems}`);
    
    // Check for specific UI elements
    const emptyMessage = await page.locator('text=This list is empty').count();
    console.log('🈳 "This list is empty" messages:', emptyMessage);
    
    // Check for loading spinners
    const loadingSpinners = await page.locator('[data-testid="loading"], .animate-spin, text=Loading').count();
    console.log('⏳ Loading indicators:', loadingSpinners);
    
    // Take a final screenshot
    await page.screenshot({ path: 'simple-list-debug-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    // Try to trigger API calls manually by refreshing
    console.log('🔄 Refreshing page to see if it triggers API calls...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const afterRefreshItems = await page.locator('li').count();
    console.log(`📊 After refresh: ${afterRefreshItems} <li> elements`);
    
    await page.screenshot({ path: 'simple-list-debug-after-refresh.png', fullPage: true });
    console.log('📸 After refresh screenshot saved');
    
    console.log('✅ Simple list debug test completed');
  });
}); 