/**
 * Simple Restaurant E2E Test
 * 
 * This is a simplified test to verify that our E2E testing setup works correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios/dist/node/axios.cjs';

// Create a simple API client
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test data
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!'
};

let authToken = null;

describe('Restaurant API Tests', () => {
  beforeAll(async () => {
    try {
      // Register a test user
      const registerResponse = await apiClient.post('/auth/register', testUser);
      console.log('User registered:', registerResponse.data.success);
      
      // Login with the test user
      const loginResponse = await apiClient.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      
      authToken = loginResponse.data.data.token;
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('User logged in, token acquired');
    } catch (error) {
      console.error('Setup error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  });
  
  it('should get a list of restaurants', async () => {
    try {
      const response = await apiClient.get('/e2e/restaurants');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data.restaurants)).toBe(true);
      
      console.log(`Retrieved ${response.data.data.restaurants.length} restaurants`);
    } catch (error) {
      console.error('Error getting restaurants:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  });
  
  it('should create a new restaurant', async () => {
    try {
      const restaurantData = {
        name: 'Test Restaurant',
        description: 'A test restaurant for E2E testing',
        address: '123 Test St, Test City, TC 12345',
        cuisine: 'Test Cuisine',
        price_range: '$$'
      };
      
      const response = await apiClient.post('/e2e/restaurants', restaurantData);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.name).toBe(restaurantData.name);
      
      console.log(`Created restaurant with ID: ${response.data.data.id}`);
    } catch (error) {
      console.error('Error creating restaurant:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  });
});
