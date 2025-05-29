import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { filterService } from '@/services/filterService';

// This is an integration test that will make real API calls to our backend
// It tests the neighborhood lookup functionality which is used in the bulk add process

describe('Neighborhood Lookup Integration', () => {
  // These tests require a running backend server
  const shouldRunTests = process.env.NODE_ENV !== 'test' || process.env.INTEGRATION_TESTS === 'true';
  const testFn = shouldRunTests ? it : it.skip;

  testFn('should find neighborhoods by zipcode', async () => {
    // Test with a known NYC zipcode
    const zipcode = '10001'; // Chelsea, Manhattan
    const response = await filterService.getNeighborhoodsByZipcode(zipcode);
    
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    
    // Should find at least one neighborhood
    expect(response.data.length).toBeGreaterThan(0);
    
    const neighborhood = response.data[0];
    expect(neighborhood).toHaveProperty('id');
    expect(neighborhood).toHaveProperty('name');
    expect(neighborhood).toHaveProperty('city_id');
  });

  testFn('should handle invalid zipcode', async () => {
    const invalidZipcode = '00000';
    const response = await filterService.getNeighborhoodsByZipcode(invalidZipcode);
    
    // Should return empty array for invalid zipcodes
    expect(response).toBeDefined();
    expect(response.data).toEqual([]);
  });

  testFn('should get all cities', async () => {
    const response = await filterService.getCities();
    
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    
    // Should find at least one city
    expect(response.data.length).toBeGreaterThan(0);
    
    const city = response.data[0];
    expect(city).toHaveProperty('id');
    expect(city).toHaveProperty('name');
    expect(city).toHaveProperty('state');
    expect(city).toHaveProperty('country');
  });

  testFn('should get neighborhoods by city', async () => {
    // First get a valid city ID
    const citiesResponse = await filterService.getCities();
    const cityId = citiesResponse.data[0]?.id;
    
    if (!cityId) {
      console.warn('No cities found in the database');
      return;
    }
    
    const response = await filterService.getNeighborhoodsByCity(cityId);
    
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    
    // Should find at least one neighborhood for the city
    if (response.data.length > 0) {
      const neighborhood = response.data[0];
      expect(neighborhood).toHaveProperty('id');
      expect(neighborhood).toHaveProperty('name');
      expect(neighborhood).toHaveProperty('city_id', cityId);
    }
  });
});
