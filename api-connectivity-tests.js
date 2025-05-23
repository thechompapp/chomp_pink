/**
 * API Connectivity Verification Test Suite
 * 
 * This script systematically tests all API endpoints required for the bulk add feature,
 * including authentication, backend health, and Google Places API integration.
 * 
 * Usage: node api-connectivity-tests.js [--verbose] [--section=<section-name>]
 * Options:
 *   --verbose: Show detailed logs including response data
 *   --section: Run only a specific test section (auth, health, places, lists)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// ====================================
// Configuration
// ====================================

const CONFIG = {
  // API endpoints
  BACKEND_URL: 'http://localhost:5001',
  FRONTEND_URL: 'http://localhost:5173',
  
  // Authentication
  AUTH: {
    email: 'admin@example.com',
    password: 'doof123'
  },
  
  // Test data
  TEST_RESTAURANTS: [
    { name: 'Maison Passerelle', location: 'New York', tags: 'French-Diaspora Fusion' },
    { name: 'Bar Bianchi', location: 'New York', tags: 'Milanese' }
  ],
  
  // Test list for adding items
  TEST_LIST: {
    name: 'API Test List',
    description: 'Created by API connectivity tests'
  },
  
  // Request options
  TIMEOUT_MS: 10000,
  RETRY_COUNT: 2,
  RETRY_DELAY_MS: 1000
};

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const SECTION_FILTER = args.find(arg => arg.startsWith('--section='))?.split('=')[1];

// ====================================
// Utilities
// ====================================

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.BACKEND_URL,
  timeout: CONFIG.TIMEOUT_MS,
  withCredentials: true
});

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  sections: {}
};

// Logger utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  error: (message, error) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    if (error) {
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.request) {
        console.error(`  No response received`);
      } else {
        console.error(`  Error details: ${error.message}`);
      }
    }
  },
  debug: (message, data) => {
    if (VERBOSE) {
      console.log(`[DEBUG] ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  },
  section: (name) => {
    console.log('\n' + '='.repeat(80));
    console.log(`SECTION: ${name}`);
    console.log('='.repeat(80));
    
    // Initialize section in results
    testResults.sections[name] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: {}
    };
    
    return name;
  },
  test: (section, name, status, duration, message) => {
    testResults.total++;
    testResults.sections[section].total++;
    
    if (status === 'PASSED') {
      testResults.passed++;
      testResults.sections[section].passed++;
      console.log(`\x1b[32m✓\x1b[0m ${name} (${duration}ms)`);
    } 
    else if (status === 'FAILED') {
      testResults.failed++;
      testResults.sections[section].failed++;
      console.log(`\x1b[31m✗\x1b[0m ${name} (${duration}ms)`);
      if (message) console.log(`  \x1b[31m${message}\x1b[0m`);
    }
    else if (status === 'SKIPPED') {
      testResults.skipped++;
      testResults.sections[section].skipped++;
      console.log(`\x1b[33m-\x1b[0m ${name} (skipped)`);
    }
    
    // Store test result
    testResults.sections[section].tests[name] = {
      status,
      duration,
      message
    };
  }
};

// Test runner
async function runTest(section, name, testFn) {
  // Skip test if section is filtered and doesn't match
  if (SECTION_FILTER && section !== SECTION_FILTER) {
    logger.test(section, name, 'SKIPPED');
    return { success: false, skipped: true };
  }
  
  const startTime = performance.now();
  try {
    const result = await testFn();
    const duration = Math.round(performance.now() - startTime);
    
    if (result.success) {
      logger.test(section, name, 'PASSED', duration);
    } else {
      logger.test(section, name, 'FAILED', duration, result.message);
    }
    
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const message = error.message || 'Unknown error';
    logger.test(section, name, 'FAILED', duration, message);
    logger.error(`Test execution error: ${name}`, error);
    return { success: false, message };
  }
}

// Helper to save auth token
let authToken = null;
let testListId = null;

// ====================================
// Test Sections
// ====================================

// 1. Backend Health Tests
async function runHealthTests() {
  const section = logger.section('Backend Health');
  
  // Test 1: Backend server is running
  await runTest(section, 'Backend server is running', async () => {
    try {
      await api.get('/api/health');
      return { success: true };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { 
          success: false, 
          message: 'Backend server is not running. Please start the backend server.' 
        };
      }
      // Even if we get an error response, the server is running
      return { success: true };
    }
  });
  
  // Test 2: Backend version check
  await runTest(section, 'Backend version check', async () => {
    try {
      const response = await api.get('/api/version');
      logger.debug('Version response:', response.data);
      return { success: true };
    } catch (error) {
      // This endpoint might not exist, which is fine
      return { 
        success: true, 
        message: 'Version endpoint not available, but server is running' 
      };
    }
  });
}

// 2. Authentication Tests
async function runAuthTests() {
  const section = logger.section('Authentication');
  
  // Test 1: Login with valid credentials
  const loginResult = await runTest(section, 'Login with valid credentials', async () => {
    try {
      const response = await api.post('/api/auth/login', CONFIG.AUTH);
      
      logger.debug('Login response:', response.data);
      
      if (response.data && response.data.success) {
        // Save auth token if available in response
        if (response.data.token) {
          authToken = response.data.token;
          api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Login failed: Invalid response format' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Login failed: ${error.message}` 
      };
    }
  });
  
  // Skip remaining auth tests if login failed
  if (!loginResult.success && !loginResult.skipped) {
    logger.error('Skipping remaining auth tests due to login failure');
    return;
  }
  
  // Test 2: Verify authentication state
  await runTest(section, 'Verify authentication state', async () => {
    try {
      const response = await api.get('/api/auth/me');
      
      logger.debug('Auth state response:', response.data);
      
      if (response.data && response.data.user) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Failed to verify authentication state' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Auth verification failed: ${error.message}` 
      };
    }
  });
  
  // Test 3: Access protected endpoint
  await runTest(section, 'Access protected endpoint', async () => {
    try {
      // Try to access a protected endpoint (lists)
      const response = await api.get('/api/lists');
      
      logger.debug('Protected endpoint response:', response.data);
      
      if (response.status === 200) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Unexpected status code: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Protected endpoint access failed: ${error.message}` 
      };
    }
  });
}

// 3. Google Places API Tests
async function runPlacesApiTests() {
  const section = logger.section('Google Places API');
  
  // Test 1: Places Autocomplete API
  const autocompleteResult = await runTest(section, 'Places Autocomplete API', async () => {
    try {
      const restaurant = CONFIG.TEST_RESTAURANTS[0];
      const query = `${restaurant.name}, ${restaurant.location}`;
      
      const response = await api.get('/api/places/autocomplete', {
        params: { input: query }
      });
      
      logger.debug('Autocomplete response:', response.data);
      
      if (response.data && response.data.status === 'OK') {
        return { 
          success: true,
          data: response.data.data || response.data.predictions
        };
      } else if (response.data && response.data.success && response.data.data) {
        return { 
          success: true,
          data: response.data.data
        };
      } else {
        return { 
          success: false, 
          message: `Invalid response format or no results found for "${query}"` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Places autocomplete request failed: ${error.message}` 
      };
    }
  });
  
  // Skip place details test if autocomplete failed
  if (!autocompleteResult.success && !autocompleteResult.skipped) {
    logger.error('Skipping place details test due to autocomplete failure');
    await runTest(section, 'Places Details API', async () => {
      return { success: false, skipped: true };
    });
    return;
  }
  
  // Test 2: Places Details API
  await runTest(section, 'Places Details API', async () => {
    try {
      // Use the first place_id from autocomplete results or a fallback
      const placeId = autocompleteResult.data?.[0]?.place_id || 'ChIJN1t_tDeuEmsRUsoyG83frY4'; // Fallback to Sydney Opera House
      
      const response = await api.get('/api/places/details', {
        params: { place_id: placeId }
      });
      
      logger.debug('Place details response:', response.data);
      
      if (response.data && (response.data.status === 'OK' || response.data.success)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Invalid response format or no details found for place_id "${placeId}"` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Places details request failed: ${error.message}` 
      };
    }
  });
  
  // Test 3: Direct Google Places API (if available)
  await runTest(section, 'Direct Google Places API', async () => {
    try {
      // This test is optional and may not be applicable
      const response = await api.get('/api/places/direct-test');
      
      logger.debug('Direct API test response:', response.data);
      
      return { success: true };
    } catch (error) {
      // This endpoint might not exist, which is fine
      return { 
        success: true, 
        message: 'Direct API test endpoint not available' 
      };
    }
  });
}

// 4. List Management Tests
async function runListTests() {
  const section = logger.section('List Management');
  
  // Test 1: Create a test list
  const createListResult = await runTest(section, 'Create test list', async () => {
    try {
      const response = await api.post('/api/lists', CONFIG.TEST_LIST);
      
      logger.debug('Create list response:', response.data);
      
      if (response.data && response.data.id) {
        testListId = response.data.id;
        return { 
          success: true,
          listId: testListId
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to create test list: Invalid response format' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create test list: ${error.message}` 
      };
    }
  });
  
  // Skip remaining list tests if list creation failed
  if (!createListResult.success && !createListResult.skipped) {
    logger.error('Skipping remaining list tests due to list creation failure');
    return;
  }
  
  // Test 2: Add item to list
  await runTest(section, 'Add item to list', async () => {
    try {
      const restaurant = CONFIG.TEST_RESTAURANTS[0];
      
      const response = await api.post(`/api/lists/${testListId}/items`, {
        name: restaurant.name,
        description: restaurant.tags,
        location: restaurant.location
      });
      
      logger.debug('Add item response:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Unexpected status code: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to add item to list: ${error.message}` 
      };
    }
  });
  
  // Test 3: Retrieve list with items
  await runTest(section, 'Retrieve list with items', async () => {
    try {
      const response = await api.get(`/api/lists/${testListId}`);
      
      logger.debug('Get list response:', response.data);
      
      if (response.data && response.data.items && response.data.items.length > 0) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'List retrieved but no items found' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to retrieve list: ${error.message}` 
      };
    }
  });
  
  // Test 4: Clean up (delete test list)
  await runTest(section, 'Delete test list', async () => {
    try {
      const response = await api.delete(`/api/lists/${testListId}`);
      
      logger.debug('Delete list response:', response.data);
      
      if (response.status === 200 || response.status === 204) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Unexpected status code: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to delete test list: ${error.message}` 
      };
    }
  });
}

// 5. Frontend API Client Tests
async function runFrontendApiTests() {
  const section = logger.section('Frontend API Client');
  
  // Test 1: Check if frontend server is running
  await runTest(section, 'Frontend server is running', async () => {
    try {
      const response = await axios.get(CONFIG.FRONTEND_URL, { timeout: 5000 });
      return { success: true };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { 
          success: false, 
          message: 'Frontend server is not running. This is optional for API tests.' 
        };
      }
      // Even if we get an error response, the server might be running
      return { success: true };
    }
  });
  
  // Test 2: Frontend-Backend CORS configuration
  await runTest(section, 'CORS configuration', async () => {
    try {
      // Make an OPTIONS request to check CORS headers
      const response = await axios.options(`${CONFIG.BACKEND_URL}/api/health`, {
        headers: {
          'Origin': CONFIG.FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials'
      ];
      
      const missingHeaders = corsHeaders.filter(header => !response.headers[header]);
      
      if (missingHeaders.length === 0) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Missing CORS headers: ${missingHeaders.join(', ')}` 
        };
      }
    } catch (error) {
      // CORS preflight might fail, which is actually informative
      return { 
        success: false, 
        message: `CORS preflight request failed: ${error.message}` 
      };
    }
  });
}

// ====================================
// Main Test Runner
// ====================================

async function runAllTests() {
  console.log('\n' + '*'.repeat(80));
  console.log('API CONNECTIVITY VERIFICATION TEST SUITE');
  console.log('*'.repeat(80) + '\n');
  
  const startTime = performance.now();
  
  try {
    // Run all test sections
    await runHealthTests();
    await runAuthTests();
    await runPlacesApiTests();
    await runListTests();
    await runFrontendApiTests();
    
    // Generate summary report
    const duration = Math.round((performance.now() - startTime) / 1000);
    generateTestSummary(duration);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Test execution failed', error);
    process.exit(1);
  }
}

// Generate test summary report
function generateTestSummary(duration) {
  console.log('\n' + '*'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('*'.repeat(80));
  
  console.log(`\nTotal duration: ${duration} seconds`);
  console.log(`Tests: ${testResults.total} total, ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped\n`);
  
  // Section summaries
  Object.entries(testResults.sections).forEach(([section, results]) => {
    const passRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
    console.log(`${section}: ${results.passed}/${results.total} passed (${passRate}%)`);
    
    // List failed tests in this section
    const failedTests = Object.entries(results.tests)
      .filter(([_, test]) => test.status === 'FAILED')
      .map(([name, test]) => `  - ${name}: ${test.message}`);
    
    if (failedTests.length > 0) {
      console.log('  Failed tests:');
      failedTests.forEach(test => console.log(test));
    }
  });
  
  // Overall assessment
  console.log('\nOverall Assessment:');
  
  if (testResults.failed === 0) {
    console.log('✅ All tests passed! The API connectivity is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
    
    // Provide specific recommendations based on failures
    const recommendations = [];
    
    if (testResults.sections['Backend Health']?.failed > 0) {
      recommendations.push('- Check if the backend server is running on the correct port');
      recommendations.push('- Verify the backend server configuration');
    }
    
    if (testResults.sections['Authentication']?.failed > 0) {
      recommendations.push('- Check authentication credentials and JWT configuration');
      recommendations.push('- Verify cookie settings and token handling');
    }
    
    if (testResults.sections['Google Places API']?.failed > 0) {
      recommendations.push('- Verify Google Places API key is valid and has sufficient quota');
      recommendations.push('- Check backend proxy implementation for Places API');
    }
    
    if (testResults.sections['List Management']?.failed > 0) {
      recommendations.push('- Check list API endpoints and permissions');
      recommendations.push('- Verify database connectivity');
    }
    
    if (testResults.sections['Frontend API Client']?.failed > 0) {
      recommendations.push('- Check CORS configuration between frontend and backend');
      recommendations.push('- Verify frontend API client implementation');
    }
    
    if (recommendations.length > 0) {
      console.log('\nRecommendations:');
      recommendations.forEach(rec => console.log(rec));
    }
  }
  
  console.log('\n' + '*'.repeat(80));
}

// Run all tests
runAllTests();
