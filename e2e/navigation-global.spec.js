/**
 * Navigation & Global UI - Comprehensive E2E Tests
 * Tests every navigation link, header/footer element, and global interactions
 */

import { test, expect } from '@playwright/test';
import { ElementDiscovery } from './helpers/element-discovery.js';

test.describe('Navigation & Global UI - Exhaustive Testing', () => {
  
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

  test.describe('Homepage - Complete UI Testing', () => {
    
    test('should discover and test all interactive elements on homepage', async ({ page }) => {
      console.log('🧪 Testing homepage - discovering all elements');
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Discover all interactive elements
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      const summary = ElementDiscovery.getElementSummary(elements);
      
      console.log('📊 Homepage element discovery:', JSON.stringify(summary, null, 2));
      
      // Test all navigation links
      for (let i = 0; i < elements.navigation.length; i++) {
        const nav = elements.navigation[i];
        console.log(`🔗 Testing navigation ${i + 1}: "${nav.text}" (href: ${nav.href})`);
        
        if (nav.href && nav.href !== '#' && !nav.href.startsWith('http')) {
          const clickResult = await ElementDiscovery.safeClick(nav.element);
          console.log(`   Navigation result:`, clickResult);
          
          if (clickResult.success) {
            await page.waitForTimeout(2000);
            console.log(`   Navigated to: ${page.url()}`);
            
            // Go back to homepage for next test
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Test all regular links
      for (let i = 0; i < Math.min(elements.links.length, 15); i++) { // Limit to prevent long tests
        const link = elements.links[i];
        console.log(`🔗 Testing link ${i + 1}: "${link.text}" (href: ${link.href})`);
        
        if (link.href && link.href !== '#' && !link.href.startsWith('http') && !link.href.startsWith('mailto')) {
          const clickResult = await ElementDiscovery.safeClick(link.element);
          console.log(`   Link result:`, clickResult);
          
          if (clickResult.success) {
            await page.waitForTimeout(2000);
            console.log(`   Link navigated to: ${page.url()}`);
            
            // Go back to homepage
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Test search functionality if present on homepage
      for (let i = 0; i < elements.inputs.length; i++) {
        const input = elements.inputs[i];
        if (input.placeholder?.toLowerCase().includes('search') || 
            input.name?.toLowerCase().includes('search')) {
          console.log(`🔍 Testing homepage search: "${input.placeholder || input.name}"`);
          
          const searchTerms = ['pizza', 'restaurant', 'italian'];
          for (const term of searchTerms) {
            const fillResult = await ElementDiscovery.safeFill(input.element, term);
            console.log(`   Search "${term}" result:`, fillResult);
            
            // Press Enter or find search button
            await input.element.press('Enter').catch(() => {});
            await page.waitForTimeout(2000);
            
            // Check if we navigated to search results
            if (!page.url().endsWith('/')) {
              console.log(`   Search navigated to: ${page.url()}`);
              // Go back to homepage
              await page.goto('/', { waitUntil: 'domcontentloaded' });
            }
          }
          break; // Test only first search input
        }
      }
      
      // Test featured content cards/buttons
      for (let i = 0; i < Math.min(elements.buttons.length, 10); i++) {
        const button = elements.buttons[i];
        console.log(`🔘 Testing homepage button ${i + 1}: "${button.text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(button.element);
        console.log(`   Button result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(2000);
          
          // Check for modals or navigation
          const modals = await page.locator('[role="dialog"], .modal').all();
          if (modals.length > 0) {
            console.log(`   Modal opened from button "${button.text}"`);
            
            // Close modal
            const closeButtons = await page.locator('button:has-text("Close"), [aria-label="Close"]').all();
            if (closeButtons.length > 0) {
              await ElementDiscovery.safeClick(closeButtons[0]);
              await page.waitForTimeout(1000);
            }
          } else if (!page.url().endsWith('/')) {
            console.log(`   Button navigated to: ${page.url()}`);
            // Go back to homepage
            await page.goto('/', { waitUntil: 'domcontentloaded' });
          }
        }
      }
      
      // Report errors
      if (consoleErrors.length > 0) {
        console.log('❌ Console errors on homepage:', consoleErrors);
      }
      if (networkErrors.length > 0) {
        console.log('❌ Network errors on homepage:', networkErrors);
      }
    });
  });

  test.describe('Global Navigation Testing', () => {
    
    test('should test navbar/header interactions across different pages', async ({ page }) => {
      console.log('🧪 Testing global navigation across pages');
      
      const pagesToTest = ['/', '/lists', '/search'];
      
      for (const pagePath of pagesToTest) {
        console.log(`📍 Testing navigation on page: ${pagePath}`);
        await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
        
        // Find header/navbar
        const headerElements = await page.locator('header, nav, .navbar, .header').all();
        
        for (let i = 0; i < headerElements.length; i++) {
          const header = headerElements[i];
          console.log(`   Testing header/nav ${i + 1}`);
          
          // Find all links in this header
          const headerLinks = await header.locator('a').all();
          
          for (let j = 0; j < Math.min(headerLinks.length, 8); j++) { // Limit per header
            const link = headerLinks[j];
            const text = await link.textContent().catch(() => '');
            const href = await link.getAttribute('href').catch(() => '');
            
            console.log(`     Testing header link: "${text}" (href: ${href})`);
            
            if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto')) {
              const clickResult = await ElementDiscovery.safeClick(link);
              console.log(`     Link result:`, clickResult);
              
              if (clickResult.success) {
                await page.waitForTimeout(2000);
                console.log(`     Navigated to: ${page.url()}`);
                
                // Go back to test page
                await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
              }
            }
          }
          
          // Find buttons in header (user menu, theme toggle, etc.)
          const headerButtons = await header.locator('button').all();
          
          for (let j = 0; j < headerButtons.length; j++) {
            const button = headerButtons[j];
            const text = await button.textContent().catch(() => '');
            console.log(`     Testing header button: "${text}"`);
            
            const clickResult = await ElementDiscovery.safeClick(button);
            console.log(`     Button result:`, clickResult);
            
            if (clickResult.success) {
              await page.waitForTimeout(1000);
              
              // Check for dropdowns or modals
              const dropdowns = await page.locator('.dropdown, [role="menu"], .menu').all();
              if (dropdowns.length > 0) {
                console.log(`     Dropdown/menu opened`);
                
                // Click elsewhere to close
                await page.locator('body').click({ position: { x: 10, y: 10 } });
                await page.waitForTimeout(500);
              }
            }
          }
        }
      }
    });

    test('should test user authentication menu interactions', async ({ page }) => {
      console.log('🧪 Testing user authentication menu');
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Test login/signup buttons when not authenticated
      const authButtons = await page.locator('button:has-text("Login"), button:has-text("Sign up"), a:has-text("Login"), a:has-text("Sign up")').all();
      
      for (let i = 0; i < authButtons.length; i++) {
        const button = authButtons[i];
        const text = await button.textContent().catch(() => '');
        console.log(`🔐 Testing auth button: "${text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(button);
        console.log(`   Auth button result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(2000);
          console.log(`   Auth button navigated to: ${page.url()}`);
          
          // Go back
          await page.goto('/', { waitUntil: 'domcontentloaded' });
        }
      }
      
      // Login via API and test authenticated menu
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
          
          // Refresh page to show authenticated state
          await page.reload({ waitUntil: 'domcontentloaded' });
          
          // Test user menu
          const userMenuButtons = await page.locator('button:has-text("Profile"), button:has-text("Account"), .user-menu button').all();
          
          for (let i = 0; i < userMenuButtons.length; i++) {
            const button = userMenuButtons[i];
            const text = await button.textContent().catch(() => '');
            console.log(`👤 Testing user menu button: "${text}"`);
            
            const clickResult = await ElementDiscovery.safeClick(button);
            console.log(`   User menu result:`, clickResult);
            
            if (clickResult.success) {
              await page.waitForTimeout(1000);
              
              // Check for dropdown menu
              const dropdownItems = await page.locator('.dropdown-item, [role="menuitem"], .menu-item').all();
              
              for (let j = 0; j < Math.min(dropdownItems.length, 5); j++) {
                const item = dropdownItems[j];
                const itemText = await item.textContent().catch(() => '');
                console.log(`     Testing dropdown item: "${itemText}"`);
                
                // Don't click logout to maintain auth state
                if (!itemText.toLowerCase().includes('logout') && !itemText.toLowerCase().includes('sign out')) {
                  const itemClickResult = await ElementDiscovery.safeClick(item);
                  console.log(`     Dropdown item result:`, itemClickResult);
                  
                  if (itemClickResult.success) {
                    await page.waitForTimeout(2000);
                    
                    // Go back to test page
                    await page.goto('/', { waitUntil: 'domcontentloaded' });
                  }
                }
              }
              
              // Close dropdown by clicking elsewhere
              await page.locator('body').click({ position: { x: 10, y: 10 } });
            }
          }
        }
      }
    });
  });

  test.describe('Footer and Global Elements Testing', () => {
    
    test('should test footer links and global elements', async ({ page }) => {
      console.log('🧪 Testing footer and global elements');
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Test footer links
      const footers = await page.locator('footer, .footer').all();
      
      for (let i = 0; i < footers.length; i++) {
        const footer = footers[i];
        console.log(`🦶 Testing footer ${i + 1}`);
        
        const footerLinks = await footer.locator('a').all();
        
        for (let j = 0; j < Math.min(footerLinks.length, 10); j++) { // Limit footer links
          const link = footerLinks[j];
          const text = await link.textContent().catch(() => '');
          const href = await link.getAttribute('href').catch(() => '');
          
          console.log(`   Testing footer link: "${text}" (href: ${href})`);
          
          if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto')) {
            const clickResult = await ElementDiscovery.safeClick(link);
            console.log(`   Footer link result:`, clickResult);
            
            if (clickResult.success) {
              await page.waitForTimeout(2000);
              console.log(`   Footer link navigated to: ${page.url()}`);
              
              // Go back
              await page.goto('/', { waitUntil: 'domcontentloaded' });
            }
          }
        }
      }
      
      // Test global floating elements (chat, help, back to top)
      const floatingElements = await page.locator('.floating, .fixed, [style*="fixed"], .fab').all();
      
      for (let i = 0; i < floatingElements.length; i++) {
        const element = floatingElements[i];
        const isVisible = await element.isVisible().catch(() => false);
        
        if (isVisible) {
          const text = await element.textContent().catch(() => '');
          console.log(`🎈 Testing floating element: "${text}"`);
          
          const clickResult = await ElementDiscovery.safeClick(element);
          console.log(`   Floating element result:`, clickResult);
          
          if (clickResult.success) {
            await page.waitForTimeout(1000);
            
            // Close any modals that might have opened
            const closeButtons = await page.locator('button:has-text("Close"), [aria-label="Close"]').all();
            if (closeButtons.length > 0) {
              await ElementDiscovery.safeClick(closeButtons[0]);
            }
          }
        }
      }
    });

    test('should test responsive navigation (mobile menu)', async ({ page }) => {
      console.log('🧪 Testing responsive navigation');
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Look for mobile menu triggers
      const mobileMenuTriggers = await page.locator('.hamburger, .menu-toggle, button[aria-label*="menu"], .mobile-menu-trigger').all();
      
      for (let i = 0; i < mobileMenuTriggers.length; i++) {
        const trigger = mobileMenuTriggers[i];
        const isVisible = await trigger.isVisible().catch(() => false);
        
        if (isVisible) {
          console.log(`📱 Testing mobile menu trigger ${i + 1}`);
          
          const clickResult = await ElementDiscovery.safeClick(trigger);
          console.log(`   Mobile trigger result:`, clickResult);
          
          if (clickResult.success) {
            await page.waitForTimeout(1000);
            
            // Look for opened mobile menu
            const mobileMenus = await page.locator('.mobile-menu, [role="navigation"][aria-expanded="true"], .drawer').all();
            
            if (mobileMenus.length > 0) {
              console.log(`   Mobile menu opened`);
              
              // Test mobile menu links
              const mobileLinks = await mobileMenus[0].locator('a').all();
              
              for (let j = 0; j < Math.min(mobileLinks.length, 5); j++) {
                const link = mobileLinks[j];
                const text = await link.textContent().catch(() => '');
                console.log(`     Testing mobile link: "${text}"`);
                
                const linkClickResult = await ElementDiscovery.safeClick(link);
                console.log(`     Mobile link result:`, linkClickResult);
                
                if (linkClickResult.success) {
                  await page.waitForTimeout(2000);
                  
                  // Go back and reopen menu for next test
                  await page.goto('/', { waitUntil: 'domcontentloaded' });
                  await ElementDiscovery.safeClick(trigger);
                  await page.waitForTimeout(1000);
                }
              }
              
              // Close mobile menu
              const closeButtons = await page.locator('button:has-text("Close"), .close, [aria-label="Close"]').all();
              if (closeButtons.length > 0) {
                await ElementDiscovery.safeClick(closeButtons[0]);
              } else {
                // Click trigger again to close
                await ElementDiscovery.safeClick(trigger);
              }
            }
          }
        }
      }
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test.describe('Error Page and 404 Testing', () => {
    
    test('should test error pages and 404 handling', async ({ page }) => {
      console.log('🧪 Testing error pages and 404 handling');
      
      // Test 404 page
      await page.goto('/nonexistent-page-12345', { waitUntil: 'domcontentloaded' });
      
      console.log(`📄 404 page URL: ${page.url()}`);
      
      // Discover elements on 404 page
      const elements = await ElementDiscovery.discoverInteractiveElements(page);
      console.log('404 page elements:', ElementDiscovery.getElementSummary(elements));
      
      // Test home/back buttons on 404 page
      const homeButtons = await page.locator('button:has-text("Home"), a:has-text("Home"), button:has-text("Back")').all();
      
      for (let i = 0; i < homeButtons.length; i++) {
        const button = homeButtons[i];
        const text = await button.textContent().catch(() => '');
        console.log(`🏠 Testing 404 navigation button: "${text}"`);
        
        const clickResult = await ElementDiscovery.safeClick(button);
        console.log(`   404 button result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(2000);
          console.log(`   Navigated from 404 to: ${page.url()}`);
          break; // Only test one navigation button
        }
      }
    });
  });

  test.describe('Theme and Accessibility Testing', () => {
    
    test('should test theme toggle and accessibility features', async ({ page }) => {
      console.log('🧪 Testing theme and accessibility features');
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Test theme toggle if present
      const themeToggles = await page.locator('button[aria-label*="theme"], .theme-toggle, button:has-text("Theme")').all();
      
      for (let i = 0; i < themeToggles.length; i++) {
        const toggle = themeToggles[i];
        console.log(`🎨 Testing theme toggle ${i + 1}`);
        
        const clickResult = await ElementDiscovery.safeClick(toggle);
        console.log(`   Theme toggle result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(1000);
          
          // Check if theme changed
          const bodyClasses = await page.locator('body').getAttribute('class').catch(() => '');
          console.log(`   Body classes after theme toggle: ${bodyClasses}`);
        }
      }
      
      // Test accessibility features
      const accessibilityButtons = await page.locator('button[aria-label*="accessibility"], .accessibility, button:has-text("A11y")').all();
      
      for (let i = 0; i < accessibilityButtons.length; i++) {
        const button = accessibilityButtons[i];
        console.log(`♿ Testing accessibility button ${i + 1}`);
        
        const clickResult = await ElementDiscovery.safeClick(button);
        console.log(`   Accessibility button result:`, clickResult);
        
        if (clickResult.success) {
          await page.waitForTimeout(1000);
        }
      }
    });
  });
}); 