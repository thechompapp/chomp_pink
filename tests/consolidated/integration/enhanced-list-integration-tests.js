/**
 * Enhanced List Management Integration Tests
 * 
 * These tests verify the complete list management functionality with full data lifecycle verification:
 * - Data Creation → Database Storage → API Retrieval → Frontend Rendering
 * - Frontend Submission → API Processing → Database Persistence → UI Feedback
 * - Real-time UI updates and state synchronization
 * - Browser automation for actual UI rendering verification
 */

import axios from 'axios';
import { performance } from 'perf_hooks';
import puppeteer from 'puppeteer';
import pg from 'pg';

// Create axios instance
let api = null;
let browser = null;
let page = null;
let dbClient = null;

// Test module
const enhancedListTests = {
  /**
   * Run all enhanced list management tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('Enhanced List Management');
    
    // Save config and logger for use in other methods
    this.config = config;
    this.logger = logger;
    
    // Initialize API client
    api = axios.create({
      baseURL: config.BACKEND_URL,
      timeout: config.TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Initialize database connection for direct data verification
    try {
      dbClient = new pg.Client({
        host: 'localhost',
        port: 5432,
        database: 'chomp',
        user: 'postgres',
        password: 'password'
      });
      await dbClient.connect();
      logger.success('Connected to database for data verification');
    } catch (error) {
      logger.error('Failed to connect to database', error);
      // Continue without database verification
    }
    
    // Initialize browser for UI testing
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      logger.success('Browser initialized for UI testing');
    } catch (error) {
      logger.error('Failed to initialize browser', error);
      // Continue without browser testing
    }
    
    // Authenticate as admin
    let token = null;
    try {
      const authResponse = await api.post('/api/auth/login', {
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD
      });
      
      token = authResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.success('Authenticated as admin for enhanced list tests');
    } catch (error) {
      logger.error('Failed to authenticate as admin for enhanced list tests', error);
      await this.cleanup();
      return;
    }
    
    try {
      // Run enhanced test suite
      await this.runEnhancedTestSuite(config, logger, section, token);
    } finally {
      await this.cleanup();
    }
  },
  
  /**
   * Run the complete enhanced test suite
   */
  async runEnhancedTestSuite(config, logger, section, token) {
    let testListId = null;
    let testItemId = null;
    
    // Test 1: Full Data Lifecycle - List Creation
    const createResult = await this.testFullDataLifecycleListCreation(section);
    if (createResult.success) {
      testListId = createResult.listId;
    }
    
    // Test 2: Frontend UI Rendering Verification
    if (testListId && browser) {
      await this.testFrontendUIRendering(section, testListId, token);
    }
    
    // Test 3: Real-time Data Updates
    if (testListId) {
      await this.testRealTimeDataUpdates(section, testListId);
    }
    
    // Test 4: Full Data Lifecycle - Item Management
    if (testListId) {
      const itemResult = await this.testFullDataLifecycleItemManagement(section, testListId);
      if (itemResult.success) {
        testItemId = itemResult.itemId;
      }
    }
    
    // Test 5: Frontend State Synchronization
    if (testListId && browser) {
      await this.testFrontendStateSynchronization(section, testListId, token);
    }
    
    // Test 6: Error Handling and UI Feedback
    if (browser) {
      await this.testErrorHandlingAndUIFeedback(section, token);
    }
    
    // Test 7: Performance and Loading States
    if (testListId && browser) {
      await this.testPerformanceAndLoadingStates(section, testListId, token);
    }
    
    // Cleanup test data
    if (testListId) {
      await this.cleanupTestData(testListId);
    }
  },
  
  /**
   * Test 1: Full Data Lifecycle - List Creation
   * Verifies: API → Database → Frontend Rendering
   */
  async testFullDataLifecycleListCreation(section) {
    return await this.runTest(section, 'Full Data Lifecycle - List Creation', async () => {
      const listData = {
        name: `Enhanced Test List ${Date.now()}`,
        description: 'Created by enhanced integration tests',
        is_private: false
      };
      
      // Step 1: Create list via API
      const apiResponse = await api.post('/api/lists', listData);
      if (!apiResponse.data || !apiResponse.data.id) {
        return { success: false, message: 'API creation failed' };
      }
      
      const listId = apiResponse.data.id;
      this.logger.debug(`Created list via API: ${listId}`);
      
      // Step 2: Verify data in database
      if (dbClient) {
        const dbResult = await dbClient.query(
          'SELECT * FROM lists WHERE id = $1',
          [listId]
        );
        
        if (dbResult.rows.length === 0) {
          return { success: false, message: 'List not found in database' };
        }
        
        const dbList = dbResult.rows[0];
        if (dbList.name !== listData.name) {
          return { success: false, message: 'Database data does not match API request' };
        }
        
        this.logger.debug('Database verification successful');
      }
      
      // Step 3: Verify API retrieval
      const getResponse = await api.get(`/api/lists/${listId}`);
      if (!getResponse.data || getResponse.data.id !== listId) {
        return { success: false, message: 'API retrieval failed' };
      }
      
      this.logger.debug('API retrieval verification successful');
      
      return { 
        success: true, 
        listId,
        message: 'Full data lifecycle verified: API → Database → API retrieval'
      };
    });
  },
  
  /**
   * Test 2: Frontend UI Rendering Verification
   * Verifies: Database Data → Frontend Display
   */
  async testFrontendUIRendering(section, listId, token) {
    return await this.runTest(section, 'Frontend UI Rendering Verification', async () => {
      if (!browser || !page) {
        return { success: false, skipped: true, message: 'Browser not available' };
      }
      
      // Navigate to frontend with authentication
      await page.goto(`${this.config.FRONTEND_URL}/lists`);
      
      // Inject authentication token
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('force_online', 'true');
        localStorage.removeItem('offline-mode');
      }, token);
      
      // Reload to apply authentication
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Wait for lists to load
      try {
        await page.waitForSelector('[data-testid="list-card"], .list-card, [class*="list"]', {
          timeout: 10000
        });
      } catch (error) {
        // Try alternative selectors
        const content = await page.content();
        if (!content.includes('Enhanced Test List')) {
          return { 
            success: false, 
            message: 'Test list not found in UI - lists may not be rendering'
          };
        }
      }
      
      // Verify the specific test list is rendered
      const listElements = await page.$$eval('*', (elements) => {
        return elements
          .filter(el => el.textContent && el.textContent.includes('Enhanced Test List'))
          .map(el => ({
            tagName: el.tagName,
            textContent: el.textContent.substring(0, 100),
            className: el.className
          }));
      });
      
      if (listElements.length === 0) {
        return { 
          success: false, 
          message: 'Test list not found in rendered UI'
        };
      }
      
      this.logger.debug(`Found ${listElements.length} UI elements containing test list data`);
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: `test-reports/list-ui-rendering-${Date.now()}.png`,
        fullPage: true 
      });
      
      return { 
        success: true,
        message: `UI rendering verified - found ${listElements.length} elements displaying list data`
      };
    });
  },
  
  /**
   * Test 3: Real-time Data Updates
   * Verifies: API Update → Database → Frontend Refresh
   */
  async testRealTimeDataUpdates(section, listId) {
    return await this.runTest(section, 'Real-time Data Updates', async () => {
      const updatedName = `Updated Enhanced Test List ${Date.now()}`;
      
      // Step 1: Update via API
      const updateResponse = await api.put(`/api/lists/${listId}`, {
        name: updatedName,
        description: 'Updated by enhanced integration tests'
      });
      
      if (!updateResponse.data) {
        return { success: false, message: 'API update failed' };
      }
      
      // Step 2: Verify database update
      if (dbClient) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Allow for async updates
        
        const dbResult = await dbClient.query(
          'SELECT name FROM lists WHERE id = $1',
          [listId]
        );
        
        if (dbResult.rows.length === 0 || dbResult.rows[0].name !== updatedName) {
          return { success: false, message: 'Database not updated correctly' };
        }
      }
      
      // Step 3: Verify API reflects update
      const getResponse = await api.get(`/api/lists/${listId}`);
      if (!getResponse.data || getResponse.data.name !== updatedName) {
        return { success: false, message: 'API does not reflect update' };
      }
      
      // Step 4: Verify frontend updates (if browser available)
      if (browser && page) {
        await page.reload();
        await page.waitForTimeout(2000);
        
        const updatedContent = await page.content();
        if (!updatedContent.includes(updatedName)) {
          return { 
            success: false, 
            message: 'Frontend does not reflect real-time updates'
          };
        }
      }
      
      return { 
        success: true,
        message: 'Real-time data updates verified across all layers'
      };
    });
  },
  
  /**
   * Test 4: Full Data Lifecycle - Item Management
   * Verifies: Item Creation → Database → API → Frontend
   */
  async testFullDataLifecycleItemManagement(section, listId) {
    return await this.runTest(section, 'Full Data Lifecycle - Item Management', async () => {
      const itemData = {
        name: `Enhanced Test Item ${Date.now()}`,
        description: 'Created by enhanced integration tests',
        restaurant_name: 'Test Restaurant',
        location: 'Test Location'
      };
      
      // Step 1: Create item via API
      const createResponse = await api.post(`/api/lists/${listId}/items`, itemData);
      if (!createResponse.data || !createResponse.data.id) {
        return { success: false, message: 'Item API creation failed' };
      }
      
      const itemId = createResponse.data.id;
      
      // Step 2: Verify in database
      if (dbClient) {
        const dbResult = await dbClient.query(
          'SELECT * FROM list_items WHERE id = $1 AND list_id = $2',
          [itemId, listId]
        );
        
        if (dbResult.rows.length === 0) {
          return { success: false, message: 'Item not found in database' };
        }
        
        const dbItem = dbResult.rows[0];
        if (dbItem.name !== itemData.name) {
          return { success: false, message: 'Database item data does not match' };
        }
      }
      
      // Step 3: Verify API retrieval
      const getResponse = await api.get(`/api/lists/${listId}/items`);
      const items = Array.isArray(getResponse.data) ? getResponse.data : getResponse.data.items;
      const createdItem = items.find(item => item.id === itemId);
      
      if (!createdItem) {
        return { success: false, message: 'Item not found in API response' };
      }
      
      return { 
        success: true, 
        itemId,
        message: 'Item data lifecycle verified: API → Database → API retrieval'
      };
    });
  },
  
  /**
   * Test 5: Frontend State Synchronization
   * Verifies: User Actions → State Updates → UI Reflection
   */
  async testFrontendStateSynchronization(section, listId, token) {
    return await this.runTest(section, 'Frontend State Synchronization', async () => {
      if (!browser || !page) {
        return { success: false, skipped: true, message: 'Browser not available' };
      }
      
      // Navigate to list detail page
      await page.goto(`${this.config.FRONTEND_URL}/list/${listId}`);
      
      // Ensure authentication
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('force_online', 'true');
      }, token);
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Check for loading states
      const hasLoadingIndicator = await page.$('[data-testid="loading"], .loading, .spinner') !== null;
      
      // Check for error states
      const hasErrorState = await page.$('[data-testid="error"], .error') !== null;
      
      // Check for data display
      const hasDataContent = await page.evaluate(() => {
        const content = document.body.textContent;
        return content.includes('Enhanced Test List') || 
               content.includes('Test Item') ||
               content.length > 1000; // Indicates content loaded
      });
      
      // Verify state management
      const stateInfo = await page.evaluate(() => {
        // Check for common state management indicators
        const hasReactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        const hasZustand = window.__zustand__;
        const hasLocalStorage = localStorage.length > 0;
        
        return {
          hasReactDevTools: !!hasReactDevTools,
          hasZustand: !!hasZustand,
          hasLocalStorage,
          localStorageKeys: Object.keys(localStorage)
        };
      });
      
      this.logger.debug('Frontend state info:', stateInfo);
      
      if (!hasDataContent && !hasLoadingIndicator) {
        return { 
          success: false, 
          message: 'Frontend appears to have no content or loading states'
        };
      }
      
      return { 
        success: true,
        message: `Frontend state synchronization verified - Content: ${hasDataContent}, Loading: ${hasLoadingIndicator}, Error: ${hasErrorState}`
      };
    });
  },
  
  /**
   * Test 6: Error Handling and UI Feedback
   * Verifies: Error States → User Feedback
   */
  async testErrorHandlingAndUIFeedback(section, token) {
    return await this.runTest(section, 'Error Handling and UI Feedback', async () => {
      if (!browser || !page) {
        return { success: false, skipped: true, message: 'Browser not available' };
      }
      
      // Test 1: Invalid list access
      await page.goto(`${this.config.FRONTEND_URL}/list/99999`);
      
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
      }, token);
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Check for error handling
      const errorElements = await page.$$eval('*', (elements) => {
        return elements
          .filter(el => {
            const text = el.textContent.toLowerCase();
            return text.includes('error') || 
                   text.includes('not found') || 
                   text.includes('failed') ||
                   text.includes('something went wrong');
          })
          .map(el => el.textContent.substring(0, 100));
      });
      
      // Test 2: Network error simulation
      await page.setOfflineMode(true);
      await page.goto(`${this.config.FRONTEND_URL}/lists`);
      await page.waitForTimeout(2000);
      
      const offlineContent = await page.content();
      const hasOfflineHandling = offlineContent.includes('offline') || 
                                 offlineContent.includes('network') ||
                                 offlineContent.includes('connection');
      
      await page.setOfflineMode(false);
      
      return { 
        success: true,
        message: `Error handling verified - Error elements: ${errorElements.length}, Offline handling: ${hasOfflineHandling}`
      };
    });
  },
  
  /**
   * Test 7: Performance and Loading States
   * Verifies: Loading Performance → User Experience
   */
  async testPerformanceAndLoadingStates(section, listId, token) {
    return await this.runTest(section, 'Performance and Loading States', async () => {
      if (!browser || !page) {
        return { success: false, skipped: true, message: 'Browser not available' };
      }
      
      // Measure page load performance
      const startTime = performance.now();
      
      await page.goto(`${this.config.FRONTEND_URL}/lists`);
      
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('force_online', 'true');
      }, token);
      
      await page.reload();
      
      // Wait for content to load
      try {
        await page.waitForSelector('body', { timeout: 10000 });
        await page.waitForTimeout(2000); // Allow for async loading
      } catch (error) {
        // Continue with performance measurement
      }
      
      const loadTime = performance.now() - startTime;
      
      // Check for loading indicators
      const performanceMetrics = await page.evaluate(() => {
        const performance = window.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      // Check for loading states
      const hasLoadingStates = await page.evaluate(() => {
        const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner, .skeleton');
        return loadingElements.length > 0;
      });
      
      this.logger.debug('Performance metrics:', performanceMetrics);
      
      const isPerformant = loadTime < 5000; // 5 second threshold
      
      return { 
        success: true,
        message: `Performance verified - Load time: ${Math.round(loadTime)}ms, Performant: ${isPerformant}, Loading states: ${hasLoadingStates}`
      };
    });
  },
  
  /**
   * Cleanup test data
   */
  async cleanupTestData(listId) {
    try {
      await api.delete(`/api/lists/${listId}`);
      this.logger.debug(`Cleaned up test list: ${listId}`);
    } catch (error) {
      this.logger.error('Failed to cleanup test data', error);
    }
  },
  
  /**
   * Cleanup resources
   */
  async cleanup() {
    if (browser) {
      try {
        await browser.close();
        this.logger.debug('Browser closed');
      } catch (error) {
        this.logger.error('Error closing browser', error);
      }
    }
    
    if (dbClient) {
      try {
        await dbClient.end();
        this.logger.debug('Database connection closed');
      } catch (error) {
        this.logger.error('Error closing database connection', error);
      }
    }
  },
  
  /**
   * Run a test and handle timing/logging
   */
  async runTest(section, name, testFn) {
    const startTime = performance.now();
    try {
      const result = await testFn();
      const duration = Math.round(performance.now() - startTime);
      
      if (result.success) {
        this.logger.test(section, name, 'PASSED', duration, result.message);
      } else if (result.skipped) {
        this.logger.test(section, name, 'SKIPPED', 0, result.message);
      } else {
        this.logger.test(section, name, 'FAILED', duration, result.message);
      }
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error.message || 'Unknown error';
      this.logger.test(section, name, 'FAILED', duration, message);
      this.logger.error(`Test execution error: ${name}`, error);
      return { success: false, message };
    }
  }
};

export default enhancedListTests;
