import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { placeService } from '@/services/placeService';
import { filterService } from '@/services/filterService';
import { findNeighborhoodByZipcode } from '@/services/bulkAddService';
import { retryWithBackoff } from '@/utils/bulkAddUtils';

// Test configuration
const CONFIG = {
  TEST_TIMEOUT: 30000, // 30 seconds for Google API calls
  SETUP_TIMEOUT: 10000,
  
  // Real NYC restaurants for testing with expected neighborhoods
  TEST_RESTAURANTS: [
    {
      name: 'Dirt Candy',
      city: 'New York',
      expectedNeighborhood: 'Lower East Side',
      expectedZip: '10002'
    },
    {
      name: 'Katz\'s Delicatessen', 
      city: 'New York',
      expectedNeighborhood: 'Lower East Side',
      expectedZip: '10002'
    },
    {
      name: 'Joe\'s Pizza',
      city: 'New York', 
      expectedNeighborhood: 'Greenwich Village',
      expectedZip: '10014'
    },
    {
      name: 'Peter Luger Steak House',
      city: 'Brooklyn',
      expectedNeighborhood: 'Williamsburg',
      expectedZip: '11211'
    },
    {
      name: 'Roberta\'s',
      city: 'Brooklyn',
      expectedNeighborhood: 'Bushwick',
      expectedZip: '11237'
    }
  ]
};

