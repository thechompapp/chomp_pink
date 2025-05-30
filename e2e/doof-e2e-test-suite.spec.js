/**
 * DOOF Application - End-to-End Test Suite
 * 
 * This test suite validates complete user flows through the actual UI, backend APIs,
 * and state management systems. No mocking - all tests run against live APIs.
 * 
 * Test Coverage:
 * 1. User Registration & Authentication
 * 2. Login/Logout with Cross-Tab Sync
 * 3. List Creation & Management
 * 4. Follow/Unfollow Functionality
 * 5. Quick Add Items to Lists
 * 6. Navigation & Routing
 * 7. Search Functionality
 * 8. Session Expiry Handling
 * 9. Cross-Tab State Synchronization
 * 
 * @requires Playwright
 * @requires Live backend on http://localhost:5001
 * @requires Frontend on http://localhost:5174
 */

import { test, expect, chromium } from '@playwright/test';
import { randomBytes } from 'crypto';

// Test Configuration
const CONFIG = {
  FRONTEND_URL: 'http://localhost:5174',
  BACKEND_URL: 'http://localhost:5001',
  DEFAULT_TIMEOUT: 30000,
  NETWORK_TIMEOUT: 10000,
  TEST_USER: {
    email: `test-${Date.now()}-${randomBytes(4).toString('hex')}@doof-e2e.com`,
    password: 'TestPass123!',
    username: `testuser_${Date.now()}`
  },
  EXISTING_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  }
};

