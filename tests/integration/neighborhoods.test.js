/**
 * Neighborhoods and Zip Codes Integration Tests
 * Tests for zip code lookups and neighborhood associations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  login,
  getNeighborhoodByZip,
  searchNeighborhoods,
  tokenStorage
} from '../setup/robust-api-client.js';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Test user credentials
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword',
  username: 'testuser'
};

describe('Neighborhoods and Zip Codes Integration Tests', () => {
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

  describe('Zip Code Lookup', () => {
    it('should find neighborhood by zip code', async () => {
      const zipCode = '10001'; // Manhattan, NY
      const response = await getNeighborhoodByZip(zipCode);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('zip_code', zipCode);
      expect(response.data).toHaveProperty('neighborhood');
      expect(response.data.neighborhood).toHaveProperty('name');
      expect(response.data.neighborhood).toHaveProperty('city');
      expect(response.data.neighborhood).toHaveProperty('state');
    }, TEST_TIMEOUT);

    it('should handle invalid zip code', async () => {
      const invalidZip = '00000';
      const response = await getNeighborhoodByZip(invalidZip);
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    }, TEST_TIMEOUT);

    it('should handle zip codes with leading zeros', async () => {
      const zipCode = '02108'; // Boston, MA
      const response = await getNeighborhoodByZip(zipCode);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('zip_code', zipCode);
      expect(response.data.neighborhood).toHaveProperty('name');
    }, TEST_TIMEOUT);
  });

  describe('Neighborhood Search', () => {
    it('should find neighborhoods by name', async () => {
      const query = 'Williamsburg';
      const response = await searchNeighborhoods({ query });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      const neighborhood = response.data[0];
      expect(neighborhood).toHaveProperty('id');
      expect(neighborhood).toHaveProperty('name');
      expect(neighborhood.name.toLowerCase()).toContain(query.toLowerCase());
    }, TEST_TIMEOUT);

    it('should filter neighborhoods by city and state', async () => {
      const query = 'Downtown';
      const city = 'San Francisco';
      const state = 'CA';
      
      const response = await searchNeighborhoods({ 
        query, 
        city, 
        state 
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const neighborhood = response.data[0];
        expect(neighborhood.city).toBe(city);
        expect(neighborhood.state).toBe(state);
      }
    }, TEST_TIMEOUT);
  });

  describe('Neighborhood Boundary Validation', () => {
    it('should validate coordinates within neighborhood boundaries', async () => {
      // Coordinates for a point in Manhattan, NY
      const lat = 40.7484;
      const lng = -73.9857;
      
      const response = await searchNeighborhoods({
        lat,
        lng,
        include_boundary: true
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Check if the point is within the boundary of any neighborhood
      const inBoundary = response.data.some(neighborhood => {
        return neighborhood.boundary && 
               isPointInPolygon([lng, lat], neighborhood.boundary.coordinates[0]);
      });
      
      expect(inBoundary).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Zip Code to Multiple Neighborhoods', () => {
    it('should handle zip codes that span multiple neighborhoods', async () => {
      // Some zip codes cover multiple neighborhoods
      const zipCode = '10003'; // Covers parts of East Village and Greenwich Village
      const response = await getNeighborhoodByZip(zipCode);
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data.neighborhoods)).toBe(true);
      expect(response.data.neighborhoods.length).toBeGreaterThan(1);
      
      const neighborhoodNames = response.data.neighborhoods.map(n => n.name);
      expect(neighborhoodNames).toContain('East Village');
      expect(neighborhoodNames).toContain('Greenwich Village');
    }, TEST_TIMEOUT);
  });

  describe('Neighborhood Metadata', () => {
    it('should return neighborhood metadata', async () => {
      const neighborhoodId = 'manhattan-downtown';
      const response = await getNeighborhoodDetails(neighborhoodId);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('id', neighborhoodId);
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('description');
      expect(response.data).toHaveProperty('population');
      expect(response.data).toHaveProperty('median_income');
      expect(response.data).toHaveProperty('average_rent');
    }, TEST_TIMEOUT);
  });
}, TEST_TIMEOUT * 2);

// Helper function to check if a point is inside a polygon
function isPointInPolygon(point, vs) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
  
  const x = point[0], y = point[1];
  let inside = false;
  
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}
