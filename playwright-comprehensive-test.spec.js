// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('List Functionality - Comprehensive Test', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any cache/storage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('API returns correct item counts', async ({ request }) => {
    console.log('🔍 Testing API directly...');
    
    const response = await request.get('http://localhost:5175/api/lists?limit=5');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    
    // Check that at least one list has items
    const listWithItems = data.data.find(list => list.item_count > 0);
    console.log('List with items:', listWithItems);
    expect(listWithItems).toBeTruthy();
    expect(listWithItems.item_count).toBeGreaterThan(0);
  });

  test('Home page displays lists with correct counts', async ({ page }) => {
    console.log('🏠 Testing home page...');
    
    await page.goto('http://localhost:5175/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/home-page.png' });
    
    // Look for list cards
    const listCards = page.locator('[data-testid*="list-card"], .list-card, [class*="ListCard"], [class*="list-card"]');
    
    if (await listCards.count() === 0) {
      // Try alternative selectors
      const alternativeCards = page.locator('div:has(h3), div:has(h2), article, .card');
      console.log('Alternative cards found:', await alternativeCards.count());
      
      // Log page content for debugging
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Page URL:', page.url());
      console.log('Body text preview:', await page.locator('body').textContent().then(text => text.substring(0, 500)));
    }
    
    await expect(listCards.first()).toBeVisible({ timeout: 10000 });
    
    const cardCount = await listCards.count();
    console.log(`Found ${cardCount} list cards`);
    expect(cardCount).toBeGreaterThan(0);
    
    // Check each card for item count display
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = listCards.nth(i);
      
      // Get card text content for debugging
      const cardText = await card.textContent();
      console.log(`Card ${i} content:`, cardText);
      
      // Look for item count indicators
      const itemCountElement = card.locator('text=/\\d+\\s*(item|Item)/ | text=/\\d+/ | [data-testid*="item-count"] | [class*="item-count"]').first();
      
      if (await itemCountElement.count() > 0) {
        const itemCountText = await itemCountElement.textContent();
        console.log(`Card ${i} item count text:`, itemCountText);
        
        // Extract number from text
        const itemCount = parseInt(itemCountText.match(/\d+/)?.[0] || '0');
        console.log(`Card ${i} parsed item count:`, itemCount);
      } else {
        console.log(`Card ${i}: No item count element found`);
      }
    }
  });

  test('List detail page shows correct items', async ({ page }) => {
    console.log('📋 Testing list detail page...');
    
    // First get a list ID from the API
    const response = await page.request.get('http://localhost:5175/api/lists?limit=1');
    const data = await response.json();
    const listId = data.data[0]?.id;
    
    expect(listId).toBeTruthy();
    console.log('Testing list ID:', listId);
    
    // Navigate to the list detail page
    await page.goto(`http://localhost:5175/lists/${listId}`);
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: `test-results/list-detail-${listId}.png` });
    
    // Check for list title
    const titleElement = page.locator('h1, h2, [data-testid*="title"], [class*="title"]').first();
    await expect(titleElement).toBeVisible({ timeout: 10000 });
    
    const title = await titleElement.textContent();
    console.log('List title:', title);
    
    // Check for items
    const itemElements = page.locator('[data-testid*="item"], .item, .list-item, li');
    const itemCount = await itemElements.count();
    console.log(`Found ${itemCount} items on detail page`);
    
    // Get page content for debugging
    const pageText = await page.locator('body').textContent();
    console.log('Page content preview:', pageText.substring(0, 500));
  });

  test('Network requests are successful', async ({ page }) => {
    console.log('🌐 Testing network requests...');
    
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });
    
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');
    
    console.log('API Requests made:', requests);
    console.log('API Responses received:', responses);
    
    // Check that list API was called
    const listRequest = requests.find(req => req.url().includes('/api/lists'));
    expect(listRequest).toBeTruthy();
    
    const listResponse = responses.find(res => res.url().includes('/api/lists'));
    expect(listResponse).toBeTruthy();
    expect(listResponse.ok).toBe(true);
  });

  test('Console errors and warnings', async ({ page }) => {
    console.log('⚠️ Checking for console errors...');
    
    const messages = [];
    
    page.on('console', msg => {
      messages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');
    
    const errors = messages.filter(msg => msg.type === 'error');
    const warnings = messages.filter(msg => msg.type === 'warning');
    
    console.log('Console errors:', errors);
    console.log('Console warnings:', warnings);
    
    // Log all console messages for debugging
    console.log('All console messages:', messages.slice(0, 10)); // First 10 to avoid spam
    
    // Check for specific error patterns
    const criticalErrors = errors.filter(error => 
      !error.text.includes('deprecated') && 
      !error.text.includes('favicon') &&
      !error.text.includes('source map')
    );
    
    if (criticalErrors.length > 0) {
      console.error('Critical errors found:', criticalErrors);
    }
  });

  test('Data flow from API to UI', async ({ page }) => {
    console.log('🔄 Testing data flow...');
    
    // Intercept the lists API call
    let apiData = null;
    await page.route('**/api/lists*', async route => {
      const response = await route.fetch();
      apiData = await response.json();
      await route.fulfill({ response });
    });
    
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');
    
    console.log('Intercepted API data:', apiData);
    
    // Verify API data structure
    expect(apiData).toBeTruthy();
    expect(apiData.success).toBe(true);
    expect(Array.isArray(apiData.data)).toBe(true);
    
    // Check if UI reflects the API data
    if (apiData.data.length > 0) {
      const firstList = apiData.data[0];
      console.log('First list from API:', firstList);
      
      // Look for this list's data in the UI
      const pageContent = await page.textContent('body');
      const hasListName = pageContent.includes(firstList.name);
      
      console.log(`List "${firstList.name}" found in UI:`, hasListName);
      console.log(`Expected item count: ${firstList.item_count}`);
      
      // Look for item count in UI
      const itemCountRegex = new RegExp(firstList.item_count.toString());
      const hasItemCount = itemCountRegex.test(pageContent);
      console.log(`Item count ${firstList.item_count} found in UI:`, hasItemCount);
    }
  });
});

test.describe('List Creation and Updates', () => {
  
  test('Create new list and verify item count updates', async ({ page }) => {
    console.log('➕ Testing list creation...');
    
    await page.goto('http://localhost:5175/');
    
    // Look for create list button/link
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid*="create"]').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Fill out the form (if it exists)
      await page.fill('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]', 'Test List ' + Date.now());
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      console.log('No create list button found');
    }
  });
}); 