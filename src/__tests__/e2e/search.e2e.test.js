/**
 * Search E2E Tests
 * 
 * Tests search functionality including searching for restaurants, dishes, and lists
 * with various filters and parameters.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Search', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for search tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for search tests');
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
  
  // Basic search tests
  describe('Basic Search', () => {
    it('should search for restaurants with a query string', async () => {
      const query = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant`),
        'Search restaurants'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('restaurants');
      expect(Array.isArray(result.data.restaurants)).toBe(true);
    });
    
    it('should search for dishes with a query string', async () => {
      const query = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=dish`),
        'Search dishes'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('dishes');
      expect(Array.isArray(result.data.dishes)).toBe(true);
    });
    
    it('should search for lists with a query string', async () => {
      const query = 'favorite';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=list`),
        'Search lists'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('lists');
      expect(Array.isArray(result.data.lists)).toBe(true);
    });
    
    it('should search across all types with a query string', async () => {
      const query = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=all`),
        'Search all types'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('restaurants');
      expect(result.data).toHaveProperty('dishes');
      expect(result.data).toHaveProperty('lists');
      expect(Array.isArray(result.data.restaurants)).toBe(true);
      expect(Array.isArray(result.data.dishes)).toBe(true);
      expect(Array.isArray(result.data.lists)).toBe(true);
    });
  });
  
  // Filtered search tests
  describe('Filtered Search', () => {
    it('should search for restaurants with city filter', async () => {
      const query = '';
      const cityId = 1; // New York from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant&city_id=${cityId}`),
        'Search restaurants by city'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('restaurants');
      expect(Array.isArray(result.data.restaurants)).toBe(true);
      
      // All restaurants should be in the specified city
      if (result.data.restaurants.length > 0) {
        result.data.restaurants.forEach(restaurant => {
          expect(restaurant.city_id).toBe(cityId);
        });
      }
    });
    
    it('should search for restaurants with neighborhood filter', async () => {
      const query = '';
      const neighborhoodId = 1; // Manhattan from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant&neighborhood_id=${neighborhoodId}`),
        'Search restaurants by neighborhood'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('restaurants');
      expect(Array.isArray(result.data.restaurants)).toBe(true);
      
      // All restaurants should be in the specified neighborhood
      if (result.data.restaurants.length > 0) {
        result.data.restaurants.forEach(restaurant => {
          expect(restaurant.neighborhood_id).toBe(neighborhoodId);
        });
      }
    });
    
    it('should search for dishes with cuisine filter', async () => {
      const query = '';
      const cuisine = 'Italian';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=dish&cuisine=${cuisine}`),
        'Search dishes by cuisine'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('dishes');
      expect(Array.isArray(result.data.dishes)).toBe(true);
    });
    
    it('should search for lists with list_type filter', async () => {
      const query = '';
      const listType = 'restaurant';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=list&list_type=${listType}`),
        'Search lists by type'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('lists');
      expect(Array.isArray(result.data.lists)).toBe(true);
      
      // All lists should be of the specified type
      if (result.data.lists.length > 0) {
        result.data.lists.forEach(list => {
          expect(list.list_type).toBe(listType);
        });
      }
    });
  });
  
  // Pagination tests
  describe('Pagination', () => {
    it('should paginate search results', async () => {
      const query = '';
      const limit = 2;
      const offset = 0;
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant&limit=${limit}&offset=${offset}`),
        'Search with pagination'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('restaurants');
      expect(Array.isArray(result.data.restaurants)).toBe(true);
      
      // Should respect the limit parameter
      expect(result.data.restaurants.length).toBeLessThanOrEqual(limit);
      
      // Get the next page
      const nextOffset = offset + limit;
      const nextResult = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant&limit=${limit}&offset=${nextOffset}`),
        'Search next page'
      );
      
      expect(nextResult.success).toBe(true);
      expect(nextResult.status).toBe(200);
      expect(nextResult.data).toHaveProperty('restaurants');
      expect(Array.isArray(nextResult.data.restaurants)).toBe(true);
      
      // Should have different results on different pages
      if (result.data.restaurants.length > 0 && nextResult.data.restaurants.length > 0) {
        const firstPageIds = result.data.restaurants.map(r => r.id);
        const secondPageIds = nextResult.data.restaurants.map(r => r.id);
        
        // No IDs should be in both pages
        const intersection = firstPageIds.filter(id => secondPageIds.includes(id));
        expect(intersection.length).toBe(0);
      }
    });
  });
  
  // Hashtag search tests
  describe('Hashtag Search', () => {
    it('should search with hashtag filter', async () => {
      const query = '';
      const hashtags = ['pizza'];
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant&hashtags=${hashtags.join(',')}`),
        'Search with hashtags'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('restaurants');
      expect(Array.isArray(result.data.restaurants)).toBe(true);
    });
  });
  
  // Error handling tests
  describe('Error Handling', () => {
    it('should handle invalid search type', async () => {
      const query = 'pizza';
      const invalidType = 'invalid_type';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=${invalidType}`),
        'Search with invalid type'
      );
      
      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });
    
    it('should handle invalid pagination parameters', async () => {
      const query = 'pizza';
      const invalidLimit = -1;
      
      const result = await handleApiRequest(
        () => apiClient.get(`/search?q=${query}&type=restaurant&limit=${invalidLimit}`),
        'Search with invalid limit'
      );
      
      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });
  });
});
