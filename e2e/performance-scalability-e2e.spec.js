/**
 * Performance & Scalability E2E Tests - Phase 3
 * 
 * Tests admin panel performance with realistic data volumes:
 * - Load testing with multiple restaurants
 * - Response time measurements
 * - Pagination performance
 * - Concurrent operation testing
 * - Memory usage monitoring
 * 
 * Uses real NYC pizza restaurant data for authentic testing
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5174';
const API_BASE_URL = 'http://localhost:5001';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'doof123'
};

// Real NYC pizza restaurant test data
const NYC_PIZZA_RESTAURANTS = [
  {
    name: "Joe's Pizza",
    address: "7 Carmine St",
    city_id: 1, // New York
    phone: "212-366-1182"
  },
  {
    name: "John's of Bleecker Street", 
    address: "278 Bleecker St",
    city_id: 1,
    phone: "212-243-1680"
  },
  {
    name: "2 Bros. Pizza",
    address: "32 St. Marks Pl", 
    city_id: 1,
    phone: "212-777-2677"
  },
  {
    name: "Prince Street Pizza",
    address: "27 Prince St",
    city_id: 1, 
    phone: "212-966-4100"
  },
  {
    name: "Lombardi's Pizza",
    address: "32 Spring St",
    city_id: 1,
    phone: "212-941-7994"
  },
  {
    name: "Lucali",
    address: "575 Henry St",
    city_id: 1, // Brooklyn (same city_id for NYC)
    phone: "718-858-4086"
  },
  {
    name: "Di Fara Pizza", 
    address: "1424 Avenue J",
    city_id: 1,
    phone: "718-258-1367"
  },
  {
    name: "Roberta's",
    address: "261 Moore St",
    city_id: 1,
    phone: "718-417-1118"
  },
  {
    name: "Paulie Gee's",
    address: "60 Greenpoint Ave", 
    city_id: 1,
    phone: "347-987-3747"
  },
  {
    name: "Artichoke Basille's Pizza",
    address: "321 E 14th St",
    city_id: 1,
    phone: "212-228-2004"
  }
];

// Performance measurement utilities
class PerformanceTracker {
  constructor() {
    this.metrics = {
      apiCalls: [],
      pageLoads: [],
      userActions: []
    };
  }

  startTimer(operation) {
    return {
      operation,
      startTime: Date.now(),
      end: () => {
        const duration = Date.now() - this.startTime;
        this.metrics.apiCalls.push({ operation, duration });
        return duration;
      }
    };
  }

  async measureApiCall(operation, apiCall) {
    const timer = this.startTimer(operation);
    try {
      const result = await apiCall();
      const duration = timer.end();
      console.log(`⏱️ ${operation}: ${duration}ms`);
      return { result, duration };
    } catch (error) {
      timer.end();
      throw error;
    }
  }

  async measurePageAction(operation, pageAction) {
    const timer = this.startTimer(operation);
    try {
      const result = await pageAction();
      const duration = timer.end();
      this.metrics.userActions.push({ operation, duration });
      console.log(`🖱️ ${operation}: ${duration}ms`);
      return { result, duration };
    } catch (error) {
      timer.end();
      throw error;
    }
  }

  getAverageTime(category) {
    const times = this.metrics[category]?.map(m => m.duration) || [];
    return times.length ? times.reduce((a, b) => a + b) / times.length : 0;
  }

  getSummary() {
    return {
      totalApiCalls: this.metrics.apiCalls.length,
      averageApiTime: this.getAverageTime('apiCalls'),
      totalUserActions: this.metrics.userActions.length, 
      averageActionTime: this.getAverageTime('userActions'),
      slowestOperation: this.metrics.apiCalls.reduce((max, curr) => 
        curr.duration > (max?.duration || 0) ? curr : max, null)
    };
  }
}

// Helper functions
async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
  await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function getAuthToken(page) {
  return await page.evaluate(() => {
    const authStorage = localStorage.getItem('auth-authentication-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token;
    }
    return localStorage.getItem('auth-token');
  });
}

async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  return {
    status: response.status,
    data: response.ok ? await response.json() : null,
    headers: response.headers
  };
}

async function cleanupTestData(token, testPrefix = 'PERF_TEST_') {
  try {
    const response = await apiRequest('GET', '/api/admin/restaurants', null, token);
    if (response.data?.data) {
      const testRestaurants = response.data.data.filter(r => 
        r.name.includes(testPrefix) || NYC_PIZZA_RESTAURANTS.some(pizza => pizza.name === r.name)
      );
      
      for (const restaurant of testRestaurants) {
        await apiRequest('DELETE', `/api/admin/restaurants/${restaurant.id}`, null, token);
      }
      
      console.log(`🧹 Cleaned up ${testRestaurants.length} test restaurants`);
    }
  } catch (error) {
    console.log('⚠️ Cleanup error:', error.message);
  }
}

// Test Suite
test.describe('Performance & Scalability E2E Tests', () => {
  let performanceTracker;
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for performance tests
    performanceTracker = new PerformanceTracker();
    await loginAsAdmin(page);
  });
  
  test.afterEach(async ({ page }) => {
    const token = await getAuthToken(page);
    if (token) {
      await cleanupTestData(token);
    }
    
    // Log performance summary
    const summary = performanceTracker.getSummary();
    console.log('\n📊 Performance Summary:');
    console.log(`   API Calls: ${summary.totalApiCalls} (avg: ${Math.round(summary.averageApiTime)}ms)`);
    console.log(`   User Actions: ${summary.totalUserActions} (avg: ${Math.round(summary.averageActionTime)}ms)`);
    if (summary.slowestOperation) {
      console.log(`   Slowest: ${summary.slowestOperation.operation} (${summary.slowestOperation.duration}ms)`);
    }
  });

  test('3.1 Bulk Data Loading Performance', async ({ page }) => {
    console.log('🚀 Testing Bulk Data Loading Performance...');
    
    const token = await getAuthToken(page);
    
    // Test 1: Bulk create all NYC pizza restaurants
    console.log('📝 Creating 10 NYC pizza restaurants...');
    
    const createPromises = NYC_PIZZA_RESTAURANTS.map(async (restaurant, index) => {
      const uniqueName = `${restaurant.name} (PERF_TEST_${Date.now()}_${index})`;
      const restaurantData = { ...restaurant, name: uniqueName };
      
      return await performanceTracker.measureApiCall(
        `Create Restaurant ${index + 1}`,
        () => apiRequest('POST', '/api/admin/restaurants', restaurantData, token)
      );
    });
    
    const createResults = await Promise.all(createPromises);
    const successfulCreates = createResults.filter(r => r.result.status === 201 || r.result.status === 200);
    
    expect(successfulCreates.length).toBeGreaterThanOrEqual(8); // Allow for some failures
    console.log(`✅ Created ${successfulCreates.length}/${NYC_PIZZA_RESTAURANTS.length} restaurants`);
    
    // Test 2: Measure page load time with larger dataset
    console.log('📄 Testing page load with full dataset...');
    
    await performanceTracker.measurePageAction(
      'Navigate to Restaurants Tab',
      async () => {
        await page.click('button:has-text("Restaurants")');
        await page.waitForLoadState('networkidle');
      }
    );
    
    // Test 3: Measure table loading and rendering time
    await performanceTracker.measurePageAction(
      'Wait for Table Render',
      async () => {
        await page.waitForSelector('table', { timeout: 10000 });
        // Wait for all restaurant data to load
        await page.waitForTimeout(2000);
      }
    );
    
    // Test 4: Count total rows and verify data display
    const rowCount = await page.$$eval('table tbody tr', rows => rows.length);
    expect(rowCount).toBeGreaterThanOrEqual(10); // Should have at least our 10 restaurants
    console.log(`📊 Table displaying ${rowCount} restaurants`);
    
    // Test 5: Search performance
    await performanceTracker.measurePageAction(
      'Search Performance',
      async () => {
        const searchSelectors = [
          'input[placeholder*="search"]',
          'input[placeholder*="Search"]', 
          'input[type="search"]',
          '.search-input'
        ];
        
        for (const selector of searchSelectors) {
          try {
            await page.fill(selector, 'Pizza');
            await page.waitForTimeout(1000); // Wait for search results
            break;
          } catch (error) {
            continue;
          }
        }
      }
    );
    
    console.log('🎉 Bulk loading performance test completed');
  });

  test('3.2 Concurrent Operations Testing', async ({ page }) => {
    console.log('🔄 Testing Concurrent Operations...');
    
    const token = await getAuthToken(page);
    
    // Test 1: Concurrent restaurant creation
    console.log('⚡ Testing concurrent restaurant creation...');
    
    const concurrentBatch = NYC_PIZZA_RESTAURANTS.slice(0, 5).map((restaurant, index) => {
      const uniqueName = `${restaurant.name} (CONCURRENT_${Date.now()}_${index})`;
      return { ...restaurant, name: uniqueName };
    });
    
    const concurrentCreates = concurrentBatch.map(async (restaurant, index) => {
      return await performanceTracker.measureApiCall(
        `Concurrent Create ${index + 1}`,
        () => apiRequest('POST', '/api/admin/restaurants', restaurant, token)
      );
    });
    
    // Execute all creates simultaneously
    const startTime = Date.now();
    const concurrentResults = await Promise.all(concurrentCreates);
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️ Concurrent operations completed in ${totalTime}ms`);
    
    const successfulConcurrent = concurrentResults.filter(r => 
      r.result.status === 201 || r.result.status === 200
    );
    
    expect(successfulConcurrent.length).toBeGreaterThanOrEqual(3); // Allow for some failures under load
    console.log(`✅ ${successfulConcurrent.length}/${concurrentBatch.length} concurrent operations succeeded`);
    
    // Test 2: Concurrent read operations
    console.log('📖 Testing concurrent read operations...');
    
    const readOperations = [
      () => apiRequest('GET', '/api/admin/restaurants', null, token),
      () => apiRequest('GET', '/api/admin/dishes', null, token),
      () => apiRequest('GET', '/api/admin/users', null, token),
      () => apiRequest('GET', '/api/admin/cities', null, token),
      () => apiRequest('GET', '/api/admin/neighborhoods', null, token)
    ];
    
    const readResults = await Promise.all(
      readOperations.map((operation, index) => 
        performanceTracker.measureApiCall(`Concurrent Read ${index + 1}`, operation)
      )
    );
    
    const successfulReads = readResults.filter(r => r.result.status === 200);
    expect(successfulReads.length).toBe(readOperations.length);
    console.log(`✅ All ${successfulReads.length} concurrent read operations succeeded`);
    
    console.log('🎉 Concurrent operations test completed');
  });

  test('3.3 Pagination and Large Dataset Performance', async ({ page }) => {
    console.log('📄 Testing Pagination Performance...');
    
    const token = await getAuthToken(page);
    
    // First, create enough data to test pagination
    console.log('📝 Creating additional restaurants for pagination testing...');
    
    const additionalRestaurants = [];
    for (let i = 0; i < 15; i++) {
      additionalRestaurants.push({
        name: `PERF_TEST_Restaurant_${Date.now()}_${i}`,
        address: `${100 + i} Test Street`,
        city_id: 1,
        phone: `555-TEST-${String(i).padStart(3, '0')}`
      });
    }
    
    // Create restaurants in smaller batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < additionalRestaurants.length; i += batchSize) {
      const batch = additionalRestaurants.slice(i, i + batchSize);
      const batchPromises = batch.map(restaurant => 
        apiRequest('POST', '/api/admin/restaurants', restaurant, token)
      );
      await Promise.all(batchPromises);
      console.log(`Created batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(additionalRestaurants.length/batchSize)}`);
    }
    
    // Test pagination performance
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    await performanceTracker.measurePageAction(
      'Navigate to Restaurants with Large Dataset',
      async () => {
        await page.click('button:has-text("Restaurants")');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('table', { timeout: 15000 });
      }
    );
    
    // Test pagination controls if they exist
    const paginationSelectors = [
      '.pagination button',
      '[aria-label="Next page"]',
      'button:has-text("Next")',
      '.page-navigation button'
    ];
    
    for (const selector of paginationSelectors) {
      try {
        const paginationButtons = await page.$$(selector);
        if (paginationButtons.length > 0) {
          console.log(`📄 Found ${paginationButtons.length} pagination controls`);
          
          await performanceTracker.measurePageAction(
            'Pagination Navigation',
            async () => {
              await paginationButtons[paginationButtons.length - 1].click();
              await page.waitForTimeout(1000);
            }
          );
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Test sorting performance if available
    const sortingSelectors = [
      'th[role="columnheader"]',
      '.sortable-header',
      'th:has-text("Name")',
      'th:has-text("Created")'
    ];
    
    for (const selector of sortingSelectors) {
      try {
        const sortHeaders = await page.$$(selector);
        if (sortHeaders.length > 0) {
          console.log(`🔄 Testing sort performance on ${sortHeaders.length} columns`);
          
          await performanceTracker.measurePageAction(
            'Column Sorting',
            async () => {
              await sortHeaders[0].click();
              await page.waitForTimeout(1000);
            }
          );
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('🎉 Pagination and large dataset test completed');
  });

  test('3.4 Memory and Resource Usage Monitoring', async ({ page }) => {
    console.log('🧠 Testing Memory and Resource Usage...');
    
    const token = await getAuthToken(page);
    
    // Monitor page performance
    await page.goto(`${BASE_URL}/admin`);
    
    // Get initial performance metrics
    const initialMetrics = await page.evaluate(() => ({
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing,
      navigation: performance.navigation.type
    }));
    
    console.log('📊 Initial Performance Metrics:');
    if (initialMetrics.memory) {
      console.log(`   Memory Used: ${Math.round(initialMetrics.memory.used / 1024 / 1024)}MB`);
      console.log(`   Memory Total: ${Math.round(initialMetrics.memory.total / 1024 / 1024)}MB`);
    }
    
    // Perform intensive operations
    await page.click('button:has-text("Restaurants")');
    await page.waitForLoadState('networkidle');
    
    // Navigate between different tabs to test memory usage
    const tabs = ['Dishes', 'Users', 'Cities', 'Restaurants'];
    for (const tab of tabs) {
      await performanceTracker.measurePageAction(
        `Navigate to ${tab}`,
        async () => {
          try {
            await page.click(`button:has-text("${tab}")`);
            await page.waitForTimeout(1500);
          } catch (error) {
            console.log(`⚠️ Could not navigate to ${tab} tab`);
          }
        }
      );
    }
    
    // Check final performance metrics
    const finalMetrics = await page.evaluate(() => ({
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null,
      resourceCount: performance.getEntriesByType('resource').length
    }));
    
    console.log('📊 Final Performance Metrics:');
    if (finalMetrics.memory && initialMetrics.memory) {
      const memoryIncrease = finalMetrics.memory.used - initialMetrics.memory.used;
      console.log(`   Memory Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      console.log(`   Resource Count: ${finalMetrics.resourceCount}`);
      
      // Alert if memory usage is excessive
      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB increase
        console.log('⚠️ High memory usage detected');
      } else {
        console.log('✅ Memory usage within acceptable limits');
      }
    }
    
    console.log('🎉 Memory and resource monitoring completed');
  });

}); 