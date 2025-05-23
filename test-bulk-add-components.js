/**
 * Bulk Add Components Test Script
 * 
 * This script tests the frontend components involved in the bulk add process,
 * focusing on the integration between the components and the Google Places API.
 */

import { parseRawInput, batchProcess } from './src/utils/bulkAddUtils.js';
import { GOOGLE_PLACES_API_KEY } from './src/config.js';
import axios from 'axios';

// Test data
const testData = {
  rawInput: `Shake Shack | restaurant | New York, NY | Burgers, Shakes, Fast Casual
Chipotle | restaurant | San Francisco, CA | Mexican, Burritos, Bowls
Sweetgreen | restaurant | Los Angeles, CA | Salads, Healthy, Organic`
};

// Create axios instance for direct Google Places API calls
const placesApi = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/place',
  timeout: 10000
});

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

// Test functions
async function testParseInput() {
  logger.step(1, 'Testing input parsing');
  
  try {
    const parsedItems = parseRawInput(testData.rawInput);
    logger.success(`Parsing successful. Parsed ${parsedItems.length} items`);
    
    // Log the parsed items
    parsedItems.forEach((item, index) => {
      logger.info(`Item ${index + 1}: ${JSON.stringify(item)}`);
    });
    
    return parsedItems;
  } catch (error) {
    logger.error('Parsing failed', error);
    return [];
  }
}

async function testPlaceSearch(item) {
  logger.step(2, `Testing place search for "${item.name}"`);
  
  try {
    const searchTerm = item.location ? `${item.name}, ${item.location}` : item.name;
    logger.info(`Search term: "${searchTerm}"`);
    
    const response = await placesApi.get('/textsearch/json', {
      params: {
        query: searchTerm,
        key: GOOGLE_PLACES_API_KEY
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
    logger.error('Place search failed', error);
    return null;
  }
}

async function testBatchProcessing(parsedItems) {
  logger.step(3, 'Testing batch processing');
  
  try {
    logger.info(`Processing ${parsedItems.length} items in batches`);
    
    // Create a test processor function that simulates the place search
    const testProcessor = async (item, index) => {
      logger.info(`Processing item ${index + 1}: ${item.name}`);
      
      try {
        // Search for the place
        const placeId = await testPlaceSearch(item);
        
        if (placeId) {
          return {
            ...item,
            place_id: placeId,
            status: 'processed',
            message: 'Successfully processed'
          };
        } else {
          return {
            ...item,
            status: 'error',
            message: 'Failed to find place'
          };
        }
      } catch (error) {
        logger.error(`Error processing item ${index + 1}`, error);
        return {
          ...item,
          status: 'error',
          message: error.message || 'Unknown error'
        };
      }
    };
    
    // Process the items in batches of 2
    const processedItems = await batchProcess(parsedItems, testProcessor, 2);
    
    logger.success(`Batch processing completed. Processed ${processedItems.length} items`);
    
    // Log the processed items
    processedItems.forEach((item, index) => {
      logger.info(`Processed item ${index + 1}: ${item.name} (Status: ${item.status})`);
    });
    
    return processedItems;
  } catch (error) {
    logger.error('Batch processing failed', error);
    return [];
  }
}

// Main test function
async function runTests() {
  console.log('======== BULK ADD COMPONENTS TEST ========');
  console.log('Testing frontend components for bulk add functionality');
  console.log('===========================================\n');
  
  // Check if API key is available
  if (!GOOGLE_PLACES_API_KEY) {
    logger.error('No Google Places API key found in environment variables');
    console.log('\nPlease set the VITE_GOOGLE_PLACES_API_KEY environment variable in .env.local and try again');
    return;
  }
  
  logger.info(`Using API key: ${GOOGLE_PLACES_API_KEY.substring(0, 5)}...`);
  
  // Run the tests
  const parsedItems = await testParseInput();
  
  if (parsedItems.length > 0) {
    const processedItems = await testBatchProcessing(parsedItems);
    
    // Print summary
    console.log('\n======== TEST RESULTS ========');
    
    const successCount = processedItems.filter(item => item.status === 'processed').length;
    const errorCount = processedItems.filter(item => item.status === 'error').length;
    
    console.log(`Total items: ${processedItems.length}`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed to process: ${errorCount}`);
    
    // Analysis
    console.log('\n======== ANALYSIS ========');
    
    if (successCount === processedItems.length) {
      console.log('- All items were processed successfully!');
      console.log('- The bulk add components are working correctly with the Google Places API.');
    } else if (successCount > 0) {
      console.log('- Some items were processed successfully, but others failed.');
      console.log('- This could be due to specific issues with certain restaurant names or locations.');
    } else {
      console.log('- All items failed to process.');
      console.log('- This indicates a problem with the Google Places API integration or the batch processing logic.');
    }
    
    // Next steps
    console.log('\n======== NEXT STEPS ========');
    
    if (successCount === processedItems.length) {
      console.log('1. The bulk add components are working correctly with the Google Places API.');
      console.log('2. Ensure the frontend is properly passing the API key to the components.');
      console.log('3. Check that the useBulkAddProcessorV2 hook is correctly handling promises.');
      console.log('4. Verify that the frontend is correctly calling the backend API for final submission.');
    } else {
      console.log('1. Check the specific errors for the failed items.');
      console.log('2. Verify that the Google Places API key has the correct permissions.');
      console.log('3. Ensure the batch processing logic is handling errors correctly.');
      console.log('4. Check that the useBulkAddProcessorV2 hook is correctly handling promises.');
    }
  }
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed', error);
});
