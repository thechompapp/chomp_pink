import { test, expect } from '@playwright/test';

test('Debug filter clicking issues', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:5173');
  
  // Wait for the page to load and filters to appear
  await page.waitForSelector('[data-testid="filter-container"], .filter-container, .space-y-4', { timeout: 10000 });
  
  console.log('Page loaded, looking for filter elements...');
  
  // Take a screenshot to see current state
  await page.screenshot({ path: 'filters-initial.png', fullPage: true });
  
  // Look for filter items
  const filterItems = await page.locator('button, .filter-item, [role="button"]').all();
  console.log(`Found ${filterItems.length} potential filter elements`);
  
  // Log details about each filter element
  for (let i = 0; i < Math.min(filterItems.length, 10); i++) {
    const item = filterItems[i];
    const text = await item.textContent();
    const isVisible = await item.isVisible();
    const isDisabled = await item.isDisabled();
    const classes = await item.getAttribute('class');
    console.log(`Filter ${i}: "${text}" - visible: ${isVisible}, disabled: ${isDisabled}, classes: ${classes}`);
  }
  
  // Look specifically for city filter buttons
  const cityButtons = await page.locator('text=New York, text=Los Angeles, text=Chicago, text=Miami, text=San Francisco').all();
  console.log(`Found ${cityButtons.length} city buttons`);
  
  // Try to find any clickable elements in the filter area
  const clickableElements = await page.locator('button, [role="button"], [tabindex="0"]').all();
  console.log(`Found ${clickableElements.length} clickable elements`);
  
  // Take another screenshot after inspection
  await page.screenshot({ path: 'filters-inspected.png', fullPage: true });
  
  // Try clicking on the first few elements to see what happens
  for (let i = 0; i < Math.min(clickableElements.length, 5); i++) {
    const element = clickableElements[i];
    const text = await element.textContent();
    const isVisible = await element.isVisible();
    
    if (isVisible && text && text.trim().length > 0) {
      console.log(`Attempting to click: "${text}"`);
      try {
        // Add a small delay to observe the click
        await element.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot after click
        await page.screenshot({ path: `after-click-${i}.png`, fullPage: true });
        
        // Check if anything changed in the DOM
        const activeFilters = await page.locator('.active, .selected, [aria-pressed="true"]').count();
        console.log(`Active filters after click: ${activeFilters}`);
        
      } catch (error) {
        console.log(`Failed to click element: ${error.message}`);
      }
      
      // Small delay between clicks
      await page.waitForTimeout(500);
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'filters-final.png', fullPage: true });
}); 