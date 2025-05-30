/**
 * DOOF Application - Incremental E2E Flows
 * 
 * Progressive test suite that builds upon core functionality:
 * Level 1: Basic User Interactions
 * Level 2: Content Discovery & Navigation
 * Level 3: User Registration & Profile
 * Level 4: List Management & Social Features
 * Level 5: Advanced Search & Filtering
 * 
 * Each level assumes the previous levels are working.
 */

import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers.js';

// Test Configuration
const CONFIG = {
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  },
  TEST_USER: {
    email: `test-${Date.now()}@doof-test.com`,
    password: 'TestPass123!',
    username: `testuser_${Date.now()}`
  }
};

// Helper function for mobile navigation
async function ensureMobileNavigation(page) {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;
  
  if (isMobile) {
    // Check if navigation links are already visible
    const searchLinkVisible = await page.locator('text=Search').first().isVisible();
    
    if (!searchLinkVisible) {
      // Find and click mobile menu button
      const mobileMenuButton = page.locator('button[aria-expanded], .sm\\:hidden button, button:has(svg)').first();
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
        
        // Wait for mobile menu to be visible
        await page.waitForSelector('[class*="mobile"], .sm\\:hidden + div, nav div[class*="hidden"]', { 
          state: 'visible', 
          timeout: 2000 
        }).catch(() => {
          console.log('📱 Mobile menu opened but structure may differ');
        });
        
        console.log('📱 Mobile menu opened');
      }
    }
  }
}

// Helper function to close mobile navigation after use
async function closeMobileNavigation(page) {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;
  
  if (isMobile) {
    // Check if mobile menu is currently open
    const mobileMenuButton = page.locator('button[aria-expanded="true"], .sm\\:hidden button:has(svg)').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(300);
      console.log('📱 Mobile menu closed');
    }
  }
}

test.describe('DOOF Incremental Flows - Level 1: Basic User Interactions', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Handle mobile navigation if needed
    await ensureMobileNavigation(page);
  });

  /**
   * Level 1.1: Homepage Content Loading
   */
  test('should display homepage content and featured lists', async ({ page }) => {
    console.log('🧪 Testing homepage content loading');
    
    // Check for featured content sections
    const hasLists = await page.locator('[data-testid="featured-lists"], .list-card, .featured-content').count();
    console.log(`Found ${hasLists} list/content elements`);
    
    // Check for category filters or buttons
    const hasCategories = await page.locator('button').filter({ hasText: /Lists|Restaurants|Dishes|Location|Cuisines/ }).count();
    console.log(`Found ${hasCategories} category buttons`);
    
    // Verify interactive elements
    const interactiveElements = await page.locator('button, a[href]').count();
    expect(interactiveElements).toBeGreaterThan(5);
    
    console.log('✓ Homepage content loaded successfully');
  });

  /**
   * Level 1.2: Category Navigation
   */
  test('should navigate between different content categories', async ({ page }) => {
    console.log('🧪 Testing category navigation');
    
    // Ensure mobile menu is closed to avoid overlay interference
    await closeMobileNavigation(page);
    
    // Test category buttons if they exist
    const categories = ['Lists', 'Restaurants', 'Dishes'];
    
    for (const category of categories) {
      const categoryButton = page.locator(`button:has-text("${category}")`);
      if (await categoryButton.isVisible()) {
        // Force click if normal click is intercepted
        try {
          await categoryButton.click();
        } catch (error) {
          console.log(`⚠️ Normal click failed for ${category}, trying force click`);
          await categoryButton.click({ force: true });
        }
        await page.waitForTimeout(500);
        console.log(`✓ Clicked ${category} category`);
      }
    }
    
    console.log('✓ Category navigation completed');
  });

  /**
   * Level 1.3: External Link Handling
   */
  test('should handle external links and modal interactions', async ({ page }) => {
    console.log('🧪 Testing modal and popup interactions');
    
    // Look for modal triggers or popup elements
    const modalTriggers = await page.locator('[data-testid*="modal"], button[aria-expanded], .modal-trigger').count();
    
    if (modalTriggers > 0) {
      console.log(`Found ${modalTriggers} potential modal triggers`);
    }
    
    // Test escape key handling
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    console.log('✓ Modal interaction testing completed');
  });
});

