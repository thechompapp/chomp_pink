/**
 * Restaurants E2E Tests
 * 
 * Tests restaurant-related functionality including fetching restaurant details,
 * filtering restaurants, and restaurant submissions.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Restaurants', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for restaurant tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for restaurant tests');
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
  
  // Restaurant retrieval tests
  describe('Get Restaurants', () => {
    it('should retrieve all restaurants', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/restaurants'),
        'Get all restaurants'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve a specific restaurant by ID', async () => {
      const restaurantId = 1; // First restaurant from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants/${restaurantId}`),
        'Get restaurant by ID'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('id', restaurantId);
    });
    
    it('should fail to retrieve a non-existent restaurant', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants/${nonExistentId}`),
        'Get non-existent restaurant'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
  
  // Restaurant filtering tests
  describe('Filter Restaurants', () => {
    it('should filter restaurants by city', async () => {
      const cityId = 1; // New York from seed data
      
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
      const neighborhoodId = 1; // Manhattan from seed data
      
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
    
    it('should filter restaurants by cuisine', async () => {
      const cuisine = 'Italian';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants?cuisine=${cuisine}`),
        'Filter restaurants by cuisine'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All restaurants should have the specified cuisine
      if (result.data.length > 0) {
        result.data.forEach(restaurant => {
          expect(restaurant.cuisine).toBe(cuisine);
        });
      }
    });
  });
  
  // Restaurant submission tests
  describe('Restaurant Submissions', () => {
    it('should submit a new restaurant', async () => {
      const newRestaurant = {
        name: 'New Test Restaurant',
        cuisine: 'French',
        address: '123 Test Street',
        city_id: 1,
        neighborhood_id: 1
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/submissions', {
          type: 'restaurant',
          data: newRestaurant
        }),
        'Submit new restaurant'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('status', 'pending');
    });
    
    it('should fail to submit a restaurant with invalid data', async () => {
      const invalidRestaurant = {
        name: '', // Missing required field
        cuisine: 'French'
        // Missing other required fields
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/submissions', {
          type: 'restaurant',
          data: invalidRestaurant
        }),
        'Submit invalid restaurant'
      );
      
      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });
  });
  
  // Admin restaurant management tests
  describe('Admin Restaurant Management', () => {
    beforeEach(async () => {
      // Login as admin for these tests
      clearAuthToken();
      
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for restaurant management tests'
      );
      
      if (loginResult.success) {
        setAuthToken(loginResult.data.token);
      } else {
        throw new Error('Failed to login as admin for restaurant management tests');
      }
    });
    
    it('should allow admin to approve a restaurant submission', async () => {
      // First get pending submissions
      const submissionsResult = await handleApiRequest(
        () => apiClient.get('/admin/submissions?type=restaurant&status=pending'),
        'Get pending restaurant submissions'
      );
      
      expect(submissionsResult.success).toBe(true);
      expect(submissionsResult.status).toBe(200);
      expect(Array.isArray(submissionsResult.data)).toBe(true);
      
      // Skip if no pending submissions
      if (submissionsResult.data.length === 0) {
        console.warn('Skipping test: No pending restaurant submissions available');
        return;
      }
      
      // Approve the first pending submission
      const submissionId = submissionsResult.data[0].id;
      
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/submissions/approve/${submissionId}`),
        'Approve restaurant submission'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'approved');
    });
    
    it('should allow admin to reject a restaurant submission', async () => {
      // First get pending submissions
      const submissionsResult = await handleApiRequest(
        () => apiClient.get('/admin/submissions?type=restaurant&status=pending'),
        'Get pending restaurant submissions'
      );
      
      expect(submissionsResult.success).toBe(true);
      expect(submissionsResult.status).toBe(200);
      expect(Array.isArray(submissionsResult.data)).toBe(true);
      
      // Skip if no pending submissions
      if (submissionsResult.data.length === 0) {
        console.warn('Skipping test: No pending restaurant submissions available');
        return;
      }
      
      // Reject the first pending submission
      const submissionId = submissionsResult.data[0].id;
      
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/submissions/reject/${submissionId}`, {
          reason: 'Test rejection reason'
        }),
        'Reject restaurant submission'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'rejected');
    });
  });
});
