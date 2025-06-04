/**
 * DEBUG LIST ITEMS FRONTEND TEST
 * 
 * This test specifically debugs the frontend React components and 
 * API calls to determine why list items aren't displaying
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const TEST_USER = {
  email: 'admin@example.com',
  password: 'doof123'
};

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5001';

function logProgress(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n🔵 [${timestamp}] ${message}`);
}

function logSuccess(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n✅ [${timestamp}] ${message}`);
}

function logError(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n❌ [${timestamp}] ${message}`);
}

class FrontendDebugger {
  static async performAuthentication(page) {
    logProgress('🔐 Authenticating...');
    
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').click();
      
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (token && token.startsWith('eyJ')) {
        logSuccess('🎉 Authentication successful!');
        return token;
      }
      
      return null;
    } catch (error) {
      logError(`Authentication failed: ${error.message}`);
      return null;
    }
  }

  static async debugFrontendAPICall(page, listId) {
    logProgress(`🔍 Setting up frontend API call debugging for list ${listId}...`);
    
    // Intercept and log all network requests
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/lists/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: Object.fromEntries(Object.entries(request.headers())),
          timestamp: new Date().toISOString()
        });
        logProgress(`📤 REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/lists/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        logProgress(`📥 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    return { requests, responses };
  }

  static async navigateToListDetailAndDebug(page, listId) {
    logProgress(`🧭 Navigating to list ${listId} detail page...`);
    
    const detailUrl = `${BASE_URL}/lists/${listId}`;
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(5000); // Give extra time for all requests
    
    // Take screenshot
    await page.screenshot({ 
      path: `e2e-results/screenshots/debug-list-${listId}.png`, 
      fullPage: true 
    });
    
    // Debug React component state
    const debugInfo = await page.evaluate(() => {
      const debugData = {
        currentUrl: window.location.href,
        reactProps: null,
        queryStates: null,
        localStorageAuth: null,
        errors: []
      };
      
      try {
        // Check auth in localStorage
        debugData.localStorageAuth = {
          token: localStorage.getItem('token')?.substring(0, 30) + '...',
          hasToken: !!localStorage.getItem('token')
        };
        
        // Try to find React components and their state
        const reactFiberKey = Object.keys(document.body).find(key => 
          key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
        );
        
        if (reactFiberKey) {
          debugData.reactProps = 'React fiber found';
        }
        
        // Look for any error messages in the DOM
        const errorElements = document.querySelectorAll('[class*="error"], .error, [data-testid*="error"]');
        errorElements.forEach(el => {
          if (el.textContent) {
            debugData.errors.push(el.textContent.trim());
          }
        });
        
        // Look for loading indicators
        const loadingElements = document.querySelectorAll('[class*="loading"], .loading, [class*="spinner"]');
        debugData.loadingStates = Array.from(loadingElements).map(el => ({
          className: el.className,
          text: el.textContent?.trim(),
          visible: el.offsetWidth > 0 && el.offsetHeight > 0
        }));
        
        // Check for list items in the DOM
        const listItemSelectors = [
          '.list-item', '.dish-item', '.restaurant-item', 
          '[data-testid*="item"]', '.item-card', '.menu-item'
        ];
        
        debugData.domItems = {};
        listItemSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          debugData.domItems[selector] = {
            count: elements.length,
            texts: Array.from(elements).slice(0, 3).map(el => el.textContent?.trim().substring(0, 50))
          };
        });
        
        // Check for debug information displayed on page
        const debugElements = document.querySelectorAll('*');
        debugData.pageDebugInfo = [];
        Array.from(debugElements).forEach(el => {
          const text = el.textContent || '';
          if (text.includes('Debug') || text.includes('Items data:') || text.includes('Items loading:')) {
            debugData.pageDebugInfo.push(text.trim());
          }
        });
        
      } catch (error) {
        debugData.errors.push(`Debug evaluation error: ${error.message}`);
      }
      
      return debugData;
    });
    
    logProgress(`🔍 Frontend Debug Info:`);
    logProgress(`   URL: ${debugInfo.currentUrl}`);
    logProgress(`   Auth: ${JSON.stringify(debugInfo.localStorageAuth)}`);
    logProgress(`   React: ${debugInfo.reactProps}`);
    logProgress(`   Errors: ${JSON.stringify(debugInfo.errors)}`);
    logProgress(`   Loading States: ${JSON.stringify(debugInfo.loadingStates)}`);
    logProgress(`   DOM Items: ${JSON.stringify(debugInfo.domItems)}`);
    
    if (debugInfo.pageDebugInfo.length > 0) {
      logProgress(`   Page Debug Info:`);
      debugInfo.pageDebugInfo.forEach(info => {
        logProgress(`     ${info}`);
      });
    }
    
    return debugInfo;
  }

  static async inspectReactQueries(page) {
    logProgress(`🔍 Inspecting React Query states...`);
    
    // Wait a bit longer for queries to settle
    await page.waitForTimeout(3000);
    
    const queryDebugInfo = await page.evaluate(() => {
      const queryDebug = {
        reactQueryDevtools: null,
        windowReactQuery: null,
        consoleErrors: [],
        networkRequests: []
      };
      
      try {
        // Check if React Query is available on window
        if (window.__REACT_QUERY_CLIENT__) {
          queryDebug.windowReactQuery = 'React Query client found on window';
        }
        
        // Check for React Query DevTools
        if (window.__REACT_QUERY_DEVTOOLS__) {
          queryDebug.reactQueryDevtools = 'React Query DevTools detected';
        }
        
        // Capture any console errors from memory
        if (window.console.memory) {
          queryDebug.consoleErrors.push('Console memory access available');
        }
        
      } catch (error) {
        queryDebug.consoleErrors.push(`Query inspection error: ${error.message}`);
      }
      
      return queryDebug;
    });
    
    logProgress(`🔍 React Query Debug: ${JSON.stringify(queryDebugInfo)}`);
    return queryDebugInfo;
  }

  static async verifyAPIDataVsUI(page, listId, apiItems) {
    logProgress(`🔍 Comparing API data vs UI display...`);
    
    // Check what the UI actually shows
    const uiItems = await page.evaluate(() => {
      const items = [];
      
      // Look for various item selectors
      const selectors = [
        '.list-item', '.dish-item', '.restaurant-item', 
        '[data-testid*="item"]', '.item-card', '.menu-item',
        'li:has(.item)', 'div:has(.dish)', 'div:has(.restaurant)'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        Array.from(elements).forEach(el => {
          if (el.offsetWidth > 0 && el.offsetHeight > 0) { // Only visible elements
            const text = el.textContent?.trim();
            if (text && text.length > 3) {
              items.push({
                selector,
                text: text.substring(0, 100),
                classes: el.className,
                id: el.id
              });
            }
          }
        });
      });
      
      return items;
    });
    
    logProgress(`📊 API returned ${apiItems.length} items`);
    logProgress(`📊 UI shows ${uiItems.length} items`);
    
    if (apiItems.length > 0) {
      logProgress(`📝 API Items:`);
      apiItems.forEach((item, index) => {
        logProgress(`   ${index + 1}. ${item.name} (${item.item_type})`);
      });
    }
    
    if (uiItems.length > 0) {
      logProgress(`📝 UI Items:`);
      uiItems.forEach((item, index) => {
        logProgress(`   ${index + 1}. "${item.text}" (${item.selector})`);
      });
    } else {
      logError(`🚨 NO ITEMS VISIBLE IN UI despite API returning ${apiItems.length} items!`);
    }
    
    return { apiItems, uiItems };
  }
}

test.describe('Debug List Items Frontend', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    logProgress('🚀 STARTING FRONTEND DEBUG TEST');
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: 'e2e-results/videos/',
        size: { width: 1920, height: 1080 }
      }
    });
    
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    
    // Listen for all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        logError(`CONSOLE ERROR: ${text}`);
      } else if (text.includes('[ListDetail]') || text.includes('Items')) {
        logProgress(`CONSOLE ${type.toUpperCase()}: ${text}`);
      }
    });
    
    logSuccess('✅ Test setup completed');
  });

  test('Debug Frontend List Items Display Issue', async () => {
    logProgress('🔍 STARTING FRONTEND DEBUGGING');
    
    try {
      // Step 1: Authenticate
      const token = await FrontendDebugger.performAuthentication(page);
      expect(token).toBeTruthy();
      
      // Step 2: Set up API debugging
      const { requests, responses } = await FrontendDebugger.debugFrontendAPICall(page, 59);
      
      // Enhanced console monitoring - capture ALL console messages
      const allConsoleMessages = [];
      page.on('console', msg => {
        const messageText = msg.text();
        allConsoleMessages.push({
          type: msg.type(),
          text: messageText,
          timestamp: new Date().toISOString()
        });
        
        // Log all ListDetail related messages immediately
        if (messageText.includes('[ListDetail]') || messageText.includes('🚀') || messageText.includes('🌐')) {
          logProgress(`CONSOLE [${msg.type().toUpperCase()}]: ${messageText}`);
        }
      });
      
      // Step 3: Get expected API data
      logProgress('📡 Checking API data directly...');
      const apiResponse = await fetch(`${API_URL}/api/lists/59/items`, {
        headers: {
          'Authorization': `Bearer ${token.replace('Bearer ', '')}`
        }
      });
      const apiData = await apiResponse.json();
      const apiItems = apiData.data || [];
      
      logProgress(`📊 API directly returns ${apiItems.length} items`);
      
      // Step 4: Navigate to list detail page and debug
      const debugInfo = await FrontendDebugger.navigateToListDetailAndDebug(page, 59);
      
      // Step 5: Wait for React component to fully mount and check console
      await page.waitForTimeout(5000);
      
      // Step 6: Log all console messages we captured
      logProgress(`📝 CAPTURED ${allConsoleMessages.length} CONSOLE MESSAGES:`);
      allConsoleMessages.forEach((msg, index) => {
        if (msg.text.includes('[ListDetail]') || msg.text.includes('🚀') || msg.text.includes('🌐') || msg.text.includes('Component initialized')) {
          logProgress(`   ${index + 1}. [${msg.type}] ${msg.text}`);
        }
      });
      
      // Step 7: Check if we have any ListDetail debug messages
      const listDetailMessages = allConsoleMessages.filter(msg => 
        msg.text.includes('[ListDetail]') || msg.text.includes('Component initialized')
      );
      
      if (listDetailMessages.length === 0) {
        logError('🚨 NO LISTDETAIL COMPONENT DEBUG MESSAGES FOUND!');
        logError('This suggests the component is not mounting or not importing correctly');
        
        // Check current URL
        const currentUrl = page.url();
        logProgress(`Current URL: ${currentUrl}`);
        
        // Check if we're on the right page
        const pageContent = await page.content();
        const hasListDetailContent = pageContent.includes('Restaurant & Dish Collection') || 
                                   pageContent.includes('This list is empty');
        logProgress(`Has ListDetail content: ${hasListDetailContent}`);
        
        // Check React Router
        const routerDebug = await page.evaluate(() => {
          // Check if React Router is working
          return {
            currentPath: window.location.pathname,
            hasReactRouter: !!window.ReactRouter,
            hasReact: !!window.React,
            documentTitle: document.title
          };
        });
        logProgress(`Router debug: ${JSON.stringify(routerDebug)}`);
      } else {
        logSuccess(`✅ Found ${listDetailMessages.length} ListDetail component messages`);
        listDetailMessages.forEach(msg => {
          logProgress(`   - ${msg.text}`);
        });
      }
      
      // Step 8: Inspect React Query states
      const queryInfo = await FrontendDebugger.inspectReactQueries(page);
      
      // Step 9: Compare API vs UI
      const comparison = await FrontendDebugger.verifyAPIDataVsUI(page, 59, apiItems);
      
      // Step 10: Summary of network activity
      logProgress(`📊 NETWORK ACTIVITY SUMMARY:`);
      logProgress(`   Total Requests: ${requests.length}`);
      logProgress(`   Total Responses: ${responses.length}`);
      
      requests.forEach((req, index) => {
        logProgress(`   Request ${index + 1}: ${req.method} ${req.url}`);
      });
      
      responses.forEach((res, index) => {
        logProgress(`   Response ${index + 1}: ${res.status} ${res.url}`);
      });
      
      // Final diagnosis
      logSuccess('🎯 DEBUGGING COMPLETE');
      logSuccess(`API Items: ${apiItems.length}`);
      logSuccess(`UI Items: ${comparison.uiItems.length}`);
      logSuccess(`Network Requests: ${requests.length}`);
      logSuccess(`Debug Errors: ${debugInfo.errors.length}`);
      logSuccess(`Console Messages: ${allConsoleMessages.length}`);
      logSuccess(`ListDetail Messages: ${listDetailMessages.length}`);
      
      if (listDetailMessages.length === 0) {
        logError('🚨 CRITICAL: ListDetail component not executing - check component mounting/imports');
      } else if (apiItems.length > 0 && comparison.uiItems.length === 0) {
        logError('🚨 CONFIRMED: Frontend bug - API returns data but UI shows nothing');
      } else if (apiItems.length === 0) {
        logError('🚨 API returns no data - backend issue');
      } else {
        logSuccess('🎉 UI is displaying some items');
      }
      
      expect(apiItems.length).toBeGreaterThan(0);
      
    } catch (error) {
      logError(`Test error: ${error.message}`);
      throw error;
    }
  });
}); 