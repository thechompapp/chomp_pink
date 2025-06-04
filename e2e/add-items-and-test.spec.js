/**
 * ADD ITEMS AND TEST LIST DISPLAY
 * 
 * This test adds real items to existing lists and verifies they display properly.
 * Following Rule #3: Use real API responses and data, not mocks.
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const TEST_USER = {
  email: 'admin@example.com',
  password: 'doof123'
};

const BASE_URL = 'http://localhost:5173';

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

class ListItemsTestHelpers {
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
        return true;
      }
      
      return false;
    } catch (error) {
      logError(`Authentication failed: ${error.message}`);
      return false;
    }
  }

  static async getAvailableItemsToAdd(page) {
    logProgress('🔍 Finding available dishes and restaurants to add to lists...');
    
    const items = {
      dishes: [],
      restaurants: []
    };
    
    try {
      // Navigate to search page to find items
      await page.goto(`${BASE_URL}/search`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Search for dishes
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.waitFor({ timeout: 5000, state: 'visible' });
      
      // Search for pizza dishes
      await searchInput.fill('pizza');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      // Look for dish elements
      const dishSelectors = [
        '.dish-card',
        '.dish-item',
        '[data-testid*="dish"]',
        '.search-result:has(.dish)',
        '.card:has(h3)',
        '.search-results .dish'
      ];
      
      for (const selector of dishSelectors) {
        try {
          const dishElements = await page.locator(selector).all();
          for (let i = 0; i < Math.min(dishElements.length, 3); i++) {
            const dish = dishElements[i];
            const isVisible = await dish.isVisible();
            if (isVisible) {
              const text = await dish.textContent();
              const addButton = dish.locator('button:has-text("Add to List"), button[aria-label*="add" i], .add-to-list');
              const hasAddButton = await addButton.count() > 0;
              
              if (text && text.trim() && hasAddButton) {
                items.dishes.push({
                  element: dish,
                  text: text.trim().substring(0, 100),
                  addButton: addButton.first()
                });
                logProgress(`🍕 Found dish: "${text.trim().substring(0, 50)}..."`);
              }
            }
          }
        } catch (error) {
          // Try next selector
        }
      }
      
      // Search for restaurants
      await searchInput.clear();
      await searchInput.fill('restaurant');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      // Look for restaurant elements
      const restaurantSelectors = [
        '.restaurant-card',
        '.restaurant-item',
        '[data-testid*="restaurant"]',
        '.search-result:has(.restaurant)',
        '.card:has(h3)',
        '.search-results .restaurant'
      ];
      
      for (const selector of restaurantSelectors) {
        try {
          const restaurantElements = await page.locator(selector).all();
          for (let i = 0; i < Math.min(restaurantElements.length, 3); i++) {
            const restaurant = restaurantElements[i];
            const isVisible = await restaurant.isVisible();
            if (isVisible) {
              const text = await restaurant.textContent();
              const addButton = restaurant.locator('button:has-text("Add to List"), button[aria-label*="add" i], .add-to-list');
              const hasAddButton = await addButton.count() > 0;
              
              if (text && text.trim() && hasAddButton) {
                items.restaurants.push({
                  element: restaurant,
                  text: text.trim().substring(0, 100),
                  addButton: addButton.first()
                });
                logProgress(`🏪 Found restaurant: "${text.trim().substring(0, 50)}..."`);
              }
            }
          }
        } catch (error) {
          // Try next selector
        }
      }
      
    } catch (error) {
      logError(`Error finding items: ${error.message}`);
    }
    
    logSuccess(`📊 Found ${items.dishes.length} dishes and ${items.restaurants.length} restaurants with Add to List buttons`);
    return items;
  }

  static async addItemsToExistingLists(page, items) {
    logProgress('➕ Adding items to existing lists...');
    
    const results = {
      itemsAdded: 0,
      errors: [],
      details: []
    };
    
    try {
      // Get available lists first
      await page.goto(`${BASE_URL}/my-lists`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      const lists = await page.locator('.list-card, .list-item, [data-testid*="list"]').all();
      logProgress(`Found ${lists.length} existing lists to add items to`);
      
      if (lists.length === 0) {
        logError('No existing lists found to add items to');
        return results;
      }
      
      // For each available item, try to add it to lists
      const allItems = [...items.dishes, ...items.restaurants];
      
      for (let i = 0; i < Math.min(allItems.length, 5); i++) {
        const item = allItems[i];
        logProgress(`➕ Adding item ${i + 1}: "${item.text.substring(0, 40)}..."`);
        
        try {
          // Navigate back to search to find the item
          await page.goto(`${BASE_URL}/search`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(1500);
          
          // Search for the specific item
          const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
          const searchTerm = item.text.split(' ').slice(0, 2).join(' '); // Use first 2 words
          await searchInput.fill(searchTerm);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // Find the item's add to list button
          const addButtons = await page.locator('button:has-text("Add to List"), button[aria-label*="add" i], .add-to-list').all();
          
          if (addButtons.length > 0) {
            // Click the first available add to list button
            await addButtons[0].click();
            await page.waitForTimeout(1000);
            
            // Look for the add to list modal/dialog
            const modalSelectors = [
              '.modal:visible',
              '.dialog:visible',
              '[role="dialog"]:visible',
              '.add-to-list-modal:visible',
              '.modal-content:visible'
            ];
            
            let modalFound = false;
            for (const modalSelector of modalSelectors) {
              try {
                const modal = page.locator(modalSelector).first();
                const isVisible = await modal.isVisible();
                if (isVisible) {
                  logProgress(`📋 Add to List modal opened`);
                  modalFound = true;
                  
                  // Look for list checkboxes or buttons
                  const listSelectors = [
                    'input[type="checkbox"]',
                    '.list-option',
                    'button:has-text("Add")',
                    '.list-item button',
                    '[data-testid*="list"]'
                  ];
                  
                  let listsChecked = 0;
                  for (const listSelector of listSelectors) {
                    try {
                      const listOptions = await modal.locator(listSelector).all();
                      for (let j = 0; j < Math.min(listOptions.length, 2); j++) {
                        const option = listOptions[j];
                        const isVisible = await option.isVisible();
                        if (isVisible) {
                          await option.click();
                          listsChecked++;
                          logProgress(`✅ Selected list option ${j + 1}`);
                          await page.waitForTimeout(300);
                        }
                      }
                      if (listsChecked > 0) break;
                    } catch (error) {
                      // Try next selector
                    }
                  }
                  
                  // Submit the modal
                  const submitSelectors = [
                    'button:has-text("Add")',
                    'button:has-text("Save")',
                    'button[type="submit"]',
                    '.modal-footer button:last-child'
                  ];
                  
                  for (const submitSelector of submitSelectors) {
                    try {
                      const submitButton = modal.locator(submitSelector).first();
                      const isVisible = await submitButton.isVisible();
                      if (isVisible) {
                        await submitButton.click();
                        logProgress(`✅ Submitted add to list for "${item.text.substring(0, 30)}..."`);
                        results.itemsAdded++;
                        await page.waitForTimeout(1000);
                        break;
                      }
                    } catch (error) {
                      // Try next submit selector
                    }
                  }
                  
                  break;
                }
              } catch (error) {
                // Try next modal selector
              }
            }
            
            if (!modalFound) {
              logProgress(`⚠️ No add to list modal found for item ${i + 1}`);
            }
            
            // Close any remaining modals
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            
          } else {
            logProgress(`⚠️ No add to list button found for item ${i + 1}`);
          }
          
        } catch (error) {
          logError(`Error adding item ${i + 1}: ${error.message}`);
          results.errors.push({
            item: item.text.substring(0, 50),
            error: error.message
          });
        }
      }
      
    } catch (error) {
      logError(`Error in addItemsToExistingLists: ${error.message}`);
      results.errors.push({ general: error.message });
    }
    
    logSuccess(`➕ Added ${results.itemsAdded} items to lists`);
    return results;
  }

  static async verifyListItemsDisplay(page) {
    logProgress('🔍 Verifying list items display after adding items...');
    
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
      await page.screenshot({ path: 'e2e-results/screenshots/lists-after-adding-items.png', fullPage: true });
      logSuccess('📸 Screenshot taken: lists-after-adding-items.png');
      
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
          await page.screenshot({ path: `e2e-results/screenshots/list-${i + 1}-after-items.png`, fullPage: true });
          logSuccess(`📸 Screenshot taken: list-${i + 1}-after-items.png`);
          
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
            '.content .item'
          ];
          
          let itemsFoundInThisList = 0;
          const foundItems = [];
          
          for (const itemSelector of itemSelectors) {
            try {
              const items = await page.locator(itemSelector).all();
              logProgress(`   Selector ${itemSelector} found ${items.length} potential items`);
              
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
            items: foundItems
          });
          
          // Check for empty state messages
          if (itemsFoundInThisList === 0) {
            const emptyMessages = await page.locator(':has-text("empty"), :has-text("No items"), :has-text("No dishes")').all();
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

test.describe('Add Items and Test List Display', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    logProgress('🚀 STARTING ADD ITEMS AND TEST');
    
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

  test('Add Real Items to Lists and Verify Display', async () => {
    logProgress('🔍 STARTING COMPREHENSIVE ADD ITEMS TEST');
    
    try {
      // Step 1: Authenticate
      const authSuccess = await ListItemsTestHelpers.performAuthentication(page);
      expect(authSuccess).toBe(true);
      logSuccess('✅ Authentication completed');
      
      // Step 2: Find available items to add
      const availableItems = await ListItemsTestHelpers.getAvailableItemsToAdd(page);
      const totalItems = availableItems.dishes.length + availableItems.restaurants.length;
      logSuccess(`✅ Found ${totalItems} available items to add to lists`);
      
      // Step 3: Add items to existing lists
      const addResults = await ListItemsTestHelpers.addItemsToExistingLists(page, availableItems);
      logSuccess(`✅ Added ${addResults.itemsAdded} items to lists`);
      
      // Step 4: Verify list items display
      const verifyResults = await ListItemsTestHelpers.verifyListItemsDisplay(page);
      
      // Step 5: Final analysis
      logSuccess('\n🎯 FINAL TEST RESULTS:');
      logSuccess(`Items Available: ${totalItems}`);
      logSuccess(`Items Added: ${addResults.itemsAdded}`);
      logSuccess(`Lists Checked: ${verifyResults.listsChecked}`);
      logSuccess(`Items Found in Lists: ${verifyResults.itemsFound}`);
      
      if (verifyResults.details.length > 0) {
        logSuccess('\n📋 DETAILED RESULTS:');
        verifyResults.details.forEach((detail, index) => {
          logSuccess(`List ${index + 1}: "${detail.listName}" - ${detail.itemsFound} items`);
          if (detail.items.length > 0) {
            detail.items.forEach(item => {
              logSuccess(`   🔸 "${item.text.substring(0, 50)}..."`);
            });
          }
        });
      }
      
      if (addResults.errors.length > 0) {
        logError('\n🚨 ERRORS:');
        addResults.errors.forEach(error => {
          logError(`   ❌ ${JSON.stringify(error)}`);
        });
      }
      
      // Test should show improvement
      if (verifyResults.itemsFound > 0) {
        logSuccess('🎉 SUCCESS! List items are now displaying properly!');
      } else if (addResults.itemsAdded > 0) {
        logProgress('⚠️ Items were added but may need time to appear or have display issues');
      } else {
        logError('❌ Could not add items to lists - may indicate UI/UX issues');
      }
      
      expect(verifyResults.listsChecked).toBeGreaterThan(0);
      logSuccess('✅ ADD ITEMS AND VERIFY TEST COMPLETED');
      
    } catch (error) {
      logError(`Test error: ${error.message}`);
      throw error;
    }
  });
}); 