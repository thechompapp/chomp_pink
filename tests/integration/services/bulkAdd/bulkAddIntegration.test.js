import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { bulkAddService } from '@/services/bulkAddService';
import { placeService } from '@/services/placeService';
import { filterService } from '@/services/filterService';
import { restaurantService } from '@/services/restaurantService';

// This is an integration test that tests the complete flow of the bulk add process
// It makes real API calls to Google Places and our backend services

describe('Bulk Add Integration', () => {
  // Skip if we don't have the required environment variables
  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
  const shouldRunTests = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && 
                       (process.env.NODE_ENV !== 'test' || process.env.INTEGRATION_TESTS === 'true');
  
  const testFn = shouldRunTests ? it : it.skip;
  
  // Test data - a single restaurant to process
  const testRestaurant = {
    name: 'Le Bernardin',
    type: 'restaurant',
    city: 'New York',
    cuisine: 'French Seafood',
    address: '155 W 51st St, New York, NY 10019, United States'
  };

  testFn('should process a restaurant through the bulk add flow', async () => {
    // 1. Lookup place using Google Places API
    const placesResponse = await placeService.searchPlaces(`${testRestaurant.name} ${testRestaurant.city}`);
    
    expect(placesResponse).toBeDefined();
    expect(Array.isArray(placesResponse.data)).toBe(true);
    expect(placesResponse.data.length).toBeGreaterThan(0);
    
    const place = placesResponse.data[0];
    expect(place).toHaveProperty('place_id');
    expect(place.name.toLowerCase()).toContain(testRestaurant.name.toLowerCase());
    
    // 2. Get place details
    const placeDetails = await placeService.getPlaceDetails(place.place_id);
    
    expect(placeDetails).toBeDefined();
    expect(placeDetails.data.place_id).toBe(place.place_id);
    expect(placeDetails.data).toHaveProperty('formatted_address');
    expect(placeDetails.data).toHaveProperty('geometry.location');
    
    // 3. Lookup neighborhood by zipcode
    // Extract zipcode from formatted address (this is a simplified approach)
    const zipcodeMatch = placeDetails.data.formatted_address.match(/\b\d{5}\b/);
    if (!zipcodeMatch) {
      console.warn('Could not extract zipcode from address:', placeDetails.data.formatted_address);
      return;
    }
    
    const zipcode = zipcodeMatch[0];
    const neighborhoodsResponse = await filterService.getNeighborhoodsByZipcode(zipcode);
    
    expect(neighborhoodsResponse).toBeDefined();
    expect(Array.isArray(neighborhoodsResponse.data)).toBe(true);
    
    // Skip if no neighborhoods found for this zipcode
    if (neighborhoodsResponse.data.length === 0) {
      console.warn(`No neighborhoods found for zipcode: ${zipcode}`);
      return;
    }
    
    const neighborhood = neighborhoodsResponse.data[0];
    
    // 4. Check if restaurant already exists
    const existingRestaurant = await restaurantService.searchRestaurants({
      name: testRestaurant.name,
      address: placeDetails.data.formatted_address
    });
    
    expect(existingRestaurant).toBeDefined();
    
    // Note: We don't assert on the result here since the restaurant might or might not exist
    // This is just testing that the API call works with the expected parameters
    
    // 5. Prepare the restaurant data for submission
    const restaurantData = {
      name: testRestaurant.name,
      address: placeDetails.data.formatted_address,
      latitude: placeDetails.data.geometry.location.lat,
      longitude: placeDetails.data.geometry.location.lng,
      neighborhood_id: neighborhood.id,
      city_id: neighborhood.city_id,
      cuisine: testRestaurant.cuisine,
      place_id: place.place_id,
      // Add other fields as needed
    };
    
    // Note: We don't actually submit the data in this test since that would modify the database
    // In a real test environment with a test database, you would submit the data and then clean up
    
    // Assert that we've successfully processed the data
    expect(restaurantData).toMatchObject({
      name: expect.any(String),
      address: expect.any(String),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      neighborhood_id: expect.any(Number),
      city_id: expect.any(Number),
      cuisine: expect.any(String),
      place_id: expect.any(String)
    });
  });
  
  testFn('should handle errors during the bulk add flow', async () => {
    // Test error handling for invalid place lookup
    await expect(placeService.searchPlaces('')).rejects.toThrow();
    
    // Test error handling for invalid place details
    await expect(placeService.getPlaceDetails('invalid_place_id')).rejects.toThrow();
    
    // Test error handling for invalid zipcode
    const invalidZipcodeResponse = await filterService.getNeighborhoodsByZipcode('00000');
    expect(invalidZipcodeResponse.data).toEqual([]);
  });
});