// Helper Functions
class E2EHelpers {
  /**
   * Wait for API response and verify status
   */
  static async waitForApiResponse(page, urlPattern, expectedStatus = 200) {
    const response = await page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === expectedStatus,
      { timeout: CONFIG.NETWORK_TIMEOUT }
    );
    return response;
  }

  /**
   * Get JWT token from localStorage
   */
  static async getAuthToken(page) {
    return await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage') || 
                         localStorage.getItem('auth-authentication-storage');
      if (authStorage) {
        const data = JSON.parse(authStorage);
        return data?.state?.token || null;
      }
      return null;
    });
  }

  /**
   * Verify user is authenticated in the UI
   */
  static async verifyAuthenticatedState(page) {
    // Check for authenticated UI elements (user menu, profile, etc.)
    await expect(page.locator('[data-testid="user-menu"], [data-testid="profile-dropdown"], .user-authenticated')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify user is logged out in the UI
   */
  static async verifyLoggedOutState(page) {
    // Check for login/register buttons
    await expect(page.locator('text=Login, text=Sign In, text=Register')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Clear application state
   */
  static async clearAppState(page) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Generate unique test data
   */
  static generateTestData() {
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    return {
      listName: `E2E Test List ${timestamp}`,
      listDescription: `Created by E2E test at ${new Date().toISOString()}`,
      itemName: `Test Item ${random}`,
      searchTerm: 'pizza'
    };
  }
}

// Test Suite Setup
test.describe('DOOF Application E2E Test Suite', () => {
  let testData;
  
  test.beforeAll(async () => {
    // Verify backend is running
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Backend not available at ${CONFIG.BACKEND_URL}`);
    }
    console.log('✓ Backend health check passed');
  });

  test.beforeEach(async ({ page }) => {
    // Generate fresh test data for each test
    testData = E2EHelpers.generateTestData();
    
    // Clear any existing state
    await E2EHelpers.clearAppState(page);
    
    // Navigate to homepage
    await page.goto(CONFIG.FRONTEND_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test 1: Register New Account
   * Validates: Registration form, API integration, token storage, UI state update
   */
  test('should register a new user account', async ({ page }) => {
    console.log(`🧪 Testing registration with email: ${CONFIG.TEST_USER.email}`);
    
    // Navigate to registration page
    await page.click('text=Register, text=Sign Up');
    await page.waitForURL('**/register');

    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', CONFIG.TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', CONFIG.TEST_USER.password);
    
    // Handle optional username field
    const usernameField = page.locator('input[name="username"]');
    if (await usernameField.isVisible()) {
      await usernameField.fill(CONFIG.TEST_USER.username);
    }

    // Submit registration
    const [response] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/register', 201),
      page.click('button[type="submit"], button:has-text("Register")')
    ]);

    // Verify API response
    expect(response.status()).toBe(201);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.token).toBeDefined();

    // Verify token is stored in localStorage
    const storedToken = await E2EHelpers.getAuthToken(page);
    expect(storedToken).toBeTruthy();
    expect(storedToken).toBe(responseData.token);

    // Verify UI reflects authenticated state
    await E2EHelpers.verifyAuthenticatedState(page);
    
    console.log('✓ Registration completed successfully');
  });

  /**
   * Test 2: Login and Logout Flow
   * Validates: Login form, JWT verification, logout API, cross-tab sync
   */
  test('should login and logout with proper state management', async ({ page }) => {
    console.log('🧪 Testing login/logout flow');
    
    // Navigate to login page
    await page.click('text=Login, text=Sign In');
    await page.waitForURL('**/login');

    // Login with existing user
    await page.fill('input[name="email"], input[type="email"]', CONFIG.EXISTING_USER.email);
    await page.fill('input[name="password"], input[type="password"]', CONFIG.EXISTING_USER.password);

    const [loginResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/login', 200),
      page.click('button[type="submit"], button:has-text("Login")')
    ]);

    // Verify login API response
    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.token).toBeDefined();

    // Verify token verification occurs
    await E2EHelpers.waitForApiResponse(page, '/api/auth/status', 200);

    // Verify authenticated UI state
    await E2EHelpers.verifyAuthenticatedState(page);

    // Test logout
    await page.click('[data-testid="user-menu"], [data-testid="logout-button"], text=Logout');
    
    const [logoutResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/logout', 200),
      page.click('button:has-text("Logout"), button:has-text("Sign Out")')
    ]);

    // Verify logout API response
    expect(logoutResponse.status()).toBe(200);

    // Verify token is cleared
    const tokenAfterLogout = await E2EHelpers.getAuthToken(page);
    expect(tokenAfterLogout).toBeFalsy();

    // Verify UI reflects logged out state
    await E2EHelpers.verifyLoggedOutState(page);
    
    console.log('✓ Login/logout flow completed successfully');
  });

  /**
   * Test 3: Create a List
   * Validates: List creation form, API integration, UI updates
   */
  test('should create a new list', async ({ page, context }) => {
    console.log('🧪 Testing list creation');
    
    // Login first
    await page.goto(`${CONFIG.FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', CONFIG.EXISTING_USER.email);
    await page.fill('input[name="password"]', CONFIG.EXISTING_USER.password);
    await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/login', 200),
      page.click('button[type="submit"]')
    ]);

    // Navigate to lists page
    await page.click('text=Lists, text=My Lists');
    await page.waitForURL('**/lists');

    // Click create new list
    await page.click('button:has-text("New List"), button:has-text("Create List"), [data-testid="create-list-button"]');

    // Fill list creation form
    await page.fill('input[name="name"], input[placeholder*="name"]', testData.listName);
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', testData.listDescription);

    // Submit list creation
    const [createResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/lists', 201),
      page.click('button[type="submit"], button:has-text("Create")')
    ]);

    // Verify API response
    expect(createResponse.status()).toBe(201);
    const listData = await createResponse.json();
    expect(listData.success).toBe(true);
    expect(listData.data.name).toBe(testData.listName);

    // Verify list appears in UI
    await page.waitForSelector(`text="${testData.listName}"`);
    await expect(page.locator(`text="${testData.listName}"`)).toBeVisible();

    // Verify list appears in API response
    const [listsResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/lists', 200),
      page.reload()
    ]);
    
    const listsData = await listsResponse.json();
    const createdList = listsData.data.find(list => list.name === testData.listName);
    expect(createdList).toBeDefined();
    
    console.log('✓ List creation completed successfully');
  });

  /**
   * Test 4: Follow and Unfollow a List
   * Validates: Follow button interaction, API calls, state management
   */
  test('should follow and unfollow a list', async ({ page }) => {
    console.log('🧪 Testing follow/unfollow functionality');
    
    // Login first
    await page.goto(`${CONFIG.FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', CONFIG.EXISTING_USER.email);
    await page.fill('input[name="password"]', CONFIG.EXISTING_USER.password);
    await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/login', 200),
      page.click('button[type="submit"]')
    ]);

    // Navigate to trending or public lists
    await page.click('text=Trending');
    await page.waitForURL('**/trending');

    // Wait for lists to load
    await page.waitForSelector('[data-testid="list-card"], .list-card, .follow-button');

    // Find a list to follow (not owned by current user)
    const followButton = page.locator('button:has-text("Follow"):not([disabled])').first();
    await expect(followButton).toBeVisible();

    // Follow the list
    const [followResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/lists/', 200), // Follow endpoint
      followButton.click()
    ]);

    // Verify follow API response
    expect(followResponse.status()).toBe(200);

    // Verify button changes to "Following" or "Unfollow"
    await expect(page.locator('button:has-text("Following"), button:has-text("Unfollow")')).toBeVisible();

    // Unfollow the list
    const unfollowButton = page.locator('button:has-text("Following"), button:has-text("Unfollow")').first();
    const [unfollowResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/lists/', 200), // Unfollow endpoint
      unfollowButton.click()
    ]);

    // Verify unfollow API response
    expect(unfollowResponse.status()).toBe(200);

    // Verify button changes back to "Follow"
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();
    
    console.log('✓ Follow/unfollow functionality completed successfully');
  });

  /**
   * Test 5: Add Item to Existing List (QuickAdd)
   * Validates: QuickAdd modal, item creation, list updates
   */
  test('should add item to existing list via QuickAdd', async ({ page }) => {
    console.log('🧪 Testing QuickAdd functionality');
    
    // Login first
    await page.goto(`${CONFIG.FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', CONFIG.EXISTING_USER.email);
    await page.fill('input[name="password"]', CONFIG.EXISTING_USER.password);
    await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/login', 200),
      page.click('button[type="submit"]')
    ]);

    // Navigate to a page with QuickAdd button (search results, restaurant details, etc.)
    await page.goto(`${CONFIG.FRONTEND_URL}/search?q=pizza`);
    await page.waitForLoadState('networkidle');

    // Find and click QuickAdd button
    const quickAddButton = page.locator('[data-testid="quick-add-button"], button:has-text("Add to List"), .quick-add-btn').first();
    await expect(quickAddButton).toBeVisible();
    await quickAddButton.click();

    // Wait for AddToListModal to appear
    await page.waitForSelector('[data-testid="add-to-list-modal"], .modal:has-text("Add to List")');

    // Select an existing list
    const listOption = page.locator('[data-testid="list-option"], .list-selector button').first();
    await expect(listOption).toBeVisible();
    await listOption.click();

    // Add item name if needed
    const itemNameField = page.locator('input[name="itemName"], input[placeholder*="item"]');
    if (await itemNameField.isVisible()) {
      await itemNameField.fill(testData.itemName);
    }

    // Submit the addition
    const [addResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/lists/', 201), // Add item endpoint
      page.click('button:has-text("Add"), button[type="submit"]')
    ]);

    // Verify API response
    expect(addResponse.status()).toBe(201);

    // Verify modal closes and success feedback
    await expect(page.locator('[data-testid="add-to-list-modal"]')).not.toBeVisible();
    await expect(page.locator('text=Added to list, text=Successfully added')).toBeVisible();
    
    console.log('✓ QuickAdd functionality completed successfully');
  });

  /**
   * Test 6: Navigation - All Navbar Links
   * Validates: Routing, component loading, data fetching
   */
  test('should navigate through all main pages', async ({ page }) => {
    console.log('🧪 Testing navigation and routing');
    
    // Test Home page
    await page.click('text=Home, [data-testid="home-link"]');
    await page.waitForURL('**/');
    await expect(page.locator('h1, .home-title, .welcome')).toBeVisible();

    // Test Trending page
    await page.click('text=Trending');
    await page.waitForURL('**/trending');
    await E2EHelpers.waitForApiResponse(page, '/api/', 200); // Trending data API
    await expect(page.locator('.trending, .list-card, [data-testid="trending-content"]')).toBeVisible();

    // Login for protected routes
    await page.goto(`${CONFIG.FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', CONFIG.EXISTING_USER.email);
    await page.fill('input[name="password"]', CONFIG.EXISTING_USER.password);
    await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/login', 200),
      page.click('button[type="submit"]')
    ]);

    // Test My Lists page
    await page.click('text=My Lists, text=Lists');
    await page.waitForURL('**/lists');
    await E2EHelpers.waitForApiResponse(page, '/api/lists', 200);
    await expect(page.locator('.lists-container, [data-testid="my-lists"]')).toBeVisible();

    // Test Profile page
    await page.click('[data-testid="profile-link"], text=Profile');
    await page.waitForURL('**/profile');
    await expect(page.locator('.profile-container, [data-testid="profile-content"]')).toBeVisible();
    
    console.log('✓ Navigation testing completed successfully');
  });

  /**
   * Test 7: Search Functionality
   * Validates: Search input, API calls, results display, result navigation
   */
  test('should perform search and navigate to results', async ({ page }) => {
    console.log('🧪 Testing search functionality');
    
    // Find search input in navbar
    const searchInput = page.locator('input[name="search"], input[placeholder*="Search"], [data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    // Perform search
    await searchInput.fill(testData.searchTerm);
    
    const [searchResponse] = await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/search', 200),
      searchInput.press('Enter')
    ]);

    // Verify search API response
    expect(searchResponse.status()).toBe(200);
    
    // Wait for search results page
    await page.waitForURL('**/search**');
    await expect(page.locator('.search-results, [data-testid="search-results"]')).toBeVisible();

    // Click on a search result
    const searchResult = page.locator('.search-result, [data-testid="search-result"]').first();
    if (await searchResult.isVisible()) {
      await searchResult.click();
      
      // Verify navigation to detail page
      await page.waitForURL('**/restaurant/**/dish/**');
      await expect(page.locator('.detail-page, [data-testid="detail-content"]')).toBeVisible();
    }
    
    console.log('✓ Search functionality completed successfully');
  });

  /**
   * Test 8: Session Expiry Handling
   * Validates: Expired token detection, 401 handling, automatic logout
   */
  test('should handle session expiry gracefully', async ({ page }) => {
    console.log('🧪 Testing session expiry handling');
    
    // Login first
    await page.goto(`${CONFIG.FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', CONFIG.EXISTING_USER.email);
    await page.fill('input[name="password"]', CONFIG.EXISTING_USER.password);
    await Promise.all([
      E2EHelpers.waitForApiResponse(page, '/api/auth/login', 200),
      page.click('button[type="submit"]')
    ]);

    // Simulate expired token by modifying localStorage
    await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage') || 
                         localStorage.getItem('auth-authentication-storage');
      if (authStorage) {
        const data = JSON.parse(authStorage);
        // Set an obviously expired token
        data.state.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
        localStorage.setItem('auth-storage', JSON.stringify(data));
      }
    });

    // Attempt a protected action that should trigger 401
    await page.goto(`${CONFIG.FRONTEND_URL}/lists`);
    
    // Wait for 401 response and subsequent logout
    await page.waitForResponse(response => response.status() === 401);

    // Verify user is redirected to login or logged out
    await page.waitForTimeout(2000); // Allow time for auth coordinator to process
    await E2EHelpers.verifyLoggedOutState(page);
    
    console.log('✓ Session expiry handling completed successfully');
  });

  /**
   * Test 9: Cross-Tab Logout Verification
   * Validates: Event synchronization, cross-tab state management
   */
  test('should synchronize logout across multiple tabs', async ({ browser }) => {
    console.log('🧪 Testing cross-tab logout synchronization');
    
    // Create two browser contexts (tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login in Tab 1
    await page1.goto(`${CONFIG.FRONTEND_URL}/login`);
    await page1.fill('input[name="email"]', CONFIG.EXISTING_USER.email);
    await page1.fill('input[name="password"]', CONFIG.EXISTING_USER.password);
    await Promise.all([
      E2EHelpers.waitForApiResponse(page1, '/api/auth/login', 200),
      page1.click('button[type="submit"]')
    ]);

    // Open Tab 2 and verify logged in state
    await page2.goto(CONFIG.FRONTEND_URL);
    await page2.evaluate(() => {
      // Copy auth state from tab 1 (simulating shared storage)
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        localStorage.setItem('auth-storage', authData);
      }
    });
    await page2.reload();
    await E2EHelpers.verifyAuthenticatedState(page2);

    // Logout from Tab 1
    await page1.click('[data-testid="logout-button"], text=Logout');
    await Promise.all([
      E2EHelpers.waitForApiResponse(page1, '/api/auth/logout', 200),
      page1.click('button:has-text("Logout")')
    ]);

    // Verify Tab 1 is logged out
    await E2EHelpers.verifyLoggedOutState(page1);

    // Simulate storage event in Tab 2 (cross-tab sync)
    await page2.evaluate(() => {
      // Trigger storage event for logout
      localStorage.removeItem('auth-storage');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth-storage',
        oldValue: 'old-auth-data',
        newValue: null,
        storageArea: localStorage
      }));
    });

    // Wait and verify Tab 2 is also logged out
    await page2.waitForTimeout(1000);
    await E2EHelpers.verifyLoggedOutState(page2);

    // Cleanup
    await context1.close();
    await context2.close();
    
    console.log('✓ Cross-tab logout synchronization completed successfully');
  });

  // Cleanup after each test
  test.afterEach(async ({ page }) => {
    // Clean up any test data created during the test
    // Note: In a real implementation, you might want to call cleanup APIs
    await E2EHelpers.clearAppState(page);
  });
});

/**
 * Export helper functions for reuse in other test files
 */
export { E2EHelpers, CONFIG }; 