/**
 * Bulk Add Frontend Test Script
 * 
 * This script tests the frontend processing logic for the bulk add functionality
 * by directly interacting with the useBulkAddProcessorV2 hook and related components.
 */

// Import necessary modules for testing
import { placeService } from './src/services/placeService.js';
import { filterService } from './src/services/filterService.js';
import { adminService } from './src/services/adminService.js';
import { 
  findLocalDuplicates,
  markLocalDuplicates,
  formatPlaceDetails,
  extractAddressComponents,
  formatItemForSubmission,
  batchProcess,
  parseRawInput,
  zipToNeighborhoodMap,
  BULK_ADD_CONFIG
} from './src/utils/bulkAddUtils.js';

// Test data - real restaurant entries
const testData = {
  rawInput: `Shake Shack | restaurant | New York, NY | Burgers, Shakes, Fast Casual
Chipotle | restaurant | San Francisco, CA | Mexican, Burritos, Bowls
Sweetgreen | restaurant | Los Angeles, CA | Salads, Healthy, Organic`,
  
  // Edge cases
  duplicates: `Shake Shack | restaurant | New York, NY | Burgers, Shakes
Shake Shack | restaurant | Boston, MA | Burgers, Fast Food`,
  
  emptyRows: `
   |    |    |   `,
  
  malformed: `Invalid Format Restaurant
Missing Fields | restaurant`
};

// Utility functions for logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error(`Error details:`, error);
    }
  },
  success: (message) => console.log(`[SUCCESS] ${message}`),
  step: (number, message) => console.log(`\n[STEP ${number}] ${message}`)
};

