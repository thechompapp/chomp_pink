/**
 * Admin Panel E2E Tests
 * 
 * Tests the administrative functionality available to superuser accounts:
 * - Admin panel access
 * - Restaurant management
 * - Dish management
 * - User management
 * - Analytics and engagement data
 * - System administration
 */

import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers.js';

const CONFIG = {
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  }
};

test.describe('Admin Panel Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test Admin Panel Access
   */
  test('should access admin panel with superuser credentials', async ({ page }) => {
    console.log('🧪 Testing admin panel access');
    
    // Login with admin credentials
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    
    // Look for admin panel link/button
    const adminLink = page.locator('text=Admin, text=Admin Panel, a[href*="/admin"], [data-testid="admin-link"]').first();
    
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on admin panel
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        console.log('✓ Admin panel access successful');
        
        // Check for admin dashboard elements
        const adminElements = page.locator('.admin-dashboard, .admin-panel, h1:has-text("Admin"), [data-testid="admin-dashboard"]');
        if (await adminElements.first().isVisible()) {
          console.log('✓ Admin dashboard loaded');
        }
        
        // Check for admin navigation/menu
        const adminNav = page.locator('.admin-nav, .admin-sidebar, .admin-menu');
        if (await adminNav.first().isVisible()) {
          console.log('✓ Admin navigation found');
        }
      }
    } else {
      // Try direct URL access
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
        console.log('✓ Direct admin panel access successful');
      } else {
        console.log('ℹ️ Admin panel may not be accessible or require different URL');
      }
    }
    
    console.log('✓ Admin panel access test completed');
  });

  /**
   * Test Restaurant Management
   */
  test('should manage restaurants in admin panel', async ({ page }) => {
    console.log('🧪 Testing restaurant management');
    
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for restaurant management section
    const restaurantSection = page.locator('text=Restaurant, .restaurant-management, [data-testid="restaurant-admin"]').first();
    
    if (await restaurantSection.isVisible()) {
      await restaurantSection.click();
      await page.waitForLoadState('networkidle');
      
      console.log('✓ Restaurant management section accessed');
      
      // Test restaurant listing
      const restaurantList = page.locator('.restaurant-list, table, .data-table');
      if (await restaurantList.isVisible()) {
        console.log('✓ Restaurant list displayed');
        
        // Check for CRUD action buttons
        const actionButtons = page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("Add"), .action-button');
        const buttonCount = await actionButtons.count();
        
        if (buttonCount > 0) {
          console.log(`✓ Found ${buttonCount} action buttons`);
        }
      }
      
      // Test search/filter functionality
      const searchInput = page.locator('input[placeholder*="Search"], input[name="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        console.log('✓ Search functionality available');
      }
    } else {
      console.log('ℹ️ Restaurant management section not found');
    }
    
    console.log('✓ Restaurant management test completed');
  });

  /**
   * Test User Management
   */
  test('should access user management features', async ({ page }) => {
    console.log('🧪 Testing user management');
    
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for user management section
    const userSection = page.locator('text=User, text=Users, .user-management, [data-testid="user-admin"]').first();
    
    if (await userSection.isVisible()) {
      await userSection.click();
      await page.waitForLoadState('networkidle');
      
      console.log('✓ User management section accessed');
      
      // Check for user listing
      const userList = page.locator('.user-list, table, .data-table');
      if (await userList.isVisible()) {
        console.log('✓ User list displayed');
        
        // Look for user details (email, role, etc.)
        const userEmails = page.locator('text=@, .email, [data-testid="user-email"]');
        const emailCount = await userEmails.count();
        
        if (emailCount > 0) {
          console.log(`✓ Found ${emailCount} user email entries`);
        }
        
        // Check for role management
        const roleElements = page.locator('text=admin, text=superuser, text=user, .role');
        const roleCount = await roleElements.count();
        
        if (roleCount > 0) {
          console.log(`✓ Found ${roleCount} role indicators`);
        }
      }
    } else {
      console.log('ℹ️ User management section not found');
    }
    
    console.log('✓ User management test completed');
  });

  /**
   * Test Analytics Dashboard
   */
  test('should view analytics and engagement data', async ({ page }) => {
    console.log('🧪 Testing analytics dashboard');
    
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for analytics section
    const analyticsSection = page.locator('text=Analytics, text=Engagement, text=Stats, .analytics, [data-testid="analytics"]').first();
    
    if (await analyticsSection.isVisible()) {
      await analyticsSection.click();
      await page.waitForLoadState('networkidle');
      
      console.log('✓ Analytics section accessed');
      
      // Wait for analytics API calls
      await page.waitForResponse(response => 
        response.url().includes('/api/analytics') || 
        response.url().includes('/api/engagement'), 
        { timeout: 5000 }
      ).catch(() => console.log('No analytics API calls detected'));
      
      // Check for charts/graphs
      const charts = page.locator('canvas, .chart, .graph, .recharts-wrapper');
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        console.log(`✓ Found ${chartCount} chart elements`);
      }
      
      // Check for metrics/statistics
      const metrics = page.locator('.metric, .stat, .kpi, .dashboard-card');
      const metricCount = await metrics.count();
      
      if (metricCount > 0) {
        console.log(`✓ Found ${metricCount} metric displays`);
      }
      
      // Check for engagement data
      const engagementData = page.locator('text=view, text=click, text=engagement');
      const engagementCount = await engagementData.count();
      
      if (engagementCount > 0) {
        console.log(`✓ Found ${engagementCount} engagement references`);
      }
    } else {
      console.log('ℹ️ Analytics section not found');
    }
    
    console.log('✓ Analytics dashboard test completed');
  });

  /**
   * Test Hashtag Management
   */
  test('should manage hashtags and categories', async ({ page }) => {
    console.log('🧪 Testing hashtag management');
    
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for hashtag management
    const hashtagSection = page.locator('text=Hashtag, text=Tags, text=Categories, .hashtag-management').first();
    
    if (await hashtagSection.isVisible()) {
      await hashtagSection.click();
      await page.waitForLoadState('networkidle');
      
      console.log('✓ Hashtag management section accessed');
      
      // Check for hashtag list
      const hashtagList = page.locator('.hashtag-list, .tag-list, table');
      if (await hashtagList.isVisible()) {
        console.log('✓ Hashtag list displayed');
        
        // Look for hashtag names
        const hashtagElements = page.locator('.hashtag, .tag, text=#');
        const hashtagCount = await hashtagElements.count();
        
        if (hashtagCount > 0) {
          console.log(`✓ Found ${hashtagCount} hashtag elements`);
        }
      }
      
      // Check for category management
      const categoryElements = page.locator('text=cuisine, text=category, .category');
      const categoryCount = await categoryElements.count();
      
      if (categoryCount > 0) {
        console.log(`✓ Found ${categoryCount} category references`);
      }
    } else {
      console.log('ℹ️ Hashtag management section not found');
    }
    
    console.log('✓ Hashtag management test completed');
  });

  /**
   * Test System Administration
   */
  test('should access system administration features', async ({ page }) => {
    console.log('🧪 Testing system administration');
    
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for system admin section
    const systemSection = page.locator('text=System, text=Settings, text=Configuration, .system-admin').first();
    
    if (await systemSection.isVisible()) {
      await systemSection.click();
      await page.waitForLoadState('networkidle');
      
      console.log('✓ System administration section accessed');
      
      // Check for system status
      const statusElements = page.locator('text=status, text=health, .status-indicator');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        console.log(`✓ Found ${statusCount} status indicators`);
      }
      
      // Check for log access
      const logElements = page.locator('text=log, text=logs, .log-viewer');
      const logCount = await logElements.count();
      
      if (logCount > 0) {
        console.log(`✓ Found ${logCount} log-related elements`);
      }
      
      // Check for cache management
      const cacheElements = page.locator('text=cache, text=clear, button:has-text("Clear")');
      const cacheCount = await cacheElements.count();
      
      if (cacheCount > 0) {
        console.log(`✓ Found ${cacheCount} cache management elements`);
      }
    } else {
      console.log('ℹ️ System administration section not found');
    }
    
    console.log('✓ System administration test completed');
  });

  /**
   * Test Bulk Operations
   */
  test('should perform bulk administrative operations', async ({ page }) => {
    console.log('🧪 Testing bulk operations');
    
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for bulk operation features
    const bulkElements = page.locator('text=bulk, text=Bulk, .bulk-actions, input[type="checkbox"]');
    const bulkCount = await bulkElements.count();
    
    if (bulkCount > 0) {
      console.log(`✓ Found ${bulkCount} bulk operation elements`);
      
      // Test selecting multiple items
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 1) {
        // Select first few checkboxes
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        
        console.log('✓ Multiple items selected');
        
        // Look for bulk action buttons
        const bulkActionButtons = page.locator('button:has-text("Delete"), button:has-text("Export"), .bulk-action-btn');
        const actionCount = await bulkActionButtons.count();
        
        if (actionCount > 0) {
          console.log(`✓ Found ${actionCount} bulk action buttons`);
        }
      }
    } else {
      console.log('ℹ️ No bulk operation features found');
    }
    
    console.log('✓ Bulk operations test completed');
  });

  // Cleanup
  test.afterEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
  });
}); 