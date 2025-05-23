/**
 * Bulk Add API Test Script
 * 
 * This script tests the backend API endpoints for the bulk add functionality
 * using real data and no mocks.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  baseUrl: 'http://localhost:5001',
  frontendUrl: 'http://localhost:5173',
  authToken: null, // Will be populated after login
  timeouts: {
    request: 10000
  },
  testData: {
    restaurants: [
      {
        name: 'Shake Shack',
        type: 'restaurant',
        location: 'New York, NY',
        tags: ['Burgers', 'Shakes', 'Fast Casual']
      },
      {
        name: 'Chipotle',
        type: 'restaurant',
        location: 'San Francisco, CA',
        tags: ['Mexican', 'Burritos', 'Bowls']
      }
    ]
  },
  credentials: {
    email: 'test@example.com',
    password: 'password123'
  }
};

// Create axios instance
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: config.timeouts.request,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Utility functions
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      } else if (error.request) {
        console.error(`No response received:`, error.request);
      } else {
        console.error(`Error details:`, error.message);
      }
    }
  },
  success: (message) => console.log(`[SUCCESS] ${message}`),
  step: (number, message) => console.log(`\n[STEP ${number}] ${message}`)
};

// Test functions
async function login() {
  logger.step(1, 'Authenticating with the API');
  
  try {
    const response = await api.post('/api/auth/login', {
      email: config.credentials.email,
      password: config.credentials.password
    });
    
    if (response.data && response.data.token) {
      config.authToken = response.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${config.authToken}`;
      logger.success(`Authentication successful. Token: ${config.authToken.substring(0, 15)}...`);
      return true;
    } else {
      logger.error('Authentication failed: No token received');
      return false;
    }
  } catch (error) {
    logger.error('Authentication failed', error);
    return false;
  }
}

async function testPlacesAPI() {
  logger.step(2, 'Testing Google Places API integration');
  
  try {
    const restaurant = config.testData.restaurants[0];
    const response = await api.get('/api/places/search', {
      params: { query: restaurant.name }
    });
    
    if (response.data && Array.isArray(response.data.results)) {
      logger.success(`Places API search successful. Found ${response.data.results.length} results for "${restaurant.name}"`);
      
      if (response.data.results.length > 0) {
        const firstPlace = response.data.results[0];
        logger.info(`First result: ${firstPlace.name} (${firstPlace.place_id})`);
        
        // Test place details
        return await testPlaceDetails(firstPlace.place_id);
      } else {
        logger.error('No places found for the test restaurant');
        return false;
      }
    } else {
      logger.error('Places API search failed: Invalid response format');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    logger.error('Places API search failed', error);
    return false;
  }
}

async function testPlaceDetails(placeId) {
  logger.step(3, 'Testing Place Details API');
  
  try {
    const response = await api.get('/api/places/details', {
      params: { place_id: placeId }
    });
    
    if (response.data && response.data.result) {
      logger.success('Place details API successful');
      logger.info(`Place details: ${JSON.stringify(response.data.result.name)}`);
      return true;
    } else {
      logger.error('Place details API failed: Invalid response format');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    logger.error('Place details API failed', error);
    return false;
  }
}

async function testNeighborhoodLookup() {
  logger.step(4, 'Testing Neighborhood Lookup API');
  
  try {
    // Test with a sample zipcode
    const zipcode = '10001'; // NYC zipcode
    const response = await api.get('/api/filters/neighborhoods/zipcode', {
      params: { zipcode }
    });
    
    if (response.data && response.data.id) {
      logger.success(`Neighborhood lookup successful for zipcode ${zipcode}`);
      logger.info(`Neighborhood: ${response.data.name} (ID: ${response.data.id})`);
      return true;
    } else {
      logger.error('Neighborhood lookup failed: Invalid response format');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    logger.error('Neighborhood lookup failed', error);
    return false;
  }
}

async function testBulkAddEndpoint() {
  logger.step(5, 'Testing Bulk Add API Endpoint');
  
  try {
    // Prepare test data
    const testItems = config.testData.restaurants.map(restaurant => ({
      name: restaurant.name,
      type: restaurant.type,
      location: restaurant.location,
      tags: restaurant.tags.join(', '),
      place_id: `test_place_id_${Math.floor(Math.random() * 1000)}`,
      formatted_address: `123 Test St, ${restaurant.location}`,
      neighborhood_id: 1,
      neighborhood_name: 'Test Neighborhood'
    }));
    
    logger.info(`Submitting ${testItems.length} items to bulk add endpoint`);
    
    const response = await api.post('/api/restaurants/bulk', {
      items: testItems
    });
    
    if (response.data && response.data.success) {
      logger.success('Bulk add API successful');
      logger.info(`Response: ${JSON.stringify(response.data)}`);
      return true;
    } else {
      logger.error('Bulk add API failed: Invalid response format');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    logger.error('Bulk add API failed', error);
    return false;
  }
}

async function testFrontendProcessing() {
  logger.step(6, 'Testing Frontend Processing Logic');
  
  logger.info('This step requires manual testing in the browser');
  logger.info('Please check the browser console for any errors during processing');
  
  // Provide instructions for manual testing
  console.log('\nManual Testing Instructions:');
  console.log('1. Navigate to the Bulk Add page in the browser');
  console.log('2. Enter the following test data:');
  config.testData.restaurants.forEach(restaurant => {
    console.log(`   ${restaurant.name} | ${restaurant.type} | ${restaurant.location} | ${restaurant.tags.join(', ')}`);
  });
  console.log('3. Click "Parse Input"');
  console.log('4. Click "Process Items"');
  console.log('5. Check the browser console for errors');
  
  return 'manual';
}

// Main test function
async function runTests() {
  console.log('======== BULK ADD API TEST ========');
  console.log(`Testing against backend: ${config.baseUrl}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log('==================================\n');
  
  const results = {
    auth: false,
    placesAPI: false,
    placeDetails: false,
    neighborhood: false,
    bulkAdd: false,
    frontend: 'manual'
  };
  
  // Run tests
  results.auth = await login();
  
  if (results.auth) {
    results.placesAPI = await testPlacesAPI();
    results.neighborhood = await testNeighborhoodLookup();
    results.bulkAdd = await testBulkAddEndpoint();
    results.frontend = await testFrontendProcessing();
  } else {
    logger.error('Skipping remaining tests due to authentication failure');
  }
  
  // Print summary
  console.log('\n======== TEST RESULTS ========');
  for (const [test, result] of Object.entries(results)) {
    if (result === 'manual') {
      console.log(`${test}: Requires manual verification`);
    } else {
      console.log(`${test}: ${result ? 'PASS' : 'FAIL'}`);
    }
  }
  
  // Analysis
  console.log('\n======== ANALYSIS ========');
  if (!results.auth) {
    console.log('- Authentication is failing. Check credentials and auth endpoint.');
  }
  
  if (!results.placesAPI) {
    console.log('- Google Places API integration is failing. Check API key and endpoint implementation.');
  }
  
  if (!results.neighborhood) {
    console.log('- Neighborhood lookup is failing. Check the filters service and database.');
  }
  
  if (!results.bulkAdd) {
    console.log('- Bulk add endpoint is failing. Check the restaurants service and database.');
  }
  
  console.log('\n======== NEXT STEPS ========');
  console.log('1. Fix any failing API endpoints identified above');
  console.log('2. Check the frontend console for errors during processing');
  console.log('3. Verify the useBulkAddProcessorV2 hook is correctly handling promises');
  console.log('4. Ensure the Google Places API key has the correct permissions');
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed', error);
});