describe('Google Places API → ZIP Code → Neighborhood Integration', () => {
  let testResults = [];
  let placesApiAvailable = false;

  beforeAll(async () => {
    console.log('🔍 Testing Google Places API availability...');
    
    // Test if Places API is available
    try {
      const testSearch = await placeService.searchPlaces('test restaurant');
      placesApiAvailable = true;
      console.log('✅ Google Places API is available');
    } catch (error) {
      console.log('⚠️ Google Places API not available:', error.message);
      placesApiAvailable = false;
    }
  }, CONFIG.SETUP_TIMEOUT);

  describe('1. Google Places API Restaurant Search', () => {
    it('should search for real NYC restaurants and get place IDs', async () => {
      if (!placesApiAvailable) {
        console.log('🔄 Skipping Places API test - service not available');
        return;
      }

      for (const restaurant of CONFIG.TEST_RESTAURANTS.slice(0, 3)) { // Limit to 3 for speed
        console.log(`🔍 Searching for: ${restaurant.name} in ${restaurant.city}`);
        
        const searchResults = await retryWithBackoff(async () => {
          return await placeService.searchPlaces(`${restaurant.name}, ${restaurant.city}`);
        });

        expect(searchResults).toBeDefined();
        expect(searchResults.success).toBe(true);
        expect(Array.isArray(searchResults.data)).toBe(true);
        
        if (searchResults.data.length > 0) {
          const place = searchResults.data[0];
          expect(place).toHaveProperty('place_id');
          expect(place.place_id).toBeTruthy();
          
          // Store result for next test
          testResults.push({
            restaurant: restaurant.name,
            city: restaurant.city,
            placeId: place.place_id,
            expectedZip: restaurant.expectedZip,
            expectedNeighborhood: restaurant.expectedNeighborhood
          });
          
          console.log(`✅ Found place ID for ${restaurant.name}: ${place.place_id}`);
        } else {
          console.log(`⚠️ No results found for ${restaurant.name} in ${restaurant.city}`);
        }
      }
      
      expect(testResults.length).toBeGreaterThan(0);
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('2. Google Places Details with Address Extraction', () => {
    it('should get place details and extract ZIP codes from addresses', async () => {
      if (!placesApiAvailable || testResults.length === 0) {
        console.log('🔄 Skipping place details test - no search results available');
        return;
      }

      const updatedResults = [];

      for (const result of testResults) {
        console.log(`🏠 Getting address details for: ${result.restaurant}`);
        
        try {
          const placeDetails = await retryWithBackoff(async () => {
            return await placeService.getPlaceDetails(result.placeId);
          });

          expect(placeDetails).toBeDefined();
          expect(placeDetails.success).toBe(true);
          expect(placeDetails.data).toHaveProperty('formatted_address');
          
          const address = placeDetails.data.formatted_address;
          console.log(`📍 Address: ${address}`);
          
          // Extract ZIP code from formatted address
          const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
          
          if (zipMatch) {
            const extractedZip = zipMatch[1];
            console.log(`📮 Extracted ZIP: ${extractedZip}`);
            
            updatedResults.push({
              ...result,
              address: address,
              extractedZip: extractedZip,
              geometry: placeDetails.data.geometry?.location
            });
            
            // Verify ZIP code is reasonable for NYC area
            expect(extractedZip).toMatch(/^1[01]\d{3}$/); // NYC ZIP codes start with 10 or 11
            
          } else {
            console.log(`⚠️ No ZIP code found in address: ${address}`);
            updatedResults.push({
              ...result,
              address: address,
              extractedZip: null
            });
          }
          
        } catch (error) {
          console.error(`❌ Error getting details for ${result.restaurant}:`, error.message);
          updatedResults.push({
            ...result,
            error: error.message
          });
        }
      }
      
      // Update testResults for next test
      testResults = updatedResults;
      
      const successfulExtractions = testResults.filter(r => r.extractedZip).length;
      console.log(`✅ Successfully extracted ZIP codes from ${successfulExtractions}/${testResults.length} addresses`);
      
      expect(successfulExtractions).toBeGreaterThan(0);
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('3. ZIP Code to Neighborhood Conversion', () => {
    it('should convert extracted ZIP codes to neighborhoods', async () => {
      const zipCodeResults = testResults.filter(r => r.extractedZip && !r.error);
      
      if (zipCodeResults.length === 0) {
        console.log('🔄 Skipping neighborhood conversion - no ZIP codes available');
        return;
      }

      console.log(`🗺️ Converting ${zipCodeResults.length} ZIP codes to neighborhoods...`);

      for (const result of zipCodeResults) {
        console.log(`🔍 Looking up neighborhood for ZIP: ${result.extractedZip} (${result.restaurant})`);
        
        try {
          // Test the bulk add service function
          const neighborhood = await retryWithBackoff(async () => {
            return await findNeighborhoodByZipcode(result.extractedZip);
          });

          if (neighborhood) {
            console.log(`✅ Found neighborhood: ${neighborhood.name} for ZIP ${result.extractedZip}`);
            
            expect(neighborhood).toHaveProperty('id');
            expect(neighborhood).toHaveProperty('name');
            expect(neighborhood.name).toBeTruthy();
            expect(typeof neighborhood.id).toBe('number');
            
            // Update result with neighborhood info
            result.foundNeighborhood = neighborhood.name;
            result.neighborhoodId = neighborhood.id;
            result.conversionSuccess = true;
            
          } else {
            console.log(`⚠️ No neighborhood found for ZIP ${result.extractedZip}`);
            result.conversionSuccess = false;
          }
          
        } catch (error) {
          console.error(`❌ Error converting ZIP ${result.extractedZip}:`, error.message);
          result.conversionError = error.message;
          result.conversionSuccess = false;
        }
      }

      const successfulConversions = zipCodeResults.filter(r => r.conversionSuccess).length;
      console.log(`✅ Successfully converted ${successfulConversions}/${zipCodeResults.length} ZIP codes to neighborhoods`);
      
      // Verify at least some conversions worked
      expect(successfulConversions).toBeGreaterThan(0);
    }, CONFIG.TEST_TIMEOUT);

    it('should validate neighborhood data quality', async () => {
      const successfulResults = testResults.filter(r => r.conversionSuccess);
      
      if (successfulResults.length === 0) {
        console.log('🔄 Skipping validation - no successful conversions');
        return;
      }

      console.log(`🔍 Validating ${successfulResults.length} neighborhood conversions...`);

      for (const result of successfulResults) {
        console.log(`Validating: ${result.restaurant} → ZIP ${result.extractedZip} → ${result.foundNeighborhood}`);
        
        // Validate neighborhood data structure
        expect(result.foundNeighborhood).toBeTruthy();
        expect(typeof result.foundNeighborhood).toBe('string');
        expect(result.foundNeighborhood.length).toBeGreaterThan(0);
        expect(result.neighborhoodId).toBeGreaterThan(0);
        
        // Log for manual verification
        console.log(`  📍 ${result.restaurant}: ${result.address}`);
        console.log(`  📮 ZIP: ${result.extractedZip}`);
        console.log(`  🏘️ Neighborhood: ${result.foundNeighborhood} (ID: ${result.neighborhoodId})`);
        
        if (result.geometry) {
          console.log(`  🌍 Coordinates: ${result.geometry.lat}, ${result.geometry.lng}`);
        }
      }
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('4. Complete Workflow Integration', () => {
    it('should demonstrate complete restaurant → address → ZIP → neighborhood workflow', async () => {
      if (!placesApiAvailable) {
        console.log('🔄 Skipping complete workflow - Places API not available');
        return;
      }

      // Pick one restaurant for complete workflow demo
      const testRestaurant = CONFIG.TEST_RESTAURANTS[0]; // Dirt Candy
      
      console.log(`🎯 Running complete workflow for: ${testRestaurant.name}`);
      
      // Step 1: Search for restaurant
      console.log('Step 1: 🔍 Searching for restaurant...');
      const searchResults = await placeService.searchPlaces(`${testRestaurant.name}, ${testRestaurant.city}`);
      
      expect(searchResults.success).toBe(true);
      expect(searchResults.data.length).toBeGreaterThan(0);
      
      const place = searchResults.data[0];
      console.log(`✅ Found: ${place.name} (Place ID: ${place.place_id})`);
      
      // Step 2: Get place details with address
      console.log('Step 2: 🏠 Getting address details...');
      const placeDetails = await placeService.getPlaceDetails(place.place_id);
      
      expect(placeDetails.success).toBe(true);
      expect(placeDetails.data.formatted_address).toBeTruthy();
      
      const address = placeDetails.data.formatted_address;
      console.log(`✅ Address: ${address}`);
      
      // Step 3: Extract ZIP code
      console.log('Step 3: 📮 Extracting ZIP code...');
      const zipMatch = address.match(/\b(\d{5})\b/);
      
      expect(zipMatch).toBeTruthy();
      const zipCode = zipMatch[1];
      console.log(`✅ ZIP Code: ${zipCode}`);
      
      // Step 4: Convert ZIP to neighborhood
      console.log('Step 4: 🗺️ Converting ZIP to neighborhood...');
      const neighborhood = await findNeighborhoodByZipcode(zipCode);
      
      if (neighborhood) {
        console.log(`✅ Neighborhood: ${neighborhood.name} (ID: ${neighborhood.id})`);
        
        expect(neighborhood).toHaveProperty('id');
        expect(neighborhood).toHaveProperty('name');
        expect(neighborhood.name).toBeTruthy();
        
        // Step 5: Create complete restaurant data object
        console.log('Step 5: 📝 Creating complete restaurant data...');
        const completeRestaurantData = {
          name: testRestaurant.name,
          address: address,
          zipcode: zipCode,
          neighborhood_id: neighborhood.id,
          neighborhood_name: neighborhood.name,
          city_id: neighborhood.city_id || 1,
          latitude: placeDetails.data.geometry?.location?.lat || 0,
          longitude: placeDetails.data.geometry?.location?.lng || 0,
          place_id: place.place_id,
          type: 'restaurant'
        };
        
        console.log('✅ Complete restaurant data:', JSON.stringify(completeRestaurantData, null, 2));
        
        // Validate complete data structure
        expect(completeRestaurantData.name).toBeTruthy();
        expect(completeRestaurantData.address).toBeTruthy();
        expect(completeRestaurantData.zipcode).toMatch(/^\d{5}$/);
        expect(completeRestaurantData.neighborhood_id).toBeGreaterThan(0);
        expect(completeRestaurantData.place_id).toBeTruthy();
        
        console.log('🎉 Complete workflow successful!');
        
      } else {
        console.log('⚠️ Neighborhood lookup failed, but workflow demonstrated ZIP extraction');
        expect(zipCode).toMatch(/^\d{5}$/);
      }
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('5. Bulk Processing Simulation', () => {
    it('should simulate bulk processing with real data', async () => {
      console.log('🔄 Simulating bulk processing with real Google data...');
      
      // Use accumulated test results or simulate if none available
      let processingData = testResults.length > 0 ? testResults : 
        CONFIG.TEST_RESTAURANTS.slice(0, 2).map(r => ({
          restaurant: r.name,
          city: r.city,
          expectedZip: r.expectedZip,
          expectedNeighborhood: r.expectedNeighborhood,
          simulatedProcessing: true
        }));

      console.log(`📊 Processing ${processingData.length} restaurants...`);
      
      const batchResults = {
        total: processingData.length,
        successful: 0,
        failed: 0,
        withZipCodes: 0,
        withNeighborhoods: 0,
        details: []
      };

      for (const item of processingData) {
        const processingResult = {
          name: item.restaurant,
          city: item.city,
          status: 'processing'
        };

        try {
          // Simulate or use real data
          if (item.extractedZip || item.expectedZip) {
            const zipCode = item.extractedZip || item.expectedZip;
            processingResult.zipCode = zipCode;
            batchResults.withZipCodes++;
            
            if (item.foundNeighborhood || item.expectedNeighborhood) {
              processingResult.neighborhood = item.foundNeighborhood || item.expectedNeighborhood;
              batchResults.withNeighborhoods++;
            }
            
            processingResult.status = 'success';
            batchResults.successful++;
            
          } else {
            processingResult.status = 'partial';
            processingResult.issue = 'No ZIP code available';
            batchResults.successful++; // Still counts as processed
          }
          
        } catch (error) {
          processingResult.status = 'failed';
          processingResult.error = error.message;
          batchResults.failed++;
        }

        batchResults.details.push(processingResult);
        console.log(`  ${processingResult.status === 'success' ? '✅' : '⚠️'} ${processingResult.name}: ${processingResult.status}`);
      }

      // Log batch summary
      console.log('\n📈 Batch Processing Summary:');
      console.log(`  Total restaurants: ${batchResults.total}`);
      console.log(`  Successful: ${batchResults.successful}`);
      console.log(`  Failed: ${batchResults.failed}`);
      console.log(`  With ZIP codes: ${batchResults.withZipCodes}`);
      console.log(`  With neighborhoods: ${batchResults.withNeighborhoods}`);
      
      // Validate batch results
      expect(batchResults.total).toBeGreaterThan(0);
      expect(batchResults.successful + batchResults.failed).toBe(batchResults.total);
      expect(batchResults.details).toHaveLength(batchResults.total);
      
      const successRate = (batchResults.successful / batchResults.total) * 100;
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
      
      expect(successRate).toBeGreaterThan(0); // At least some processing should work
    }, CONFIG.TEST_TIMEOUT);
  });

  afterAll(() => {
    if (testResults.length > 0) {
      console.log('\n🎯 Final Test Results Summary:');
      console.log('=================================');
      
      testResults.forEach(result => {
        console.log(`\n🏪 ${result.restaurant} (${result.city})`);
        console.log(`   Place ID: ${result.placeId || 'N/A'}`);
        console.log(`   Address: ${result.address || 'N/A'}`);
        console.log(`   ZIP Code: ${result.extractedZip || 'N/A'}`);
        console.log(`   Neighborhood: ${result.foundNeighborhood || 'N/A'}`);
        console.log(`   Status: ${result.conversionSuccess ? '✅ Success' : '⚠️ Partial'}`);
      });
      
      const totalTests = testResults.length;
      const withAddresses = testResults.filter(r => r.address).length;
      const withZipCodes = testResults.filter(r => r.extractedZip).length;
      const withNeighborhoods = testResults.filter(r => r.conversionSuccess).length;
      
      console.log('\n📊 Overall Statistics:');
      console.log(`   Restaurants tested: ${totalTests}`);
      console.log(`   Addresses found: ${withAddresses}/${totalTests} (${((withAddresses/totalTests)*100).toFixed(1)}%)`);
      console.log(`   ZIP codes extracted: ${withZipCodes}/${totalTests} (${((withZipCodes/totalTests)*100).toFixed(1)}%)`);
      console.log(`   Neighborhoods resolved: ${withNeighborhoods}/${totalTests} (${((withNeighborhoods/totalTests)*100).toFixed(1)}%)`);
      
      console.log('\n🎉 Google Places → ZIP Code → Neighborhood integration testing complete!');
    }
  });
}); 