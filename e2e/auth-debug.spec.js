/**
 * Authentication Debug Test
 * Simple test to debug login flow and admin panel access
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

test.describe('Authentication Debug', () => {
  
  test('Debug login and admin panel access', async ({ page }) => {
    test.setTimeout(60000);
    
    // Enable verbose logging
    page.on('console', (msg) => {
      console.log('PAGE LOG:', msg.text());
    });
    
    page.on('pageerror', (error) => {
      console.log('PAGE ERROR:', error.message);
    });
    
    console.log('🔍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'debug-login-page.png' });
    console.log('📸 Screenshot saved: debug-login-page.png');
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    // Look for any form elements
    const forms = await page.locator('form').count();
    console.log('📝 Forms found:', forms);
    
    const emailInputs = await page.locator('input[type="email"], input[name="email"]').count();
    console.log('📧 Email inputs found:', emailInputs);
    
    const passwordInputs = await page.locator('input[type="password"], input[name="password"]').count();
    console.log('🔒 Password inputs found:', passwordInputs);
    
    const buttons = await page.locator('button').count();
    console.log('🔘 Buttons found:', buttons);
    
    // Try to find login elements with different selectors
    const loginSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      '#email',
      '.email'
    ];
    
    console.log('🔍 Step 2: Testing email input selectors...');
    for (const selector of loginSelectors) {
      const exists = await page.locator(selector).count();
      if (exists > 0) {
        console.log(`✅ Found email input with selector: ${selector}`);
        break;
      } else {
        console.log(`❌ No email input found with selector: ${selector}`);
      }
    }
    
    // Try different approaches to login
    console.log('🔍 Step 3: Attempting login...');
    
    // Method 1: Try with email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('📧 Found email input, attempting to fill...');
      await emailInput.fill('admin@example.com');
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      if (await passwordInput.isVisible()) {
        console.log('🔒 Found password input, attempting to fill...');
        await passwordInput.fill('doof123');
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
        if (await submitButton.isVisible()) {
          console.log('🔘 Found submit button, attempting to click...');
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          const newUrl = page.url();
          console.log('🌐 URL after login attempt:', newUrl);
          
          // Take screenshot after login
          await page.screenshot({ path: 'debug-after-login.png' });
          console.log('📸 Screenshot saved: debug-after-login.png');
        } else {
          console.log('❌ No submit button found');
        }
      } else {
        console.log('❌ No password input found');
      }
    } else {
      console.log('❌ No email input found');
    }
    
    console.log('🔍 Step 4: Checking admin panel access...');
    
    // Try to navigate directly to admin
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const adminUrl = page.url();
    console.log('🌐 Admin URL:', adminUrl);
    
    // Take screenshot of admin page
    await page.screenshot({ path: 'debug-admin-page.png' });
    console.log('📸 Screenshot saved: debug-admin-page.png');
    
    // Check for admin panel elements
    const adminElements = [
      'h1:has-text("Admin")',
      'h2:has-text("Admin")',
      '.admin-panel',
      '[data-testid*="admin"]',
      'button:has-text("Restaurants")',
      'button:has-text("Dishes")',
      'button:has-text("Users")',
      '.tab, .tabs',
      'nav',
      '.sidebar'
    ];
    
    console.log('🔍 Step 5: Looking for admin panel elements...');
    for (const selector of adminElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found admin element: ${selector} (count: ${count})`);
        const text = await page.locator(selector).first().textContent();
        console.log(`   Text content: "${text}"`);
      } else {
        console.log(`❌ Not found: ${selector}`);
      }
    }
    
    // Check for any tabs or navigation
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`🔘 Total buttons found: ${buttonCount}`);
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`   Button ${i}: "${text}" (visible: ${isVisible})`);
    }
    
    // Check page content
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Page contains text about:', bodyText.substring(0, 200) + '...');
    
    // Look for error messages
    const errorSelectors = [
      '.error',
      '.alert',
      '[class*="error"]',
      ':has-text("error")',
      ':has-text("unauthorized")',
      ':has-text("forbidden")'
    ];
    
    console.log('🔍 Step 6: Checking for error messages...');
    for (const selector of errorSelectors) {
      const errors = page.locator(selector);
      const count = await errors.count();
      if (count > 0) {
        const text = await errors.first().textContent();
        console.log(`⚠️ Error found with ${selector}: "${text}"`);
      }
    }
    
    console.log('✅ Debug test completed');
  });
  
}); 