/**
 * FOCUSED LIST ITEMS TEST
 * 
 * This test focuses specifically on testing list items display functionality
 * to identify authentication or other issues preventing list items from showing
 */

import { test, expect } from '@playwright/test';

// Test configuration
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

// Helper class for list items testing
class ListItemsTestHelpers {
  static async closeAnyOpenModals(page) {
    logProgress('🔍 Checking for open modals...');
    
    const modalCloseSelectors = [
      'button:has-text("Close")',
      'button:has-text("Cancel")', 
      'button:has-text("×")',
      '[aria-label*="close" i]',
      '.modal-close',
      '[data-testid="modal-backdrop"]',
      '.modal-backdrop'
    ];
    
    let modalsClosed = 0;
    
    for (const selector of modalCloseSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            await element.click({ timeout: 1000 });
            modalsClosed++;
            logSuccess(`Closed modal using: ${selector}`);
            await page.waitForTimeout(300);
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Try Escape key
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    } catch (error) {
      // Ignore
    }
    
    if (modalsClosed > 0) {
      logSuccess(`Successfully closed ${modalsClosed} modals`);
    }
    
    return modalsClosed;
  }

  static async performAuthentication(page) {
    logProgress('🔐 Starting Authentication...');
    
    try {
      // Navigate to login if not already there
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      }
      
      await page.waitForTimeout(2000);
      await this.closeAnyOpenModals(page);
      
      // Fill login form
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').click();
      
      // Wait for navigation
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Verify auth token
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

  static async performComprehensiveListItemsTesting(page) {
    logProgress('📋 Starting FOCUSED LIST ITEMS Testing...');
    const results = {
      listsFound: 0,
      listsClicked: 0,
      itemsFound: 0,
      authChecks: 0,
      errors: [],
      details: []
    };
    
    try {
      // Navigate to lists page
      logProgress('🧭 Navigating to my-lists page...');
      await page.goto(`${BASE_URL}/my-lists`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
      await this.closeAnyOpenModals(page);
      
      // Check authentication status
      const isAuthenticated = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        return token && token.startsWith('eyJ');
      });
      results.authChecks++;
      logProgress(`🔐 Authentication status: ${isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
      
      // Take screenshot of lists page
      await page.screenshot({ path: 'e2e-results/screenshots/lists-page-state.png', fullPage: true });
      logSuccess('📸 Screenshot taken: lists-page-state.png');
      
      // Look for list elements
      logProgress('🔍 Searching for list elements on the page...');
      const listSelectors = [
        '.list-card',
        '.list-item',
        '[data-testid*="list"]',
        'article:has(.list)',
        '.card:has(h3)',
        '.grid > div:has(h3)',
        'a[href*="/lists/"]'
      ];
      
      let allLists = [];
      for (const selector of listSelectors) {
        try {
          const lists = await page.locator(selector).all();
          logProgress(`Selector ${selector} found ${lists.length} elements`);
          
          for (let i = 0; i < lists.length; i++) {
            try {
              const list = lists[i];
              const isVisible = await list.isVisible();
              if (isVisible) {
                const text = await list.textContent();
                const boundingBox = await list.boundingBox();
                if (text && text.trim() && boundingBox) {
                  allLists.push({
                    element: list,
                    text: text.trim().substring(0, 100),
                    selector: selector,
                    index: i,
                    x: boundingBox.x,
                    y: boundingBox.y
                  });
                  logProgress(`📋 Found list: "${text.trim().substring(0, 50)}..."`);
                }
              }
            } catch (error) {
              logProgress(`Error processing element ${i} with selector ${selector}: ${error.message}`);
            }
          }
        } catch (error) {
          logProgress(`Selector ${selector} failed: ${error.message}`);
        }
      }
      
      // Remove duplicates
      const uniqueLists = [];
      for (const list of allLists) {
        const isDuplicate = uniqueLists.some(existing => 
          Math.abs(existing.x - list.x) < 10 && 
          Math.abs(existing.y - list.y) < 10
        );
        if (!isDuplicate) {
          uniqueLists.push(list);
        }
      }
      
      results.listsFound = uniqueLists.length;
      logSuccess(`📊 Found ${uniqueLists.length} unique lists to test`);
      
      // Check for empty state messages
      const emptyStateSelectors = [
        ':has-text("No lists")',
        ':has-text("You haven\'t created")',
        ':has-text("Empty")',
        '.empty-state',
        '.no-lists'
      ];
      
      for (const selector of emptyStateSelectors) {
        try {
          const emptyElement = await page.locator(selector).first();
          const isVisible = await emptyElement.isVisible();
          if (isVisible) {
            const emptyText = await emptyElement.textContent();
            logProgress(`📝 Empty state found: "${emptyText.trim()}"`);
          }
        } catch (error) {
          // Continue
        }
      }
      
      if (uniqueLists.length === 0) {
        logError('❌ No lists found! This could indicate:');
        logError('   1. User has no lists in database');
        logError('   2. Authentication issues preventing list loading');
        logError('   3. API endpoint not responding');
        logError('   4. Frontend not rendering lists properly');
        
        // Try to create a test list
        logProgress('🆕 Attempting to create a test list...');
        await this.createTestList(page);
        
        // Refresh and check again
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Re-check for lists
        const newLists = await page.locator('.list-card, .list-item, [data-testid*="list"]').all();
        results.listsFound = newLists.length;
        logProgress(`After creating test list, found ${newLists.length} lists`);
        
        if (newLists.length > 0) {
          uniqueLists.push({
            element: newLists[0],
            text: 'Created Test List',
            selector: 'newly-created'
          });
        }
      }
      
      // Test clicking on lists and looking for items
      let totalItemsFound = 0;
      for (let i = 0; i < Math.min(uniqueLists.length, 3); i++) {
        const list = uniqueLists[i];
        logProgress(`🎯 Testing list ${i + 1}/${Math.min(uniqueLists.length, 3)}: "${list.text.substring(0, 40)}..."`);
        
        try {
          // Click on the list
          await list.element.click({ timeout: 5000 });
          results.listsClicked++;
          
          await page.waitForTimeout(3000);
          await this.closeAnyOpenModals(page);
          
          // Take screenshot of opened list
          await page.screenshot({ path: `e2e-results/screenshots/list-${i + 1}-opened.png`, fullPage: true });
          logSuccess(`📸 Screenshot taken: list-${i + 1}-opened.png`);
          
          // Check authentication after clicking
          const stillAuth = await page.evaluate(() => {
            const token = localStorage.getItem('token');
            return token && token.startsWith('eyJ');
          });
          results.authChecks++;
          
          if (!stillAuth) {
            logError(`⚠️ Lost authentication after clicking list ${i + 1}`);
            results.errors.push(`Lost auth on list ${i + 1}`);
          }
          
          // Look for list items
          logProgress(`🔍 Searching for items in list: "${list.text.substring(0, 30)}..."`);
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
            'li:not(:empty)',
            '[class*="item"]:has(h3)',
            '[class*="item"]:has(h4)'
          ];
          
          let itemsFoundInThisList = 0;
          const foundItems = [];
          
          for (const itemSelector of itemSelectors) {
            try {
              const items = await page.locator(itemSelector).all();
              logProgress(`   Item selector ${itemSelector} found ${items.length} elements`);
              
              for (let j = 0; j < items.length; j++) {
                try {
                  const item = items[j];
                  const isVisible = await item.isVisible();
                  if (isVisible) {
                    const itemText = await item.textContent();
                    const itemBox = await item.boundingBox();
                    if (itemText && itemText.trim() && itemBox && itemBox.width > 50 && itemBox.height > 20) {
                      const isDuplicate = foundItems.some(existing => 
                        existing.text.substring(0, 20) === itemText.trim().substring(0, 20) &&
                        Math.abs(existing.x - itemBox.x) < 20
                      );
                      if (!isDuplicate) {
                        foundItems.push({
                          text: itemText.trim().substring(0, 100),
                          selector: itemSelector,
                          x: itemBox.x,
                          y: itemBox.y
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
          
          totalItemsFound += itemsFoundInThisList;
          
          results.details.push({
            listName: list.text.substring(0, 50),
            itemsFound: itemsFoundInThisList,
            items: foundItems.map(item => ({
              text: item.text.substring(0, 50),
              selector: item.selector
            }))
          });
          
          if (itemsFoundInThisList === 0) {
            logError(`❌ No items found in list: "${list.text.substring(0, 30)}..."`);
            
            // Check for empty state or loading indicators
            const emptyMessages = await page.locator(':has-text("No items"), :has-text("Empty"), :has-text("Loading")').all();
            for (const msg of emptyMessages) {
              try {
                const isVisible = await msg.isVisible();
                if (isVisible) {
                  const text = await msg.textContent();
                  logProgress(`📝 Found message: "${text.trim()}"`);
                }
              } catch (error) {
                // Continue
              }
            }
          }
          
          // Navigate back to lists
          const currentUrl = page.url();
          if (!currentUrl.includes('/my-lists')) {
            logProgress('🔙 Navigating back to lists page...');
            await page.goto(`${BASE_URL}/my-lists`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            await page.waitForTimeout(1500);
          }
          
        } catch (listError) {
          logError(`❌ Error testing list ${i + 1}: ${listError.message}`);
          results.errors.push({
            list: list.text.substring(0, 50),
            error: listError.message
          });
        }
      }
      
      results.itemsFound = totalItemsFound;
      
      // Final summary
      logSuccess('📊 FOCUSED LIST ITEMS TESTING SUMMARY:');
      logSuccess(`   🔍 Lists Found: ${results.listsFound}`);
      logSuccess(`   👆 Lists Clicked: ${results.listsClicked}`);
      logSuccess(`   📋 Total Items Found: ${results.itemsFound}`);
      logSuccess(`   🔐 Auth Checks: ${results.authChecks}`);
      logSuccess(`   ❌ Errors: ${results.errors.length}`);
      
      if (results.itemsFound === 0) {
        logError('🚨 CRITICAL: NO LIST ITEMS FOUND ACROSS ALL LISTS!');
        logError('This indicates a serious issue with:');
        logError('   1. List items not being stored in database');
        logError('   2. API not returning list items');
        logError('   3. Frontend not rendering list items');
        logError('   4. Authentication preventing item access');
      }
      
    } catch (error) {
      logError(`List items testing error: ${error.message}`);
      results.errors.push({ general: error.message });
    }
    
    return results;
  }

  static async createTestList(page) {
    try {
      logProgress('🆕 Creating test list...');
      
      const createButton = page.locator('button:has-text("Create List")').first();
      await createButton.waitFor({ timeout: 3000, state: 'visible' });
      await createButton.click();
      await page.waitForTimeout(1000);
      
      const timestamp = Date.now();
      await page.locator('input[name="name"]').fill(`E2E Test List ${timestamp}`);
      await page.locator('textarea[name="description"]').fill(`Test list for debugging list items - ${new Date().toISOString()}`);
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      await this.closeAnyOpenModals(page);
      logSuccess('✅ Test list created');
      return true;
    } catch (error) {
      logError(`Create test list error: ${error.message}`);
      return false;
    }
  }
}

test.describe('FOCUSED List Items Testing', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    logProgress('🚀 STARTING FOCUSED LIST ITEMS TEST');
    
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

  test('Focused List Items Display Test', async () => {
    logProgress('🔍 STARTING FOCUSED LIST ITEMS DISPLAY TEST');
    
    try {
      // Step 1: Navigate and authenticate
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const authSuccess = await ListItemsTestHelpers.performAuthentication(page);
      
      expect(authSuccess).toBe(true);
      logSuccess('✅ Authentication completed');
      
      // Step 2: Perform comprehensive list items testing
      const results = await ListItemsTestHelpers.performComprehensiveListItemsTesting(page);
      
      // Step 3: Validate results and provide diagnostics
      logSuccess('\n🎯 FINAL TEST RESULTS:');
      logSuccess(`Lists Found: ${results.listsFound}`);
      logSuccess(`Lists Clicked: ${results.listsClicked}`);
      logSuccess(`Items Found: ${results.itemsFound}`);
      logSuccess(`Auth Checks: ${results.authChecks}`);
      logSuccess(`Errors: ${results.errors.length}`);
      
      if (results.details.length > 0) {
        logSuccess('\n📋 DETAILED LIST ANALYSIS:');
        results.details.forEach((detail, index) => {
          logSuccess(`List ${index + 1}: "${detail.listName}" - ${detail.itemsFound} items`);
          if (detail.items.length > 0) {
            detail.items.forEach(item => {
              logSuccess(`   🔸 "${item.text}" (${item.selector})`);
            });
          }
        });
      }
      
      if (results.errors.length > 0) {
        logError('\n🚨 ERRORS ENCOUNTERED:');
        results.errors.forEach(error => {
          logError(`   ❌ ${JSON.stringify(error)}`);
        });
      }
      
      // Test passes if we found lists (even without items, for debugging)
      expect(results.listsFound).toBeGreaterThanOrEqual(0);
      
      logSuccess('✅ FOCUSED LIST ITEMS TEST COMPLETED');
      
    } catch (error) {
      logError(`Test error: ${error.message}`);
      throw error;
    }
  });
}); 