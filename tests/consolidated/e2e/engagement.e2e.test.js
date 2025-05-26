/**
 * Engagement E2E Tests
 * 
 * Tests engagement-related functionality including likes, favorites,
 * and user interactions with restaurants, dishes, and lists.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Engagement', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for engagement tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for engagement tests');
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
  
  // Restaurant engagement tests
  describe('Restaurant Engagement', () => {
    let restaurantId;
    
    beforeEach(async () => {
      // Get a restaurant ID to use for tests
      const restaurantsResult = await handleApiRequest(
        () => apiClient.get('/restaurants?limit=1'),
        'Get restaurant for engagement tests'
      );
      
      expect(restaurantsResult.success).toBe(true);
      expect(restaurantsResult.data.length).toBeGreaterThan(0);
      
      restaurantId = restaurantsResult.data[0].id;
    });
    
    it('should like a restaurant', async () => {
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/like/restaurant/${restaurantId}`),
        'Like restaurant'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('liked', true);
    });
    
    it('should unlike a restaurant', async () => {
      // First like the restaurant
      await handleApiRequest(
        () => apiClient.post(`/engagement/like/restaurant/${restaurantId}`),
        'Like restaurant before unlike test'
      );
      
      // Then unlike it
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/unlike/restaurant/${restaurantId}`),
        'Unlike restaurant'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('liked', false);
    });
    
    it('should favorite a restaurant', async () => {
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/favorite/restaurant/${restaurantId}`),
        'Favorite restaurant'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('favorited', true);
    });
    
    it('should unfavorite a restaurant', async () => {
      // First favorite the restaurant
      await handleApiRequest(
        () => apiClient.post(`/engagement/favorite/restaurant/${restaurantId}`),
        'Favorite restaurant before unfavorite test'
      );
      
      // Then unfavorite it
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/unfavorite/restaurant/${restaurantId}`),
        'Unfavorite restaurant'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('favorited', false);
    });
  });
  
  // Dish engagement tests
  describe('Dish Engagement', () => {
    let dishId;
    
    beforeEach(async () => {
      // Get a dish ID to use for tests
      const dishesResult = await handleApiRequest(
        () => apiClient.get('/dishes?limit=1'),
        'Get dish for engagement tests'
      );
      
      expect(dishesResult.success).toBe(true);
      expect(dishesResult.data.length).toBeGreaterThan(0);
      
      dishId = dishesResult.data[0].id;
    });
    
    it('should like a dish', async () => {
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/like/dish/${dishId}`),
        'Like dish'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('liked', true);
    });
    
    it('should unlike a dish', async () => {
      // First like the dish
      await handleApiRequest(
        () => apiClient.post(`/engagement/like/dish/${dishId}`),
        'Like dish before unlike test'
      );
      
      // Then unlike it
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/unlike/dish/${dishId}`),
        'Unlike dish'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('liked', false);
    });
    
    it('should favorite a dish', async () => {
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/favorite/dish/${dishId}`),
        'Favorite dish'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('favorited', true);
    });
    
    it('should unfavorite a dish', async () => {
      // First favorite the dish
      await handleApiRequest(
        () => apiClient.post(`/engagement/favorite/dish/${dishId}`),
        'Favorite dish before unfavorite test'
      );
      
      // Then unfavorite it
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/unfavorite/dish/${dishId}`),
        'Unfavorite dish'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('favorited', false);
    });
  });
  
  // List engagement tests
  describe('List Engagement', () => {
    let listId;
    
    beforeEach(async () => {
      // Create a list to use for tests
      const createListResult = await handleApiRequest(
        () => apiClient.post('/lists', {
          name: 'Test List for Engagement',
          description: 'Created for engagement tests'
        }),
        'Create list for engagement tests'
      );
      
      expect(createListResult.success).toBe(true);
      expect(createListResult.data).toHaveProperty('id');
      
      listId = createListResult.data.id;
    });
    
    it('should like a list', async () => {
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/like/list/${listId}`),
        'Like list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('liked', true);
    });
    
    it('should unlike a list', async () => {
      // First like the list
      await handleApiRequest(
        () => apiClient.post(`/engagement/like/list/${listId}`),
        'Like list before unlike test'
      );
      
      // Then unlike it
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/unlike/list/${listId}`),
        'Unlike list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('liked', false);
    });
    
    it('should favorite a list', async () => {
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/favorite/list/${listId}`),
        'Favorite list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('favorited', true);
    });
    
    it('should unfavorite a list', async () => {
      // First favorite the list
      await handleApiRequest(
        () => apiClient.post(`/engagement/favorite/list/${listId}`),
        'Favorite list before unfavorite test'
      );
      
      // Then unfavorite it
      const result = await handleApiRequest(
        () => apiClient.post(`/engagement/unfavorite/list/${listId}`),
        'Unfavorite list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('favorited', false);
    });
  });
  
  // User engagement summary tests
  describe('User Engagement Summary', () => {
    it('should get user\'s liked restaurants', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/user/likes/restaurants'),
        'Get liked restaurants'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get user\'s liked dishes', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/user/likes/dishes'),
        'Get liked dishes'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get user\'s liked lists', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/user/likes/lists'),
        'Get liked lists'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get user\'s favorited restaurants', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/user/favorites/restaurants'),
        'Get favorited restaurants'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get user\'s favorited dishes', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/user/favorites/dishes'),
        'Get favorited dishes'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get user\'s favorited lists', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/user/favorites/lists'),
        'Get favorited lists'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
