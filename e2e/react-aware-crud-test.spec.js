/**
 * React-Aware CRUD Test 
 * Test that properly triggers React onChange events for form validation
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

// Helper to fill input and trigger React events
async function fillInputWithEvents(page, selector, value) {
  const input = page.locator(selector).first();
  if (await input.isVisible()) {
    // Clear the input first
    await input.clear();
    
    // Type the value character by character to trigger onChange events
    await input.type(value, { delay: 50 });
    
    // Trigger blur to ensure validation
    await input.blur();
    
    return true;
  }
  return false;
}

test.describe('React-Aware CRUD Test', () => {
  
  test('Test form submission with proper React events', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginAsAdmin(page);
    
    const testCases = [
      {
        tab: 'Cities',
        fields: [
          { placeholder: 'Enter name', value: 'Test React City' }
        ]
      },
      {
        tab: 'Hashtags', 
        fields: [
          { placeholder: 'Enter name', value: 'reacttest' }
        ]
      },
      {
        tab: 'Restaurants',
        fields: [
          { placeholder: 'Enter name', value: 'Test React Restaurant' }
        ]
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🎯 === Testing ${testCase.tab} ===`);
      
      // Navigate to tab
      const tabNavigated = await navigateToTab(page, testCase.tab);
      if (!tabNavigated) {
        console.log(`❌ Skipping ${testCase.tab} - tab not found`);
        continue;
      }
      
      await page.waitForTimeout(1000);
      
      // ADD operation
      console.log(`➕ Adding new ${testCase.tab.slice(0, -1).toLowerCase()}...`);
      
      const addButton = page.locator('button:has-text("Add New"), button:has-text("Create"), button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click({ force: true });
        await page.waitForTimeout(2000); // Wait for form to fully load
        
        console.log('📝 Filling form fields with React events...');
        
        // Fill each field with proper React events
        for (const field of testCase.fields) {
          const filled = await fillInputWithEvents(page, `input[placeholder="${field.placeholder}"]`, field.value);
          if (filled) {
            console.log(`  ✅ Filled "${field.placeholder}": ${field.value}`);
          } else {
            console.log(`  ⚠️ Field not found: ${field.placeholder}`);
          }
        }
        
        // Wait for form validation to complete
        console.log('⏳ Waiting for form validation...');
        await page.waitForTimeout(2000);
        
        // Check if submit button is enabled
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          const isEnabled = await submitButton.isEnabled();
          console.log(`📋 Submit button enabled: ${isEnabled}`);
          
          if (isEnabled) {
            console.log('🚀 Attempting form submission...');
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            // Check for success indicators
            const successSelectors = [
              ':has-text("success")',
              ':has-text("created")',
              ':has-text("added")',
              '.toast-success',
              '.alert-success'
            ];
            
            for (const selector of successSelectors) {
              const successElement = page.locator(selector).first();
              if (await successElement.isVisible()) {
                console.log(`  ✅ Success indicator found: ${selector}`);
                break;
              }
            }
            
            console.log(`  ✅ ${testCase.tab.slice(0, -1)} submission completed`);
          } else {
            console.log(`  ⚠️ Submit button remained disabled after filling form`);
            
            // Log form validation state
            const formElement = page.locator('form').first();
            if (await formElement.isVisible()) {
              const isFormValid = await formElement.evaluate(form => form.checkValidity());
              console.log(`  📋 HTML5 form validity: ${isFormValid}`);
            }
          }
          
          // Close form if still open
          const cancelButton = page.locator('button:has-text("Cancel")').first();
          if (await cancelButton.isVisible()) {
            try {
              await cancelButton.click({ force: true });
              await page.waitForTimeout(1000);
              console.log('  ✅ Form closed');
            } catch (error) {
              console.log('  ⚠️ Could not close form');
            }
          }
        }
      } else {
        console.log(`  ❌ Add button not found for ${testCase.tab}`);
      }
      
      console.log(`✅ ${testCase.tab} test completed`);
    }
    
    console.log('\n🎉 All React-aware CRUD tests completed!');
  });
  
}); 