/**
 * Comprehensive End-to-End Test Script for Bulk Add Functionality
 * 
 * This script tests the complete flow of the bulk add feature from frontend to backend,
 * without using any mock data. It identifies breakage points and validates the implementation.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout } from 'timers/promises';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  // API endpoints
  API_URL: 'http://localhost:5001/api',
  FRONTEND_URL: 'http://localhost:5173',
  
  // Login credentials
  LOGIN_CREDENTIALS: {
    email: 'admin@example.com',
    password: 'doof123'
  },
  
  // Test data
  TEST_DATA_DIR: path.join(__dirname, 'test-data'),
  
  // Test configuration
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000
};

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.TIMEOUT_MS,
  withCredentials: true
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

// Test data sets
const testDataSets = {
  // Standard valid data
  standard: `Shake Shack | restaurant | New York, NY | Burgers, Shakes, Fast Casual
Chipotle | restaurant | San Francisco, CA | Mexican, Burritos, Bowls
Sweetgreen | restaurant | Los Angeles, CA | Salads, Healthy, Organic`,
  
  // Edge cases
  duplicates: `Shake Shack | restaurant | New York, NY | Burgers, Shakes
Shake Shack | restaurant | Boston, MA | Burgers, Fast Food`,
  
  emptyRows: `
   |    |    |   
Chipotle | restaurant | San Francisco, CA | Mexican`,
  
  malformed: `Invalid Format Restaurant
Missing Fields | restaurant
Sweetgreen | restaurant | Los Angeles, CA`,
  
  // Mixed data with all edge cases
  mixed: `Shake Shack | restaurant | New York, NY | Burgers, Shakes
Chipotle | restaurant | San Francisco, CA | Mexican, Burritos
Sweetgreen | restaurant | Los Angeles, CA | Salads, Healthy

Invalid Format Restaurant
   |    |    |   
Shake Shack | restaurant | Boston, MA | Burgers, Fast Food`
};

/**
 * Authentication Functions
 */

// Function to login and get authentication
async function login() {
  const stage = logger.stage('Authentication');
  
  try {
    logger.info('Logging in to the application');
    
    const response = await api.post('/auth/login', CONFIG.LOGIN_CREDENTIALS);
    
    if (response.data && response.data.success) {
      logger.success('Login successful');
      logger.endStage(stage, 'SUCCESS');
      return response.data.token;
    } else {
      throw new Error('Login failed: ' + (response.data?.message || 'Unknown error'));
    }
  } catch (error) {
    logger.error('Authentication failed', error);
    logger.endStage(stage, 'FAILED', 'Could not authenticate with the API');
    throw error;
  }
}

/**
 * Input Parsing Functions
 */

// Function to parse raw input data as the frontend would
function parseRawInput(rawInput) {
  const stage = logger.stage('Input Parsing');
  
  try {
    logger.info('Parsing raw input data');
    
    // Split input by newlines and filter out empty lines
    const lines = rawInput.split('\n').filter(line => line.trim() !== '');
    
    const parsedItems = [];
    const errors = [];
    
    lines.forEach((line, lineIndex) => {
      // Split by pipe and trim each part
      const parts = line.split('|').map(part => part.trim());
      
      // Basic validation
      if (parts.length < 3) {
        errors.push({
          line: lineIndex + 1,
          message: 'Line has fewer than 3 parts',
          content: line
        });
        return;
      }
      
      const [name, type, location, tagsString] = parts;
      
      // Validate required fields
      if (!name || !type) {
        errors.push({
          line: lineIndex + 1,
          message: 'Missing required fields (name or type)',
          content: line
        });
        return;
      }
      
      // Parse tags
      const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
      
      // Parse location
      let city = '';
      let state = '';
      
      if (location) {
        const locationParts = location.split(',').map(part => part.trim());
        city = locationParts[0];
        state = locationParts.length > 1 ? locationParts[1] : '';
      }
      
      // Create parsed item
      parsedItems.push({
        _lineNumber: lineIndex + 1,
        name,
        type,
        location,
        city_name: city,
        state,
        tags: tags.join(', ')
      });
    });
    
    logger.success(`Parsed ${parsedItems.length} items with ${errors.length} errors`);
    
    if (errors.length > 0) {
      logger.warn('Parsing errors:');
      errors.forEach(error => {
        logger.warn(`Line ${error.line}: ${error.message} - "${error.content}"`);
      });
    }
    
    logger.endStage(stage, parsedItems.length > 0 ? 'SUCCESS' : 'FAILED');
    return parsedItems;
  } catch (error) {
    logger.error('Input parsing failed', error);
    logger.endStage(stage, 'FAILED', 'Error parsing input data');
    return [];
  }
}

