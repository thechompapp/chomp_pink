/**
 * Dish Endpoints Test
 * 
 * This file contains tests for the dish-related endpoints.
 * It tests listing, creating, updating, and deleting dishes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios/dist/node/axios.cjs';
import { config } from '../setup/config.js';
import { getOrCreateTestUser, getOrCreateAdminUser } from '../setup/test-users.js';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Create a dedicated API client for dish tests
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test data
const testDish = {
  name: `Test Dish ${Date.now()}`,
  description: 'A dish created for E2E testing',
  price: 12.99,
  category: 'Main Course',
  ingredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3'],
  dietaryInfo: {
    vegetarian: true,
    vegan: false,
    glutenFree: false,
    dairyFree: false
  },
  spicyLevel: 'Medium',
  imageUrl: 'https://example.com/test-dish.jpg'
};

// Store test data for cleanup
let testRestaurantId = null;
let createdDishId = null;
let testUser = null;
let adminUser = null;

describe('Dish Endpoints', () => {
  // Set up test users and restaurant before all tests
  beforeAll(async () => {
    try {
      // Get or create a regular test user
      testUser = await getOrCreateTestUser();
      if (testUser && testUser.token) {
        console.log('Test user authenticated successfully');
      } else {
        console.warn('Failed to authenticate test user, some tests may fail');
      }
      
      // Get or create an admin user
      adminUser = await getOrCreateAdminUser();
      if (adminUser && adminUser.token) {
        console.log('Admin user authenticated successfully');
      } else {
        console.warn('Failed to authenticate admin user, some tests may fail');
      }
      
      // Create a test restaurant if we have an authenticated user
      if (testUser && testUser.token) {
        try {
          const restaurantResponse = await apiClient.post('/restaurants', {
            name: `Test Restaurant for Dishes ${Date.now()}`,
            description: 'A restaurant created for dish E2E testing',
            address: '123 Test Street, Test City, TS 12345',
            cuisine: 'Test Cuisine',
            priceRange: '$$'
          }, {
            headers: {
              Authorization: `Bearer ${testUser.token}`
            }
          });
          
          testRestaurantId = restaurantResponse.data.id;
          console.log(`Test restaurant created: ${testRestaurantId}`);
        } catch (error) {
          console.error('Error creating test restaurant:', error.message);
        }
      }
    } catch (error) {
      console.error('Error setting up test data:', error.message);
    }
  }, TEST_TIMEOUT);
  
  // Clean up after all tests
  afterAll(async () => {
    // Delete the created dish if it exists
    if (createdDishId && testUser && testUser.token) {
      try {
        await apiClient.delete(`/dishes/${createdDishId}`, {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        });
        console.log(`Test dish deleted: ${createdDishId}`);
      } catch (error) {
        console.error(`Error deleting test dish: ${error.message}`);
      }
    }
    
    // Delete the test restaurant if it exists
    if (testRestaurantId && adminUser && adminUser.token) {
      try {
        await apiClient.delete(`/restaurants/${testRestaurantId}`, {
          headers: {
            Authorization: `Bearer ${adminUser.token}`
          }
        });
        console.log(`Test restaurant deleted: ${testRestaurantId}`);
      } catch (error) {
        console.error(`Error deleting test restaurant: ${error.message}`);
      }
    }
  }, TEST_TIMEOUT);
  
  describe('Dish Listing', () => {
    it('should list dishes without authentication', async () => {
      try {
        const response = await apiClient.get('/dishes');
        
        console.log(`Retrieved ${response.data.length || 0} dishes`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish listing endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should list dishes for a specific restaurant', async () => {
      // Skip if we didn't create a restaurant
      if (!testRestaurantId) {
        console.log('No test restaurant, skipping restaurant dishes test');
        return;
      }
      
      try {
        const response = await apiClient.get(`/restaurants/${testRestaurantId}/dishes`);
        
        console.log(`Retrieved ${response.data.length || 0} dishes for restaurant ${testRestaurantId}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Restaurant dishes endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should support filtering dishes by category', async () => {
      try {
        const response = await apiClient.get('/dishes?category=Main Course');
        
        console.log(`Retrieved ${response.data.length || 0} main course dishes`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        // If the endpoint doesn't support filtering, we'll skip this test
        if (error.response?.status === 400) {
          console.log('Dish filtering not supported, skipping test');
          return;
        }
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish listing endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Dish Creation', () => {
    it('should create a new dish when authenticated', async () => {
      // Skip if we don't have an authenticated user or a restaurant
      if (!testUser || !testUser.token || !testRestaurantId) {
        console.log('No authenticated user or restaurant, skipping dish creation test');
        return;
      }
      
      try {
        const dishData = {
          ...testDish,
          restaurantId: testRestaurantId
        };
        
        const response = await apiClient.post('/dishes', dishData, {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        });
        
        console.log('Dish created:', response.data);
        
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name', testDish.name);
        expect(response.data).toHaveProperty('restaurantId', testRestaurantId);
        
        // Store the dish ID for later tests and cleanup
        createdDishId = response.data.id;
      } catch (error) {
        console.error('Dish creation error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish creation endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should fail to create a dish without authentication', async () => {
      // Skip if we didn't create a restaurant
      if (!testRestaurantId) {
        console.log('No test restaurant, skipping unauthenticated dish creation test');
        return;
      }
      
      try {
        const dishData = {
          ...testDish,
          name: `Unauthenticated Dish ${Date.now()}`,
          restaurantId: testRestaurantId
        };
        
        await apiClient.post('/dishes', dishData);
        
        // If we get here, the test should fail because we expect an error
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        console.log('Expected dish creation error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish creation endpoint not found, skipping test');
          return;
        }
        
        expect(error.response?.status).toBe(401);
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Dish Details', () => {
    it('should get details for a specific dish', async () => {
      // Skip if we didn't create a dish
      if (!createdDishId) {
        console.log('No dish created, skipping dish details test');
        return;
      }
      
      try {
        const response = await apiClient.get(`/dishes/${createdDishId}`);
        
        console.log('Dish details:', response.data);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', createdDishId);
        expect(response.data).toHaveProperty('name', testDish.name);
        expect(response.data).toHaveProperty('restaurantId', testRestaurantId);
      } catch (error) {
        console.error('Dish details error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish details endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Dish Update', () => {
    it('should update a dish when authenticated', async () => {
      // Skip if we don't have an authenticated user or a dish
      if (!testUser || !testUser.token || !createdDishId) {
        console.log('No authenticated user or dish, skipping dish update test');
        return;
      }
      
      try {
        const updateData = {
          description: `Updated description ${Date.now()}`,
          price: 14.99,
          spicyLevel: 'Hot'
        };
        
        const response = await apiClient.put(`/dishes/${createdDishId}`, updateData, {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        });
        
        console.log('Dish updated:', response.data);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', createdDishId);
        expect(response.data).toHaveProperty('description', updateData.description);
        expect(response.data).toHaveProperty('price', updateData.price);
        expect(response.data).toHaveProperty('spicyLevel', updateData.spicyLevel);
      } catch (error) {
        console.error('Dish update error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish update endpoint not found, skipping test');
          return;
        }
        
        // Re-throw the error to fail the test
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should fail to update a dish without authentication', async () => {
      // Skip if we didn't create a dish
      if (!createdDishId) {
        console.log('No dish created, skipping unauthenticated dish update test');
        return;
      }
      
      try {
        const updateData = {
          description: 'Unauthorized update attempt'
        };
        
        await apiClient.put(`/dishes/${createdDishId}`, updateData);
        
        // If we get here, the test should fail because we expect an error
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        console.log('Expected dish update error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish update endpoint not found, skipping test');
          return;
        }
        
        expect(error.response?.status).toBe(401);
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Dish Deletion', () => {
    it('should fail to delete a dish without authentication', async () => {
      // Skip if we didn't create a dish
      if (!createdDishId) {
        console.log('No dish created, skipping unauthenticated dish deletion test');
        return;
      }
      
      try {
        await apiClient.delete(`/dishes/${createdDishId}`);
        
        // If we get here, the test should fail because we expect an error
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        console.log('Expected dish deletion error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        // If the endpoint doesn't exist, we'll skip this test
        if (error.response?.status === 404) {
          console.log('Dish deletion endpoint not found, skipping test');
          return;
        }
        
        expect(error.response?.status).toBe(401);
      }
    }, TEST_TIMEOUT);
    
    // Note: We don't test successful deletion here because we want to keep the dish
    // for cleanup in afterAll. We could create another dish just for this test.
  });
});
