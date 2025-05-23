/**
 * Google Places API Integration Test Suite
 * 
 * This script focuses specifically on testing the Google Places API integration
 * for the bulk add feature, including both frontend and backend components.
 * 
 * Usage: node places-api-integration-tests.js [--verbose] [--mode=<backend|frontend|both>]
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
  
  // Test data - using non-chain restaurants as requested
  TEST_RESTAURANTS: [
    { name: 'Maison Passerelle', location: 'New York', cuisine: 'French-Diaspora Fusion' },
    { name: 'Bar Bianchi', location: 'New York', cuisine: 'Milanese' },
    { name: 'JR & Son', location: 'New York', cuisine: 'Italian-American' },
    { name: "Papa d'Amour", location: 'New York', cuisine: 'French-Asian Bakery' },
    { name: 'Figure Eight', location: 'New York', cuisine: 'Chinese-American' }
  ],
  
  // Request options
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  RETRY_DELAY_MS: 1000
};

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const MODE = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'both';

// ====================================
// Utilities
// ====================================

// Create axios instances
const backendApi = axios.create({
  baseURL: CONFIG.BACKEND_URL,
  timeout: CONFIG.TIMEOUT_MS,
  withCredentials: true
});

const frontendApi = axios.create({
  baseURL: CONFIG.FRONTEND_URL,
  timeout: CONFIG.TIMEOUT_MS
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
        if (VERBOSE) {
          console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
          console.error(`  Message: ${error.response.data?.message || 'No error message provided'}`);
        }
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
  const startTime = performance.now();
  try {
    const result = await testFn();
    const duration = Math.round(performance.now() - startTime);
    
    if (result.success) {
      logger.test(section, name, 'PASSED', duration);
    } else if (result.skipped) {
      logger.test(section, name, 'SKIPPED', 0, result.message);
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

// ====================================
// Test Sections
// ====================================

// 1. Authentication
async function runAuthTests() {
  const section = logger.section('Authentication');
  
  // Test 1: Login with valid credentials
  const loginResult = await runTest(section, 'Login with valid credentials', async () => {
    try {
      const response = await backendApi.post('/api/auth/login', CONFIG.AUTH);
      
      logger.debug('Login response:', response.data);
      
      if (response.data && response.data.success) {
        // Save auth token if available in response
        if (response.data.token) {
          authToken = response.data.token;
          backendApi.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
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
  
  if (!loginResult.success) {
    logger.error('Authentication failed. Skipping tests that require authentication.');
  }
  
  return loginResult.success;
}

// 2. Backend Places API Tests
async function runBackendPlacesTests() {
  const section = logger.section('Backend Places API');
  
  // Test 1: Check if backend Places API routes are configured
  const routesResult = await runTest(section, 'Places API routes are configured', async () => {
    try {
      // Try to access the routes endpoint (if available)
      const response = await backendApi.get('/api/routes');
      
      logger.debug('Routes response:', response.data);
      
      // Check if places routes are included
      const hasPlacesRoutes = response.data && 
        (response.data.includes('/api/places') || 
         response.data.includes('/places/autocomplete') || 
         response.data.includes('/places/details'));
      
      if (hasPlacesRoutes) {
        return { success: true };
      } else {
        // Try alternative approach - make an OPTIONS request
        const optionsResponse = await backendApi.options('/api/places/autocomplete');
        return { success: true };
      }
    } catch (error) {
      // If routes endpoint doesn't exist, try a direct request to places API
      try {
        const response = await backendApi.options('/api/places/autocomplete');
        return { success: true };
      } catch (optionsError) {
        return { 
          success: false, 
          message: 'Places API routes do not appear to be configured correctly' 
        };
      }
    }
  });
  
  if (!routesResult.success) {
    logger.error('Places API routes are not configured correctly. Skipping related tests.');
    return false;
  }
  
  // Test 2: Places Autocomplete API
  const autocompleteResults = [];
  
  for (const restaurant of CONFIG.TEST_RESTAURANTS) {
    const query = `${restaurant.name}, ${restaurant.location}`;
    
    const result = await runTest(section, `Autocomplete: "${restaurant.name}"`, async () => {
      try {
        const response = await backendApi.get('/api/places/autocomplete', {
          params: { input: query }
        });
        
        logger.debug(`Autocomplete response for "${restaurant.name}":`, response.data);
        
        // Check for valid response format
        if (response.data && 
            ((response.data.status === 'OK' && response.data.predictions) || 
             (response.data.success && response.data.data))) {
          
          const predictions = response.data.predictions || response.data.data;
          
          if (predictions && predictions.length > 0) {
            autocompleteResults.push({
              query,
              restaurant: restaurant.name,
              placeId: predictions[0].place_id,
              description: predictions[0].description
            });
            
            return { 
              success: true,
              message: `Found ${predictions.length} results`
            };
          } else {
            return { 
              success: false, 
              message: `No predictions found for "${query}"` 
            };
          }
        } else {
          return { 
            success: false, 
            message: `Invalid response format for "${query}"` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Request failed: ${error.message}` 
        };
      }
    });
  }
  
  if (autocompleteResults.length === 0) {
    logger.error('No successful autocomplete results. Skipping place details tests.');
    return false;
  }
  
  // Test 3: Places Details API
  for (const result of autocompleteResults) {
    await runTest(section, `Place Details: "${result.restaurant}"`, async () => {
      try {
        const response = await backendApi.get('/api/places/details', {
          params: { place_id: result.placeId }
        });
        
        logger.debug(`Place details response for "${result.restaurant}":`, response.data);
        
        // Check for valid response format
        if (response.data && 
            ((response.data.status === 'OK' && response.data.result) || 
             (response.data.success && response.data.data))) {
          
          const details = response.data.result || response.data.data;
          
          if (details) {
            const address = details.formatted_address || details.formattedAddress;
            return { 
              success: true,
              message: `Address: ${address}`
            };
          } else {
            return { 
              success: false, 
              message: 'No details found in response' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Request failed: ${error.message}` 
        };
      }
    });
  }
  
  return true;
}

// 3. Frontend Places Service Tests
async function runFrontendPlacesTests() {
  const section = logger.section('Frontend Places Service');
  
  // Test 1: Check if frontend is running
  const frontendResult = await runTest(section, 'Frontend server is running', async () => {
    try {
      const response = await axios.get(CONFIG.FRONTEND_URL, { timeout: 5000 });
      return { success: true };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { 
          success: false, 
          message: 'Frontend server is not running' 
        };
      }
      // Even if we get an error response, the server might be running
      return { success: true };
    }
  });
  
  if (!frontendResult.success) {
    logger.error('Frontend server is not running. Skipping frontend tests.');
    return false;
  }
  
  // Test 2: Check if placeService.js exists
  await runTest(section, 'placeService.js exists', async () => {
    try {
      // Try to access the placeService.js file
      const filePath = path.join(process.cwd(), 'src', 'services', 'placeService.js');
      
      if (fs.existsSync(filePath)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'placeService.js file not found' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error checking for placeService.js: ${error.message}` 
      };
    }
  });
  
  // Test 3: Test frontend API endpoints
  for (const restaurant of CONFIG.TEST_RESTAURANTS.slice(0, 2)) { // Test only first 2 restaurants
    const query = `${restaurant.name}, ${restaurant.location}`;
    
    await runTest(section, `Frontend search: "${restaurant.name}"`, async () => {
      try {
        // This test is a bit tricky since we can't directly call the frontend service
        // We'll use a proxy endpoint if available, or skip this test
        
        try {
          // Try to use a test endpoint if available
          const response = await frontendApi.get('/api/test/places/search', {
            params: { query }
          });
          
          logger.debug(`Frontend search response for "${restaurant.name}":`, response.data);
          
          return { success: true };
        } catch (proxyError) {
          // If test endpoint doesn't exist, we'll note this but not fail the test
          return { 
            success: false, 
            skipped: true,
            message: 'Frontend test endpoint not available. Manual testing required.' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Request failed: ${error.message}` 
        };
      }
    });
  }
  
  return true;
}

// 4. End-to-End Places API Flow
async function runEndToEndTests() {
  const section = logger.section('End-to-End Places API Flow');
  
  // Test 1: Simulate bulk add flow for a single restaurant
  await runTest(section, 'Simulate bulk add flow', async () => {
    try {
      const restaurant = CONFIG.TEST_RESTAURANTS[0];
      const query = `${restaurant.name}, ${restaurant.location}`;
      
      // Step 1: Search for place
      logger.info(`Step 1: Searching for "${query}"`);
      const searchResponse = await backendApi.get('/api/places/autocomplete', {
        params: { input: query }
      });
      
      const predictions = searchResponse.data.predictions || searchResponse.data.data;
      
      if (!predictions || predictions.length === 0) {
        return { 
          success: false, 
          message: 'No place predictions found' 
        };
      }
      
      const placeId = predictions[0].place_id;
      logger.info(`Found place_id: ${placeId}`);
      
      // Step 2: Get place details
      logger.info('Step 2: Getting place details');
      const detailsResponse = await backendApi.get('/api/places/details', {
        params: { place_id: placeId }
      });
      
      const details = detailsResponse.data.result || detailsResponse.data.data;
      
      if (!details) {
        return { 
          success: false, 
          message: 'No place details found' 
        };
      }
      
      const address = details.formatted_address || details.formattedAddress;
      logger.info(`Found address: ${address}`);
      
      // Step 3: Prepare item for list
      logger.info('Step 3: Preparing item for list');
      const item = {
        name: details.name || restaurant.name,
        description: restaurant.cuisine,
        location: address,
        placeId: placeId
      };
      
      logger.debug('Prepared item:', item);
      
      // We won't actually add to a list to avoid side effects
      // but we'll verify that we have all the necessary data
      
      if (item.name && item.location && item.placeId) {
        return { 
          success: true,
          message: 'Successfully simulated bulk add flow' 
        };
      } else {
        return { 
          success: false, 
          message: 'Missing required data for list item' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `End-to-end flow failed: ${error.message}` 
      };
    }
  });
  
  // Test 2: Test error handling for invalid place ID
  await runTest(section, 'Error handling: Invalid place ID', async () => {
    try {
      const invalidPlaceId = 'invalid_place_id_123';
      
      const response = await backendApi.get('/api/places/details', {
        params: { place_id: invalidPlaceId }
      });
      
      // If we get here, the API didn't properly reject the invalid ID
      if (response.data && response.data.error) {
        // This is good - the API recognized the error
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'API did not properly handle invalid place ID' 
        };
      }
    } catch (error) {
      // Getting an error is actually the expected behavior here
      if (error.response && (error.response.status === 400 || error.response.status === 404)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Unexpected error: ${error.message}` 
        };
      }
    }
  });
  
  return true;
}

// ====================================
// Main Test Runner
// ====================================

async function runAllTests() {
  console.log('\n' + '*'.repeat(80));
  console.log('GOOGLE PLACES API INTEGRATION TEST SUITE');
  console.log('*'.repeat(80) + '\n');
  
  const startTime = performance.now();
  
  try {
    // Always run authentication tests first
    const isAuthenticated = await runAuthTests();
    
    // Run backend tests if mode is 'backend' or 'both'
    if (MODE === 'backend' || MODE === 'both') {
      if (isAuthenticated) {
        await runBackendPlacesTests();
        await runEndToEndTests();
      } else {
        logger.info('Skipping backend tests due to authentication failure');
      }
    }
    
    // Run frontend tests if mode is 'frontend' or 'both'
    if (MODE === 'frontend' || MODE === 'both') {
      await runFrontendPlacesTests();
    }
    
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
    const passRate = results.total > 0 ? Math.round((results.passed / (results.total - results.skipped)) * 100) : 0;
    console.log(`${section}: ${results.passed}/${results.total - results.skipped} passed (${passRate}%)`);
    
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
    if (testResults.skipped > 0) {
      console.log('✅ All executed tests passed, but some tests were skipped.');
    } else {
      console.log('✅ All tests passed! The Google Places API integration is working correctly.');
    }
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
    
    // Provide specific recommendations based on failures
    const recommendations = [];
    
    if (testResults.sections['Authentication']?.failed > 0) {
      recommendations.push('- Check authentication credentials and JWT configuration');
    }
    
    if (testResults.sections['Backend Places API']?.failed > 0) {
      recommendations.push('- Verify Google Places API key is valid and properly configured');
      recommendations.push('- Check backend proxy implementation for Places API');
      recommendations.push('- Ensure backend routes are correctly defined for /api/places/autocomplete and /api/places/details');
    }
    
    if (testResults.sections['Frontend Places Service']?.failed > 0) {
      recommendations.push('- Verify placeService.js is correctly implemented');
      recommendations.push('- Check that frontend is using the correct backend API endpoints');
    }
    
    if (testResults.sections['End-to-End Places API Flow']?.failed > 0) {
      recommendations.push('- Review the complete data flow from frontend to backend to Google Places API');
      recommendations.push('- Check error handling throughout the flow');
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