/**
 * Place API Integration Functions
 */

// Function to test the place lookup (simulating frontend behavior)
async function testPlaceLookup(item) {
  const stage = logger.stage(`Place Lookup for "${item.name}"`);
  
  try {
    logger.info(`Searching for place: ${item.name}`);
    
    // Build the search query
    const searchQuery = item.location ? `${item.name}, ${item.location}` : item.name;
    
    // Make the API request
    const response = await api.get('/places/search', {
      params: { query: searchQuery }
    });
    
    // Check for valid response
    if (!response.data || !response.data.results) {
      throw new Error('Invalid response format from places search API');
    }
    
    const results = response.data.results;
    
    if (results.length === 0) {
      logger.warn(`No places found for "${searchQuery}"`);
      logger.endStage(stage, 'WARNING', 'No places found');
      return { success: false, message: 'No places found', results: [] };
    }
    
    logger.success(`Found ${results.length} places for "${searchQuery}"`);
    logger.debug('First result:', results[0]);
    
    logger.endStage(stage, 'SUCCESS');
    return { 
      success: true, 
      results,
      selectedPlace: results[0] // Automatically select the first result for testing
    };
  } catch (error) {
    logger.error(`Place lookup failed for "${item.name}"`, error);
    logger.endStage(stage, 'FAILED', `Error looking up place for "${item.name}"`);
    return { success: false, message: error.message, results: [] };
  }
}

