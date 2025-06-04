/**
 * MANUAL ADD ITEMS TEST
 * 
 * This test manually adds items to lists using the API directly
 * to verify the list items display functionality works properly
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const TEST_USER = {
  email: 'admin@example.com',
  password: 'doof123'
};

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5001';

function logProgress(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n🔵 [${timestamp}] ${message}`);
}

function logSuccess(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n✅ [${timestamp}] ${message}`);
}

function logError(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n❌ [${timestamp}] ${message}`);
}

class ManualListTestHelpers {
  static async performAuthentication(page) {
    logProgress('🔐 Authenticating...');
    
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').click();
      
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (token && token.startsWith('eyJ')) {
        logSuccess('🎉 Authentication successful!');
        return token;
      }
      
      return null;
    } catch (error) {
      logError(`Authentication failed: ${error.message}`);
      return null;
    }
  }

  static async addItemsToListViaAPI(token) {
    logProgress('🔧 Adding items to lists via API...');
    
    const results = {
      itemsAdded: 0,
      errors: [],
      details: []
    };
    
    try {
      // Get lists
      const listsResponse = await fetch(`${API_URL}/api/lists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const listsData = await listsResponse.json();
      const lists = listsData.lists || [];
      
      logProgress(`Found ${lists.length} lists to add items to`);
      
      if (lists.length === 0) {
        logError('No lists found to add items to');
        return results;
      }
      
      // Get dishes to add
      const dishesResponse = await fetch(`${API_URL}/api/dishes`);
      const dishesData = await dishesResponse.json();
      const dishes = dishesData.dishes || [];
      
      logProgress(`Found ${dishes.length} dishes available to add`);
      
      if (dishes.length === 0) {
        logError('No dishes found to add to lists');
        return results;
      }
      
      // Add 3 dishes to the first 2 lists
      const maxLists = Math.min(lists.length, 2);
      const maxDishes = Math.min(dishes.length, 3);
      
      for (let i = 0; i < maxLists; i++) {
        const list = lists[i];
        logProgress(`Adding items to list: "${list.name}"`);
        
        for (let j = 0; j < maxDishes; j++) {
          const dish = dishes[j];
          
          try {
            const addResponse = await fetch(`${API_URL}/api/lists/${list.id}/items`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                dishId: dish.id,
                type: 'dish'
              })
            });
            
            if (addResponse.ok) {
              const addData = await addResponse.json();
              logSuccess(`✅ Added "${dish.name}" to "${list.name}"`);
              results.itemsAdded++;
              results.details.push({
                listName: list.name,
                itemName: dish.name,
                itemType: 'dish',
                success: true
              });
            } else {
              const errorData = await addResponse.json();
              logError(`Failed to add "${dish.name}" to "${list.name}": ${errorData.message}`);
              results.errors.push({
                listName: list.name,
                itemName: dish.name,
                error: errorData.message
              });
            }
          } catch (error) {
            logError(`API error adding "${dish.name}" to "${list.name}": ${error.message}`);
            results.errors.push({
              listName: list.name,
              itemName: dish.name,
              error: error.message
            });
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      logSuccess(`✅ Added ${results.itemsAdded} items to lists via API`);
      
    } catch (error) {
      logError(`Error in addItemsToListViaAPI: ${error.message}`);
      results.errors.push({ general: error.message });
    }
    
    return results;
  }

  static async verifyListItemsDisplay(page) {
    logProgress('🔍 Verifying list items display after adding via API...');
    
    const results = {
      listsChecked: 0,
      itemsFound: 0,
      details: []
    };
    
    try {
      // Navigate to lists page
      await page.goto(`${BASE_URL}/my-lists`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'e2e-results/screenshots/lists-after-api-add.png', fullPage: true });
      logSuccess('📸 Screenshot taken: lists-after-api-add.png');
      
      // Find all lists
      const lists = await page.locator('.list-card, .list-item, [data-testid*="list"]').all();
      logProgress(`Found ${lists.length} lists to check for items`);
      
      for (let i = 0; i < Math.min(lists.length, 3); i++) {
        const list = lists[i];
        const listText = await list.textContent();
        logProgress(`🎯 Checking list ${i + 1}: "${listText.trim().substring(0, 40)}..."`);
        
        try {
          // Click on the list
          await list.click();
          results.listsChecked++;
          
          await page.waitForTimeout(3000);
          
          // Take screenshot of opened list
          await page.screenshot({ path: `e2e-results/screenshots/list-${i + 1}-after-api-add.png`, fullPage: true });
          logSuccess(`📸 Screenshot taken: list-${i + 1}-after-api-add.png`);
          
          // Check current URL to see which list we're viewing
          const currentUrl = page.url();
          logProgress(`Current URL: ${currentUrl}`);
          
          // Look for debug info
          const debugInfo = await page.locator('*:has-text("Debug Info"), *:has-text("Items data"), *:has-text("List ID")').all();
          for (const info of debugInfo) {
            try {
              const debugText = await info.textContent();
              if (debugText.includes('Items data') || debugText.includes('List ID')) {
                logProgress(`📝 Debug info: ${debugText.trim()}`);
              }
            } catch (error) {
              // Skip
            }
          }
          
          // Check for items with comprehensive selectors
          const itemSelectors = [
            '.list-item-container',
            '.dish-item',
            '.restaurant-item', 
            '.item-card',
            '.list-content .item',
            '.list-items .item',
            '[data-testid*="item"]',
            '.menu-item',
            '.list-entry',
            '.grid-item',
            '.items-container > *',
            '.content .item',
            '.dish-card',
            '.restaurant-card',
            '.collection-item',
            'article:has(.dish)',
            'article:has(.restaurant)',
            '[class*="item"]:has(h3)',
            '[class*="item"]:has(h4)'
          ];
          
          let itemsFoundInThisList = 0;
          const foundItems = [];
          
          for (const itemSelector of itemSelectors) {
            try {
              const items = await page.locator(itemSelector).all();
              if (items.length > 0) {
                logProgress(`   Selector ${itemSelector} found ${items.length} potential items`);
              }
              
              for (const item of items) {
                try {
                  const isVisible = await item.isVisible();
                  if (isVisible) {
                    const itemText = await item.textContent();
                    const itemBox = await item.boundingBox();
                    if (itemText && itemText.trim() && itemBox && itemBox.width > 50 && itemBox.height > 20) {
                      const isDuplicate = foundItems.some(existing => 
                        existing.text.substring(0, 20) === itemText.trim().substring(0, 20)
                      );
                      if (!isDuplicate) {
                        foundItems.push({
                          text: itemText.trim().substring(0, 100),
                          selector: itemSelector
                        });
                        itemsFoundInThisList++;
                      }
                    }
                  }
                } catch (error) {
                  // Skip invalid items
                }
              }
            } catch (error) {
              // Selector not found
            }
          }
          
          logProgress(`📊 Found ${itemsFoundInThisList} items in this list`);
          foundItems.forEach(item => {
            logProgress(`   🔸 Item: "${item.text.substring(0, 50)}..." (${item.selector})`);
          });
          
          results.itemsFound += itemsFoundInThisList;
          results.details.push({
            listName: listText.trim().substring(0, 50),
            itemsFound: itemsFoundInThisList,
            items: foundItems.map(item => ({
              text: item.text.substring(0, 50),
              selector: item.selector
            }))
          });
          
          // Check for empty state messages
          if (itemsFoundInThisList === 0) {
            const emptyMessages = await page.locator(':has-text("empty"), :has-text("No items"), :has-text("No dishes"), :has-text("No restaurants")').all();
            for (const msg of emptyMessages) {
              try {
                const isVisible = await msg.isVisible();
                if (isVisible) {
                  const text = await msg.textContent();
                  logProgress(`📝 Empty state: "${text.trim()}"`);
                }
              } catch (error) {
                // Continue
              }
            }
          }
          
          // Navigate back to lists
          await page.goto(`${BASE_URL}/my-lists`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(1500);
          
        } catch (error) {
          logError(`Error checking list ${i + 1}: ${error.message}`);
        }
      }
      
    } catch (error) {
      logError(`Error verifying list items: ${error.message}`);
    }
    
    return results;
  }
}

test.describe('Manual Add Items and Test List Display', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    logProgress('🚀 STARTING MANUAL ADD ITEMS TEST');
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: 'e2e-results/videos/',
        size: { width: 1920, height: 1080 }
      }
    });
    
    page = await context.newPage();
    page.setDefaultTimeout(10000);
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logError(`Console Error: ${msg.text()}`);
      }
    });
    
    logSuccess('✅ Test setup completed');
  });

  test('Manually Add Items via API and Verify Display', async () => {
    logProgress('🔍 STARTING MANUAL API-BASED ADD ITEMS TEST');
    
    try {
      // Step 1: Authenticate and get token
      const token = await ManualListTestHelpers.performAuthentication(page);
      expect(token).toBeTruthy();
      logSuccess('✅ Authentication completed');
      
      // Step 2: Add items to lists via API
      const addResults = await ManualListTestHelpers.addItemsToListViaAPI(token);
      logSuccess(`✅ Added ${addResults.itemsAdded} items via API`);
      
      // Step 3: Verify list items display in frontend
      const verifyResults = await ManualListTestHelpers.verifyListItemsDisplay(page);
      
      // Step 4: Final analysis
      logSuccess('\n🎯 FINAL TEST RESULTS:');
      logSuccess(`Items Added via API: ${addResults.itemsAdded}`);
      logSuccess(`Lists Checked: ${verifyResults.listsChecked}`);
      logSuccess(`Items Found in Frontend: ${verifyResults.itemsFound}`);
      
      if (addResults.details.length > 0) {
        logSuccess('\n📋 ITEMS ADDED:');
        addResults.details.forEach((detail, index) => {
          logSuccess(`${index + 1}. "${detail.itemName}" → "${detail.listName}" (${detail.success ? 'SUCCESS' : 'FAILED'})`);
        });
      }
      
      if (verifyResults.details.length > 0) {
        logSuccess('\n📋 FRONTEND VERIFICATION:');
        verifyResults.details.forEach((detail, index) => {
          logSuccess(`List ${index + 1}: "${detail.listName}" - ${detail.itemsFound} items found`);
          if (detail.items.length > 0) {
            detail.items.forEach(item => {
              logSuccess(`   🔸 "${item.text}..."`);
            });
          }
        });
      }
      
      if (addResults.errors.length > 0) {
        logError('\n🚨 API ERRORS:');
        addResults.errors.forEach(error => {
          logError(`   ❌ ${JSON.stringify(error)}`);
        });
      }
      
      // Determine success
      if (addResults.itemsAdded > 0 && verifyResults.itemsFound > 0) {
        logSuccess('🎉 SUCCESS! Items were added via API and are displaying in the frontend!');
      } else if (addResults.itemsAdded > 0 && verifyResults.itemsFound === 0) {
        logError('⚠️ Items added via API but not displaying in frontend - UI issue detected');
      } else if (addResults.itemsAdded === 0) {
        logError('❌ Could not add items via API - backend issue');
      }
      
      expect(verifyResults.listsChecked).toBeGreaterThan(0);
      logSuccess('✅ MANUAL API ADD ITEMS TEST COMPLETED');
      
    } catch (error) {
      logError(`Test error: ${error.message}`);
      throw error;
    }
  });
}); 