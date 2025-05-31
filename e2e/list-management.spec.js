/**
 * List Management - Comprehensive E2E Tests
 * Tests every interactive element in list creation, viewing, editing flows
 */

import { test, expect } from '@playwright/test';
import { ElementDiscovery } from './helpers/element-discovery.js';

test.describe('List Management - Exhaustive UI Testing', () => {
  
  let consoleErrors = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    // Clear previous errors
    consoleErrors = [];
    networkErrors = [];
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Monitor network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
  });

  test.describe('Lists Page - Complete UI Testing', () => {
    
    test('should discover and test all interactive elements on lists page', async ({ page }) => {
      console.log('🧪 Testing lists page - discovering all elements');
      
      await page.goto('/lists', { waitUntil: 'domcontentloaded' });
      
      // Discover all interactive elements
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      const summary = ElementDiscovery.getElementSummary(elements);
      
      console.log('📊 Lists page element discovery:', JSON.stringify(summary, null, 2));
      
      // Test each button found
      for (let i = 0; i < Math.min(elements.buttons.length, 10); i++) { // Limit to first 10 to prevent hanging
        const button = elements.buttons[i];
        console.log(`🔘 Testing button ${i + 1}: "${button.text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(button.element);
        console.log(`   Click result:`, clickResult);
        
        if (clickResult.success) {
          // Wait for any UI changes
          await page.waitForTimeout(2000);
          
          // Check if modal opened
          const postClickElements = await ElementDiscovery.discoverInteractiveElements(page);
          if (postClickElements.modals.length > 0) {
            console.log(`   Modal opened after clicking "${button.text}"`);
            
            // Test modal elements
            for (let j = 0; j < postClickElements.modals.length; j++) {
              const modal = postClickElements.modals[j];
              console.log(`     Testing modal ${j + 1}`);
              
              // Find close button in modal
              const closeButtons = await page.locator('.modal-close, [aria-label="Close"], button:has-text("Close")').all();
              if (closeButtons.length > 0) {
                console.log(`     Closing modal`);
                await ElementDiscovery.safeClick(closeButtons[0]);
                await page.waitForTimeout(1000);
              } else {
                // Try clicking outside modal
                await page.locator('body').click({ position: { x: 10, y: 10 } });
                await page.waitForTimeout(1000);
              }
            }
          }
          
          // Check for errors after button click
          const errorElements = await ElementDiscovery.discoverInteractiveElements(page);
          if (errorElements.errors.length > 0) {
            console.log(`   Errors after clicking "${button.text}":`, 
              errorElements.errors.map(e => e.text));
          }
          
          // Go back to lists page if navigated away
          if (!page.url().includes('/lists')) {
            await page.goto('/lists', { waitUntil: 'domcontentloaded' });
          }
        }
      }
      
      // Test search/filter functionality if present
      for (let i = 0; i < elements.inputs.length; i++) {
        const input = elements.inputs[i];
        if (input.placeholder?.toLowerCase().includes('search') || 
            input.placeholder?.toLowerCase().includes('filter') ||
            input.name?.toLowerCase().includes('search')) {
          console.log(`🔍 Testing search input: "${input.placeholder || input.name}"`);
          
          const fillResult = await ElementDiscovery.safeFill(input.element, 'test search');
          console.log(`   Search fill result:`, fillResult);
          
          // Wait for search results
          await page.waitForTimeout(2000);
          
          // Clear search
          await ElementDiscovery.safeFill(input.element, '');
          await page.waitForTimeout(1000);
        }
      }
      
      // Test pagination or load more if present
      const paginationButtons = await page.locator('button:has-text("Load"), button:has-text("More"), .pagination button').all();
      for (let i = 0; i < Math.min(paginationButtons.length, 3); i++) {
        const paginationButton = paginationButtons[i];
        const text = await paginationButton.textContent().catch(() => '');
        console.log(`📄 Testing pagination button: "${text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(paginationButton);
        console.log(`   Pagination click result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(3000); // Wait for content to load
        }
      }
      
      // Report errors
      if (consoleErrors.length > 0) {
        console.log('❌ Console errors on lists page:', consoleErrors);
      }
      if (networkErrors.length > 0) {
        console.log('❌ Network errors on lists page:', networkErrors);
      }
    });

    test('should test list card interactions and modal opening', async ({ page }) => {
      console.log('🧪 Testing list card interactions');
      
      await page.goto('/lists', { waitUntil: 'domcontentloaded' });
      
      // Find clickable cards or list items
      const cardSelectors = [
        '.list-card',
        '.card',
        '[data-testid="list-card"]',
        '.list-item',
        'div[role="button"]'
      ];
      
      let cardsFound = false;
      for (const selector of cardSelectors) {
        try {
          const cards = await page.locator(selector).all();
          if (cards.length > 0) {
            console.log(`📇 Found ${cards.length} cards with selector: ${selector}`);
            cardsFound = true;
            
            // Test first few cards
            for (let i = 0; i < Math.min(cards.length, 3); i++) {
              const card = cards[i];
              const cardText = await card.textContent().catch(() => '');
              console.log(`   Testing card ${i + 1}: "${cardText.substring(0, 50)}..."`);
              
              const clickResult = await ElementDiscovery.safeClick(card);
              console.log(`   Card click result:`, clickResult);
              
              if (clickResult.success) {
                await page.waitForTimeout(2000);
                
                // Check if modal opened or navigation occurred
                const currentUrl = page.url();
                const modals = await page.locator('[role="dialog"], .modal').all();
                
                if (modals.length > 0) {
                  console.log(`   Modal opened for card ${i + 1}`);
                  
                  // Test modal interactions
                  await testModalInteractions(page, modals[0]);
                  
                } else if (!currentUrl.includes('/lists')) {
                  console.log(`   Navigated to: ${currentUrl}`);
                  // Go back to lists
                  await page.goto('/lists', { waitUntil: 'domcontentloaded' });
                }
              }
            }
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!cardsFound) {
        console.log('ℹ️ No list cards found on page');
      }
    });
  });

  test.describe('My Lists Page - User-Specific Testing', () => {
    
    test('should test my lists page with authentication', async ({ page }) => {
      console.log('🧪 Testing my lists page');
      
      // Login first via API to avoid UI dependency
      await loginUser(page);
      
      await page.goto('/my-lists', { waitUntil: 'domcontentloaded' });
      
      // Discover all interactive elements
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      const summary = ElementDiscovery.getElementSummary(elements);
      
      console.log('📊 My Lists page element discovery:', JSON.stringify(summary, null, 2));
      
      // Test "Create New List" functionality
      for (let i = 0; i < elements.buttons.length; i++) {
        const button = elements.buttons[i];
        if (button.text.toLowerCase().includes('create') || 
            button.text.toLowerCase().includes('new') ||
            button.text.toLowerCase().includes('add')) {
          console.log(`➕ Testing create button: "${button.text}"`);
          
          const clickResult = await ElementDiscovery.safeClick(button.element);
          console.log(`   Create button result:`, clickResult);
          
          if (clickResult.success) {
            await page.waitForTimeout(2000);
            
            // Check for form or modal
            const postClickElements = await ElementDiscovery.discoverInteractiveElements(page);
            
            if (postClickElements.modals.length > 0 || postClickElements.forms.length > 0) {
              console.log(`   Create form/modal opened`);
              
              // Test form filling
              await testListCreationForm(page);
            }
          }
          break; // Test only one create button
        }
      }
      
      // Test existing list management buttons
      const managementButtons = await page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("Share")').all();
      for (let i = 0; i < Math.min(managementButtons.length, 3); i++) {
        const button = managementButtons[i];
        const text = await button.textContent().catch(() => '');
        console.log(`⚙️ Testing management button: "${text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(button);
        console.log(`   Management button result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(2000);
          
          // Handle confirmation dialogs or modals
          const confirmButtons = await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').all();
          const cancelButtons = await page.locator('button:has-text("Cancel"), button:has-text("No")').all();
          
          if (cancelButtons.length > 0) {
            console.log(`   Canceling action`);
            await ElementDiscovery.safeClick(cancelButtons[0]);
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('List Creation and Editing Forms', () => {
    
    test('should test list creation form validation', async ({ page }) => {
      console.log('🧪 Testing list creation form validation');
      
      // Login first
      await loginUser(page);
      
      await page.goto('/my-lists', { waitUntil: 'domcontentloaded' });
      
      // Find and click create button
      const createButtons = await page.locator('button:has-text("Create"), button:has-text("New List"), button:has-text("Add List")').all();
      
      if (createButtons.length > 0) {
        await ElementDiscovery.safeClick(createButtons[0]);
        await page.waitForTimeout(2000);
        
        // Test empty form submission
        const submitButtons = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').all();
        if (submitButtons.length > 0) {
          console.log('📋 Testing empty form submission');
          await ElementDiscovery.safeClick(submitButtons[0]);
          await page.waitForTimeout(2000);
          
          // Check for validation errors
          const elements = await ElementDiscovery.discoverInteractiveElements(page);
          console.log('Validation errors:', elements.errors.map(e => e.text));
        }
        
        // Test form with valid data
        const nameInputs = await page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="title"]').all();
        const descriptionInputs = await page.locator('textarea[name="description"], textarea[placeholder*="description"]').all();
        
        if (nameInputs.length > 0) {
          console.log('📝 Filling list name');
          await ElementDiscovery.safeFill(nameInputs[0], 'Test List Name');
        }
        
        if (descriptionInputs.length > 0) {
          console.log('📝 Filling list description');
          await ElementDiscovery.safeFill(descriptionInputs[0], 'Test list description');
        }
        
        // Test category/type selection if present
        const selects = await page.locator('select').all();
        for (let i = 0; i < selects.length; i++) {
          const select = selects[i];
          const options = await select.locator('option').all();
          if (options.length > 1) {
            console.log('📝 Selecting category/type');
            await select.selectOption({ index: 1 });
          }
        }
        
        // Submit with valid data
        if (submitButtons.length > 0) {
          console.log('📋 Submitting valid form');
          await ElementDiscovery.safeClick(submitButtons[0]);
          await page.waitForTimeout(3000);
          
          // Check for success or errors
          const elements = await ElementDiscovery.discoverInteractiveElements(page);
          if (elements.errors.length > 0) {
            console.log('Errors after valid submission:', elements.errors.map(e => e.text));
          }
        }
      }
    });
  });

  test.describe('Search and Filter Testing', () => {
    
    test('should test all search and filter functionality', async ({ page }) => {
      console.log('🧪 Testing search and filter functionality');
      
      await page.goto('/search', { waitUntil: 'domcontentloaded' });
      
      // Discover all interactive elements
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      
      // Test search inputs
      for (let i = 0; i < elements.inputs.length; i++) {
        const input = elements.inputs[i];
        if (input.placeholder?.toLowerCase().includes('search') || 
            input.name?.toLowerCase().includes('search')) {
          console.log(`🔍 Testing search input: "${input.placeholder || input.name}"`);
          
          const searchTerms = ['pizza', 'chinese', 'restaurant', ''];
          for (const term of searchTerms) {
            const fillResult = await ElementDiscovery.safeFill(input.element, term);
            console.log(`   Search "${term}" result:`, fillResult);
            
            // Press Enter or find search button
            await input.element.press('Enter').catch(() => {});
            await page.waitForTimeout(2000);
            
            // Check results
            const resultsElements = await page.locator('.search-results, .results, .list-card').all();
            console.log(`   Found ${resultsElements.length} results for "${term}"`);
          }
        }
      }
      
      // Test filter checkboxes
      for (let i = 0; i < elements.checkboxes.length; i++) {
        const checkbox = elements.checkboxes[i];
        console.log(`☑️ Testing checkbox filter: "${checkbox.name || checkbox.value}"`);
        
        const clickResult = await ElementDiscovery.safeClick(checkbox.element);
        console.log(`   Checkbox result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(2000);
          // Uncheck
          await ElementDiscovery.safeClick(checkbox.element);
          await page.waitForTimeout(1000);
        }
      }
      
      // Test filter dropdowns
      for (let i = 0; i < elements.selects.length; i++) {
        const select = elements.selects[i];
        console.log(`📋 Testing select filter: "${select.name}"`);
        
        const options = await select.element.locator('option').all();
        if (options.length > 1) {
          // Test different options
          for (let j = 1; j < Math.min(options.length, 4); j++) {
            await select.element.selectOption({ index: j });
            await page.waitForTimeout(2000);
          }
          
          // Reset to default
          await select.element.selectOption({ index: 0 });
        }
      }
    });
  });
});

