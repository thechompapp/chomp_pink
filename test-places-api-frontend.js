/**
 * Frontend Google Places API Integration Test
 * 
 * This script tests the frontend integration with the Google Places API
 * through the backend proxy, focusing on the key components of the bulk add functionality.
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';

// Configuration
const CONFIG = {
  API_URL: 'http://localhost:5001',
  TIMEOUT_MS: 10000,
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000,
  
  // Test queries
  TEST_QUERIES: [
    'Shake Shack New York',
    'Chipotle San Francisco',
    'Sweetgreen Los Angeles',
    'McDonald\'s Chicago',
    'In-N-Out Burger Los Angeles'
  ]
};

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.TIMEOUT_MS
});

// Logger utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  warn: (message) => console.log(`[WARNING] ${message}`),
  error: (message, error) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error('Error details:', error);
    }
  },
  debug: (message, data) => {
    console.log(`[DEBUG] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  },
  stage: (stageName) => {
    console.log('\n' + '='.repeat(80));
    console.log(`STAGE: ${stageName}`);
    console.log('='.repeat(80));
    return {
      name: stageName,
      startTime: Date.now()
    };
  },
  endStage: (stage, status, message) => {
    const duration = Date.now() - stage.startTime;
    console.log('-'.repeat(80));
    console.log(`STAGE ${stage.name} ${status} (${duration}ms)`);
    if (message) {
      console.log(message);
    }
    console.log('-'.repeat(80) + '\n');
  }
};

/**
 * Test Functions
 */

// Function to test place search
async function testPlaceSearch(query) {
  const stage = logger.stage(`Place Search for "${query}"`);
  
  try {
    logger.info(`Searching for places with query: ${query}`);
    
    // Make the API request to the backend proxy
    const response = await api.get('/api/places/search', {
      params: { query }
    });
    
    // Check for valid response
    if (!response.data || !response.data.results) {
      throw new Error('Invalid response format from places search API');
    }
    
    const results = response.data.results;
    
    if (results.length === 0) {
      logger.warn(`No places found for "${query}"`);
      logger.endStage(stage, 'WARNING', 'No places found');
      return { success: false, message: 'No places found', results: [] };
    }
    
    logger.success(`Found ${results.length} places for "${query}"`);
    logger.debug('First result:', results[0]);
    
    logger.endStage(stage, 'SUCCESS');
    return { 
      success: true, 
      results,
      selectedPlace: results[0] // Automatically select the first result for testing
    };
  } catch (error) {
    logger.error(`Place search failed for "${query}"`, error);
    logger.endStage(stage, 'FAILED', `Error searching for "${query}"`);
    return { success: false, message: error.message, results: [] };
  }
}

// Function to test place details
async function testPlaceDetails(placeId, placeName) {
  const stage = logger.stage(`Place Details for "${placeName}" (ID: ${placeId})`);
  
  try {
    logger.info(`Getting details for place ID: ${placeId}`);
    
    // Make the API request to the backend proxy
    const response = await api.get('/api/places/details', {
      params: { place_id: placeId }
    });
    
    // Check for valid response
    if (!response.data || !response.data.result) {
      throw new Error('Invalid response format from place details API');
    }
    
    const placeDetails = response.data.result;
    
    logger.success('Place details retrieved successfully');
    logger.debug('Place details:', {
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      types: placeDetails.types
    });
    
    logger.endStage(stage, 'SUCCESS');
    return { success: true, placeDetails };
  } catch (error) {
    logger.error(`Place details lookup failed for "${placeName}" (ID: ${placeId})`, error);
    logger.endStage(stage, 'FAILED', `Error getting place details for "${placeName}"`);
    return { success: false, message: error.message };
  }
}