// Test functions
async function testParseInput() {
  logger.step(1, 'Testing parseRawInput function');
  
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

async function testDuplicateDetection() {
  logger.step(2, 'Testing duplicate detection');
  
  try {
    const parsedItems = parseRawInput(testData.duplicates);
    logger.info(`Parsed ${parsedItems.length} items for duplicate testing`);
    
    const duplicates = findLocalDuplicates(parsedItems);
    
    if (duplicates.length > 0) {
      logger.success(`Duplicate detection successful. Found ${duplicates.length} duplicates`);
      duplicates.forEach((dup, index) => {
        logger.info(`Duplicate ${index + 1}: Original index ${dup.originalIndex}, Duplicate index ${dup.duplicateIndex}`);
      });
      
      // Test marking duplicates
      const markedItems = markLocalDuplicates(parsedItems, duplicates);
      logger.info('Marked duplicates in the items array');
      
      return true;
    } else {
      logger.error('Duplicate detection failed. No duplicates found when expected');
      return false;
    }
  } catch (error) {
    logger.error('Duplicate detection test failed', error);
    return false;
  }
}

async function testPlaceSearch() {
  logger.step(3, 'Testing place search functionality');
  
  try {
    // Get the first parsed item
    const parsedItems = parseRawInput(testData.rawInput);
    const testItem = parsedItems[0];
    
    logger.info(`Searching for place: ${testItem.name}`);
    
    // Test the search function directly
    const searchResult = await placeService.searchPlaces(testItem.name);
    
    if (searchResult && Array.isArray(searchResult.results)) {
      logger.success(`Place search successful. Found ${searchResult.results.length} results`);
      
      if (searchResult.results.length > 0) {
        const firstPlace = searchResult.results[0];
        logger.info(`First result: ${firstPlace.name} (${firstPlace.place_id})`);
        
        // Return the place_id for further testing
        return firstPlace.place_id;
      } else {
        logger.error('No places found for the test restaurant');
        return null;
      }
    } else {
      logger.error('Place search failed: Invalid response format');
      console.log('Response:', searchResult);
      return null;
    }
  } catch (error) {
    logger.error('Place search test failed', error);
    return null;
  }
}

async function testPlaceDetails(placeId) {
  logger.step(4, 'Testing place details functionality');
  
  if (!placeId) {
    logger.error('Cannot test place details without a place_id');
    return null;
  }
  
  try {
    logger.info(`Getting details for place_id: ${placeId}`);
    
    const placeDetails = await placeService.getPlaceDetails(placeId);
    
    if (placeDetails && placeDetails.result) {
      logger.success('Place details retrieval successful');
      logger.info(`Place name: ${placeDetails.result.name}`);
      logger.info(`Formatted address: ${placeDetails.result.formatted_address}`);
      
      // Test formatting place details
      const formattedPlace = formatPlaceDetails(placeDetails.result);
      logger.info('Formatted place details successfully');
      
      // Test extracting address components
      const addressComponents = extractAddressComponents(placeDetails.result);
      logger.info(`Extracted address components: ${JSON.stringify(addressComponents)}`);
      
      return placeDetails.result;
    } else {
      logger.error('Place details retrieval failed: Invalid response format');
      console.log('Response:', placeDetails);
      return null;
    }
  } catch (error) {
    logger.error('Place details test failed', error);
    return null;
  }
}

async function testNeighborhoodLookup(postalCode) {
  logger.step(5, 'Testing neighborhood lookup functionality');
  
  if (!postalCode) {
    logger.info('No postal code provided, using a default');
    postalCode = '10001'; // NYC zipcode
  }
  
  try {
    logger.info(`Looking up neighborhood for postal code: ${postalCode}`);
    
    const neighborhood = await filterService.findNeighborhoodByZipcode(postalCode);
    
    if (neighborhood && neighborhood.id) {
      logger.success('Neighborhood lookup successful');
      logger.info(`Neighborhood: ${neighborhood.name} (ID: ${neighborhood.id})`);
      return neighborhood;
    } else {
      logger.error('Neighborhood lookup failed: Invalid response format');
      console.log('Response:', neighborhood);
      
      // Check if the zipcode is in the hardcoded map
      if (zipToNeighborhoodMap[postalCode]) {
        logger.info(`Found neighborhood in hardcoded map: ${zipToNeighborhoodMap[postalCode].name}`);
        return zipToNeighborhoodMap[postalCode];
      }
      
      return null;
    }
  } catch (error) {
    logger.error('Neighborhood lookup test failed', error);
    
    // Check if the zipcode is in the hardcoded map as fallback
    if (zipToNeighborhoodMap[postalCode]) {
      logger.info(`Found neighborhood in hardcoded map after API error: ${zipToNeighborhoodMap[postalCode].name}`);
      return zipToNeighborhoodMap[postalCode];
    }
    
    return null;
  }
}

async function testBatchProcessing() {
  logger.step(6, 'Testing batch processing functionality');
  
  try {
    // Parse some test items
    const parsedItems = parseRawInput(testData.rawInput);
    logger.info(`Parsed ${parsedItems.length} items for batch processing test`);
    
    // Create a simple processor function for testing
    const testProcessor = async (item, index, items) => {
      logger.info(`Processing item ${index + 1}: ${item.name}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        ...item,
        status: 'processed',
        message: 'Test processing completed'
      };
    };
    
    // Test the batch processing
    logger.info('Starting batch processing with test processor');
    const processedItems = await batchProcess(parsedItems, testProcessor, 2);
    
    if (processedItems && processedItems.length === parsedItems.length) {
      logger.success(`Batch processing successful. Processed ${processedItems.length} items`);
      return true;
    } else {
      logger.error('Batch processing failed: Incorrect number of processed items');
      return false;
    }
  } catch (error) {
    logger.error('Batch processing test failed', error);
    return false;
  }
}

async function testFormatItemForSubmission() {
  logger.step(7, 'Testing item formatting for submission');
  
  try {
    // Create a test item with all required fields
    const testItem = {
      name: 'Test Restaurant',
      type: 'restaurant',
      location: 'Test Location',
      tags: ['Tag1', 'Tag2'],
      place_id: 'test_place_id',
      formatted_address: '123 Test St, Test City, Test State',
      neighborhood_id: 1,
      neighborhood_name: 'Test Neighborhood',
      status: 'ready'
    };
    
    const formattedItem = formatItemForSubmission(testItem);
    
    if (formattedItem && formattedItem.name === testItem.name) {
      logger.success('Item formatting for submission successful');
      logger.info(`Formatted item: ${JSON.stringify(formattedItem)}`);
      return true;
    } else {
      logger.error('Item formatting for submission failed');
      return false;
    }
  } catch (error) {
    logger.error('Item formatting test failed', error);
    return false;
  }
}

async function testFullProcessingFlow() {
  logger.step(8, 'Testing full processing flow');
  
  try {
    // 1. Parse input
    const parsedItems = parseRawInput(testData.rawInput);
    logger.info(`Parsed ${parsedItems.length} items for full flow test`);
    
    // 2. Check for duplicates
    const duplicates = findLocalDuplicates(parsedItems);
    if (duplicates.length > 0) {
      logger.info(`Found ${duplicates.length} duplicates`);
      markLocalDuplicates(parsedItems, duplicates);
    }
    
    // 3. Process the first item as a test
    const testItem = parsedItems[0];
    logger.info(`Processing test item: ${testItem.name}`);
    
    // 4. Search for place
    logger.info(`Searching for place: ${testItem.name}`);
    const searchResult = await placeService.searchPlaces(testItem.name);
    
    if (!searchResult || !Array.isArray(searchResult.results) || searchResult.results.length === 0) {
      logger.error('Place search failed in full flow test');
      return false;
    }
    
    logger.info(`Found ${searchResult.results.length} places for ${testItem.name}`);
    
    // 5. Get place details for the first result
    const placeId = searchResult.results[0].place_id;
    logger.info(`Getting details for place_id: ${placeId}`);
    
    const placeDetails = await placeService.getPlaceDetails(placeId);
    
    if (!placeDetails || !placeDetails.result) {
      logger.error('Place details retrieval failed in full flow test');
      return false;
    }
    
    logger.info(`Got details for ${placeDetails.result.name}`);
    
    // 6. Format place details
    const formattedPlace = formatPlaceDetails(placeDetails.result);
    
    // 7. Extract address components
    const addressComponents = extractAddressComponents(placeDetails.result);
    
    // 8. Get neighborhood
    let neighborhood = null;
    if (addressComponents.postalCode) {
      logger.info(`Looking up neighborhood for postal code: ${addressComponents.postalCode}`);
      try {
        neighborhood = await filterService.findNeighborhoodByZipcode(addressComponents.postalCode);
      } catch (error) {
        logger.error('Neighborhood lookup failed in full flow test', error);
        
        // Use hardcoded fallback
        if (zipToNeighborhoodMap[addressComponents.postalCode]) {
          neighborhood = zipToNeighborhoodMap[addressComponents.postalCode];
          logger.info(`Using fallback neighborhood: ${neighborhood.name}`);
        } else {
          // Default neighborhood
          neighborhood = { id: 1, name: 'Default Neighborhood' };
          logger.info('Using default neighborhood');
        }
      }
    } else {
      // Default neighborhood
      neighborhood = { id: 1, name: 'Default Neighborhood' };
      logger.info('Using default neighborhood (no postal code)');
    }
    
    // 9. Create processed item
    const processedItem = {
      ...testItem,
      ...formattedPlace,
      neighborhood_id: neighborhood.id,
      neighborhood_name: neighborhood.name,
      address_components: addressComponents,
      status: 'ready',
      message: 'Ready for submission'
    };
    
    logger.info(`Processed item created: ${JSON.stringify(processedItem)}`);
    
    // 10. Format for submission
    const submissionItem = formatItemForSubmission(processedItem);
    
    logger.success('Full processing flow completed successfully');
    logger.info(`Final submission item: ${JSON.stringify(submissionItem)}`);
    
    return true;
  } catch (error) {
    logger.error('Full processing flow test failed', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('======== BULK ADD FRONTEND TEST ========');
  console.log('Testing frontend processing logic for bulk add functionality');
  console.log('=========================================\n');
  
  const results = {
    parseInput: false,
    duplicateDetection: false,
    placeSearch: false,
    placeDetails: false,
    neighborhoodLookup: false,
    batchProcessing: false,
    itemFormatting: false,
    fullFlow: false
  };
  
  // Run tests
  results.parseInput = await testParseInput();
  results.duplicateDetection = await testDuplicateDetection();
  
  const placeId = await testPlaceSearch();
  results.placeSearch = !!placeId;
  
  if (placeId) {
    const placeDetails = await testPlaceDetails(placeId);
    results.placeDetails = !!placeDetails;
    
    if (placeDetails && placeDetails.address_components) {
      const postalCodeComponent = placeDetails.address_components.find(
        comp => comp.types.includes('postal_code')
      );
      
      if (postalCodeComponent) {
        const postalCode = postalCodeComponent.long_name;
        const neighborhood = await testNeighborhoodLookup(postalCode);
        results.neighborhoodLookup = !!neighborhood;
      } else {
        results.neighborhoodLookup = await testNeighborhoodLookup();
      }
    } else {
      results.neighborhoodLookup = await testNeighborhoodLookup();
    }
  } else {
    results.neighborhoodLookup = await testNeighborhoodLookup();
  }
  
  results.batchProcessing = await testBatchProcessing();
  results.itemFormatting = await testFormatItemForSubmission();
  results.fullFlow = await testFullProcessingFlow();
  
  // Print summary
  console.log('\n======== TEST RESULTS ========');
  for (const [test, result] of Object.entries(results)) {
    console.log(`${test}: ${result ? 'PASS' : 'FAIL'}`);
  }
  
  // Analysis
  console.log('\n======== ANALYSIS ========');
  
  if (!results.placeSearch) {
    console.log('- Google Places API search is failing. Check API key and endpoint implementation.');
  }
  
  if (!results.placeDetails) {
    console.log('- Google Places API details retrieval is failing. Check API key and endpoint implementation.');
  }
  
  if (!results.neighborhoodLookup) {
    console.log('- Neighborhood lookup is failing. Check the filters service and database.');
  }
  
  if (!results.batchProcessing) {
    console.log('- Batch processing is failing. Check the batchProcess function implementation.');
  }
  
  if (!results.fullFlow) {
    console.log('- Full processing flow is failing. Check the individual components and their integration.');
  }
  
  console.log('\n======== NEXT STEPS ========');
  console.log('1. Fix any failing components identified above');
  console.log('2. Check the useBulkAddProcessorV2 hook for proper promise handling');
  console.log('3. Verify the Google Places API key has the correct permissions');
  console.log('4. Check for any network issues or CORS problems');
  console.log('5. Ensure all dependencies are properly imported in the components');
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed', error);
});