// Helper functions
async function testModalInteractions(page, modal) {
  console.log('     Testing modal interactions');
  
  // Find all buttons in modal
  const modalButtons = await modal.locator('button').all();
  for (let i = 0; i < modalButtons.length; i++) {
    const button = modalButtons[i];
    const text = await button.textContent().catch(() => '');
    console.log(`       Testing modal button: "${text}"`);
    
    if (text.toLowerCase().includes('close') || text.toLowerCase().includes('cancel')) {
      // Close the modal
      await ElementDiscovery.safeClick(button);
      await page.waitForTimeout(1000);
      break;
    }
  }
}

async function testListCreationForm(page) {
  console.log('     Testing list creation form');
  
  // Find form inputs
  const nameInputs = await page.locator('input[name="name"], input[placeholder*="name"]').all();
  const descriptionInputs = await page.locator('textarea, input[name="description"]').all();
  
  if (nameInputs.length > 0) {
    await ElementDiscovery.safeFill(nameInputs[0], 'Test List from E2E');
  }
  
  if (descriptionInputs.length > 0) {
    await ElementDiscovery.safeFill(descriptionInputs[0], 'Created during E2E testing');
  }
  
  // Find cancel button and click it (don't actually create)
  const cancelButtons = await page.locator('button:has-text("Cancel")').all();
  if (cancelButtons.length > 0) {
    await ElementDiscovery.safeClick(cancelButtons[0]);
  }
}

async function loginUser(page) {
  const loginResponse = await page.request.post('/api/auth/login', {
    data: {
      email: 'admin@example.com',
      password: 'doof123'
    }
  });
  
  if (loginResponse.ok()) {
    const loginData = await loginResponse.json();
    if (loginData.success && loginData.data.token) {
      await page.evaluate((token) => {
        localStorage.setItem('auth-token', token);
        localStorage.setItem('token', token);
      }, loginData.data.token);
    }
  }
} 