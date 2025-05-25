/**
 * Hashtags E2E Tests
 * 
 * Tests hashtag-related functionality including fetching hashtags,
 * filtering by hashtags, and trending hashtags.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Hashtags', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for hashtag tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for hashtag tests');
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
  
  // Hashtag retrieval tests
  describe('Get Hashtags', () => {
    it('should retrieve all hashtags', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/hashtags'),
        'Get all hashtags'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve top hashtags', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/hashtags/top'),
        'Get top hashtags'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve trending hashtags', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/hashtags/trending'),
        'Get trending hashtags'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
  
  // Hashtag filtering tests
  describe('Filter by Hashtags', () => {
    it('should filter restaurants by hashtag', async () => {
      const hashtag = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants?hashtags=${hashtag}`),
        'Filter restaurants by hashtag'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should filter dishes by hashtag', async () => {
      const hashtag = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/dishes?hashtags=${hashtag}`),
        'Filter dishes by hashtag'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should filter by multiple hashtags', async () => {
      const hashtags = ['pizza', 'italian'];
      
      const result = await handleApiRequest(
        () => apiClient.get(`/restaurants?hashtags=${hashtags.join(',')}`),
        'Filter restaurants by multiple hashtags'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
  
  // Hashtag search tests
  describe('Search Hashtags', () => {
    it('should search for hashtags by partial name', async () => {
      const query = 'piz';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/hashtags/search?q=${query}`),
        'Search hashtags by partial name'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // Results should include hashtags that match the query
      if (result.data.length > 0) {
        const matchingHashtag = result.data.find(hashtag => 
          hashtag.name.toLowerCase().includes(query.toLowerCase())
        );
        expect(matchingHashtag).toBeDefined();
      }
    });
  });
  
  // Hashtag association tests
  describe('Hashtag Associations', () => {
    it('should get restaurants associated with a hashtag', async () => {
      const hashtag = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/hashtags/${hashtag}/restaurants`),
        'Get restaurants by hashtag'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get dishes associated with a hashtag', async () => {
      const hashtag = 'pizza';
      
      const result = await handleApiRequest(
        () => apiClient.get(`/hashtags/${hashtag}/dishes`),
        'Get dishes by hashtag'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
  
  // Admin hashtag management tests
  describe('Admin Hashtag Management', () => {
    beforeEach(async () => {
      // Login as admin for these tests
      clearAuthToken();
      
      const loginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for hashtag management tests'
      );
      
      if (loginResult.success) {
        setAuthToken(loginResult.data.token);
      } else {
        throw new Error('Failed to login as admin for hashtag management tests');
      }
    });
    
    it('should allow admin to create a new hashtag', async () => {
      const newHashtag = {
        name: 'newtesthashtag'
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/admin/hashtags', newHashtag),
        'Create new hashtag'
      );
      
      expect(result.success).toBe(true);
      expect([200, 201]).toContain(result.status);
      expect(result.data).toHaveProperty('name', newHashtag.name);
    });
    
    it('should allow admin to update a hashtag', async () => {
      // First get all hashtags to find one to update
      const hashtagsResult = await handleApiRequest(
        () => apiClient.get('/admin/hashtags'),
        'Get all hashtags for admin'
      );
      
      expect(hashtagsResult.success).toBe(true);
      expect(hashtagsResult.status).toBe(200);
      expect(Array.isArray(hashtagsResult.data)).toBe(true);
      
      // Skip if no hashtags available
      if (hashtagsResult.data.length === 0) {
        console.warn('Skipping test: No hashtags available to update');
        return;
      }
      
      // Update the first hashtag
      const hashtagId = hashtagsResult.data[0].id;
      const updatedData = {
        name: 'updatedhashtag'
      };
      
      const result = await handleApiRequest(
        () => apiClient.put(`/admin/hashtags/${hashtagId}`, updatedData),
        'Update hashtag'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('name', updatedData.name);
    });
    
    it('should allow admin to delete a hashtag', async () => {
      // First get all hashtags to find one to delete
      const hashtagsResult = await handleApiRequest(
        () => apiClient.get('/admin/hashtags'),
        'Get all hashtags for admin'
      );
      
      expect(hashtagsResult.success).toBe(true);
      expect(hashtagsResult.status).toBe(200);
      expect(Array.isArray(hashtagsResult.data)).toBe(true);
      
      // Skip if no hashtags available
      if (hashtagsResult.data.length === 0) {
        console.warn('Skipping test: No hashtags available to delete');
        return;
      }
      
      // Delete the first hashtag
      const hashtagId = hashtagsResult.data[0].id;
      
      const result = await handleApiRequest(
        () => apiClient.delete(`/admin/hashtags/${hashtagId}`),
        'Delete hashtag'
      );
      
      expect(result.success).toBe(true);
      expect([200, 204]).toContain(result.status);
    });
  });
});
