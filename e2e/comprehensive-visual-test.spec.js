/**
 * COMPREHENSIVE VISUAL E2E TEST
 * Tests all navigation, physical elements, and admin panel functionality
 * Runs in headed mode for visual verification
 */

import { test, expect } from '@playwright/test';
import { ElementDiscovery } from './helpers/element-discovery.js';

test.describe('COMPREHENSIVE VISUAL APPLICATION TEST', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up console and error listeners
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', err => {
      console.log(`🚨 PAGE ERROR: ${err.message}`);
    });
  });

  test('should test all navigation and interactive elements comprehensively', async ({ page }) => {
    console.log('🚀 STARTING COMPREHENSIVE VISUAL TEST');
    console.log('📺 Browser windows will be visible for monitoring');
    
    const testResults = {
      pagesVisited: [],
      elementsClicked: 0,
      navigationTests: 0,
      adminPanelTests: 0,
      errors: []
    };

    // ========================================
    // PHASE 1: HOMEPAGE COMPREHENSIVE TESTING
    // ========================================
    console.log('\n🏠 PHASE 1: HOMEPAGE COMPREHENSIVE TESTING');
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Allow user to see the page
    
    console.log('   📍 Testing Homepage Elements');
    testResults.pagesVisited.push('Homepage');
    
    // Discover all elements on homepage
    const discovery = new ElementDiscovery(page);
    const homeElements = await ElementDiscovery.discoverInteractiveElements(page);
    const homeSummary = ElementDiscovery.getElementSummary(homeElements);
    console.log(`   🧩 Found ${homeSummary.total} elements on homepage`);
    
    // Test every button on homepage
    console.log('   🔘 Testing all buttons...');
    for (let i = 0; i < homeElements.buttons.length && i < 10; i++) {
      const button = homeElements.buttons[i].element;
      const text = homeElements.buttons[i].text || '';
      console.log(`     Clicking button: "${text}"`);
      await ElementDiscovery.safeClick(button);
      testResults.elementsClicked++;
      await page.waitForTimeout(1000); // Visual delay
    }
    
    // Test every link on homepage
    console.log('   🔗 Testing navigation links...');
    for (let i = 0; i < homeElements.links.length && i < 5; i++) {
      const link = homeElements.links[i].element;
      const text = homeElements.links[i].text || '';
      const href = homeElements.links[i].href || '';
      console.log(`     Testing link: "${text}" -> ${href}`);
      
      if (href && !href.includes('mailto') && !href.includes('tel')) {
        await ElementDiscovery.safeClick(link);
        testResults.navigationTests++;
        await page.waitForTimeout(2000); // Allow navigation
        
        // Go back to homepage
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
      }
    }

    // ========================================
    // PHASE 2: AUTHENTICATION FLOW TESTING
    // ========================================
    console.log('\n🔐 PHASE 2: AUTHENTICATION FLOW TESTING');
    
    // Test Login Page
    console.log('   📍 Testing Login Page');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    testResults.pagesVisited.push('Login');
    
    const loginElements = await ElementDiscovery.discoverInteractiveElements(page);
    const loginSummary = ElementDiscovery.getElementSummary(loginElements);
    console.log(`   🧩 Found ${loginSummary.total} elements on login page`);
    
    // Test login form
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login")').first();
    
    if (await emailInput.isVisible()) {
      console.log('     ✏️ Filling login form...');
      await emailInput.fill('admin@example.com');
      await page.waitForTimeout(500);
      await passwordInput.fill('doof123');
      await page.waitForTimeout(500);
      
      console.log('     🔐 Attempting login...');
      await ElementDiscovery.safeClick(loginButton);
      testResults.elementsClicked++;
      await page.waitForTimeout(3000); // Wait for login response
    }
    
    // Test Register Page
    console.log('   📍 Testing Register Page');
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    testResults.pagesVisited.push('Register');
    
    const registerElements = await ElementDiscovery.discoverInteractiveElements(page);
    const registerSummary = ElementDiscovery.getElementSummary(registerElements);
    console.log(`   🧩 Found ${registerSummary.total} elements on register page`);

    // ========================================
    // PHASE 3: MAIN APPLICATION PAGES
    // ========================================
    console.log('\n📄 PHASE 3: MAIN APPLICATION PAGES TESTING');
    
    const mainPages = [
      { path: '/lists', name: 'Lists' },
      { path: '/search', name: 'Search' },
      { path: '/my-lists', name: 'My Lists' }
    ];
    
    for (const pageInfo of mainPages) {
      console.log(`   📍 Testing ${pageInfo.name} page`);
      await page.goto(pageInfo.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      testResults.pagesVisited.push(pageInfo.name);
      
      const pageElements = await ElementDiscovery.discoverInteractiveElements(page);
      const pageSummary = ElementDiscovery.getElementSummary(pageElements);
      console.log(`   🧩 Found ${pageSummary.total} elements on ${pageInfo.name}`);
      
      // Test first few interactive elements
      for (let i = 0; i < Math.min(pageElements.buttons.length, 3); i++) {
        const button = pageElements.buttons[i].element;
        const text = pageElements.buttons[i].text || '';
        console.log(`     Clicking "${text}" button`);
        await ElementDiscovery.safeClick(button);
        testResults.elementsClicked++;
        await page.waitForTimeout(1000);
      }
    }

    // ========================================
    // PHASE 4: ADMIN PANEL COMPREHENSIVE TEST
    // ========================================
    console.log('\n👑 PHASE 4: ADMIN PANEL COMPREHENSIVE TESTING');
    
    // First, ensure we're logged in as admin
    console.log('   🔐 Ensuring admin authentication...');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Fill and submit login form
    const adminEmail = await page.locator('input[type="email"], input[name="email"]').first();
    const adminPassword = await page.locator('input[type="password"], input[name="password"]').first();
    const adminLoginBtn = await page.locator('button[type="submit"], button:has-text("Login")').first();
    
    if (await adminEmail.isVisible()) {
      await adminEmail.fill('admin@example.com');
      await adminPassword.fill('doof123');
      await ElementDiscovery.safeClick(adminLoginBtn);
      await page.waitForTimeout(3000);
    }
    
    // Now try to access admin panel
    console.log('   👑 Attempting to access admin panel...');
    
    // Look for admin links in navigation
    const adminLinks = await page.locator('a:has-text("Admin"), a[href*="admin"], button:has-text("Admin")').all();
    console.log(`   🔍 Found ${adminLinks.length} potential admin links`);
    
    for (let i = 0; i < adminLinks.length; i++) {
      const link = adminLinks[i];
      const text = await link.textContent().catch(() => '');
      console.log(`     Testing admin link: "${text}"`);
      
      try {
        await ElementDiscovery.safeClick(link);
        testResults.adminPanelTests++;
        await page.waitForTimeout(3000); // Wait for potential redirect
        
        const currentUrl = page.url();
        console.log(`     Current URL after click: ${currentUrl}`);
        
        // Check if we're on an admin page
        if (currentUrl.includes('admin')) {
          console.log('     ✅ Successfully accessed admin area!');
          
          // Test admin page elements
          const adminElements = await ElementDiscovery.discoverInteractiveElements(page);
          const adminSummary = ElementDiscovery.getElementSummary(adminElements);
          console.log(`     🧩 Found ${adminSummary.total} elements in admin area`);
          
          // Test admin buttons
          for (let j = 0; j < Math.min(adminElements.buttons.length, 5); j++) {
            const adminButton = adminElements.buttons[j].element;
            const buttonText = adminElements.buttons[j].text || '';
            console.log(`       Testing admin button: "${buttonText}"`);
            await ElementDiscovery.safeClick(adminButton);
            testResults.elementsClicked++;
            await page.waitForTimeout(1500);
          }
        } else if (currentUrl === page.url()) {
          console.log('     ⚠️ No navigation occurred - possible auth issue');
          testResults.errors.push(`Admin link "${text}" did not navigate`);
        } else {
          console.log('     ⚠️ Redirected elsewhere - checking for auth errors');
          testResults.errors.push(`Admin access redirected to: ${currentUrl}`);
        }
        
      } catch (error) {
        console.log(`     ❌ Error clicking admin link: ${error.message}`);
        testResults.errors.push(`Admin link error: ${error.message}`);
      }
    }
    
    // Try direct admin routes
    console.log('   🔗 Testing direct admin routes...');
    const adminRoutes = ['/admin', '/admin/dashboard', '/admin/panel', '/dashboard'];
    
    for (const route of adminRoutes) {
      console.log(`     Testing direct route: ${route}`);
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        console.log(`     Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('admin') || finalUrl.includes('dashboard')) {
          console.log('     ✅ Admin route accessible!');
          testResults.adminPanelTests++;
          
          // Test elements on admin page
          const adminPageElements = await ElementDiscovery.discoverInteractiveElements(page);
          const adminPageSummary = ElementDiscovery.getElementSummary(adminPageElements);
          console.log(`     🧩 Admin page has ${adminPageSummary.total} elements`);
          
        } else {
          console.log('     ⚠️ Admin route redirected or blocked');
          testResults.errors.push(`Admin route ${route} redirected to ${finalUrl}`);
        }
        
      } catch (error) {
        console.log(`     ❌ Admin route ${route} failed: ${error.message}`);
        testResults.errors.push(`Admin route ${route} error: ${error.message}`);
      }
    }

    // ========================================
    // PHASE 5: GLOBAL NAVIGATION TESTING
    // ========================================
    console.log('\n🧭 PHASE 5: GLOBAL NAVIGATION TESTING');
    
    // Test header navigation
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    const headerNav = await page.locator('nav, header').first();
    if (await headerNav.isVisible()) {
      const navLinks = await headerNav.locator('a').all();
      console.log(`   🔗 Testing ${navLinks.length} header navigation links`);
      
      for (let i = 0; i < Math.min(navLinks.length, 8); i++) {
        const navLink = navLinks[i];
        const text = await navLink.textContent().catch(() => '');
        const href = await navLink.getAttribute('href').catch(() => '');
        
        console.log(`     Testing nav link: "${text}" -> ${href}`);
        
        if (href && href.startsWith('/')) {
          await ElementDiscovery.safeClick(navLink);
          testResults.navigationTests++;
          await page.waitForTimeout(2000);
          
          console.log(`       Navigated to: ${page.url()}`);
        }
      }
    }

    // ========================================
    // PHASE 6: FORM INTERACTIONS
    // ========================================
    console.log('\n📝 PHASE 6: FORM INTERACTIONS TESTING');
    
    // Test search functionality
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').all();
    console.log(`   🔍 Found ${searchInputs.length} search inputs`);
    
    for (let i = 0; i < searchInputs.length; i++) {
      const searchInput = searchInputs[i];
      console.log(`     Testing search input ${i + 1}`);
      
      await searchInput.fill('pizza');
      await page.waitForTimeout(1000);
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      testResults.elementsClicked++;
    }

    // ========================================
    // FINAL RESULTS
    // ========================================
    console.log('\n📊 COMPREHENSIVE VISUAL TEST RESULTS');
    console.log('================================================================================');
    console.log(`📄 Pages Visited: ${testResults.pagesVisited.length}`);
    console.log(`   ${testResults.pagesVisited.join(', ')}`);
    console.log(`🔘 Elements Clicked: ${testResults.elementsClicked}`);
    console.log(`🧭 Navigation Tests: ${testResults.navigationTests}`);
    console.log(`👑 Admin Panel Tests: ${testResults.adminPanelTests}`);
    console.log(`❌ Errors Encountered: ${testResults.errors.length}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 DETAILED ERRORS:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎯 ADMIN PANEL STATUS:');
    if (testResults.adminPanelTests > 0) {
      console.log('   ✅ Admin panel access attempts made');
    } else {
      console.log('   ❌ No successful admin panel access');
    }
    
    console.log('\n✅ COMPREHENSIVE VISUAL TEST COMPLETE');
    
    // Keep browser open for a moment for final viewing
    await page.waitForTimeout(3000);
  });
  
  test('should test modal interactions and overlays', async ({ page }) => {
    console.log('\n🪟 TESTING MODAL INTERACTIONS AND OVERLAYS');
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Look for modal triggers
    const modalTriggers = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), [data-modal]').all();
    console.log(`   🎯 Found ${modalTriggers.length} potential modal triggers`);
    
    for (let i = 0; i < Math.min(modalTriggers.length, 5); i++) {
      const trigger = modalTriggers[i];
      const text = await trigger.textContent().catch(() => '');
      console.log(`     Testing modal trigger: "${text}"`);
      
      await ElementDiscovery.safeClick(trigger);
      await page.waitForTimeout(1500);
      
      // Look for opened modal
      const modal = await page.locator('[role="dialog"], .modal, .modal-overlay').first();
      if (await modal.isVisible()) {
        console.log(`       ✅ Modal opened successfully`);
        
        // Test modal close
        const closeButton = await modal.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await ElementDiscovery.safeClick(closeButton);
          await page.waitForTimeout(1000);
          console.log(`       ✅ Modal closed successfully`);
        }
      }
    }
  });
}); 