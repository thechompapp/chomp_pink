/**
 * Direct Google Places API Test Script with Hardcoded Key
 * 
 * This script tests the Google Places API integration directly
 * using the API key from the backend .env.example file.
 * 
 * NOTE: This is for testing purposes only and should not be committed to version control.
 */

import axios from 'axios';

// Configuration
const config = {
  apiKey: 'AIzaSyD_xhCWUXjhSXD4xpL-BxM5t7HfzJDf-dI', // API key from backend .env.example
  testQueries: [
    'Shake Shack New York',
    'Chipotle San Francisco',
    'Sweetgreen Los Angeles'
  ]
};

// Utility functions for logging
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

// Create axios instance for Google Places API
const placesApi = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/place',
  timeout: 10000
});

// Test functions
async function testPlacesSearch(query) {
  logger.step(1, `Testing Places API Search for "${query}"`);
  
  try {
    const response = await placesApi.get('/textsearch/json', {
      params: {
        query,
        key: config.apiKey
      }
    });
    
    if (response.data && response.data.status === 'OK') {
      logger.success(`Search successful. Found ${response.data.results.length} results`);
      
      if (response.data.results.length > 0) {
        const firstPlace = response.data.results[0];
        logger.info(`First result: ${firstPlace.name} (${firstPlace.place_id})`);
        return firstPlace.place_id;
      } else {
        logger.error('No places found for the query');
        return null;
      }
    } else {
      logger.error(`Search failed with status: ${response.data.status}`);
      if (response.data.error_message) {
        logger.error(`Error message: ${response.data.error_message}`);
      }
      return null;
    }
  } catch (error) {
    logger.error('Places API search failed', error);
    return null;
  }
}

async function testPlaceDetails(placeId) {
  logger.step(2, `Testing Place Details API for place_id: ${placeId}`);
  
  if (!placeId) {
    logger.error('Cannot test place details without a place_id');
    return null;
  }
  
  try {
    const response = await placesApi.get('/details/json', {
      params: {
        place_id: placeId,
        key: config.apiKey
      }
    });
    
    if (response.data && response.data.status === 'OK') {
      logger.success('Place details retrieval successful');
      
      const place = response.data.result;
      logger.info(`Place name: ${place.name}`);
      logger.info(`Formatted address: ${place.formatted_address}`);
      
      // Log address components
      if (place.address_components) {
        logger.info('Address components:');
        place.address_components.forEach(component => {
          logger.info(`  ${component.types.join(', ')}: ${component.long_name}`);
        });
        
        // Extract postal code
        const postalCodeComponent = place.address_components.find(
          comp => comp.types.includes('postal_code')
        );
        
        if (postalCodeComponent) {
          logger.info(`Postal code: ${postalCodeComponent.long_name}`);
        } else {
          logger.info('No postal code found in address components');
        }
      }
      
      return place;
    } else {
      logger.error(`Place details failed with status: ${response.data.status}`);
      if (response.data.error_message) {
        logger.error(`Error message: ${response.data.error_message}`);
      }
      return null;
    }
  } catch (error) {
    logger.error('Place details API failed', error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('======== GOOGLE PLACES API TEST ========');
  console.log(`Testing direct integration with Google Places API`);
  console.log('========================================\n');
  
  // Check if API key is available
  if (!config.apiKey) {
    logger.error('No Google Places API key found in configuration');
    return;
  }
  
  logger.info(`Using API key: ${config.apiKey.substring(0, 5)}...`);
  
  const results = {
    search: [],
    details: []
  };
  
  // Test search for each query
  for (const query of config.testQueries) {
    const placeId = await testPlacesSearch(query);
    results.search.push({
      query,
      success: !!placeId,
      placeId
    });
    
    // If search was successful, test place details
    if (placeId) {
      const placeDetails = await testPlaceDetails(placeId);
      results.details.push({
        placeId,
        success: !!placeDetails
      });
    }
  }
  
  // Print summary
  console.log('\n======== TEST RESULTS ========');
  
  console.log('\nSearch Results:');
  results.search.forEach(result => {
    console.log(`- Query "${result.query}": ${result.success ? 'SUCCESS' : 'FAIL'}`);
  });
  
  console.log('\nPlace Details Results:');
  results.details.forEach(result => {
    console.log(`- Place ID "${result.placeId}": ${result.success ? 'SUCCESS' : 'FAIL'}`);
  });
  
  // Analysis
  console.log('\n======== ANALYSIS ========');
  
  const searchSuccesses = results.search.filter(r => r.success).length;
  const detailsSuccesses = results.details.filter(r => r.success).length;
  
  if (searchSuccesses === 0) {
    console.log('- All Places API searches failed. This indicates a problem with:');
    console.log('  * API key validity or permissions');
    console.log('  * Network connectivity to Google APIs');
    console.log('  * Request format or parameters');
  } else if (searchSuccesses < config.testQueries.length) {
    console.log('- Some Places API searches failed. This could be due to:');
    console.log('  * Specific query formatting issues');
    console.log('  * Rate limiting or quota issues');
  } else {
    console.log('- All Places API searches were successful!');
  }
  
  if (detailsSuccesses === 0 && results.details.length > 0) {
    console.log('- All Place Details API requests failed. This indicates a problem with:');
    console.log('  * API key permissions for the Details API');
    console.log('  * Place ID format or validity');
  } else if (detailsSuccesses < results.details.length) {
    console.log('- Some Place Details API requests failed. This could be due to:');
    console.log('  * Specific place ID issues');
    console.log('  * Rate limiting or quota issues');
  } else if (results.details.length > 0) {
    console.log('- All Place Details API requests were successful!');
  }
  
  console.log('\n======== NEXT STEPS ========');
  
  if (searchSuccesses === 0 || detailsSuccesses === 0) {
    console.log('1. Verify your Google Places API key is valid and has the correct permissions');
    console.log('2. Check that the Places API is enabled in your Google Cloud Console');
    console.log('3. Ensure your API key has no restrictions that would block these requests');
    console.log('4. Check your quota usage in the Google Cloud Console');
  } else {
    console.log('1. The direct API integration is working correctly');
    console.log('2. Check the implementation in your application code:');
    console.log('   * Verify the placeService.js implementation');
    console.log('   * Check the useBulkAddProcessorV2.js hook for proper API usage');
    console.log('   * Ensure promises are being handled correctly in the processing flow');
  }
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed', error);
});
