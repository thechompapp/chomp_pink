// Test script for neighborhood and place lookups in the bulk add feature
import { filterService } from './src/services/filterService.js';
import { placeService } from './src/services/placeService.js';
import { zipToNeighborhoodMap } from './src/utils/bulkAddUtils.js';
import { logInfo, logError, logDebug } from './src/utils/logger.js';

// Test data
const TEST_ZIPCODES = ['10014', '11249', '10001', '11377', '10003'];
const TEST_PLACES = ['Chipotle New York', 'Shake Shack NYC', 'Thai Villa New York', 'Cosme NYC'];

/**
 * Test neighborhood lookup by zipcode
 */
async function testNeighborhoodLookup() {
  console.log('\n=== TESTING NEIGHBORHOOD LOOKUP ===\n');
  
  for (const zipcode of TEST_ZIPCODES) {
    try {
      console.log(`Testing lookup for zipcode: ${zipcode}`);
      
      // Check if we have a hardcoded mapping
      if (zipToNeighborhoodMap[zipcode]) {
        console.log(`✅ Found hardcoded neighborhood: ${zipToNeighborhoodMap[zipcode].name}`);
      }
      
      // Try API lookup
      console.log(`Attempting API lookup for zipcode: ${zipcode}`);
      const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
      
      if (neighborhood && neighborhood.id && neighborhood.name) {
        console.log(`✅ API lookup successful: ${neighborhood.name} (ID: ${neighborhood.id})`);
      } else {
        console.log(`❌ API lookup failed, no neighborhood found for zipcode: ${zipcode}`);
      }
    } catch (error) {
      console.error(`❌ Error looking up neighborhood for zipcode ${zipcode}:`, error.message);
    }
    
    console.log('---');
  }
}

/**
 * Test place lookup using Google Places API
 */
async function testPlaceLookup() {
  console.log('\n=== TESTING PLACE LOOKUP ===\n');
  
  for (const placeName of TEST_PLACES) {
    try {
      console.log(`Testing place lookup for: "${placeName}"`);
      
      // Search for place
      const searchResult = await placeService.searchPlaces(placeName);
      
      if (!searchResult || !Array.isArray(searchResult.results) || searchResult.results.length === 0) {
        console.log(`❌ No places found for: "${placeName}"`);
        continue;
      }
      
      console.log(`✅ Found ${searchResult.results.length} places for "${placeName}"`);
      
      // Get details for the first place
      const place = searchResult.results[0];
      console.log(`Getting details for place: ${place.name} (${place.place_id})`);
      
      const placeDetails = await placeService.getPlaceDetails(place.place_id);
      
      if (!placeDetails) {
        console.log(`❌ Failed to get place details for: ${place.name}`);
        continue;
      }
      
      console.log(`✅ Successfully retrieved place details:`);
      console.log(`  Name: ${placeDetails.name}`);
      console.log(`  Address: ${placeDetails.formatted_address}`);
      console.log(`  Types: ${placeDetails.types?.join(', ')}`);
      
      // Extract address components
      if (placeDetails.address_components) {
        const zipcode = placeDetails.address_components.find(
          component => component.types.includes('postal_code')
        )?.short_name;
        
        if (zipcode) {
          console.log(`  Zipcode: ${zipcode}`);
          
          // Try to lookup neighborhood for this zipcode
          try {
            console.log(`  Looking up neighborhood for zipcode: ${zipcode}`);
            const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
            
            if (neighborhood && neighborhood.id && neighborhood.name) {
              console.log(`  ✅ Neighborhood: ${neighborhood.name} (ID: ${neighborhood.id})`);
            } else {
              console.log(`  ❌ No neighborhood found for zipcode: ${zipcode}`);
            }
          } catch (error) {
            console.error(`  ❌ Error looking up neighborhood:`, error.message);
          }
        } else {
          console.log(`  ❌ No zipcode found in address components`);
        }
      }
    } catch (error) {
      console.error(`❌ Error looking up place "${placeName}":`, error.message);
    }
    
    console.log('---');
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('Starting tests for neighborhood and place lookups...');
    
    // Test neighborhood lookup
    await testNeighborhoodLookup();
    
    // Test place lookup
    await testPlaceLookup();
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests().catch(console.error);
