/**
 * Simple Form Debug Test
 * Focused test to debug form submission issue
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

// Helper function
async function loginAsAdmin(page) {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('doof123');
  await page.waitForTimeout(1000);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  
  await page.goto(`${BASE_URL}/admin`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Admin login successful');
  return true;
}

test.describe('Simple Form Debug', () => {
  
  test('Debug form submission for Cities', async ({ page }) => {
    test.setTimeout(60000);
    
    // Listen for console logs
    page.on('console', msg => {
      if (msg.text().includes('[CreateForm]')) {
        console.log('CONSOLE:', msg.text());
      }
    });
    
    await loginAsAdmin(page);
    
    // Navigate to Cities tab
    const citiesTab = page.locator('button:has-text("Cities")').first();
    await citiesTab.click();
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Cities');
    
    // Click Add New button
    const addButton = page.locator('button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Opened create form');
    
    // Find and fill the name input
    const nameInput = page.locator('input[name="name"]').first();
    await nameInput.fill('Test Debug City');
    await page.waitForTimeout(1000);
    console.log('✅ Filled name field');
    
    // Check form state
    const submitButton = page.locator('button[type="submit"]').first();
    const isEnabled = await submitButton.isEnabled();
    console.log(`📋 Submit button enabled: ${isEnabled}`);
    
    // Wait a bit more to see if state updates
    await page.waitForTimeout(3000);
    const isEnabledAfterWait = await submitButton.isEnabled();
    console.log(`📋 Submit button enabled after wait: ${isEnabledAfterWait}`);
    
    if (isEnabledAfterWait) {
      console.log('🚀 Form is valid, attempting submission...');
      await submitButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Form submitted');
    } else {
      console.log('❌ Form remained invalid');
    }
  });
  
}); 