// Function to test getting place details
async function testPlaceDetails(placeId) {
  const stage = logger.stage(`Place Details for ID: ${placeId}`);
  
  try {
    logger.info(`Getting details for place ID: ${placeId}`);
    
    // Make the API request
    const response = await api.get('/places/details', {
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
    logger.error(`Place details lookup failed for ID: ${placeId}`, error);
    logger.endStage(stage, 'FAILED', `Error getting place details for ID: ${placeId}`);
    return { success: false, message: error.message };
  }
}

// Function to test neighborhood lookup by zipcode
async function testNeighborhoodLookup(zipcode) {
  const stage = logger.stage(`Neighborhood Lookup for Zipcode: ${zipcode}`);
  
  try {
    logger.info(`Looking up neighborhood for zipcode: ${zipcode}`);
    
    // Make the API request
    const response = await api.get('/filters/neighborhoods', {
      params: { zipcode }
    });
    
    // Check for valid response
    if (!response.data) {
      throw new Error('Invalid response format from neighborhood lookup API');
    }
    
    // If no neighborhood found, return default
    if (!response.data.id) {
      logger.warn(`No neighborhood found for zipcode: ${zipcode}`);
      logger.endStage(stage, 'WARNING', 'No neighborhood found, using default');
      return { 
        success: true, 
        neighborhood: { id: 1, name: 'Default Neighborhood' },
        isDefault: true
      };
    }
    
    const neighborhood = response.data;
    
    logger.success(`Found neighborhood: ${neighborhood.name} (ID: ${neighborhood.id})`);
    
    logger.endStage(stage, 'SUCCESS');
    return { success: true, neighborhood, isDefault: false };
  } catch (error) {
    logger.error(`Neighborhood lookup failed for zipcode: ${zipcode}`, error);
    logger.endStage(stage, 'FAILED', `Error looking up neighborhood for zipcode: ${zipcode}`);
    
    // Return default neighborhood as fallback
    return { 
      success: false, 
      message: error.message,
      neighborhood: { id: 1, name: 'Default Neighborhood' },
      isDefault: true
    };
  }
}

// Function to extract address components from place details
function extractAddressComponents(placeDetails) {
  if (!placeDetails || !placeDetails.address_components) {
    return {
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      country: '',
      postal_code: ''
    };
  }
  
  const components = {};
  
  // Map of address component types to our simplified structure
  const componentMap = {
    street_number: 'street_number',
    route: 'route',
    locality: 'locality',
    administrative_area_level_1: 'administrative_area_level_1',
    country: 'country',
    postal_code: 'postal_code'
  };
  
  // Extract components based on types
  placeDetails.address_components.forEach(component => {
    for (const type of component.types) {
      if (componentMap[type]) {
        components[componentMap[type]] = component.long_name;
      }
    }
  });
  
  return {
    street_number: components.street_number || '',
    route: components.route || '',
    locality: components.locality || '',
    administrative_area_level_1: components.administrative_area_level_1 || '',
    country: components.country || '',
    postal_code: components.postal_code || ''
  };
}

// Function to process place details for an item
async function processPlaceDetails(item, placeDetails) {
  const stage = logger.stage(`Processing Details for "${item.name}"`);
  
  try {
    logger.info(`Processing place details for "${item.name}"`);
    
    // Extract address components
    const addressComponents = extractAddressComponents(placeDetails);
    logger.debug('Extracted address components:', addressComponents);
    
    // Look up neighborhood if postal code is available
    let neighborhood = { id: 1, name: 'Default Neighborhood' };
    let neighborhoodLookupResult = { success: false, isDefault: true };
    
    if (addressComponents.postal_code) {
      neighborhoodLookupResult = await testNeighborhoodLookup(addressComponents.postal_code);
      if (neighborhoodLookupResult.success && !neighborhoodLookupResult.isDefault) {
        neighborhood = neighborhoodLookupResult.neighborhood;
      }
    }
    
    // Create processed item
    const processedItem = {
      ...item,
      place_id: placeDetails.place_id,
      formatted_address: placeDetails.formatted_address,
      address_components: addressComponents,
      neighborhood_id: neighborhood.id,
      neighborhood_name: neighborhood.name,
      geometry: placeDetails.geometry,
      status: 'ready',
      message: 'Ready for submission'
    };
    
    logger.success(`Successfully processed details for "${item.name}"`);
    logger.debug('Processed item:', processedItem);
    
    logger.endStage(stage, 'SUCCESS');
    return { success: true, processedItem };
  } catch (error) {
    logger.error(`Processing place details failed for "${item.name}"`, error);
    logger.endStage(stage, 'FAILED', `Error processing place details for "${item.name}"`);
    
    // Return item with error status
    return {
      success: false,
      message: error.message,
      processedItem: {
        ...item,
        status: 'error',
        message: `Error processing place details: ${error.message}`
      }
    };
  }
}

// Function to format item for submission
function formatItemForSubmission(item) {
  // Extract only the fields needed for submission
  return {
    name: item.name,
    type: item.type,
    place_id: item.place_id,
    formatted_address: item.formatted_address,
    neighborhood_id: item.neighborhood_id,
    geometry: item.geometry,
    tags: item.tags
  };
}

// Function to test the bulk add submission
async function testBulkAddSubmission(items) {
  const stage = logger.stage('Bulk Add Submission');
  
  try {
    logger.info(`Submitting ${items.length} items for bulk add`);
    
    // Format items for submission
    const formattedItems = items
      .filter(item => item.status === 'ready')
      .map(formatItemForSubmission);
    
    if (formattedItems.length === 0) {
      logger.warn('No items ready for submission');
      logger.endStage(stage, 'WARNING', 'No items to submit');
      return { success: false, message: 'No items ready for submission' };
    }
    
    logger.debug(`Submitting ${formattedItems.length} formatted items`);
    
    // Make the API request
    const response = await api.post('/restaurants/bulk', {
      items: formattedItems
    });
    
    // Check for valid response
    if (!response.data) {
      throw new Error('Invalid response format from bulk add API');
    }
    
    const result = response.data;
    
    if (!result.success) {
      throw new Error(`Bulk add failed: ${result.message || 'Unknown error'}`);
    }
    
    logger.success(`Successfully submitted ${formattedItems.length} items`);
    logger.debug('Submission result:', result);
    
    logger.endStage(stage, 'SUCCESS');
    return { success: true, result };
  } catch (error) {
    logger.error('Bulk add submission failed', error);
    logger.endStage(stage, 'FAILED', 'Error submitting bulk add items');
    return { success: false, message: error.message };
  }
}

/**
 * Main Test Functions
 */

// Function to run a single test case
async function runTestCase(testCase, dataSet) {
  const stage = logger.stage(`Test Case: ${testCase}`);
  
  try {
    logger.info(`Running test case "${testCase}" with ${dataSet.split('\n').filter(line => line.trim()).length} items`);
    
    // Step 1: Parse input
    const parsedItems = parseRawInput(dataSet);
    
    if (parsedItems.length === 0) {
      throw new Error('No items parsed from input data');
    }
    
    // Step 2: Process each item
    const processedItems = [];
    const failedItems = [];
    
    for (const item of parsedItems) {
      try {
        // Step 2.1: Look up place
        const placeLookupResult = await testPlaceLookup(item);
        
        if (!placeLookupResult.success || placeLookupResult.results.length === 0) {
          failedItems.push({
            ...item,
            status: 'error',
            message: placeLookupResult.message || 'No places found'
          });
          continue;
        }
        
        // Step 2.2: Get place details
        const selectedPlace = placeLookupResult.selectedPlace;
        const placeDetailsResult = await testPlaceDetails(selectedPlace.place_id);
        
        if (!placeDetailsResult.success) {
          failedItems.push({
            ...item,
            status: 'error',
            message: placeDetailsResult.message || 'Failed to get place details'
          });
          continue;
        }
        
        // Step 2.3: Process place details
        const processResult = await processPlaceDetails(item, placeDetailsResult.placeDetails);
        
        if (!processResult.success) {
          failedItems.push(processResult.processedItem);
          continue;
        }
        
        // Add to processed items
        processedItems.push(processResult.processedItem);
      } catch (itemError) {
        logger.error(`Error processing item "${item.name}"`, itemError);
        failedItems.push({
          ...item,
          status: 'error',
          message: `Unhandled error: ${itemError.message}`
        });
      }
      
      // Add a small delay between items to avoid rate limiting
      await setTimeout(500);
    }
    
    logger.info(`Processed ${processedItems.length} items successfully, ${failedItems.length} failed`);
    
    // Step 3: Submit processed items
    let submissionResult = { success: false, message: 'Submission skipped' };
    
    if (processedItems.length > 0) {
      submissionResult = await testBulkAddSubmission(processedItems);
    }
    
    // Compile test results
    const testResult = {
      testCase,
      totalItems: parsedItems.length,
      processedItems: processedItems.length,
      failedItems: failedItems.length,
      submissionSuccess: submissionResult.success,
      submissionMessage: submissionResult.message
    };
    
    logger.success(`Test case "${testCase}" completed`);
    logger.debug('Test result:', testResult);
    
    logger.endStage(stage, testResult.submissionSuccess ? 'SUCCESS' : 'PARTIAL', 
      `Processed ${testResult.processedItems}/${testResult.totalItems} items successfully`);
    
    return testResult;
  } catch (error) {
    logger.error(`Test case "${testCase}" failed`, error);
    logger.endStage(stage, 'FAILED', `Error running test case "${testCase}"`);
    
    return {
      testCase,
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      submissionSuccess: false,
      submissionMessage: error.message
    };
  }
}

// Main test function
async function runTests() {
  console.log('\n' + '*'.repeat(80));
  console.log('BULK ADD END-TO-END TEST SUITE');
  console.log('Testing the complete frontend-to-backend flow');
  console.log('*'.repeat(80) + '\n');
  
  try {
    // Step 1: Login to get authentication
    await login();
    
    // Step 2: Run test cases
    const testCases = [
      { name: 'standard', data: testDataSets.standard },
      { name: 'duplicates', data: testDataSets.duplicates },
      { name: 'emptyRows', data: testDataSets.emptyRows },
      { name: 'malformed', data: testDataSets.malformed },
      { name: 'mixed', data: testDataSets.mixed }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      const result = await runTestCase(testCase.name, testCase.data);
      results.push(result);
      
      // Add a delay between test cases
      await setTimeout(1000);
    }
    
    // Step 3: Generate summary
    generateTestSummary(results);
    
    return results;
  } catch (error) {
    logger.error('Test execution failed', error);
    return [];
  }
}

// Function to generate test summary
function generateTestSummary(results) {
  console.log('\n' + '*'.repeat(80));
  console.log('BULK ADD TEST SUMMARY');
  console.log('*'.repeat(80));
  
  // Calculate overall statistics
  const totalItems = results.reduce((sum, result) => sum + result.totalItems, 0);
  const processedItems = results.reduce((sum, result) => sum + result.processedItems, 0);
  const failedItems = results.reduce((sum, result) => sum + result.failedItems, 0);
  const successfulSubmissions = results.filter(result => result.submissionSuccess).length;
  
  console.log(`\nTotal Test Cases: ${results.length}`);
  console.log(`Total Items: ${totalItems}`);
  console.log(`Successfully Processed: ${processedItems} (${Math.round(processedItems / totalItems * 100)}%)`);
  console.log(`Failed Items: ${failedItems} (${Math.round(failedItems / totalItems * 100)}%)`);
  console.log(`Successful Submissions: ${successfulSubmissions}/${results.length}`);
  
  // Print individual test case results
  console.log('\nTest Case Results:');
  results.forEach(result => {
    const status = result.submissionSuccess ? 'SUCCESS' : 'FAILED';
    console.log(`- ${result.testCase}: ${status} (${result.processedItems}/${result.totalItems} items processed)`);
  });
  
  // Overall assessment
  const overallSuccess = processedItems > 0 && successfulSubmissions > 0;
  console.log('\nOverall Assessment:');
  if (overallSuccess) {
    console.log('✅ The bulk add functionality is working, but with some limitations.');
    
    if (failedItems > 0) {
      console.log('⚠️ Some items failed processing. This may be due to:');
      console.log('   - Invalid or malformed input data');
      console.log('   - Places not found in the Google Places API');
      console.log('   - Issues with neighborhood lookup');
    }
  } else {
    console.log('❌ The bulk add functionality is NOT working correctly.');
    console.log('   Major issues were encountered during testing.');
  }
  
  // Recommendations
  console.log('\nRecommendations:');
  if (failedItems > 0) {
    console.log('1. Improve error handling for malformed input data');
    console.log('2. Add better fallback mechanisms for place lookup failures');
    console.log('3. Enhance user feedback for failed items');
  }
  if (successfulSubmissions < results.length) {
    console.log('4. Fix issues with the bulk add submission endpoint');
    console.log('5. Ensure proper authentication and authorization for API calls');
  }
  
  console.log('\n' + '*'.repeat(80));
}

// Run the tests
runTests().catch(error => {
  logger.error('Unhandled error in test execution', error);
  process.exit(1);
});
