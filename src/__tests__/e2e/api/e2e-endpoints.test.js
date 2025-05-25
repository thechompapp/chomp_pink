/**
 * E2E API Endpoint Tests
 * 
 * This file contains tests for the E2E testing endpoints.
 * These endpoints are specifically designed for testing and should be more reliable
 * than the regular API endpoints.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  apiClient, 
  verifyBackendServer, 
  API_ENDPOINTS,
  TEST_TIMEOUT 
} from '../../setup/browser-test-config.js';

// Setup before all tests
beforeAll(async () => {
  // Ensure the backend server is running
  await verifyBackendServer();
  console.log('Starting E2E endpoint tests with backend server connected');
}, TEST_TIMEOUT);

describe('E2E API Endpoints', () => {
  
  describe('Restaurant Endpoints', () => {
    it('should get a list of restaurants', async () => {
      try {
        console.log('Fetching restaurants...');
        const response = await apiClient.get(API_ENDPOINTS.E2E.RESTAURANTS);
        
        console.log(`Received ${response.data.length} restaurants`);
        
        // Verify response
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        console.log('Get restaurants test passed!');
      } catch (error) {
        console.error('Error fetching restaurants:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should create a new restaurant', async () => {
      try {
        const newRestaurant = {
          name: `Test Restaurant ${Date.now()}`,
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          phone: '555-123-4567',
          cuisine: 'Test Cuisine',
          priceRange: '$$'
        };
        
        console.log('Creating new restaurant:', newRestaurant.name);
        const response = await apiClient.post(API_ENDPOINTS.E2E.RESTAURANTS, newRestaurant);
        
        // Verify response
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name', newRestaurant.name);
        
        console.log('Restaurant created with ID:', response.data.id);
        console.log('Create restaurant test passed!');
        
        // Return the created restaurant for use in other tests
        return response.data;
      } catch (error) {
        console.error('Error creating restaurant:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should get a restaurant by ID', async () => {
      try {
        // First create a restaurant
        const newRestaurant = {
          name: `Test Restaurant Get ${Date.now()}`,
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          phone: '555-123-4567',
          cuisine: 'Test Cuisine',
          priceRange: '$$'
        };
        
        console.log('Creating restaurant for get by ID test...');
        const createResponse = await apiClient.post(API_ENDPOINTS.E2E.RESTAURANTS, newRestaurant);
        const restaurantId = createResponse.data.id;
        
        // Now get the restaurant by ID
        console.log(`Fetching restaurant with ID: ${restaurantId}`);
        const response = await apiClient.get(API_ENDPOINTS.E2E.RESTAURANT_BY_ID(restaurantId));
        
        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', restaurantId);
        expect(response.data).toHaveProperty('name', newRestaurant.name);
        
        console.log('Get restaurant by ID test passed!');
      } catch (error) {
        console.error('Error getting restaurant by ID:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Dish Endpoints', () => {
    it('should get a list of dishes', async () => {
      try {
        console.log('Fetching dishes...');
        const response = await apiClient.get(API_ENDPOINTS.E2E.DISHES);
        
        console.log(`Received ${response.data.length} dishes`);
        
        // Verify response
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        console.log('Get dishes test passed!');
      } catch (error) {
        console.error('Error fetching dishes:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should create a new dish', async () => {
      try {
        // First create a restaurant for the dish
        const newRestaurant = {
          name: `Test Restaurant for Dish ${Date.now()}`,
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          phone: '555-123-4567',
          cuisine: 'Test Cuisine',
          priceRange: '$$'
        };
        
        console.log('Creating restaurant for dish test...');
        const restaurantResponse = await apiClient.post(API_ENDPOINTS.E2E.RESTAURANTS, newRestaurant);
        const restaurantId = restaurantResponse.data.id;
        
        // Now create a dish
        const newDish = {
          name: `Test Dish ${Date.now()}`,
          description: 'A delicious test dish',
          price: 12.99,
          restaurantId: restaurantId,
          category: 'Test Category',
          tags: ['test', 'dish', 'delicious']
        };
        
        console.log('Creating new dish:', newDish.name);
        const response = await apiClient.post(API_ENDPOINTS.E2E.DISHES, newDish);
        
        // Verify response
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name', newDish.name);
        expect(response.data).toHaveProperty('restaurantId', restaurantId);
        
        console.log('Dish created with ID:', response.data.id);
        console.log('Create dish test passed!');
        
        // Return the created dish for use in other tests
        return response.data;
      } catch (error) {
        console.error('Error creating dish:', error.message);
        throw error;
      }
    }, TEST_TIMEOUT);
  });
});