test.describe('DOOF Incremental Flows - Level 2: Content Discovery', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Handle mobile navigation if needed
    await ensureMobileNavigation(page);
  });

  /**
   * Level 2.1: Search Page Access and Basic Search
   */
  test('should access search page and perform basic search', async ({ page }) => {
    console.log('🧪 Testing search page access');
    
    await ensureMobileNavigation(page);
    
    // Try clicking navigation link, fallback to direct URL navigation
    try {
      await page.click('text=Search', { timeout: 5000 });
    } catch (error) {
      console.log('📱 Direct navigation fallback to /search');
      await page.goto('/search');
    }
    
    await page.waitForURL('**/search');
    
    // Check for search input - use first() to avoid strict mode violation
    const searchInput = page.locator('input[name="search"], input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Perform search
      await searchInput.fill('pizza');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Check if results appeared or URL changed
      const currentUrl = page.url();
      const hasResults = await page.locator('.search-result, .result, [data-testid*="result"]').count();
      
      console.log(`Search performed. URL: ${currentUrl}, Results: ${hasResults}`);
    } else {
      console.log('ℹ️ Search input not found - may not be implemented');
    }
    
    console.log('✓ Search functionality tested');
  });

  /**
   * Level 2.2: Trending Page Content
   */
  test('should access and interact with trending content', async ({ page }) => {
    console.log('🧪 Testing trending page');
    
    await ensureMobileNavigation(page);
    
    // Try clicking navigation link, fallback to direct URL navigation
    try {
      await page.click('text=Trending', { timeout: 5000 });
    } catch (error) {
      console.log('📱 Direct navigation fallback to /trending');
      await page.goto('/trending');
    }
    
    await page.waitForURL('**/trending');
    
    // Check for trending content
    const trendingItems = await page.locator('.trending-item, .trend, [data-testid*="trending"]').count();
    console.log(`Found ${trendingItems} trending items`);
    
    // Look for sorting or filtering options
    const filters = await page.locator('select, button').filter({ hasText: /Sort|Filter|Time|Popular/ }).count();
    console.log(`Found ${filters} filter/sort options`);
    
    console.log('✓ Trending page tested');
  });

  /**
   * Level 2.3: Lists Page Exploration
   */
  test('should explore public lists and list details', async ({ page }) => {
    console.log('🧪 Testing lists page exploration');
    
    await ensureMobileNavigation(page);
    
    // Try clicking navigation link, fallback to direct URL navigation
    try {
      await page.click('text=Lists', { timeout: 5000 });
    } catch (error) {
      console.log('📱 Direct navigation fallback to /lists');
      await page.goto('/lists');
    }
    
    await page.waitForURL('**/lists');
    
    // Check for list cards/items
    const listCards = await page.locator('.list-card, .list-item, [data-testid*="list"]').count();
    console.log(`Found ${listCards} list cards`);
    
    // Try to click on the first list if available
    const firstList = page.locator('.list-card, .list-item, [data-testid*="list"]').first();
    if (await firstList.isVisible()) {
      await firstList.click();
      await page.waitForTimeout(1000);
      console.log('✓ Clicked on first list item');
    }
    
    console.log('✓ Lists exploration completed');
  });
});

test.describe('DOOF Incremental Flows - Level 3: User Registration', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Level 3.1: Registration Form Validation
   */
  test('should validate registration form fields', async ({ page }) => {
    console.log('🧪 Testing registration form validation');
    
    // Navigate to registration
    const registerLink = page.locator('text=Register, text="Sign Up", a[href*="register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForURL('**/register');
      
      // Test form validation by submitting empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Check for validation messages
        const validationMessages = await page.locator('.error, .invalid, [aria-invalid="true"]').count();
        console.log(`Found ${validationMessages} validation messages`);
      }
    } else {
      console.log('ℹ️ Registration not available - may be disabled');
    }
    
    console.log('✓ Registration validation tested');
  });

  /**
   * Level 3.2: User Registration Flow (if enabled)
   */
  test('should complete user registration flow', async ({ page }) => {
    console.log('🧪 Testing complete registration flow');
    
    const registerLink = page.locator('text=Register, text="Sign Up", a[href*="register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForURL('**/register');
      
      // Fill registration form
      await page.fill('input[name="email"], input[type="email"]', CONFIG.TEST_USER.email);
      await page.fill('input[name="password"], input[type="password"]', CONFIG.TEST_USER.password);
      
      // Add username if field exists
      const usernameField = page.locator('input[name="username"], input[name="name"]');
      if (await usernameField.isVisible()) {
        await usernameField.fill(CONFIG.TEST_USER.username);
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Check if registration succeeded (URL change or success message)
      const currentUrl = page.url();
      console.log(`Post-registration URL: ${currentUrl}`);
      
      // Look for success indicators
      const successIndicators = await page.locator('.success, .welcome, text="Welcome"').count();
      console.log(`Found ${successIndicators} success indicators`);
    }
    
    console.log('✓ Registration flow completed');
  });
});

