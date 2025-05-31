/**
 * Authentication Flows - Comprehensive E2E Tests
 * Tests every interactive element in login/register flows
 */

import { test, expect } from '@playwright/test';
import { ElementDiscovery } from './helpers/element-discovery.js';

test.describe('Authentication Flows - Exhaustive UI Testing', () => {
  
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

  test.describe('Login Page - Complete UI Interaction Testing', () => {
    
    test('should discover and test all interactive elements on login page', async ({ page }) => {
      console.log('🧪 Testing login page - discovering all elements');
      
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      
      // Discover all interactive elements
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      const summary = ElementDiscovery.getElementSummary(elements);
      
      console.log('📊 Login page element discovery:', JSON.stringify(summary, null, 2));
      
      // Test each button found
      for (let i = 0; i < elements.buttons.length; i++) {
        const button = elements.buttons[i];
        console.log(`🔘 Testing button ${i + 1}: "${button.text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(button.element);
        console.log(`   Click result:`, clickResult);
        
        // Wait for any potential UI changes
        await page.waitForTimeout(1000);
        
        // Check for new error messages after click
        const postClickElements = await ElementDiscovery.discoverInteractiveElements(page);
        if (postClickElements.errors.length > 0) {
          console.log(`   Errors after clicking "${button.text}":`, 
            postClickElements.errors.map(e => e.text));
        }
      }
      
      // Test each input field
      for (let i = 0; i < elements.inputs.length; i++) {
        const input = elements.inputs[i];
        console.log(`📝 Testing input ${i + 1}: "${input.name || input.placeholder}"`);
        
        // Test with valid data
        let testValue = 'test@example.com';
        if (input.inputType === 'password') {
          testValue = 'testPassword123';
        } else if (input.inputType === 'text') {
          testValue = 'Test User';
        }
        
        const fillResult = await ElementDiscovery.safeFill(input.element, testValue);
        console.log(`   Fill result:`, fillResult);
        
        // Test with invalid data for certain fields
        if (input.inputType === 'email') {
          const invalidResult = await ElementDiscovery.safeFill(input.element, 'invalid-email');
          console.log(`   Invalid email test:`, invalidResult);
          
          // Look for validation errors
          await page.waitForTimeout(500);
          const errorElements = await ElementDiscovery.discoverInteractiveElements(page);
          if (errorElements.errors.length > 0) {
            console.log(`   Validation errors:`, errorElements.errors.map(e => e.text));
          }
        }
        
        // Clear the field
        await ElementDiscovery.safeFill(input.element, '');
      }
      
      // Test forms (complete login flow)
      if (elements.forms.length > 0) {
        console.log(`📋 Testing ${elements.forms.length} form(s)`);
        
        for (let i = 0; i < elements.forms.length; i++) {
          const form = elements.forms[i];
          console.log(`   Testing form ${i + 1} (action: ${form.action})`);
          
          // Fill form with valid data
          const emailInputs = await page.locator('input[type="email"]').all();
          const passwordInputs = await page.locator('input[type="password"]').all();
          
          if (emailInputs.length > 0) {
            await ElementDiscovery.safeFill(emailInputs[0], 'admin@example.com');
          }
          if (passwordInputs.length > 0) {
            await ElementDiscovery.safeFill(passwordInputs[0], 'doof123');
          }
          
          // Find and click submit button
          const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').all();
          if (submitButtons.length > 0) {
            console.log(`   Submitting form with valid credentials`);
            const submitResult = await ElementDiscovery.safeClick(submitButtons[0]);
            console.log(`   Submit result:`, submitResult);
            
            // Wait for response
            await page.waitForTimeout(3000);
            
            // Check for navigation or error messages
            const currentUrl = page.url();
            console.log(`   URL after submit: ${currentUrl}`);
            
            // Check for any error messages
            const postSubmitElements = await ElementDiscovery.discoverInteractiveElements(page);
            if (postSubmitElements.errors.length > 0) {
              console.log(`   Errors after submit:`, postSubmitElements.errors.map(e => e.text));
            }
          }
        }
      }
      
      // Report any console or network errors
      if (consoleErrors.length > 0) {
        console.log('❌ Console errors detected:', consoleErrors);
      }
      if (networkErrors.length > 0) {
        console.log('❌ Network errors detected:', networkErrors);
      }
      
      // Basic assertions
      expect(elements.buttons.length + elements.inputs.length + elements.forms.length).toBeGreaterThan(0);
    });

    test('should test empty form submission and capture validation errors', async ({ page }) => {
      console.log('🧪 Testing empty form submission');
      
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      
      // Find submit button and click without filling form
      const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').all();
      
      if (submitButtons.length > 0) {
        console.log('📋 Submitting empty form');
        const clickResult = await ElementDiscovery.safeClick(submitButtons[0]);
        console.log('Submit result:', clickResult);
        
        // Wait for validation messages
        await page.waitForTimeout(2000);
        
        // Check for validation errors
        const elements = await ElementDiscovery.discoverInteractiveElements(page);
        console.log('Validation errors found:', elements.errors.map(e => e.text));
        
        // Should not navigate away on empty form
        expect(page.url()).toContain('/login');
      }
    });

    test('should test invalid credentials and capture error messages', async ({ page }) => {
      console.log('🧪 Testing invalid credentials');
      
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      
      // Fill with invalid credentials
      const emailInputs = await page.locator('input[type="email"]').all();
      const passwordInputs = await page.locator('input[type="password"]').all();
      
      if (emailInputs.length > 0 && passwordInputs.length > 0) {
        await ElementDiscovery.safeFill(emailInputs[0], 'invalid@example.com');
        await ElementDiscovery.safeFill(passwordInputs[0], 'wrongpassword');
        
        const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').all();
        if (submitButtons.length > 0) {
          console.log('📋 Submitting invalid credentials');
          await ElementDiscovery.safeClick(submitButtons[0]);
          
          // Wait for error response
          await page.waitForTimeout(3000);
          
          // Check for error messages
          const elements = await ElementDiscovery.discoverInteractiveElements(page);
          console.log('Error messages after invalid login:', elements.errors.map(e => e.text));
          
          // Should remain on login page
          expect(page.url()).toContain('/login');
        }
      }
    });
  });

  test.describe('Register Page - Complete UI Interaction Testing', () => {
    
    test('should discover and test all interactive elements on register page', async ({ page }) => {
      console.log('🧪 Testing register page - discovering all elements');
      
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      
      // Discover all interactive elements
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      const summary = ElementDiscovery.getElementSummary(elements);
      
      console.log('📊 Register page element discovery:', JSON.stringify(summary, null, 2));
      
      // Test each input field with various data
      for (let i = 0; i < elements.inputs.length; i++) {
        const input = elements.inputs[i];
        console.log(`📝 Testing input ${i + 1}: "${input.name || input.placeholder}"`);
        
        let testValue = 'test';
        if (input.inputType === 'email') {
          testValue = 'newuser@example.com';
        } else if (input.inputType === 'password') {
          testValue = 'strongPassword123!';
        } else if (input.name === 'name' || input.placeholder?.includes('name')) {
          testValue = 'Test User';
        }
        
        const fillResult = await ElementDiscovery.safeFill(input.element, testValue);
        console.log(`   Fill result:`, fillResult);
      }
      
      // Test each button
      for (let i = 0; i < elements.buttons.length; i++) {
        const button = elements.buttons[i];
        if (button.text.toLowerCase().includes('register') || button.text.toLowerCase().includes('sign up')) {
          console.log(`🔘 Testing register button: "${button.text}"`);
          
          const clickResult = await ElementDiscovery.safeClick(button.element);
          console.log(`   Click result:`, clickResult);
          
          // Wait for response
          await page.waitForTimeout(3000);
          
          // Check for any messages
          const postClickElements = await ElementDiscovery.discoverInteractiveElements(page);
          if (postClickElements.errors.length > 0) {
            console.log(`   Messages after registration attempt:`, 
              postClickElements.errors.map(e => e.text));
          }
          
          break; // Only test one register button
        }
      }
      
      // Report errors
      if (consoleErrors.length > 0) {
        console.log('❌ Console errors on register page:', consoleErrors);
      }
      if (networkErrors.length > 0) {
        console.log('❌ Network errors on register page:', networkErrors);
      }
    });

    test('should test password confirmation validation', async ({ page }) => {
      console.log('🧪 Testing password confirmation validation');
      
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      
      // Find password fields
      const passwordInputs = await page.locator('input[type="password"]').all();
      
      if (passwordInputs.length >= 2) {
        console.log('📝 Testing mismatched passwords');
        
        // Fill with mismatched passwords
        await ElementDiscovery.safeFill(passwordInputs[0], 'password123');
        await ElementDiscovery.safeFill(passwordInputs[1], 'differentpassword');
        
        // Try to submit
        const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').all();
        if (submitButtons.length > 0) {
          await ElementDiscovery.safeClick(submitButtons[0]);
          
          // Wait for validation
          await page.waitForTimeout(2000);
          
          // Check for validation errors
          const elements = await ElementDiscovery.discoverInteractiveElements(page);
          console.log('Password mismatch errors:', elements.errors.map(e => e.text));
        }
      }
    });
  });

  test.describe('Navigation and Link Testing', () => {
    
    test('should test all navigation links in auth pages', async ({ page }) => {
      console.log('🧪 Testing navigation links in auth pages');
      
      const pages = ['/login', '/register'];
      
      for (const pagePath of pages) {
        console.log(`📍 Testing navigation on ${pagePath}`);
        await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
        
        const elements = await ElementDiscovery.discoverInteractiveElements(page);
        
        // Test navigation links
        for (let i = 0; i < elements.navigation.length; i++) {
          const nav = elements.navigation[i];
          console.log(`🔗 Testing nav link ${i + 1}: "${nav.text}" (href: ${nav.href})`);
          
          if (nav.href && !nav.href.startsWith('http') && nav.href !== '#') {
            const clickResult = await ElementDiscovery.safeClick(nav.element);
            console.log(`   Navigation result:`, clickResult);
            
            if (clickResult.success) {
              // Wait for navigation
              await page.waitForTimeout(2000);
              console.log(`   Navigated to: ${page.url()}`);
              
              // Go back to continue testing
              await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
            }
          }
        }
        
        // Test regular links that might be auth-related
        for (let i = 0; i < elements.links.length; i++) {
          const link = elements.links[i];
          if (link.text.toLowerCase().includes('forgot') || 
              link.text.toLowerCase().includes('sign') ||
              link.text.toLowerCase().includes('login') ||
              link.text.toLowerCase().includes('register')) {
            console.log(`🔗 Testing auth link: "${link.text}" (href: ${link.href})`);
            
            const clickResult = await ElementDiscovery.safeClick(link.element);
            console.log(`   Link click result:`, clickResult);
            
            if (clickResult.success) {
              await page.waitForTimeout(2000);
              console.log(`   Link navigated to: ${page.url()}`);
              
              // Go back
              await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
            }
          }
        }
      }
    });
  });
}); 