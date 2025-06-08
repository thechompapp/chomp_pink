const { chromium } = require('@playwright/test');

/**
 * Filter System E2E Test with Playwright
 * Run with: node filter-system.playwright.js
 */
(async () => {
  // Launch the browser in headed mode
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting Filter System Test with Playwright...');
  
  try {
    // Navigate directly to a page that has the filter component
    console.log('Navigating to search page with filters...');
    await page.goto('http://localhost:5176/search', { timeout: 10000 });
    console.log('Page loaded');
    
    // Log console messages for debugging
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'filter-system-test.png' });
    console.log('Screenshot taken: filter-system-test.png');
    
    // Wait for application to stabilize (shorter timeout)
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    console.log('DOM content loaded');
    
    // Wait a bit more for data to load
    await page.waitForTimeout(2000);
    console.log('Waited additional time for data loading');
    
    // Debug: List all text content on the page
    const textContent = await page.evaluate(() => document.body.textContent);
    console.log('Text content on page (excerpt):', textContent.substring(0, 200) + '...');
    
    // Check if filter container exists with a more reliable selector
    const filterContainer = await page.locator('div.rounded-lg');
    console.log('Looking for filter container...');
    
    // Log the page HTML for debugging
    const html = await page.content();
    console.log('Page HTML (first 500 chars):');
    console.log(html.substring(0, 500) + '...');
    
    if (await filterContainer.count() > 0) {
      console.log('✓ Filter container found');
      
      // Debug: List all div elements in the filter container
      const divs = await filterContainer.locator('div').count();
      console.log(`Filter container has ${divs} div elements`);
    } else {
      console.error('✗ Filter container not found');
    }
    
    // Check for initial loading state
    const initialLoading = await page.locator('text=Loading...');
    if (await initialLoading.count() > 0) {
      console.log('✓ Loading state visible initially');
      
      // Wait for loading to finish (max 5 seconds)
      try {
        await page.waitForFunction(() => !document.body.textContent.includes('Loading...'), { timeout: 5000 });
        console.log('✓ Loading state disappeared after data loaded');
      } catch (e) {
        console.error('✗ Loading state did not disappear - possible issue with data fetching');
      }
    } else {
      console.log('i Loading state not visible (might have loaded quickly)');
    }
    
    // Try different methods to locate city elements
    try {
      // Very broad approach to find elements that might be cities
      const cityElements = await page.evaluate(() => {
        // Look for elements that might contain city names
        const possibleElements = [
          ...document.querySelectorAll('[type="city"]'),
          ...document.querySelectorAll('button:not([disabled])'),
          ...document.querySelectorAll('div.rounded'),
          ...document.querySelectorAll('div.p-2')
        ];
        
        // Filter elements that likely contain city names
        const cityTextRegex = /(New York|Chicago|Los Angeles|Miami|Seattle|San Francisco)/i;
        const cityElements = possibleElements.filter(el => 
          cityTextRegex.test(el.textContent) || 
          el.getAttribute('aria-label')?.includes('city')
        );
        
        return cityElements.length;
      });
      
      console.log(`Found ${cityElements} potential city elements`);
      
      if (cityElements > 0) {
        console.log('✓ Cities detected in the DOM');
        
        // Try clicking a city
        try {
          await page.click('text="New York"', { timeout: 1000 });
          console.log('Clicked on "New York"');
        } catch (e) {
          try {
            await page.click('text="Chicago"', { timeout: 1000 });
            console.log('Clicked on "Chicago"');
          } catch (e2) {
            console.log('Could not click on specific city');
          }
        }
      } else {
        console.error('✗ No city elements detected - data loading issue');
      }
    } catch (e) {
      console.error('✗ Error detecting cities:', e.message);
    }
    
    // Check for cuisines with a similar approach
    try {
      const cuisineElements = await page.evaluate(() => {
        // Look for elements that might contain cuisine names
        const possibleElements = [
          ...document.querySelectorAll('[type="cuisine"]'),
          ...document.querySelectorAll('button:not([disabled])'),
          ...document.querySelectorAll('div.rounded'),
          ...document.querySelectorAll('div.p-2')
        ];
        
        // Filter elements that likely contain cuisine names
        const cuisineTextRegex = /(pizza|italian|mexican|chinese|japanese|thai|burger)/i;
        const cuisineElements = possibleElements.filter(el => 
          cuisineTextRegex.test(el.textContent) || 
          el.getAttribute('aria-label')?.includes('cuisine')
        );
        
        return cuisineElements.length;
      });
      
      console.log(`Found ${cuisineElements} potential cuisine elements`);
      
      if (cuisineElements > 0) {
        console.log('✓ Cuisines detected in the DOM');
      } else {
        console.error('✗ No cuisine elements detected - data loading issue');
      }
    } catch (e) {
      console.error('✗ Error detecting cuisines:', e.message);
    }
    
    console.log('Test completed');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Take a final screenshot
    try {
      await page.screenshot({ path: 'filter-system-final.png' });
      console.log('Final screenshot taken: filter-system-final.png');
    } catch (e) {
      console.error('Failed to take final screenshot:', e.message);
    }
    
    // Automatically close the browser after 5 seconds
    console.log('Browser will close automatically in 5 seconds...');
    console.log('Press Ctrl+C to close immediately');
    
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed');
    }, 5000);
  }
})(); 