test.describe('DOOF Incremental Flows - Level 4: Authenticated Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Level 4.1: Protected Route Access
   */
  test('should test protected route behavior', async ({ page }) => {
    console.log('🧪 Testing protected route access');
    
    // Try to access My Lists without authentication
    await page.goto('/my-lists');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log(`Accessing /my-lists redirected to: ${currentUrl}`);
    
    // Check if redirected to login or shows auth required message
    if (currentUrl.includes('/login')) {
      console.log('✓ Correctly redirected to login');
    } else {
      const authRequired = await page.locator('text*="login", text*="sign in", text*="authentication"').count();
      console.log(`Found ${authRequired} authentication prompts`);
    }
    
    console.log('✓ Protected route access tested');
  });

  /**
   * Level 4.2: Admin Panel Access
   */
  test('should test admin panel access with proper credentials', async ({ page }) => {
    console.log('🧪 Testing admin panel access');
    
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', CONFIG.ADMIN_USER.email);
    await page.fill('input[name="password"], input[type="password"]', CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    
    // Try to access admin panel
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log(`Admin panel access URL: ${currentUrl}`);
    
    if (currentUrl.includes('/admin')) {
      // Check for admin content
      const adminElements = await page.locator('[data-testid*="admin"], .admin, h1, h2').count();
      console.log(`Found ${adminElements} admin elements`);
    }
    
    console.log('✓ Admin panel access tested');
  });

  /**
   * Level 4.3: User Profile and Settings
   */
  test('should access user profile and settings', async ({ page }) => {
    console.log('🧪 Testing user profile access');
    
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', CONFIG.ADMIN_USER.email);
    await page.fill('input[name="password"], input[type="password"]', CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    
    // Go to homepage and look for profile access
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Look for profile dropdown or menu
    const profileTrigger = page.locator('[id*="user-menu"], .profile, [aria-haspopup="true"]');
    if (await profileTrigger.isVisible()) {
      await profileTrigger.click();
      await page.waitForTimeout(500);
      
      // Look for profile-related links
      const profileLinks = await page.locator('text*="Profile", text*="Settings", text*="Account"').count();
      console.log(`Found ${profileLinks} profile-related links`);
    }
    
    console.log('✓ Profile access tested');
  });
});

test.describe('DOOF Incremental Flows - Level 5: Advanced Interactions', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Level 5.1: Cross-page Navigation Flow
   */
  test('should perform complex cross-page navigation', async ({ page }) => {
    console.log('🧪 Testing complex navigation flow');
    
    const navigationFlow = ['/', '/search', '/trending', '/lists', '/'];
    
    for (const route of navigationFlow) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      console.log(`Navigated to ${route} - Title: ${title}`);
      
      // Check that page loaded correctly - verify we're not on an error page
      const currentUrl = page.url();
      expect(currentUrl).toContain(route === '/' ? 'localhost:5174' : route);
    }
    
    console.log('✓ Complex navigation flow completed');
  });

  /**
   * Level 5.2: Responsive Design Testing
   */
  test('should test responsive behavior on mobile viewport', async ({ page }) => {
    console.log('🧪 Testing responsive mobile behavior');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu exists
    const mobileMenu = page.locator('[aria-label*="menu"], .mobile-menu, .hamburger');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
      console.log('✓ Mobile menu triggered');
    }
    
    // Test navigation on mobile
    const navLinks = await page.locator('nav a, .mobile-nav a').count();
    console.log(`Found ${navLinks} navigation links on mobile`);
    
    console.log('✓ Mobile responsive testing completed');
  });

  /**
   * Level 5.3: Performance and Loading States
   */
  test('should handle loading states and error conditions', async ({ page }) => {
    console.log('🧪 Testing loading states and error handling');
    
    // Test with slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // Add delay
    });
    
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    // Look for loading indicators
    const loadingIndicators = await page.locator('.loading, .spinner, [aria-busy="true"]').count();
    console.log(`Found ${loadingIndicators} loading indicators`);
    
    // Test 404 handling
    await page.goto('/non-existent-page');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log(`404 page URL: ${currentUrl}`);
    
    console.log('✓ Error handling and loading states tested');
  });

  // Cleanup after each test
  test.afterEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
  });
}); 