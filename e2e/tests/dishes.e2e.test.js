/**
 * Dishes E2E Tests
 * 
 * Tests dish-related functionality including fetching dish details,
 * filtering dishes, and dish submissions.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Dishes', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for dish tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for dish tests');
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
  
  // Dish retrieval tests
  describe('Get Dishes', () => {
    it('should retrieve all dishes', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/dishes'),
        'Get all dishes'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve a specific dish by ID', async () => {
      const dishId = 1; // First dish from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/dishes/${dishId}`),
        'Get dish by ID'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('id', dishId);
    });
    
    it('should fail to retrieve a non-existent dish', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.get(`/dishes/${nonExistentId}`),
        'Get non-existent dish'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
  
  // Dish filtering tests
  describe('Filter Dishes', () => {
    it('should filter dishes by restaurant', async () => {
      const restaurantId = 1; // First restaurant from seed data
      
      const result = await handleApiRequest(
        () => apiClient.get(`/dishes?restaurant_id=${restaurantId}`),
        'Filter dishes by restaurant'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All dishes should be from the specified restaurant
      if (result.data.length > 0) {
        result.data.forEach(dish => {
          expect(dish.restaurant_id).toBe(restaurantId);
        });
      }
    });
    
    it('should filter dishes by price range', async () => {
      const minPrice = 10;
      const maxPrice = 15;
      
      const result = await handleApiRequest(
        () => apiClient.get(`/dishes?min_price=${minPrice}&max_price=${maxPrice}`),
        'Filter dishes by price range'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All dishes should be within the specified price range
      if (result.data.length > 0) {
        result.data.forEach(dish => {
          expect(dish.price).toBeGreaterThanOrEqual(minPrice);
          expect(dish.price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });
    
    it('should filter dishes by hashtags', async () => {
      const hashtags = ['pizza'];
      
      const result = await handleApiRequest(
        () => apiClient.get(`/dishes?hashtags=${hashtags.join(',')}`),
        'Filter dishes by hashtags'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
  
  // Dish submission tests
  describe('Dish Submissions', () => {
    it('should submit a new dish', async () => {
      const newDish = {
        name: 'New Test Dish',
        restaurant_id: 1,
        price: 15.99,
        description: 'A delicious test dish'
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/submissions', {
          type: 'dish',
          data: newDish
        }),
        'Submit new dish'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('status', 'pending');
    });
    
    it('should fail to submit a dish with invalid data', async () => {
      const invalidDish = {
        name: '', // Missing required field
        restaurant_id: 1
        // Missing other required fields
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/submissions', {
          type: 'dish',
          data: invalidDish
        }),
        'Submit invalid dish'
      );
      
      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });
  });
  
  // Admin dish management tests
  describe('Admin Dish Management', () => {
    beforeEach(async () => {
      // Login as admin for these tests
      clearAuthToken();
      
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for dish management tests'
      );
      
      if (loginResult.success) {
        setAuthToken(loginResult.data.token);
      } else {
        throw new Error('Failed to login as admin for dish management tests');
      }
    });
    
    it('should allow admin to approve a dish submission', async () => {
      // First get pending submissions
      const submissionsResult = await handleApiRequest(
        () => apiClient.get('/admin/submissions?type=dish&status=pending'),
        'Get pending dish submissions'
      );
      
      expect(submissionsResult.success).toBe(true);
      expect(submissionsResult.status).toBe(200);
      expect(Array.isArray(submissionsResult.data)).toBe(true);
      
      // Skip if no pending submissions
      if (submissionsResult.data.length === 0) {
        console.warn('Skipping test: No pending dish submissions available');
        return;
      }
      
      // Approve the first pending submission
      const submissionId = submissionsResult.data[0].id;
      
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/submissions/approve/${submissionId}`),
        'Approve dish submission'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'approved');
    });
    
    it('should allow admin to reject a dish submission', async () => {
      // First get pending submissions
      const submissionsResult = await handleApiRequest(
        () => apiClient.get('/admin/submissions?type=dish&status=pending'),
        'Get pending dish submissions'
      );
      
      expect(submissionsResult.success).toBe(true);
      expect(submissionsResult.status).toBe(200);
      expect(Array.isArray(submissionsResult.data)).toBe(true);
      
      // Skip if no pending submissions
      if (submissionsResult.data.length === 0) {
        console.warn('Skipping test: No pending dish submissions available');
        return;
      }
      
      // Reject the first pending submission
      const submissionId = submissionsResult.data[0].id;
      
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/submissions/reject/${submissionId}`, {
          reason: 'Test rejection reason'
        }),
        'Reject dish submission'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'rejected');
    });
  });
});
