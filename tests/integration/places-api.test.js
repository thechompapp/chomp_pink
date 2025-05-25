/**
 * Google Places API Integration Tests
 * Tests for place search, autocomplete, and details functionality
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { 
  login, 
  searchPlaces,
  getPlaceDetails,
  tokenStorage
} from '../setup/robust-api-client.js';

// Test timeout (15 seconds for API calls)
const TEST_TIMEOUT = 15000;

// Test user credentials
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword',
  username: 'testuser'
};

describe('Google Places API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Log in before running tests
    const loginResponse = await login(TEST_CREDENTIALS);
    expect(loginResponse.success).toBe(true, `Login failed: ${loginResponse.error || 'Unknown error'}`);
    authToken = loginResponse.data?.token;
    expect(authToken).toBeTruthy('No auth token received');
  }, TEST_TIMEOUT);

  afterAll(() => {
    // Clear the auth token
    tokenStorage.clearToken();
  });

  describe('Place Search', () => {
    it('should find places by search query', async () => {
      const query = 'Starbucks';
      const location = { lat: 40.7128, lng: -74.0060 }; // New York
      const radius = 5000; // 5km
      
      const response = await searchPlaces({ query, location, radius });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      const place = response.data[0];
      expect(place).toHaveProperty('place_id');
      expect(place).toHaveProperty('name');
      expect(place).toHaveProperty('vicinity');
      expect(place).toHaveProperty('geometry.location');
    }, TEST_TIMEOUT);

    it('should handle empty search results', async () => {
      const query = 'asdfghjkl12345';
      const location = { lat: 0, lng: 0 }; // Middle of nowhere
      const radius = 1000;
      
      const response = await searchPlaces({ query, location, radius });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    }, TEST_TIMEOUT);
  });

  describe('Place Details', () => {
    let testPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4'; // Google Sydney

    it('should retrieve place details by place ID', async () => {
      const response = await getPlaceDetails(testPlaceId);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('result.place_id', testPlaceId);
      expect(response.data.result).toHaveProperty('name');
      expect(response.data.result).toHaveProperty('formatted_address');
      expect(response.data.result).toHaveProperty('geometry.location');
    }, TEST_TIMEOUT);

    it('should handle invalid place ID', async () => {
      const invalidPlaceId = 'INVALID_PLACE_ID';
      const response = await getPlaceDetails(invalidPlaceId);
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    }, TEST_TIMEOUT);
  });

  describe('Place Autocomplete', () => {
    it('should return autocomplete predictions', async () => {
      const input = 'Starbucks';
      const location = { lat: 40.7128, lng: -74.0060 }; // New York
      const radius = 5000; // 5km
      
      const response = await searchPlaces({ 
        input, 
        location, 
        radius,
        types: 'establishment',
        strictbounds: true
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data.predictions)).toBe(true);
      expect(response.data.predictions.length).toBeGreaterThan(0);
      
      const prediction = response.data.predictions[0];
      expect(prediction).toHaveProperty('description');
      expect(prediction).toHaveProperty('place_id');
    }, TEST_TIMEOUT);
  });

  describe('Nearby Search', () => {
    it('should find places near a location', async () => {
      const location = '40.7128,-74.0060'; // New York
      const radius = 1000; // 1km
      const type = 'restaurant';
      
      const response = await searchPlaces({
        location,
        radius,
        type
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      const place = response.data[0];
      expect(place).toHaveProperty('place_id');
      expect(place).toHaveProperty('name');
      expect(place).toHaveProperty('vicinity');
      expect(place).toHaveProperty('geometry.location');
    }, TEST_TIMEOUT);
  });

  describe('Text Search', () => {
    it('should find places by text query', async () => {
      const query = 'restaurants in New York';
      const location = '40.7128,-74.0060'; // New York
      const radius = 10000; // 10km
      
      const response = await searchPlaces({
        query,
        location,
        radius,
        type: 'restaurant'
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      const place = response.data[0];
      expect(place).toHaveProperty('place_id');
      expect(place).toHaveProperty('name');
      expect(place).toHaveProperty('vicinity');
    }, TEST_TIMEOUT);
  });
}, TEST_TIMEOUT * 2); // Give the whole suite more time
