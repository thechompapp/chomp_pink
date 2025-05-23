// Simple test script for neighborhood and place lookups in the bulk add feature
import { zipToNeighborhoodMap, BULK_ADD_CONFIG } from './src/utils/bulkAddUtils.js';

// Test data
const TEST_ZIPCODES = ['10014', '11249', '10001', '11377', '10003'];
const TEST_PLACES = [
  { name: 'Chipotle', address: '111 Broadway, New York, NY 10006', zipcode: '10006' },
  { name: 'Shake Shack', address: '215 Murray St, New York, NY 10282', zipcode: '10282' },
  { name: 'Thai Villa', address: '5 E 19th St, New York, NY 10003', zipcode: '10003' },
  { name: 'Cosme', address: '35 E 21st St, New York, NY 10010', zipcode: '10010' }
];

/**
 * Test neighborhood lookup using hardcoded mappings
 */
function testNeighborhoodLookup() {
  console.log('\n=== TESTING NEIGHBORHOOD LOOKUP ===\n');
  
  for (const zipcode of TEST_ZIPCODES) {
    console.log(`Testing lookup for zipcode: ${zipcode}`);
    
    // Check if we have a hardcoded mapping
    if (zipToNeighborhoodMap[zipcode]) {
      console.log(`✅ Found hardcoded neighborhood: ${zipToNeighborhoodMap[zipcode].name} (ID: ${zipToNeighborhoodMap[zipcode].id})`);
    } else {
      console.log(`❌ No hardcoded neighborhood found for zipcode: ${zipcode}`);
      console.log(`   In the actual application, this would fall back to API lookup or default neighborhood`);
    }
    
    console.log('---');
  }
}

/**
 * Simulate place lookup and neighborhood resolution
 */
function testPlaceProcessing() {
  console.log('\n=== TESTING PLACE PROCESSING ===\n');
  
  for (const place of TEST_PLACES) {
    console.log(`Processing place: "${place.name}" (${place.address})`);
    
    // Extract zipcode
    const zipcode = place.zipcode;
    console.log(`Extracted zipcode: ${zipcode}`);
    
    // Look up neighborhood
    let neighborhood = null;
    
    if (zipToNeighborhoodMap[zipcode]) {
      neighborhood = zipToNeighborhoodMap[zipcode];
      console.log(`✅ Found hardcoded neighborhood: ${neighborhood.name} (ID: ${neighborhood.id})`);
    } else {
      console.log(`❌ No hardcoded neighborhood found for zipcode: ${zipcode}`);
      console.log(`   Using default neighborhood as fallback`);
      neighborhood = { name: "Default Neighborhood", id: BULK_ADD_CONFIG.defaultNeighborhoodId };
    }
    
    // Simulate processing the place with neighborhood
    const processedPlace = {
      name: place.name,
      address: place.address,
      zipcode: zipcode,
      neighborhood_id: neighborhood.id,
      neighborhood_name: neighborhood.name,
      status: 'ready',
      message: `Ready to add ${place.name} in ${neighborhood.name}`
    };
    
    console.log(`✅ Successfully processed place:`);
    console.log(JSON.stringify(processedPlace, null, 2));
    console.log('---');
  }
}

/**
 * Run all tests
 */
function runTests() {
  try {
    console.log('Starting tests for neighborhood and place lookups...');
    
    // Test neighborhood lookup
    testNeighborhoodLookup();
    
    // Test place processing
    testPlaceProcessing();
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
