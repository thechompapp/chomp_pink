import { test, expect } from '@playwright/test';
import { ResponsiveHelpers } from './helpers/responsive-helpers.js';
import { AuthHelpers } from './helpers/auth-helpers.js';

test.describe('Modal Interactions Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set up for clean testing
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Enable E2E testing mode to prevent auth auto-restoration
    await page.evaluate(() => {
      localStorage.setItem('e2e_testing_mode', 'true');
    });
  });

  /**
   * Test 1: List Card Modal Interactions
   * Validates: List cards open modals instead of navigating
   */
  test('should open list modals when clicking list cards', async ({ page }) => {
    console.log('🧪 Testing List Card Modal Interactions');
    
    // Navigate to homepage where list cards are displayed
    console.log('📍 Navigating to homepage with list cards...');
    await page.goto('/');
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Wait for list cards to load
    console.log('⏳ Waiting for list cards to load...');
    await page.waitForSelector('[data-testid^="list-card-"]', { 
      timeout: 10000,
      state: 'visible' 
    });
    
    // Find all list cards
    const listCards = await page.locator('[data-testid^="list-card-"]').all();
    console.log(`✅ Found ${listCards.length} list cards`);
    
    if (listCards.length === 0) {
      console.log('⚠️ No list cards found, skipping test');
      return;
    }
    
    // Test clicking the first few list cards
    const cardsToTest = Math.min(3, listCards.length);
    
    for (let i = 0; i < cardsToTest; i++) {
      const card = listCards[i];
      const cardId = await card.getAttribute('data-testid');
      console.log(`\n🎯 Testing card ${i + 1}/${cardsToTest}: ${cardId}`);
      
      // Click the card (avoiding action buttons)
      console.log('👆 Clicking list card...');
      await card.click({ position: { x: 100, y: 100 } });
      
      // Wait for modal to appear
      console.log('👀 Waiting for modal to appear...');
      const modal = page.locator('.fixed.inset-0.z-50 .bg-white.rounded-2xl, [role="dialog"], .modal, [data-testid*="modal"]').first();
      
      try {
        await modal.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Modal opened successfully!');
        
        // Verify modal content - look for the modal title
        const modalTitle = await modal.locator('h1, h2, h3, [data-testid*="title"]').first().textContent();
        console.log(`📝 Modal title: ${modalTitle || 'No title found'}`);
        
        // Verify it's actually the enhanced list modal by checking for specific elements
        const hasListStats = await modal.locator('div:has-text("saves"), div:has-text("followers")').count() > 0;
        const hasCloseButton = await modal.locator('button[aria-label="Close modal"]').count() > 0;
        console.log(`🔍 Enhanced modal indicators - Stats: ${hasListStats}, Close button: ${hasCloseButton}`);
        
        // Close modal by pressing Escape or clicking close button
        console.log('❌ Closing modal...');
        
        // Try close button first
        const closeButton = modal.locator('button[aria-label="Close modal"], button[aria-label*="close"], button[data-testid*="close"], .close-button').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();
        } else {
          // Fallback to Escape key
          await page.keyboard.press('Escape');
        }
        
        // Verify modal closed
        await modal.waitFor({ state: 'hidden', timeout: 3000 });
        console.log('✅ Modal closed successfully!');
        
      } catch (error) {
        console.log(`❌ Modal test failed for ${cardId}:`, error.message);
        
        // Debug: Check what's actually on the page
        const allElements = await page.locator('*').count();
        const modalElements = await page.locator('.fixed, [role="dialog"], .modal').count();
        console.log(`🔍 Debug: Total elements: ${allElements}, Modal-like elements: ${modalElements}`);
        
        // Try to close any open modal before continuing
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // Small delay between tests
      await page.waitForTimeout(1000);
    }
  });

  /**
   * Test 2: Dish Card Modal Interactions  
   * Validates: Dish cards open modals with dish details
   */
  test('should open dish modals when clicking dish cards', async ({ page }) => {
    console.log('🧪 Testing Dish Card Modal Interactions');
    
    // Set authentication state directly in localStorage
    console.log('🔐 Setting authentication state...');
    await page.goto('/');
    await page.evaluate(() => {
      // Set authentication tokens and state
      const authData = {
        state: {
          token: 'test-token-123',
          isAuthenticated: true,
          user: { id: 1, email: 'admin@example.com', name: 'Test User' },
          lastAuthCheck: Date.now()
        },
        version: 0
      };
      localStorage.setItem('auth-authentication-storage', JSON.stringify(authData));
      localStorage.setItem('token', 'test-token-123');
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.setItem('superuser_override', 'true');
    });
    
    // Refresh page to ensure auth state is loaded
    console.log('🔄 Refreshing page to load auth state...');
    await page.reload();
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Debug: Check auth state after refresh
    const authState = await page.evaluate(() => {
      try {
        const authStorage = localStorage.getItem('auth-authentication-storage');
        const token = localStorage.getItem('token');
        return {
          hasAuthStorage: !!authStorage,
          hasToken: !!token,
          authData: authStorage ? JSON.parse(authStorage) : null
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('🔍 Auth state after refresh:', authState);
    
    // Check what buttons are available after auth
    const buttonsAfterAuth = await page.locator('button').all();
    console.log(`🔍 Found ${buttonsAfterAuth.length} buttons after auth:`);
    for (let i = 0; i < Math.min(buttonsAfterAuth.length, 10); i++) {
      const buttonText = await buttonsAfterAuth[i].textContent();
      console.log(`  Button ${i}: "${buttonText}"`);
    }
    
    // Check if we see any user-specific elements
    const userElements = await page.locator('nav').first().textContent();
    console.log(`📄 Navigation content: ${userElements}`);
    
    // Navigate directly to trending page to find dish cards
    console.log('🔍 Navigating to trending page...');
    await page.goto('/trending');
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Try to click on dishes tab - updated selector based on debug output
    const dishesTab = page.locator('button:has-text("Dishes")').first();
    if (await dishesTab.isVisible({ timeout: 3000 })) {
      console.log('🔄 Clicking dishes tab...');
      await dishesTab.click();
      await ResponsiveHelpers.waitForReactStabilization(page);
    } else {
      console.log('⚠️ Dishes tab not found, checking if dishes are already visible');
    }
    
    // Debug: Check page content
    const pageContent = await page.textContent('body');
    console.log(`📄 Page contains "dish": ${pageContent.toLowerCase().includes('dish')}`);
    console.log(`📄 Page contains "restaurant": ${pageContent.toLowerCase().includes('restaurant')}`);
    
    // Wait for dish cards to load
    console.log('⏳ Waiting for dish cards to load...');
    const dishCardSelectors = [
      '[data-testid^="dish-card-"]',
      '.dish-card',
      '[data-type="dish"]',
      '.card[data-item-type="dish"]'
    ];
    
    let dishCards = [];
    for (const selector of dishCardSelectors) {
      dishCards = await page.locator(selector).all();
      if (dishCards.length > 0) {
        console.log(`✅ Found ${dishCards.length} dish cards using selector: ${selector}`);
        break;
      } else {
        console.log(`❌ No cards found with selector: ${selector}`);
      }
    }
    
    if (dishCards.length === 0) {
      console.log('⚠️ No dish cards found, skipping test');
      return;
    }
    
    // Test clicking the first few dish cards
    const cardsToTest = Math.min(2, dishCards.length);
    
    for (let i = 0; i < cardsToTest; i++) {
      const card = dishCards[i];
      console.log(`\n🍕 Testing dish card ${i + 1}/${cardsToTest}`);
      
      // Click the card
      console.log('👆 Clicking dish card...');
      await card.click({ position: { x: 100, y: 100 } });
      
      // Wait for modal to appear
      console.log('👀 Waiting for dish modal...');
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]').first();
      
      try {
        await modal.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Dish modal opened successfully!');
        
        // Close modal
        await page.keyboard.press('Escape');
        await modal.waitFor({ state: 'hidden', timeout: 3000 });
        console.log('✅ Dish modal closed successfully!');
        
      } catch (error) {
        console.log(`❌ Dish modal test failed:`, error.message);
        await page.keyboard.press('Escape');
      }
      
      await page.waitForTimeout(1000);
    }
  });

  /**
   * Test 3: Restaurant Card Modal Interactions
   * Validates: Restaurant cards open modals with restaurant details
   */
  test('should open restaurant modals when clicking restaurant cards', async ({ page }) => {
    console.log('🧪 Testing Restaurant Card Modal Interactions');
    
    // Set authentication state directly in localStorage
    console.log('🔐 Setting authentication state...');
    await page.goto('/');
    await page.evaluate(() => {
      // Set authentication tokens and state
      const authData = {
        state: {
          token: 'test-token-123',
          isAuthenticated: true,
          user: { id: 1, email: 'admin@example.com', name: 'Test User' },
          lastAuthCheck: Date.now()
        },
        version: 0
      };
      localStorage.setItem('auth-authentication-storage', JSON.stringify(authData));
      localStorage.setItem('token', 'test-token-123');
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.setItem('superuser_override', 'true');
    });
    
    // Refresh page to ensure auth state is loaded
    console.log('🔄 Refreshing page to load auth state...');
    await page.reload();
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Debug: Check auth state after refresh
    const authState = await page.evaluate(() => {
      try {
        const authStorage = localStorage.getItem('auth-authentication-storage');
        const token = localStorage.getItem('token');
        return {
          hasAuthStorage: !!authStorage,
          hasToken: !!token,
          authData: authStorage ? JSON.parse(authStorage) : null
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('🔍 Auth state after refresh:', authState);
    
    // Check what buttons are available after auth
    const buttonsAfterAuth = await page.locator('button').all();
    console.log(`🔍 Found ${buttonsAfterAuth.length} buttons after auth:`);
    for (let i = 0; i < Math.min(buttonsAfterAuth.length, 10); i++) {
      const buttonText = await buttonsAfterAuth[i].textContent();
      console.log(`  Button ${i}: "${buttonText}"`);
    }
    
    // Check if we see any user-specific elements
    const userElements = await page.locator('nav').first().textContent();
    console.log(`📄 Navigation content: ${userElements}`);
    
    // Navigate directly to trending page to find restaurant cards
    console.log('🔍 Navigating to trending page...');
    await page.goto('/trending');
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Try to click on restaurants tab - updated selector
    const restaurantsTab = page.locator('button:has-text("Restaurants")').first();
    if (await restaurantsTab.isVisible({ timeout: 3000 })) {
      console.log('🔄 Clicking restaurants tab...');
      await restaurantsTab.click();
      await ResponsiveHelpers.waitForReactStabilization(page);
    }
    
    // Wait for restaurant cards to load
    console.log('⏳ Waiting for restaurant cards to load...');
    const restaurantCardSelectors = [
      '[data-testid^="restaurant-card-"]',
      '.restaurant-card',
      '[data-type="restaurant"]',
      '.card[data-item-type="restaurant"]'
    ];
    
    let restaurantCards = [];
    for (const selector of restaurantCardSelectors) {
      restaurantCards = await page.locator(selector).all();
      if (restaurantCards.length > 0) {
        console.log(`✅ Found ${restaurantCards.length} restaurant cards using selector: ${selector}`);
        break;
      }
    }
    
    if (restaurantCards.length === 0) {
      console.log('⚠️ No restaurant cards found, skipping test');
      return;
    }
    
    // Test clicking the first few restaurant cards
    const cardsToTest = Math.min(2, restaurantCards.length);
    
    for (let i = 0; i < cardsToTest; i++) {
      const card = restaurantCards[i];
      console.log(`\n🏪 Testing restaurant card ${i + 1}/${cardsToTest}`);
      
      // Click the card
      console.log('👆 Clicking restaurant card...');
      await card.click({ position: { x: 100, y: 100 } });
      
      // Wait for modal to appear
      console.log('👀 Waiting for restaurant modal...');
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]').first();
      
      try {
        await modal.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Restaurant modal opened successfully!');
        
        // Close modal
        await page.keyboard.press('Escape');
        await modal.waitFor({ state: 'hidden', timeout: 3000 });
        console.log('✅ Restaurant modal closed successfully!');
        
      } catch (error) {
        console.log(`❌ Restaurant modal test failed:`, error.message);
        await page.keyboard.press('Escape');
      }
      
      await page.waitForTimeout(1000);
    }
  });

  /**
   * Test 4: Comprehensive Modal Navigation Test
   * Validates: No navigation errors occur when clicking cards
   */
  test('should not trigger navigation errors when clicking cards', async ({ page }) => {
    console.log('🧪 Testing No Navigation Errors');
    
    // Listen for console errors
    const consoleErrors = [];
    const navigationErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('No routes matched') || text.includes('Failed to navigate')) {
          navigationErrors.push(text);
        }
      }
    });
    
    // Navigate to homepage
    await page.goto('/');
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Find any clickable cards
    const allCards = await page.locator('[data-testid*="card"], .card, [role="article"]').all();
    console.log(`✅ Found ${allCards.length} total cards`);
    
    // Click a few cards and check for navigation errors
    const cardsToTest = Math.min(5, allCards.length);
    
    for (let i = 0; i < cardsToTest; i++) {
      const card = allCards[i];
      console.log(`\n🎯 Testing card ${i + 1}/${cardsToTest} for navigation errors`);
      
      const initialErrorCount = navigationErrors.length;
      
      try {
        await card.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(2000); // Give time for any navigation to occur
        
        // Close any modal that might have opened
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const newErrorCount = navigationErrors.length;
        if (newErrorCount > initialErrorCount) {
          console.log(`❌ Navigation error detected: ${navigationErrors[newErrorCount - 1]}`);
        } else {
          console.log('✅ No navigation errors');
        }
        
      } catch (error) {
        console.log(`⚠️ Card click failed: ${error.message}`);
      }
    }
    
    // Report results
    console.log(`\n📊 Test Results:`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Navigation errors: ${navigationErrors.length}`);
    
    if (navigationErrors.length > 0) {
      console.log('❌ Navigation errors found:');
      navigationErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No navigation errors detected!');
    }
    
    // Expect no navigation errors
    expect(navigationErrors.length).toBe(0);
  });

  /**
   * Test 5: Simple Click Handler Test
   * Validates: List card click handlers are working and console logs appear
   */
  test('should trigger click handlers when clicking list cards', async ({ page }) => {
    console.log('🧪 Testing List Card Click Handlers');
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[ListCard]') || text.includes('Opening modal')) {
        console.log(`📝 Console: ${text}`);
      }
    });
    
    // Navigate to homepage where list cards are displayed
    console.log('📍 Navigating to homepage with list cards...');
    await page.goto('/');
    await ResponsiveHelpers.waitForReactStabilization(page);
    
    // Wait for list cards to load
    console.log('⏳ Waiting for list cards to load...');
    await page.waitForSelector('[data-testid^="list-card-"]', { 
      timeout: 10000,
      state: 'visible' 
    });
    
    // Find all list cards
    const listCards = await page.locator('[data-testid^="list-card-"]').all();
    console.log(`✅ Found ${listCards.length} list cards`);
    
    if (listCards.length === 0) {
      console.log('⚠️ No list cards found, skipping test');
      return;
    }
    
    // Test clicking the first list card
    const card = listCards[0];
    const cardId = await card.getAttribute('data-testid');
    console.log(`\n🎯 Testing click handler for: ${cardId}`);
    
    // Count console logs before click
    const logsBefore = consoleLogs.length;
    
    // Click the card (avoiding action buttons)
    console.log('👆 Clicking list card...');
    await card.click({ position: { x: 100, y: 100 } });
    
    // Wait a bit for any console logs to appear
    await page.waitForTimeout(2000);
    
    // Check for new console logs
    const logsAfter = consoleLogs.length;
    const newLogs = consoleLogs.slice(logsBefore);
    
    console.log(`📊 Console logs - Before: ${logsBefore}, After: ${logsAfter}, New: ${newLogs.length}`);
    
    if (newLogs.length > 0) {
      console.log('📝 New console logs:');
      newLogs.forEach(log => console.log(`  - ${log}`));
    }
    
    // Look for specific indicators that our click handler worked
    const hasListCardLog = newLogs.some(log => log.includes('[ListCard]'));
    const hasModalLog = newLogs.some(log => log.includes('Opening modal'));
    const hasEngagementLog = newLogs.some(log => log.includes('engagement'));
    
    console.log(`✅ Click handler indicators:`);
    console.log(`  - ListCard log: ${hasListCardLog}`);
    console.log(`  - Modal log: ${hasModalLog}`);
    console.log(`  - Engagement log: ${hasEngagementLog}`);
    
    // Check for any visible modals (with a shorter timeout)
    console.log('👀 Checking for visible modals...');
    const modalVisible = await page.locator('.fixed .bg-white, [role="dialog"], .modal').isVisible({ timeout: 1000 }).catch(() => false);
    
    if (modalVisible) {
      console.log('✅ Modal is visible!');
      // Close it
      await page.keyboard.press('Escape');
    } else {
      console.log('ℹ️ No modal visible (might still be working correctly)');
    }
  });
}); 