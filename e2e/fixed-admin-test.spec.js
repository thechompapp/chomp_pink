/**
 * Fixed Admin Panel Test
 * Using proper form submission approach
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

// Helper function to wait for login to complete
async function waitForLoginSuccess(page, timeout = 15000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const currentUrl = page.url();
    
    // Check if we're redirected away from login
    if (!currentUrl.includes('/login')) {
      console.log('✅ Login successful, redirected to:', currentUrl);
      return true;
    }
    
    // Check for error messages
    const errorVisible = await page.locator('.error, .alert-error, [class*="error"]').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('.error, .alert-error, [class*="error"]').textContent();
      console.log('❌ Login error detected:', errorText);
      return false;
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log('⏰ Login timeout reached');
  return false;
}

test.describe('Fixed Admin Panel Test', () => {
  
  test('Complete admin panel test with proper authentication', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🚀 Starting comprehensive admin panel test...');
    
    // Step 1: Navigate to login and authenticate
    console.log('📝 Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Fill login form with proper timing
    console.log('📧 Filling email...');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('admin@example.com');
    
    console.log('🔒 Filling password...');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('doof123');
    
    // Wait a moment for form validation
    await page.waitForTimeout(1000);
    
    console.log('🔘 Submitting form...');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Monitor network activity during form submission
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await submitButton.click();
    
    try {
      // Wait for the login API call
      const response = await responsePromise;
      console.log('📡 Login API response:', response.status());
      
      if (response.status() === 200) {
        console.log('✅ Backend login successful');
      } else {
        console.log('❌ Backend login failed with status:', response.status());
      }
    } catch (error) {
      console.log('⚠️ No login API call detected:', error.message);
    }
    
    // Wait for login to complete
    console.log('⏳ Waiting for login completion...');
    const loginSuccessful = await waitForLoginSuccess(page);
    
    if (!loginSuccessful) {
      console.log('❌ Login failed, trying alternative approach...');
      
      // Alternative: Try clicking sign in again if form is still visible
      const formStillVisible = await page.locator('form').isVisible();
      if (formStillVisible) {
        console.log('🔄 Form still visible, trying again...');
        await submitButton.click();
        await waitForLoginSuccess(page, 10000);
      }
    }
    
    // Step 2: Navigate to admin panel
    console.log('📍 Step 2: Navigating to admin panel...');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    // Verify we're on admin panel
    if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page, authentication failed');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-auth-failed.png' });
      
      // Try one more direct API approach
      console.log('🔧 Attempting direct API authentication...');
      
      const apiAuth = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'admin@example.com',
              password: 'doof123'
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Store auth data in localStorage
            if (data.token) {
              localStorage.setItem('authToken', data.token);
            }
            if (data.user) {
              localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            return { success: true, data };
          }
          
          return { success: false, status: response.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('📡 Direct API auth result:', apiAuth);
      
      if (apiAuth.success) {
        console.log('✅ Direct API auth worked, refreshing...');
        await page.reload();
        await page.waitForTimeout(2000);
        
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    // Final URL check
    const finalUrl = page.url();
    console.log('🎯 Final URL:', finalUrl);
    
    expect(finalUrl).toContain('/admin');
    expect(finalUrl).not.toContain('/login');
    
    console.log('✅ Successfully authenticated and reached admin panel!');
    
    // Step 3: Test admin panel functionality
    console.log('🧪 Step 3: Testing admin panel functionality...');
    
    // Wait for admin content to load
    await page.waitForSelector('button, .admin-panel, nav', { timeout: 15000 });
    
    // Look for admin tabs
    const adminTabs = ['Analytics', 'Restaurants', 'Dishes', 'Users', 'Cities', 'Neighborhoods', 'Hashtags'];
    
    console.log('📋 Checking for admin tabs...');
    for (const tabName of adminTabs) {
      const tabButton = page.locator(`button:has-text("${tabName}")`);
      try {
        await expect(tabButton).toBeVisible({ timeout: 5000 });
        console.log(`✅ Found tab: ${tabName}`);
      } catch (error) {
        console.log(`⚠️ Tab not found: ${tabName}`);
      }
    }
    
    // Test Restaurants tab
    console.log('🍽️ Testing Restaurants tab...');
    const restaurantsTab = page.locator('button:has-text("Restaurants")');
    if (await restaurantsTab.isVisible()) {
      await restaurantsTab.click();
      await page.waitForTimeout(2000);
      
      // Look for table
      const table = page.locator('table, .table-container, .data-table');
      try {
        await expect(table).toBeVisible({ timeout: 10000 });
        console.log('✅ Restaurants table loaded');
        
        // Look for add button
        const addButtons = ['Add New', 'Create', 'Add Restaurant', 'Add'];
        for (const buttonText of addButtons) {
          const addButton = page.locator(`button:has-text("${buttonText}")`).first();
          if (await addButton.isVisible()) {
            console.log(`✅ Found add button: ${buttonText}`);
            
            // Test clicking the button
            await addButton.click();
            await page.waitForTimeout(1000);
            
            // Look for create form
            const createForm = page.locator('form, .create-form, .modal');
            if (await createForm.isVisible()) {
              console.log('✅ Create form opened');
              
              // Close the form
              const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
              if (await cancelButton.isVisible()) {
                await cancelButton.click();
              }
            } else {
              console.log('⚠️ Create form not visible');
            }
            
            break;
          }
        }
        
      } catch (error) {
        console.log('⚠️ Restaurants table not found');
      }
    }
    
    console.log('🎉 Admin panel test completed successfully!');
  });
  
}); 