// Function to test direct API calls
async function testDirectApiCalls(query) {
  const stage = logger.stage(`Direct API Call for "${query}"`);
  
  try {
    logger.info(`Making direct API call for query: ${query}`);
    
    // Make the API request directly to the backend
    const response = await api.get('/places/search', {
      params: { query }
    });
    
    // Check for valid response
    if (!response.data) {
      throw new Error('Invalid response format from direct API call');
    }
    
    logger.success('Direct API call successful');
    logger.debug('Response:', response.data);
    
    logger.endStage(stage, 'SUCCESS');
    return { success: true, response: response.data };
  } catch (error) {
    logger.error(`Direct API call failed for "${query}"`, error);
    logger.endStage(stage, 'FAILED', `Error making direct API call for "${query}"`);
    return { success: false, message: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('\n' + '*'.repeat(80));
  console.log('FRONTEND GOOGLE PLACES API INTEGRATION TEST');
  console.log('Testing the integration between frontend and Google Places API via backend proxy');
  console.log('*'.repeat(80) + '\n');
  
  try {
    // Test 1: Test place search for each query
    const searchResults = [];
    
    for (const query of CONFIG.TEST_QUERIES) {
      const result = await testPlaceSearch(query);
      searchResults.push({
        query,
        success: result.success,
        placeId: result.success ? result.selectedPlace.place_id : null,
        placeName: result.success ? result.selectedPlace.name : null
      });
      
      // Add a delay between requests to avoid rate limiting
      await setTimeout(1000);
    }
    
    // Test 2: Test place details for each successful search
    const detailsResults = [];
    
    for (const result of searchResults) {
      if (result.success && result.placeId) {
        const detailsResult = await testPlaceDetails(result.placeId, result.placeName);
        detailsResults.push({
          placeId: result.placeId,
          placeName: result.placeName,
          success: detailsResult.success
        });
        
        // Add a delay between requests to avoid rate limiting
        await setTimeout(1000);
      }
    }
    
    // Test 3: Test direct API calls
    const directApiResults = [];
    
    for (const query of CONFIG.TEST_QUERIES.slice(0, 2)) { // Only test first two queries
      const result = await testDirectApiCalls(query);
      directApiResults.push({
        query,
        success: result.success
      });
      
      // Add a delay between requests to avoid rate limiting
      await setTimeout(1000);
    }
    
    // Generate summary
    generateTestSummary(searchResults, detailsResults, directApiResults);
    
    return {
      searchResults,
      detailsResults,
      directApiResults
    };
  } catch (error) {
    logger.error('Test execution failed', error);
    return {
      searchResults: [],
      detailsResults: [],
      directApiResults: []
    };
  }
}

// Function to generate test summary
function generateTestSummary(searchResults, detailsResults, directApiResults) {
  console.log('\n' + '*'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('*'.repeat(80));
  
  // Calculate statistics
  const totalSearches = searchResults.length;
  const successfulSearches = searchResults.filter(r => r.success).length;
  
  const totalDetails = detailsResults.length;
  const successfulDetails = detailsResults.filter(r => r.success).length;
  
  const totalDirectApi = directApiResults.length;
  const successfulDirectApi = directApiResults.filter(r => r.success).length;
  
  console.log(`\nPlace Search Results: ${successfulSearches}/${totalSearches} successful`);
  searchResults.forEach(result => {
    const status = result.success ? 'SUCCESS' : 'FAILED';
    console.log(`- "${result.query}": ${status}`);
  });
  
  console.log(`\nPlace Details Results: ${successfulDetails}/${totalDetails} successful`);
  detailsResults.forEach(result => {
    const status = result.success ? 'SUCCESS' : 'FAILED';
    console.log(`- "${result.placeName}": ${status}`);
  });
  
  console.log(`\nDirect API Results: ${successfulDirectApi}/${totalDirectApi} successful`);
  directApiResults.forEach(result => {
    const status = result.success ? 'SUCCESS' : 'FAILED';
    console.log(`- "${result.query}": ${status}`);
  });
  
  // Overall assessment
  console.log('\nOverall Assessment:');
  
  if (successfulSearches > 0 && successfulDetails > 0) {
    console.log('✅ The Google Places API integration is working through the backend proxy.');
    
    if (successfulSearches < totalSearches || successfulDetails < totalDetails) {
      console.log('⚠️ Some requests failed. This may be due to:');
      console.log('   - Rate limiting by the Google Places API');
      console.log('   - Network issues or timeouts');
      console.log('   - Invalid queries or place IDs');
    }
  } else {
    console.log('❌ The Google Places API integration is NOT working correctly.');
    console.log('   Major issues were encountered during testing.');
  }
  
  // Recommendations
  console.log('\nRecommendations:');
  
  if (successfulDirectApi < totalDirectApi) {
    console.log('1. Check the backend proxy implementation for the Google Places API');
    console.log('2. Verify that the API key is correctly configured in the backend');
  }
  
  if (successfulSearches < totalSearches) {
    console.log('3. Improve error handling for place search requests');
    console.log('4. Add retry mechanisms for failed API calls');
  }
  
  if (successfulDetails < totalDetails) {
    console.log('5. Enhance error handling for place details requests');
    console.log('6. Implement fallback mechanisms for when place details cannot be retrieved');
  }
  
  console.log('\n' + '*'.repeat(80));
}

// Run the tests
runTests().catch(error => {
  logger.error('Unhandled error in test execution', error);
  process.exit(1);
});
