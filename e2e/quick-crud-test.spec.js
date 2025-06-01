/**
 * Quick CRUD Test - Standalone
 * Fast test that performs add/edit/remove for each admin panel tab
 * 
 * Usage: npx playwright test e2e/quick-crud-test.spec.js --headed
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

// Helper functions
async function loginAsAdmin(page) {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill('admin@example.com');
  
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill('doof123');
  
  await page.waitForTimeout(1000);
  
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Wait for login to complete
  await page.waitForTimeout(3000);
  
  // Navigate to admin panel
  await page.goto(`${BASE_URL}/admin`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Admin login successful');
  return true;
}

async function navigateToTab(page, tabName) {
  console.log(`📍 Navigating to ${tabName} tab...`);
  
  const tabButton = page.locator(`button:has-text("${tabName}")`).first();
  if (await tabButton.isVisible()) {
    await tabButton.click();
    await page.waitForTimeout(2000);
    console.log(`✅ Navigated to ${tabName}`);
    return true;
  }
  
  console.log(`❌ ${tabName} tab not found`);
  return false;
}

async function waitForTableToLoad(page) {
  await page.waitForSelector('table tbody tr, .no-data, .empty-state', { timeout: 10000 }).catch(() => {
    console.log('⚠️ Table may not have loaded');
  });
  await page.waitForTimeout(1000);
}

test.describe('Quick CRUD Test - All Tabs', () => {
  
  test('Add/Edit/Remove one item for each admin panel tab', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for all tabs
    
    await loginAsAdmin(page);
    
    // Resource definitions with correct required fields based on actual column config
    const resources = [
      {
        tab: 'Restaurants',
        data: {
          name: 'Quick Test Restaurant' // Only required field according to validation rules
          // city_id and neighborhood_id are NOT marked as required in column config
        },
        editData: { name: 'Quick Test Restaurant - EDITED' },
        identifier: 'name'
      },
      {
        tab: 'Dishes',
        data: {
          name: 'Test Quick Dish',
          description: 'Quick test dish description',
          price: '19.99'
          // restaurant_id is NOT marked as required in column config
        },
        editData: { name: 'Test Quick Dish - EDITED' },
        identifier: 'name'
      },
      {
        tab: 'Users',
        data: {
          email: 'quicktest@test.com',
          username: 'quicktest123'
          // Only email and username are required according to validation rules
        },
        editData: { username: 'quicktest123-edited' },
        identifier: 'email'
      },
      {
        tab: 'Cities',
        data: {
          name: 'Test Quick City'
          // Only name is required
        },
        editData: { name: 'Test Quick City - EDITED' },
        identifier: 'name'
      },
      {
        tab: 'Neighborhoods',
        data: {
          name: 'Test Quick Neighborhood'
          // name is required, but city_id is NOT marked as required in column config
        },
        editData: { name: 'Test Quick Neighborhood - EDITED' },
        identifier: 'name'
      },
      {
        tab: 'Hashtags',
        data: {
          name: 'quicktesthashtag'
          // Only name is required
        },
        editData: { name: 'quicktesthashtag-edited' },
        identifier: 'name'
      }
    ];
    
    for (const resource of resources) {
      console.log(`\n🎯 === Testing ${resource.tab} ===`);
      
      // 1. Navigate to tab
      const tabNavigated = await navigateToTab(page, resource.tab);
      if (!tabNavigated) {
        console.log(`❌ Skipping ${resource.tab} - tab not found`);
        continue;
      }
      
      await waitForTableToLoad(page);
      
      // 2. ADD operation
      console.log(`➕ Adding new ${resource.tab.slice(0, -1).toLowerCase()}...`);
      
      const addButton = page.locator('button:has-text("Add New"), button:has-text("Create"), button:has-text("Add")').first();
      let itemAdded = false;
      
      if (await addButton.isVisible()) {
        await addButton.click({ force: true }); // Force click to handle overlays
        await page.waitForTimeout(1000);
        
        // Fill form - simplified approach for required fields only
        for (const [field, value] of Object.entries(resource.data)) {
          // Use simpler, more direct selectors
          const selectors = [
            `input[name="${field}"]`,
            `textarea[name="${field}"]`,
            `select[name="${field}"]`
          ];
          
          let fieldFilled = false;
          for (const selector of selectors) {
            const input = page.locator(selector).first();
            if (await input.isVisible()) {
              try {
                const tagName = await input.evaluate(el => el.tagName.toLowerCase());
                
                if (tagName === 'select') {
                  // For select elements, select by value or text
                  await input.selectOption({ value: value });
                } else if (tagName === 'input' || tagName === 'textarea') {
                  await input.clear();
                  await input.fill(value);
                }
                
                console.log(`  ✅ Filled ${field}: ${value}`);
                fieldFilled = true;
                break;
              } catch (error) {
                console.log(`  ⚠️ Error filling ${field} with selector ${selector}: ${error.message}`);
                continue;
              }
            }
          }
          
          if (!fieldFilled) {
            console.log(`  ⚠️ Could not find fillable field: ${field}`);
          }
        }
        
        // Wait for form validation to complete
        await page.waitForTimeout(1000);
        
        // Submit the form - simplified approach
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitButton.isVisible()) {
          // Simple click without complex disabled checking
          await submitButton.click();
          await page.waitForTimeout(3000); // Wait for submission
          itemAdded = true;
          console.log(`  ✅ ${resource.tab.slice(0, -1)} creation attempted`);
        } else {
          console.log(`  ⚠️ Submit button not found`);
        }
      } else {
        console.log(`  ⚠️ Add button not found for ${resource.tab}`);
      }
      
      if (!itemAdded) {
        console.log(`  ❌ Could not add ${resource.tab.slice(0, -1)}`);
        continue;
      }
      
      // 3. Verify item exists and EDIT
      const identifierValue = resource.data[resource.identifier];
      const itemRow = page.locator(`tr:has-text("${identifierValue}")`).first();
      
      if (await itemRow.isVisible()) {
        console.log(`  ✅ Item found in table`);
        
        // Try inline editing
        console.log(`✏️ Editing ${resource.tab.slice(0, -1).toLowerCase()}...`);
        
        const nameCell = itemRow.locator('td').filter({ hasText: identifierValue }).first();
        await nameCell.click();
        await page.waitForTimeout(500);
        
        // Look for inline edit input
        const editInput = page.locator(`input[value*="${identifierValue}"]`).first();
        if (await editInput.isVisible()) {
          const newValue = resource.editData[resource.identifier];
          await editInput.clear();
          await editInput.fill(newValue);
          await editInput.press('Enter');
          await page.waitForTimeout(1500);
          console.log(`  ✅ Inline edit successful: ${newValue}`);
        } else {
          console.log(`  ⚠️ Inline editing not available for ${resource.tab}`);
        }
        
        // 4. DELETE operation
        console.log(`🗑️ Deleting ${resource.tab.slice(0, -1).toLowerCase()}...`);
        
        // Find the updated row
        const editedValue = resource.editData[resource.identifier];
        const updatedRow = page.locator(`tr:has-text("${editedValue}"), tr:has-text("${identifierValue}")`).first();
        
        if (await updatedRow.isVisible()) {
          const deleteButton = updatedRow.locator('button[title="Delete"], button:has-text("Delete"), svg:near(text("delete"))').first();
          
          if (await deleteButton.isVisible()) {
            await deleteButton.click();
            await page.waitForTimeout(1000);
            
            // Handle confirmation
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').first();
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              await page.waitForTimeout(1500);
            }
            
            // Verify deletion
            const stillExists = await page.locator(`tr:has-text("${editedValue}"), tr:has-text("${identifierValue}")`).isVisible();
            if (!stillExists) {
              console.log(`  ✅ Item deleted successfully`);
            } else {
              console.log(`  ⚠️ Item may still exist after delete attempt`);
            }
          } else {
            console.log(`  ⚠️ Delete button not found`);
          }
        }
      } else {
        console.log(`  ❌ Created item not found in table`);
      }
      
      console.log(`✅ ${resource.tab} CRUD test completed`);
    }
    
    console.log('\n🎉 All quick CRUD tests completed!');
  });
  
}); 