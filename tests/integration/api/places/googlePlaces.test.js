import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { placeService } from '@/services/placeService';

// This is an integration test that will make real API calls
// Make sure to set up the required environment variables
// VITE_GOOGLE_PLACES_API_KEY - Your Google Maps API key with Places API enabled

describe('Google Places API Integration', () => {
  // Skip tests if API key is not available
  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
  const shouldRunTests = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY';
  
  const testFn = shouldRunTests ? it : it.skip;
  
  testFn('should search for places', async () => {
    // Test with a well-known restaurant in New York
    const query = 'Le Bernardin New York';
    const response = await placeService.searchPlaces(query);
    
    expect(response).toBeDefined();
    expect(Array.isArray(response.results)).toBe(true);
    expect(response.results.length).toBeGreaterThan(0);
    
    const place = response.results[0];
    expect(place).toHaveProperty('place_id');
    expect(place).toHaveProperty('description');
    expect(place.description.toLowerCase()).toContain('le bernardin');
  });
  
  testFn('should get place details', async () => {
    // Using Le Bernardin's place ID (as of knowledge cutoff)
    const placeId = 'ChIJV7QQ6kdZwokRax4615zpSGU'; // Updated place ID for Le Bernardin
    const response = await placeService.getPlaceDetails(placeId);
    
    expect(response).toBeDefined();
    expect(response.details).toBeDefined();
    expect(response.details.placeId).toBe(placeId);
    expect(response.details).toHaveProperty('name');
    expect(response.details).toHaveProperty('formattedAddress');
    expect(response.details).toHaveProperty('location');
  });
  
  testFn('should handle invalid place ID', async () => {
    const invalidPlaceId = 'invalid_place_id';
    await expect(placeService.getPlaceDetails(invalidPlaceId)).rejects.toThrow();
  });
});
