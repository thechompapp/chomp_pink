/**
 * Locations E2E Tests
 * 
 * Tests location-related functionality including cities, neighborhoods,
 * and location-based filtering.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Locations', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for location tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for location tests');
    }
  }, TEST_TIMEOUT);
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    
    // Close database connections
    await closeDbConnections();
    
    // Clear auth token
    clearAuthToken();
  }, TEST_TIMEOUT);
  
  // City tests
  describe('Cities', () => {
    it('should retrieve all cities', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/cities'),
        'Get all cities'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve a specific city by ID', async () => {
      const cityId = 1; // First city from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/cities/${cityId}`),
        'Get city by ID'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('id', cityId);
    });
    
    it('should fail to retrieve a non-existent city', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.get(`/cities/${nonExistentId}`),
        'Get non-existent city'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
  
  // Neighborhood tests
  describe('Neighborhoods', () => {
    it('should retrieve all neighborhoods', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/neighborhoods'),
        'Get all neighborhoods'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve neighborhoods by city', async () => {
      const cityId = 1; // First city from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/neighborhoods?city_id=${cityId}`),
        'Get neighborhoods by city'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All neighborhoods should be in the specified city
      if (result.data.length > 0) {
        result.data.forEach(neighborhood => {
          expect(neighborhood.city_id).toBe(cityId);
        });
      }
    });
    
    it('should retrieve a specific neighborhood by ID', async () => {
      const neighborhoodId = 1; // First neighborhood from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/neighborhoods/${neighborhoodId}`),
        'Get neighborhood by ID'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('id', neighborhoodId);
    });
    
    it('should fail to retrieve a non-existent neighborhood', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.get(`/neighborhoods/${nonExistentId}`),
        'Get non-existent neighborhood'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
  
  // Location-based filtering tests
  describe('Location-Based Filtering', () => {
    it('should filter restaurants by city', async () => {
      const cityId = 1; // First city from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants?city_id=${cityId}`),
        'Filter restaurants by city'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All restaurants should be in the specified city
      if (result.data.length > 0) {
        result.data.forEach(restaurant => {
          expect(restaurant.city_id).toBe(cityId);
        });
      }
    });
    
    it('should filter restaurants by neighborhood', async () => {
      const neighborhoodId = 1; // First neighborhood from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants?neighborhood_id=${neighborhoodId}`),
        'Filter restaurants by neighborhood'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All restaurants should be in the specified neighborhood
      if (result.data.length > 0) {
        result.data.forEach(restaurant => {
          expect(restaurant.neighborhood_id).toBe(neighborhoodId);
        });
      }
    });
    
    it('should filter restaurants by city and neighborhood', async () => {
      const cityId = 1; // First city from seed data
      const neighborhoodId = 1; // First neighborhood from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants?city_id=${cityId}&neighborhood_id=${neighborhoodId}`),
        'Filter restaurants by city and neighborhood'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All restaurants should be in the specified city and neighborhood
      if (result.data.length > 0) {
        result.data.forEach(restaurant => {
          expect(restaurant.city_id).toBe(cityId);
          expect(restaurant.neighborhood_id).toBe(neighborhoodId);
        });
      }
    });
  });
  
  // Admin location management tests
  describe('Admin Location Management', () => {
    beforeEach(async () => {
      // Login as admin for these tests
      clearAuthToken();
      
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for location management tests'
      );
      
      if (loginResult.success) {
        setAuthToken(loginResult.data.token);
      } else {
        throw new Error('Failed to login as admin for location management tests');
      }
    });
    
    it('should allow admin to create a new city', async () => {
      const newCity = {
        name: 'Test City',
        state: 'TS',
        country: 'USA'
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/admin/cities', newCity),
        'Create new city'
      );
      
      expect(result.success).toBe(true);
      expect([200, 201]).toContain(result.status);
      expect(result.data).toHaveProperty('name', newCity.name);
    });
    
    it('should allow admin to create a new neighborhood', async () => {
      const newNeighborhood = {
        name: 'Test Neighborhood',
        city_id: 1 // First city from seed data
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/admin/neighborhoods', newNeighborhood),
        'Create new neighborhood'
      );
      
      expect(result.success).toBe(true);
      expect([200, 201]).toContain(result.status);
      expect(result.data).toHaveProperty('name', newNeighborhood.name);
    });
    
    it('should allow admin to update a city', async () => {
      // First get all cities to find one to update
      const citiesResult = await handleApiRequest(
        () => apiClient.get('/admin/cities'),
        'Get all cities for admin'
      );
      
      expect(citiesResult.success).toBe(true);
      expect(citiesResult.status).toBe(200);
      expect(Array.isArray(citiesResult.data)).toBe(true);
      
      // Skip if no cities available
      if (citiesResult.data.length === 0) {
        console.warn('Skipping test: No cities available to update');
        return;
      }
      
      // Update the first city
      const cityId = citiesResult.data[0].id;
      const updatedData = {
        name: 'Updated City Name'
      };
      
      const result = await handleApiRequest(
        () => apiClient.put(`/admin/cities/${cityId}`, updatedData),
        'Update city'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('name', updatedData.name);
    });
    
    it('should allow admin to update a neighborhood', async () => {
      // First get all neighborhoods to find one to update
      const neighborhoodsResult = await handleApiRequest(
        () => apiClient.get('/admin/neighborhoods'),
        'Get all neighborhoods for admin'
      );
      
      expect(neighborhoodsResult.success).toBe(true);
      expect(neighborhoodsResult.status).toBe(200);
      expect(Array.isArray(neighborhoodsResult.data)).toBe(true);
      
      // Skip if no neighborhoods available
      if (neighborhoodsResult.data.length === 0) {
        console.warn('Skipping test: No neighborhoods available to update');
        return;
      }
      
      // Update the first neighborhood
      const neighborhoodId = neighborhoodsResult.data[0].id;
      const updatedData = {
        name: 'Updated Neighborhood Name'
      };
      
      const result = await handleApiRequest(
        () => apiClient.put(`/admin/neighborhoods/${neighborhoodId}`, updatedData),
        'Update neighborhood'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('name', updatedData.name);
    });
  });
});
