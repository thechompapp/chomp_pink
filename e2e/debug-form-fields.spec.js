/**
 * Debug Form Fields Test
 * Simple test to debug what form fields are available in each tab
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

test.describe('Debug Form Fields', () => {
  
  test('Debug form fields for each tab', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginAsAdmin(page);
    
    const tabs = ['Restaurants', 'Dishes', 'Users', 'Cities', 'Neighborhoods', 'Hashtags'];
    
    for (const tab of tabs) {
      console.log(`\n🔍 === Debugging ${tab} Form ===`);
      
      // Navigate to tab
      const tabButton = page.locator(`button:has-text("${tab}")`).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(2000);
        console.log(`✅ Navigated to ${tab}`);
        
        // Click Add New button
        const addButton = page.locator('button:has-text("Add New"), button:has-text("Create"), button:has-text("Add")').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1500);
          console.log(`✅ Opened create form for ${tab}`);
          
          // Debug all form fields
          const allInputs = await page.locator('input, select, textarea').all();
          console.log(`📝 Found ${allInputs.length} form elements:`);
          
          for (let i = 0; i < allInputs.length; i++) {
            try {
              const input = allInputs[i];
              const tagName = await input.evaluate(el => el.tagName.toLowerCase());
              const name = await input.getAttribute('name');
              const placeholder = await input.getAttribute('placeholder');
              const type = await input.getAttribute('type');
              const id = await input.getAttribute('id');
              const required = await input.getAttribute('required');
              
              console.log(`  ${i + 1}. ${tagName}[name="${name}" type="${type}" placeholder="${placeholder}" id="${id}" required="${required}"]`);
            } catch (e) {
              console.log(`  ${i + 1}. [Element no longer attached]`);
            }
          }
          
          // Also check for labels
          const labels = await page.locator('label').all();
          console.log(`🏷️ Found ${labels.length} labels:`);
          for (let i = 0; i < Math.min(labels.length, 10); i++) {
            try {
              const label = labels[i];
              const text = await label.textContent();
              const forAttr = await label.getAttribute('for');
              console.log(`  ${i + 1}. label[for="${forAttr}"] = "${text}"`);
            } catch (e) {
              console.log(`  ${i + 1}. [Label no longer attached]`);
            }
          }
          
          // Close the form
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await page.waitForTimeout(1000);
          }
        } else {
          console.log(`❌ Add button not found for ${tab}`);
        }
      } else {
        console.log(`❌ Tab not found: ${tab}`);
      }
    }
    
    console.log('\n🎉 Form field debugging completed!');
  });
  
}); 