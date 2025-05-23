/**
 * Quick Google Places API Integration Test
 * 
 * This script tests the integration with the Google Places API
 * using real restaurant data from New York.
 */

import axios from 'axios';

// Configuration
const CONFIG = {
  API_URL: 'http://localhost:5001',
  TIMEOUT_MS: 10000, // Increased timeout
  
  // Authentication
  AUTH: {
    email: 'admin@example.com',
    password: 'doof123'
  },
  
  // Test restaurants
  TEST_RESTAURANTS: [
    { name: 'Maison Passerelle', location: 'New York', tags: 'French-Diaspora Fusion' },
    { name: 'Bar Bianchi', location: 'New York', tags: 'Milanese' },
    { name: 'JR & Son', location: 'New York', tags: 'Italian-American' },
    { name: "Papa d'Amour", location: 'New York', tags: 'French-Asian Bakery' },
    { name: 'Figure Eight', location: 'New York', tags: 'Chinese-American' }
  ]
};

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.TIMEOUT_MS,
  withCredentials: true // Important for auth cookies
});

// Logger utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  error: (message, error) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      } else if (error.request) {
        console.error(`No response received. Request:`, error.request._currentUrl);
      } else {
        console.error(`Error details: ${error.message}`);
      }
    }
  },
  debug: (message, data) => {
    console.log(`[DEBUG] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }
};

// Login to get authentication token
async function login() {
  try {
    logger.info(`Logging in as ${CONFIG.AUTH.email}...`);
    
    const response = await api.post('/api/auth/login', {
      email: CONFIG.AUTH.email,
      password: CONFIG.AUTH.password
    });
    
    if (response.data && response.data.success) {
      logger.success('Login successful');
      return true;
    } else {
      logger.error('Login failed: Invalid credentials');
      return false;
    }
  } catch (error) {
    logger.error('Login failed', error);
    return false;
  }
}

// Check if backend is running
async function checkBackendStatus() {
  try {
    logger.info('Checking if backend server is running...');
    await api.get('/api/health');
    logger.success('Backend server is running');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.error('Backend server is not running. Please start the backend server.');
      return false;
    } else {
      logger.success('Backend server is running, but returned an error (this is normal)');
      return true;
    }
  }
}

// Test place search using autocomplete endpoint
async function testPlaceAutocomplete(restaurant) {
  try {
    const query = `${restaurant.name}, ${restaurant.location}`;
    logger.info(`Testing autocomplete for: ${query}`);
    
    // Use the exact endpoint from the backend routes file
    const response = await api.get('/api/places/autocomplete', {
      params: { input: query }
    });
    
    logger.debug('Autocomplete response:', response.data);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      logger.success(`Found ${response.data.data.length} results for "${restaurant.name}"`);
      return {
        success: true,
        placeId: response.data.data[0].place_id,
        name: response.data.data[0].description
      };
    } else {
      logger.error(`No results found for "${restaurant.name}"`);
      return { success: false };
    }
  } catch (error) {
    logger.error(`Autocomplete failed for "${restaurant.name}"`, error);
    return { success: false };
  }
}

// Test place details
async function testPlaceDetails(placeId, name) {
  try {
    logger.info(`Testing details for: ${name} (${placeId})`);
    
    // Use the exact endpoint from the backend routes file
    const response = await api.get('/api/places/details', {
      params: { place_id: placeId }
    });
    
    logger.debug('Details response:', response.data);
    
    if (response.data && (response.data.result || response.data.data)) {
      const details = response.data.result || response.data.data;
      const address = details.formatted_address || details.formattedAddress;
      logger.success(`Got details for "${name}": ${address}`);
      return { success: true };
    } else {
      logger.error(`Failed to get details for "${name}"`);
      return { success: false };
    }
  } catch (error) {
    logger.error(`Details lookup failed for "${name}"`, error);
    return { success: false };
  }
}

// Main test function
async function runTests() {
  console.log('\n===== GOOGLE PLACES API QUICK TEST =====');
  console.log('Testing with New York restaurants\n');
  
  // First check if backend is running
  const backendRunning = await checkBackendStatus();
  if (!backendRunning) {
    console.log('\n❌ Cannot proceed with tests - backend server is not running.');
    return;
  }
  
  // Login to get authentication token
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed with tests - authentication failed.');
    return;
  }
  
  const results = {
    autocomplete: { total: 0, success: 0 },
    details: { total: 0, success: 0 }
  };
  
  // Test each restaurant
  for (const restaurant of CONFIG.TEST_RESTAURANTS) {
    results.autocomplete.total++;
    const searchResult = await testPlaceAutocomplete(restaurant);
    
    if (searchResult.success) {
      results.autocomplete.success++;
      results.details.total++;
      
      const detailsResult = await testPlaceDetails(searchResult.placeId, searchResult.name);
      if (detailsResult.success) {
        results.details.success++;
      }
    }
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print summary
  console.log('\n===== TEST SUMMARY =====');
  console.log(`Place Autocomplete: ${results.autocomplete.success}/${results.autocomplete.total} successful`);
  console.log(`Place Details: ${results.details.success}/${results.details.total} successful`);
  
  // Overall assessment
  console.log('\n===== ASSESSMENT =====');
  if (results.autocomplete.success > 0 && results.details.success > 0) {
    console.log('✅ The Google Places API integration is working!');
    
    if (results.autocomplete.success < results.autocomplete.total) {
      console.log('⚠️ Some autocomplete requests failed - this may be due to restaurants not found in the API.');
    }
    
    if (results.details.success < results.details.total) {
      console.log('⚠️ Some details lookups failed - check error handling in the placeService.js file.');
    }
  } else {
    console.log('❌ The Google Places API integration is NOT working correctly.');
  }
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed', error);
});
