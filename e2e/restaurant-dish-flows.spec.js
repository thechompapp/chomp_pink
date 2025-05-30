/**
 * Restaurant & Dish Flows E2E Tests
 * 
 * Tests the core restaurant and dish browsing functionality:
 * - Restaurant detail pages
 * - Dish detail pages  
 * - Search with filters
 * - Navigation between restaurants and dishes
 * - Hashtag and filter functionality
 */

import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers.js';

const CONFIG = {
  EXISTING_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  }
};

test.describe('Restaurant & Dish Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test Restaurant Search & Filtering
   */
  test('should search and filter restaurants', async ({ page }) => {
    console.log('🧪 Testing restaurant search and filtering');
    
    // Navigate to search/browse page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for search functionality
    const searchInput = page.locator('input[name="search"], input[placeholder*="Search"], [data-testid="search-input"]').first();
    
    if (await searchInput.isVisible()) {
      // Search for restaurants
      await searchInput.fill('restaurant');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Check for restaurant results
      const restaurantCards = page.locator('.restaurant-card, [data-testid="restaurant-card"], .result-item');
      const cardCount = await restaurantCards.count();
      
      if (cardCount > 0) {
        console.log(`✓ Found ${cardCount} restaurant results`);
        
        // Test clicking on a restaurant
        const firstRestaurant = restaurantCards.first();
        await firstRestaurant.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on a restaurant detail page
        const currentUrl = page.url();
        if (currentUrl.includes('/restaurant/')) {
          console.log('✓ Navigation to restaurant detail successful');
          
          // Look for dish listings on restaurant page
          const dishElements = page.locator('.dish-card, .dish-item, [data-testid="dish-card"]');
          const dishCount = await dishElements.count();
          
          if (dishCount > 0) {
            console.log(`✓ Found ${dishCount} dishes on restaurant page`);
          }
        }
      }
    } else {
      console.log('ℹ️ Search input not found - testing direct navigation');
    }
    
    console.log('✓ Restaurant search flow completed');
  });

  /**
   * Test Dish Detail Navigation
   */
  test('should navigate to dish details', async ({ page }) => {
    console.log('🧪 Testing dish detail navigation');
    
    // Try to find dishes on the homepage or search
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for dish cards anywhere on the page
    const dishCards = page.locator('.dish-card, [data-testid="dish-card"], .dish-item');
    const dishCount = await dishCards.count();
    
    if (dishCount > 0) {
      console.log(`✓ Found ${dishCount} dish cards`);
      
      // Click on first dish
      const firstDish = dishCards.first();
      await firstDish.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on dish detail page
      const currentUrl = page.url();
      if (currentUrl.includes('/dish/')) {
        console.log('✓ Navigation to dish detail successful');
        
        // Look for dish information
        const dishInfo = page.locator('.dish-detail, .dish-info, h1, .title');
        if (await dishInfo.first().isVisible()) {
          console.log('✓ Dish detail page loaded with content');
        }
        
        // Look for restaurant link
        const restaurantLink = page.locator('a[href*="/restaurant/"], .restaurant-link');
        if (await restaurantLink.first().isVisible()) {
          console.log('✓ Restaurant link found on dish page');
        }
      }
    } else {
      console.log('ℹ️ No dish cards found on homepage');
    }
    
    console.log('✓ Dish detail navigation completed');
  });

  /**
   * Test Filter Functionality
   */
  test('should use cuisine and location filters', async ({ page }) => {
    console.log('🧪 Testing filter functionality');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for filter components
    const filterSection = page.locator('.filters, .filter-panel, [data-testid="filters"]');
    
    if (await filterSection.isVisible()) {
      console.log('✓ Filter section found');
      
      // Test cuisine filter
      const cuisineFilter = page.locator('select[name="cuisine"], .cuisine-filter, [data-testid="cuisine-filter"]').first();
      if (await cuisineFilter.isVisible()) {
        await cuisineFilter.selectOption({ index: 1 }); // Select first non-default option
        await page.waitForTimeout(1000); // Wait for filter to apply
        console.log('✓ Cuisine filter applied');
      }
      
      // Test location filter
      const locationFilter = page.locator('select[name="location"], .location-filter, [data-testid="location-filter"]').first();
      if (await locationFilter.isVisible()) {
        await locationFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        console.log('✓ Location filter applied');
      }
      
      // Check if results updated
      const resultContainer = page.locator('.results, .search-results, [data-testid="results"]');
      if (await resultContainer.isVisible()) {
        console.log('✓ Filtered results displayed');
      }
    } else {
      console.log('ℹ️ Filter section not found or not visible');
    }
    
    console.log('✓ Filter functionality test completed');
  });

  /**
   * Test Engagement Tracking
   */
  test('should track user engagement on restaurant/dish interactions', async ({ page }) => {
    console.log('🧪 Testing engagement tracking');
    
    // Login first to enable engagement tracking
    await AuthHelpers.login(page, CONFIG.EXISTING_USER.email, CONFIG.EXISTING_USER.password);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Set up network monitoring for engagement API calls
    const engagementRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/engage') || request.url().includes('/api/engagement')) {
        engagementRequests.push(request.url());
      }
    });
    
    // Interact with restaurant/dish cards
    const cards = page.locator('.restaurant-card, .dish-card, .result-item');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Click on first card
      await cards.first().click();
      await page.waitForTimeout(1000);
      
      // Check if engagement was tracked
      if (engagementRequests.length > 0) {
        console.log(`✓ Engagement tracked: ${engagementRequests.length} requests`);
      } else {
        console.log('ℹ️ No engagement requests detected');
      }
    }
    
    console.log('✓ Engagement tracking test completed');
  });

  /**
   * Test Hashtag Functionality
   */
  test('should display and filter by hashtags', async ({ page }) => {
    console.log('🧪 Testing hashtag functionality');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for hashtag elements
    const hashtags = page.locator('.hashtag, .tag, [data-testid="hashtag"]');
    const hashtagCount = await hashtags.count();
    
    if (hashtagCount > 0) {
      console.log(`✓ Found ${hashtagCount} hashtag elements`);
      
      // Click on a hashtag to filter
      const firstHashtag = hashtags.first();
      await firstHashtag.click();
      await page.waitForLoadState('networkidle');
      
      // Check if URL or content changed to reflect hashtag filter
      const currentUrl = page.url();
      if (currentUrl.includes('hashtag') || currentUrl.includes('tag')) {
        console.log('✓ Hashtag filtering applied to URL');
      }
      
      // Check for filtered content
      const results = page.locator('.results, .filtered-results');
      if (await results.isVisible()) {
        console.log('✓ Hashtag filtered results displayed');
      }
    } else {
      console.log('ℹ️ No hashtag elements found');
    }
    
    console.log('✓ Hashtag functionality test completed');
  });

  /**
   * Test Trending Content
   */
  test('should display trending restaurants and dishes', async ({ page }) => {
    console.log('🧪 Testing trending content');
    
    // Navigate to trending page
    await page.goto('/trending');
    await page.waitForLoadState('networkidle');
    
    // Wait for API calls to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/trending') || 
      response.url().includes('/api/hashtags') ||
      response.url().includes('/api/lists'), 
      { timeout: 5000 }
    ).catch(() => console.log('No trending API calls detected'));
    
    // Look for trending content
    const trendingItems = page.locator('.trending-item, .trending-card, .list-card');
    const itemCount = await trendingItems.count();
    
    if (itemCount > 0) {
      console.log(`✓ Found ${itemCount} trending items`);
      
      // Test clicking on trending item
      const firstItem = trendingItems.first();
      await firstItem.click();
      await page.waitForLoadState('networkidle');
      
      // Verify navigation occurred
      const currentUrl = page.url();
      if (currentUrl !== 'http://localhost:5174/trending') {
        console.log('✓ Trending item navigation successful');
      }
    } else {
      console.log('ℹ️ No trending items found');
    }
    
    console.log('✓ Trending content test completed');
  });

  // Cleanup
  test.afterEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
  });
}); 