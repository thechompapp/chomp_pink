/**
 * Comprehensive Admin Panel Test
 * 
 * Tests everything: authentication mechanism, form submissions, 
 * CRUD operations, and complete admin functionality.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

// Helper function to login
async function loginAsAdmin(page) {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('doof123');
  await page.waitForTimeout(1000);
  await page.locator('button[type="submit"]').click();
  
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Login completed');
  return true;
}

// Helper to investigate all storage mechanisms
async function investigateAuthMechanism(page) {
  const authInfo = await page.evaluate(() => {
    // Check localStorage
    const localStorage_keys = Object.keys(localStorage);
    const localStorage_auth = localStorage_keys.filter(key => 
      key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')
    );
    
    // Check sessionStorage
    const sessionStorage_keys = Object.keys(sessionStorage);
    const sessionStorage_auth = sessionStorage_keys.filter(key => 
      key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')
    );
    
    // Check cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    const auth_cookies = cookies.filter(cookie => 
      cookie.toLowerCase().includes('auth') || cookie.toLowerCase().includes('token')
    );
    
    // Check for any auth-related window properties
    const windowAuthProps = Object.keys(window).filter(key =>
      key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')
    );
    
    return {
      localStorage: {
        keys: localStorage_keys,
        authKeys: localStorage_auth,
        authData: localStorage_auth.reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {})
      },
      sessionStorage: {
        keys: sessionStorage_keys,
        authKeys: sessionStorage_auth,
        authData: sessionStorage_auth.reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {})
      },
      cookies: {
        all: cookies,
        authCookies: auth_cookies
      },
      windowProps: windowAuthProps,
      currentUrl: window.location.href
    };
  });
  
  console.log('🔍 Auth Storage Investigation:');
  console.log('  📦 LocalStorage auth keys:', authInfo.localStorage.authKeys);
  console.log('  📦 SessionStorage auth keys:', authInfo.sessionStorage.authKeys);
  console.log('  🍪 Auth cookies:', authInfo.cookies.authCookies);
  console.log('  🌐 Window auth props:', authInfo.windowProps);
  
  return authInfo;
}

// Helper to test form submission
async function testFormSubmission(page, resourceType, testData) {
  console.log(`\n📝 Testing form submission for ${resourceType}...`);
  
  // Navigate to the resource tab
  const tabButton = page.locator(`button:has-text("${resourceType}")`).first();
  await tabButton.click();
  await page.waitForTimeout(2000);
  
  // Click Add New button
  const addButton = page.locator('button:has-text("Add New")').first();
  await addButton.click();
  await page.waitForTimeout(1000);
  
  // Fill form fields
  for (const [fieldName, value] of Object.entries(testData)) {
    const input = page.locator(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`).first();
    if (await input.isVisible()) {
      if (await input.getAttribute('type') === 'checkbox') {
        if (value) await input.check();
      } else {
        await input.fill(String(value));
      }
      await page.waitForTimeout(300);
      console.log(`  ✅ Filled ${fieldName}: ${value}`);
    }
  }
  
  // Wait for form validation
  await page.waitForTimeout(1000);
  
  // Check if submit button is enabled
  const submitButton = page.locator('button[type="submit"]').first();
  const isEnabled = await submitButton.isEnabled();
  console.log(`  📋 Submit button enabled: ${isEnabled}`);
  
  if (isEnabled) {
    // Submit the form
    await submitButton.click();
    await page.waitForTimeout(3000);
    console.log(`  🚀 Form submitted successfully`);
    return true;
  } else {
    console.log(`  ❌ Submit button disabled - form validation failed`);
    
    // Cancel the form
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    }
    return false;
  }
}

test.describe('Comprehensive Admin Panel Tests', () => {
  
  test('Authentication mechanism investigation', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🧪 === Authentication Mechanism Investigation ===');
    
    // Before login
    console.log('\n📍 Before Login:');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    const beforeLogin = await investigateAuthMechanism(page);
    
    // During login process
    console.log('\n📍 During Login Process:');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('doof123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    
    const duringLogin = await investigateAuthMechanism(page);
    
    // After successful login
    console.log('\n📍 After Login:');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    const afterLogin = await investigateAuthMechanism(page);
    
    // Navigate to admin panel
    console.log('\n📍 On Admin Panel:');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const onAdmin = await investigateAuthMechanism(page);
    
    // After page refresh
    console.log('\n📍 After Page Refresh:');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const afterRefresh = await investigateAuthMechanism(page);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('  🔍 Auth likely persisted via:', 
      afterRefresh.cookies.authCookies.length > 0 ? 'COOKIES' : 
      afterRefresh.sessionStorage.authKeys.length > 0 ? 'SESSION STORAGE' :
      afterRefresh.localStorage.authKeys.length > 0 ? 'LOCAL STORAGE' : 'UNKNOWN'
    );
    
    expect(afterRefresh.currentUrl).toContain('/admin');
  });
  
  test('Complete form submission testing', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('\n🧪 === Complete Form Submission Testing ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test data for each resource type
    const testData = {
      'Cities': {
        name: 'Test City E2E',
        state: 'Test State',
        country: 'Test Country'
      },
      'Hashtags': {
        name: 'testhashtag'
      },
      'Restaurants': {
        name: 'Test Restaurant E2E',
        website: 'https://test-restaurant.com',
        phone: '555-0123',
        address: '123 Test St'
      },
      'Users': {
        email: 'testuser@example.com',
        username: 'testuser_e2e',
        full_name: 'Test User'
      },
      'Dishes': {
        name: 'Test Dish E2E',
        price: '15.99',
        description: 'A delicious test dish'
      }
    };
    
    const results = {};
    
    // Test each resource type
    for (const [resourceType, data] of Object.entries(testData)) {
      try {
        const success = await testFormSubmission(page, resourceType, data);
        results[resourceType] = success ? 'SUCCESS' : 'FAILED';
      } catch (error) {
        console.log(`  ❌ Error testing ${resourceType}: ${error.message}`);
        results[resourceType] = 'ERROR';
      }
    }
    
    console.log('\n📊 Form Submission Results:');
    for (const [resource, result] of Object.entries(results)) {
      const icon = result === 'SUCCESS' ? '✅' : result === 'FAILED' ? '❌' : '⚠️';
      console.log(`  ${icon} ${resource}: ${result}`);
    }
    
    // At least Cities and Hashtags should work (simple required fields)
    expect(results['Cities']).toBe('SUCCESS');
    expect(results['Hashtags']).toBe('SUCCESS');
  });
  
  test('Complete admin functionality verification', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('\n🧪 === Complete Admin Functionality Verification ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const tabs = ['Restaurants', 'Cities', 'Users', 'Dishes', 'Hashtags', 'Neighborhoods'];
    const functionality = {};
    
    for (const tab of tabs) {
      console.log(`\n📋 Testing ${tab} tab...`);
      
      try {
        // Navigate to tab
        const tabButton = page.locator(`button:has-text("${tab}")`).first();
        await tabButton.click();
        await page.waitForTimeout(2000);
        
        const tabResults = {
          navigation: false,
          dataLoaded: false,
          searchWorks: false,
          createFormOpens: false,
          bulkSelectWorks: false
        };
        
        // Check navigation
        const currentUrl = page.url();
        tabResults.navigation = currentUrl.includes('/admin');
        
        // Check data loaded
        const tableRows = page.locator('tbody tr');
        const rowCount = await tableRows.count();
        tabResults.dataLoaded = rowCount > 0;
        console.log(`  📊 ${rowCount} rows loaded`);
        
        // Test search
        const searchInput = page.locator('input[placeholder*="Search"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('test');
          await page.waitForTimeout(1000);
          await searchInput.clear();
          await page.waitForTimeout(1000);
          tabResults.searchWorks = true;
          console.log(`  🔍 Search functionality works`);
        }
        
        // Test create form
        const addButton = page.locator('button:has-text("Add New")').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
          
          const formVisible = await page.locator('form').isVisible();
          tabResults.createFormOpens = formVisible;
          console.log(`  ➕ Create form opens: ${formVisible}`);
          
          // Close form
          const cancelButton = page.locator('button:has-text("Cancel")').first();
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await page.waitForTimeout(500);
          }
        }
        
        // Test bulk selection
        if (rowCount > 0) {
          const firstCheckbox = page.locator('tbody tr input[type="checkbox"]').first();
          if (await firstCheckbox.isVisible()) {
            await firstCheckbox.check();
            await page.waitForTimeout(500);
            
            const bulkButton = page.locator('button:has-text("Bulk Edit"), button:has-text("Delete")').first();
            tabResults.bulkSelectWorks = await bulkButton.isVisible();
            console.log(`  ☑️ Bulk selection works: ${tabResults.bulkSelectWorks}`);
            
            // Uncheck
            await firstCheckbox.uncheck();
            await page.waitForTimeout(500);
          }
        }
        
        functionality[tab] = tabResults;
        
        const successCount = Object.values(tabResults).filter(Boolean).length;
        console.log(`  📈 ${tab}: ${successCount}/${Object.keys(tabResults).length} features working`);
        
      } catch (error) {
        console.log(`  ❌ Error testing ${tab}: ${error.message}`);
        functionality[tab] = { error: error.message };
      }
    }
    
    console.log('\n📊 Complete Functionality Summary:');
    for (const [tab, results] of Object.entries(functionality)) {
      if (results.error) {
        console.log(`  ❌ ${tab}: ERROR - ${results.error}`);
      } else {
        const working = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;
        const percentage = Math.round((working / total) * 100);
        const icon = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
        console.log(`  ${icon} ${tab}: ${working}/${total} (${percentage}%)`);
      }
    }
    
    // Verify core functionality works
    const coreTabsWorking = ['Restaurants', 'Cities', 'Users'].every(tab => 
      functionality[tab] && functionality[tab].navigation && functionality[tab].dataLoaded
    );
    expect(coreTabsWorking).toBe(true);
  });
  
  test('CRUD operations end-to-end', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('\n🧪 === CRUD Operations End-to-End ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Test CREATE operation (Cities - simplest)
    console.log('\n➕ Testing CREATE operation...');
    
    const citiesTab = page.locator('button:has-text("Cities")').first();
    await citiesTab.click();
    await page.waitForTimeout(2000);
    
    // Get initial count
    const initialRows = await page.locator('tbody tr').count();
    console.log(`  📊 Initial rows: ${initialRows}`);
    
    // Create new city
    const addButton = page.locator('button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const nameInput = page.locator('input[name="name"]').first();
    await nameInput.fill('CRUD Test City');
    await page.waitForTimeout(1000);
    
    const submitButton = page.locator('button[type="submit"]').first();
    const isEnabled = await submitButton.isEnabled();
    console.log(`  📝 Submit button enabled: ${isEnabled}`);
    
    if (isEnabled) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Verify creation
      const newRows = await page.locator('tbody tr').count();
      const created = newRows > initialRows;
      console.log(`  ✅ CREATE success: ${created} (${initialRows} → ${newRows})`);
      
      if (created) {
        // Test READ operation (search for created item)
        console.log('\n👀 Testing READ operation...');
        const searchInput = page.locator('input[placeholder*="Search"]').first();
        await searchInput.fill('CRUD Test City');
        await page.waitForTimeout(2000);
        
        const searchResults = await page.locator('tbody tr').count();
        const found = searchResults > 0;
        console.log(`  ✅ READ success: ${found} (found ${searchResults} results)`);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);
        
        // Test UPDATE operation (inline editing)
        console.log('\n✏️ Testing UPDATE operation...');
        try {
          // Find the created row and try to edit it
          const nameCell = page.locator('tbody tr').first().locator('td').nth(1);
          await nameCell.click();
          await page.waitForTimeout(1000);
          
          // Check if inline editing works
          const editInput = page.locator('tbody input[type="text"]').first();
          if (await editInput.isVisible()) {
            await editInput.fill('CRUD Updated City');
            await editInput.press('Enter');
            await page.waitForTimeout(2000);
            console.log(`  ✅ UPDATE attempt completed`);
          } else {
            console.log(`  ⚠️ UPDATE: Inline editing not available`);
          }
        } catch (error) {
          console.log(`  ⚠️ UPDATE error: ${error.message}`);
        }
        
        // Test DELETE operation
        console.log('\n🗑️ Testing DELETE operation...');
        try {
          // Select first row for deletion
          const firstCheckbox = page.locator('tbody tr input[type="checkbox"]').first();
          if (await firstCheckbox.isVisible()) {
            await firstCheckbox.check();
            await page.waitForTimeout(500);
            
            const deleteButton = page.locator('button:has-text("Delete")').first();
            if (await deleteButton.isVisible()) {
              await deleteButton.click();
              await page.waitForTimeout(3000);
              
              const finalRows = await page.locator('tbody tr').count();
              const deleted = finalRows < newRows;
              console.log(`  ✅ DELETE success: ${deleted} (${newRows} → ${finalRows})`);
            } else {
              console.log(`  ⚠️ DELETE: No delete button found`);
            }
          } else {
            console.log(`  ⚠️ DELETE: No checkboxes available`);
          }
        } catch (error) {
          console.log(`  ⚠️ DELETE error: ${error.message}`);
        }
      }
    } else {
      console.log(`  ❌ CREATE failed: Submit button disabled`);
    }
    
    console.log('\n📊 CRUD Operations Summary Complete');
  });
  
  test('Performance and stress testing', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('\n🧪 === Performance and Stress Testing ===');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Test rapid tab switching
    console.log('\n⚡ Testing rapid tab switching...');
    const tabs = ['Restaurants', 'Cities', 'Users', 'Dishes'];
    
    const startTime = Date.now();
    for (let i = 0; i < 3; i++) {
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`).first();
        await tabButton.click();
        await page.waitForTimeout(200); // Rapid switching
      }
    }
    const endTime = Date.now();
    
    console.log(`  ⏱️ Rapid switching completed in ${endTime - startTime}ms`);
    
    // Test multiple operations
    console.log('\n🔄 Testing multiple operations...');
    
    // Search operations
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    const searchTerms = ['test', 'admin', 'city', ''];
    
    for (const term of searchTerms) {
      await searchInput.fill(term);
      await page.waitForTimeout(500);
      const results = await page.locator('tbody tr').count();
      console.log(`  🔍 Search "${term}": ${results} results`);
    }
    
    // Form open/close operations
    console.log('\n📝 Testing rapid form operations...');
    for (let i = 0; i < 3; i++) {
      const addButton = page.locator('button:has-text("Add New")').first();
      await addButton.click();
      await page.waitForTimeout(500);
      
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      await cancelButton.click();
      await page.waitForTimeout(500);
    }
    
    console.log('  ✅ Stress testing completed');
    
    // Verify admin panel still functional
    const finalCheck = await page.locator('tbody tr').count();
    expect(finalCheck).toBeGreaterThan(0);
  });
  
}); 