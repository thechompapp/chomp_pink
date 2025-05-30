import { test, expect } from '@playwright/test';

const CONFIG = {
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  }
};

test.describe('Google Places Modal Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Set up intercept for console messages to capture debug info
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'info' || msg.type() === 'error') {
        console.log(`🔍 ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });
    
    // Go to home page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open Google Places modal when clicking the map pin button', async ({ page }) => {
    console.log('🧪 Testing Google Places modal functionality...');
    
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('🔒 Need to authenticate first');
      
      // Fill login form
      await page.fill('input[name="email"], input[type="email"]', CONFIG.ADMIN_USER.email);
      await page.fill('input[name="password"], input[type="password"]', CONFIG.ADMIN_USER.password);
      
      // Submit login form
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      await page.waitForLoadState('networkidle');
      
      // Navigate to admin panel after login
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Successfully logged in and navigated to admin panel');
    
    // Step 2: Navigate to restaurants tab
    console.log('🔄 Looking for restaurants tab...');
    const restaurantsTab = page.locator('button:has-text("Restaurants"), nav a:has-text("Restaurants")').first();
    await restaurantsTab.waitFor({ state: 'visible', timeout: 10000 });
    await restaurantsTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Successfully clicked restaurants tab');
    
    // Step 3: Wait for restaurant data to load
    console.log('🔄 Waiting for restaurant data to load...');
    await page.waitForSelector('table', { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Restaurant table loaded');
    
    // Step 4: Look for Google Places button (map pin icon) in actions column
    console.log('🔍 Looking for Google Places button (map pin icon)...');
    
    // First try to find the button by svg content or class
    let mapPinButton = page.locator('button svg').filter({ hasText: '' }).locator('..').first();
    
    if (!(await mapPinButton.isVisible())) {
      // Try finding by button containing MapPin icon class
      mapPinButton = page.locator('button:has(.lucide-map-pin)').first();
    }
    
    if (!(await mapPinButton.isVisible())) {
      // Try finding in action column buttons
      console.log('🔍 Map pin button not found by icon, looking for action buttons...');
      const actionButtons = page.locator('td button').last(); // Usually the last button in actions
      mapPinButton = actionButtons;
    }
    
    await mapPinButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Found Google Places button');
    
    // Step 5: Click the Google Places button
    console.log('🔄 Clicking Google Places button...');
    await mapPinButton.click();
    
    // Step 6: Wait for modal to appear
    console.log('🔄 Waiting for Google Places modal to appear...');
    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Google Places modal opened');
    
    // Step 7: Verify modal title
    const modalTitle = page.locator('[role="dialog"] h2').first();
    const titleText = await modalTitle.textContent();
    expect(titleText).toContain('Google Places');
    console.log(`✅ Modal title verified: "${titleText}"`);
    
    // Step 8: Verify modal contains search input
    const searchInput = page.locator('[role="dialog"] input[type="text"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Search input found in modal');
    
    // Step 9: Test search functionality
    console.log('🔄 Testing search functionality...');
    await searchInput.fill('Joe\'s Pizza New York');
    await page.waitForTimeout(2000); // Wait for autocomplete
    
    // Step 10: Look for autocomplete dropdown (optional)
    const dropdown = page.locator('[role="dialog"] [class*="dropdown"]').first();
    if (await dropdown.isVisible()) {
      console.log('✅ Autocomplete dropdown appeared');
    } else {
      console.log('ℹ️ Autocomplete dropdown not visible (may be normal)');
    }
    
    // Step 11: Verify modal can be closed
    console.log('🔄 Testing modal close functionality...');
    const closeButton = page.locator('[role="dialog"] button:has-text("Cancel")').first();
    await closeButton.click();
    
    // Wait for modal to disappear
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✅ Modal closed successfully');
    
    console.log('🎉 Google Places modal test completed successfully!');
  });

  test('should handle Google Places modal data extraction', async ({ page }) => {
    console.log('🧪 Testing Google Places modal data extraction...');
    
    // Navigate to admin panel  
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', CONFIG.ADMIN_USER.email);
      await page.fill('input[name="password"]', CONFIG.ADMIN_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
    }
    
    const restaurantsTab = page.locator('button:has-text("Restaurants")').first();
    await restaurantsTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Open modal - try to find Google Places button
    let mapPinButton = page.locator('button:has(.lucide-map-pin)').first();
    if (!(await mapPinButton.isVisible())) {
      mapPinButton = page.locator('td button').last(); 
    }
    await mapPinButton.click();
    
    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    
    // Test the search and data extraction
    const searchInput = page.locator('[role="dialog"] input[type="text"]').first();
    await searchInput.fill('Joe\'s Pizza Broadway New York');
    
    // Wait for API response and processing
    await page.waitForTimeout(3000);
    
    // Check if restaurant information is displayed
    const infoSection = page.locator('[role="dialog"] .bg-gray-50').first();
    if (await infoSection.isVisible()) {
      console.log('✅ Restaurant information section appeared');
      
      // Check specific data fields
      const nameField = page.locator('[role="dialog"]:has-text("Restaurant Name")');
      const addressField = page.locator('[role="dialog"]:has-text("Address")');
      const zipField = page.locator('[role="dialog"]:has-text("Zip Code")');
      
      if (await nameField.isVisible()) console.log('✅ Restaurant name field found');
      if (await addressField.isVisible()) console.log('✅ Address field found');  
      if (await zipField.isVisible()) console.log('✅ Zip code field found');
      
      // Test apply button
      const applyButton = page.locator('[role="dialog"] button:has-text("Apply")').first();
      if (await applyButton.isVisible()) {
        console.log('✅ Apply button is available');
        // Don't actually apply in test to avoid data changes
      }
    } else {
      console.log('ℹ️ Restaurant information section not found (may need actual Google Places API response)');
    }
    
    // Close modal
    const closeButton = page.locator('[role="dialog"] button:has-text("Cancel")').first();
    await closeButton.click();
    
    console.log('🎉 Google Places modal data extraction test completed!');
  });

}); 