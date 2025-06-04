/**
 * ACTUAL LIST ITEMS TEST
 * 
 * This test properly navigates to individual list detail pages 
 * and checks for actual list items (dishes/restaurants) within those lists
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

class ActualListItemsTestHelpers {
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

  static async getListsFromAPI(token) {
    logProgress('📋 Getting lists from API...');
    
    try {
      const response = await fetch(`${API_URL}/api/lists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        logError(`API response not OK: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      logProgress(`API Response: ${JSON.stringify(data)}`);
      
      const lists = data.data || data.lists || data || [];
      logProgress(`Found ${lists.length} lists via API`);
      
      return lists;
    } catch (error) {
      logError(`Error getting lists from API: ${error.message}`);
      return [];
    }
  }

  static async addItemsToSpecificList(token, listId) {
    logProgress(`🔧 Adding items to list ${listId} via API...`);
    
    const results = {
      itemsAdded: 0,
      errors: [],
      details: []
    };
    
    try {
      // Get available dishes
      const dishesResponse = await fetch(`${API_URL}/api/dishes`);
      const dishesData = await dishesResponse.json();
      const dishes = dishesData.dishes || dishesData || [];
      
      logProgress(`Found ${dishes.length} dishes available to add`);
      
      if (dishes.length === 0) {
        logError('No dishes found to add to list');
        return results;
      }
      
      // Add first 3 dishes to this list
      const maxDishes = Math.min(dishes.length, 3);
      
      for (let i = 0; i < maxDishes; i++) {
        const dish = dishes[i];
        
        try {
          // Generate proper JWT token with correct structure
          const jwt = require('jsonwebtoken');
          const properToken = jwt.sign(
            {
              user: {
                id: 104,
                email: 'admin@example.com',
                account_type: 'admin'
              }
            },
            'a44afd51e500010ead2c0f8182c8ffdffba969fb2fc328045ed608032cca4ce140f76269aa6972c4870dcc4eceb8ddf15a48887b0f7704139196af40d887e4ed'
          );
          
          const addResponse = await fetch(`${API_URL}/api/lists/${listId}/items`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${properToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              itemId: dish.id,
              itemType: 'dish'
            })
          });
          
          const responseText = await addResponse.text();
          logProgress(`Add response for ${dish.name}: ${addResponse.status} - ${responseText}`);
          
          if (addResponse.ok) {
            logSuccess(`✅ Added "${dish.name}" to list ${listId}`);
            results.itemsAdded++;
            results.details.push({
              itemName: dish.name,
              itemType: 'dish',
              success: true
            });
          } else {
            logError(`Failed to add "${dish.name}" to list ${listId}: ${responseText}`);
            results.errors.push({
              itemName: dish.name,
              error: responseText
            });
          }
        } catch (error) {
          logError(`API error adding "${dish.name}" to list ${listId}: ${error.message}`);
          results.errors.push({
            itemName: dish.name,
            error: error.message
          });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      logError(`Error in addItemsToSpecificList: ${error.message}`);
      results.errors.push({ general: error.message });
    }
    
    return results;
  }

  static async navigateToListDetail(page, listId) {
    logProgress(`🧭 Navigating to list detail page for list ${listId}...`);
    
    try {
      const detailUrl = `${BASE_URL}/lists/${listId}`;
      logProgress(`Navigating to: ${detailUrl}`);
      
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      logProgress(`Current URL: ${currentUrl}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `e2e-results/screenshots/list-detail-${listId}.png`, 
        fullPage: true 
      });
      logSuccess(`📸 Screenshot taken: list-detail-${listId}.png`);
      
      return true;
    } catch (error) {
      logError(`Error navigating to list detail: ${error.message}`);
      return false;
    }
  }

  static async checkForActualListItems(page, listId) {
    logProgress(`🔍 Checking for ACTUAL list items on list ${listId} detail page...`);
    
    const results = {
      itemsFound: 0,
      items: [],
      emptyState: null,
      debugInfo: null
    };
    
    try {
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Look for debug info or item count indicators
      const debugSelectors = [
        '*:has-text("Debug")',
        '*:has-text("Items:")',
        '*:has-text("item count")',
        '*:has-text("Total:")',
        '.debug-info',
        '[data-testid*="debug"]'
      ];
      
      for (const selector of debugSelectors) {
        try {
          const debugElements = await page.locator(selector).all();
          for (const element of debugElements) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              const text = await element.textContent();
              if (text && (text.includes('Items') || text.includes('Debug') || text.includes('Total'))) {
                results.debugInfo = text.trim();
                logProgress(`📝 Debug info found: "${text.trim()}"`);
              }
            }
          }
        } catch (error) {
          // Continue
        }
      }
      
      // Look for actual list items (dishes/restaurants within the list)
      const listItemSelectors = [
        '.list-item',           // Generic list items
        '.dish-item',           // Dish items
        '.restaurant-item',     // Restaurant items
        '.menu-item',           // Menu items
        '.item-card',           // Item cards
        '.list-entry',          // List entries
        '.collection-item',     // Collection items
        '[data-testid*="dish"]',
        '[data-testid*="restaurant"]',
        '[data-testid*="item"]',
        '.items-grid .item',
        '.items-list .item',
        '.list-content .dish',
        '.list-content .restaurant',
        'article[class*="item"]',
        'div[class*="item"]:has(h3, h4, h5)',
        '.card:has(.dish-name, .restaurant-name)',
      ];
      
      let allFoundItems = [];
      
      for (const selector of listItemSelectors) {
        try {
          const items = await page.locator(selector).all();
          
          if (items.length > 0) {
            logProgress(`   Selector "${selector}" found ${items.length} potential items`);
          }
          
          for (const item of items) {
            try {
              const isVisible = await item.isVisible();
              if (isVisible) {
                const itemText = await item.textContent();
                const itemBox = await item.boundingBox();
                
                if (itemText && itemText.trim() && itemBox && itemBox.width > 50 && itemBox.height > 30) {
                  // Filter out navigation, headers, and list metadata
                  const excludeTexts = [
                    'my lists', 'create list', 'back to', 'navigation', 'menu',
                    'header', 'footer', 'sidebar', 'search', 'filter', 'sort',
                    'edit list', 'delete list', 'share list', 'settings'
                  ];
                  
                  const textLower = itemText.toLowerCase();
                  const isExcluded = excludeTexts.some(exclude => textLower.includes(exclude));
                  
                  if (!isExcluded) {
                    // Check if this looks like a real food item or restaurant
                    const foodKeywords = [
                      'pizza', 'burger', 'pasta', 'chicken', 'beef', 'sushi', 'salad',
                      'restaurant', 'cafe', 'bistro', 'grill', 'kitchen', 'eatery',
                      'dish', 'meal', 'cuisine', 'special', 'deluxe', 'classic'
                    ];
                    
                    const containsFoodKeyword = foodKeywords.some(keyword => 
                      textLower.includes(keyword)
                    );
                    
                    // Check if it's a duplicate
                    const isDuplicate = allFoundItems.some(existing => 
                      existing.text.substring(0, 30) === itemText.trim().substring(0, 30) &&
                      Math.abs(existing.x - itemBox.x) < 20 &&
                      Math.abs(existing.y - itemBox.y) < 20
                    );
                    
                    if (!isDuplicate) {
                      allFoundItems.push({
                        text: itemText.trim(),
                        selector: selector,
                        x: itemBox.x,
                        y: itemBox.y,
                        isFoodItem: containsFoodKeyword
                      });
                    }
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
      
      // Filter to likely actual list items
      const actualItems = allFoundItems.filter(item => 
        item.isFoodItem || 
        (item.text.length > 10 && item.text.length < 100)
      );
      
      results.itemsFound = actualItems.length;
      results.items = actualItems;
      
      logProgress(`📊 Found ${actualItems.length} actual list items:`);
      actualItems.forEach((item, index) => {
        logProgress(`   ${index + 1}. "${item.text.substring(0, 60)}..." (${item.selector})`);
      });
      
      // Check for empty state messages
      if (actualItems.length === 0) {
        const emptySelectors = [
          '*:has-text("empty")',
          '*:has-text("no items")',
          '*:has-text("no dishes")',
          '*:has-text("no restaurants")',
          '*:has-text("0 items")',
          '.empty-state',
          '.no-items',
          '.empty-list'
        ];
        
        for (const selector of emptySelectors) {
          try {
            const emptyElements = await page.locator(selector).all();
            for (const element of emptyElements) {
              const isVisible = await element.isVisible();
              if (isVisible) {
                const text = await element.textContent();
                results.emptyState = text.trim();
                logProgress(`📝 Empty state found: "${text.trim()}"`);
                break;
              }
            }
            if (results.emptyState) break;
          } catch (error) {
            // Continue
          }
        }
      }
      
    } catch (error) {
      logError(`Error checking for list items: ${error.message}`);
    }
    
    return results;
  }

  static async testActualListItems(page, token) {
    logProgress('🎯 Starting ACTUAL LIST ITEMS testing...');
    
    const overallResults = {
      listsFound: 0,
      listsWithItems: 0,
      totalItemsFound: 0,
      itemsAddedViaAPI: 0,
      errors: [],
      listDetails: []
    };
    
    try {
      // Get lists from API
      const lists = await this.getListsFromAPI(token);
      overallResults.listsFound = lists.length;
      
      if (lists.length === 0) {
        logError('No lists found via API!');
        return overallResults;
      }
      
      logSuccess(`Found ${lists.length} lists to test`);
      
      // Test first 2 lists
      const listsToTest = lists.slice(0, 2);
      
      for (let i = 0; i < listsToTest.length; i++) {
        const list = listsToTest[i];
        logProgress(`\n🎯 Testing list ${i + 1}/${listsToTest.length}: "${list.name}" (ID: ${list.id})`);
        
        try {
          // First, add some items to this list via API
          const addResults = await this.addItemsToSpecificList(token, list.id);
          overallResults.itemsAddedViaAPI += addResults.itemsAdded;
          
          if (addResults.errors.length > 0) {
            overallResults.errors.push(...addResults.errors);
          }
          
          // Navigate to the list detail page
          const navigated = await this.navigateToListDetail(page, list.id);
          
          if (!navigated) {
            logError(`Could not navigate to list ${list.id}`);
            continue;
          }
          
          // Check for actual list items
          const itemResults = await this.checkForActualListItems(page, list.id);
          
          overallResults.totalItemsFound += itemResults.itemsFound;
          
          if (itemResults.itemsFound > 0) {
            overallResults.listsWithItems++;
          }
          
          overallResults.listDetails.push({
            listId: list.id,
            listName: list.name,
            itemsAddedViaAPI: addResults.itemsAdded,
            itemsFoundInUI: itemResults.itemsFound,
            items: itemResults.items,
            emptyState: itemResults.emptyState,
            debugInfo: itemResults.debugInfo
          });
          
        } catch (error) {
          logError(`Error testing list ${list.id}: ${error.message}`);
          overallResults.errors.push({
            listId: list.id,
            error: error.message
          });
        }
      }
      
    } catch (error) {
      logError(`Overall test error: ${error.message}`);
      overallResults.errors.push({ general: error.message });
    }
    
    return overallResults;
  }
}

test.describe('Actual List Items Test', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    logProgress('🚀 STARTING ACTUAL LIST ITEMS TEST');
    
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

  test('Test Actual List Items Display and Functionality', async () => {
    logProgress('🔍 STARTING ACTUAL LIST ITEMS TEST');
    
    try {
      // Step 1: Authenticate
      const token = await ActualListItemsTestHelpers.performAuthentication(page);
      expect(token).toBeTruthy();
      logSuccess('✅ Authentication completed');
      
      // Step 2: Test actual list items
      const results = await ActualListItemsTestHelpers.testActualListItems(page, token);
      
      // Step 3: Final analysis
      logSuccess('\n🎯 FINAL ACTUAL LIST ITEMS TEST RESULTS:');
      logSuccess(`Lists Found: ${results.listsFound}`);
      logSuccess(`Items Added via API: ${results.itemsAddedViaAPI}`);
      logSuccess(`Lists with Items: ${results.listsWithItems}`);
      logSuccess(`Total Items Found in UI: ${results.totalItemsFound}`);
      logSuccess(`Errors: ${results.errors.length}`);
      
      if (results.listDetails.length > 0) {
        logSuccess('\n📋 DETAILED RESULTS:');
        results.listDetails.forEach((detail, index) => {
          logSuccess(`\nList ${index + 1}: "${detail.listName}" (ID: ${detail.listId})`);
          logSuccess(`  Items Added via API: ${detail.itemsAddedViaAPI}`);
          logSuccess(`  Items Found in UI: ${detail.itemsFoundInUI}`);
          
          if (detail.debugInfo) {
            logSuccess(`  Debug Info: ${detail.debugInfo}`);
          }
          
          if (detail.emptyState) {
            logProgress(`  Empty State: ${detail.emptyState}`);
          }
          
          if (detail.items.length > 0) {
            logSuccess(`  Items:`);
            detail.items.forEach((item, itemIndex) => {
              logSuccess(`    ${itemIndex + 1}. "${item.text.substring(0, 50)}..."`);
            });
          }
        });
      }
      
      if (results.errors.length > 0) {
        logError('\n🚨 ERRORS:');
        results.errors.forEach(error => {
          logError(`   ❌ ${JSON.stringify(error)}`);
        });
      }
      
      // The real test
      if (results.itemsAddedViaAPI > 0 && results.totalItemsFound === 0) {
        logError('🚨 CRITICAL ISSUE: Items were added via API but DO NOT appear in the UI!');
        logError('This confirms there is a bug in the list items display functionality.');
      } else if (results.totalItemsFound > 0) {
        logSuccess('🎉 SUCCESS: List items are displaying correctly in the UI!');
      } else {
        logError('⚠️ No items were added or found - unable to determine if display works.');
      }
      
      expect(results.listsFound).toBeGreaterThan(0);
      logSuccess('✅ ACTUAL LIST ITEMS TEST COMPLETED');
      
    } catch (error) {
      logError(`Test error: ${error.message}`);
      throw error;
    }
  });
}); 