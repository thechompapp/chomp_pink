/**
 * Lists E2E Tests
 * 
 * Tests list-related functionality including creating, updating, and deleting lists,
 * as well as adding and removing items from lists.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

// Test data
let testListId = null;
let testItemId = null;

describe('Lists', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as a regular user
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.regular),
      'Login for lists tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login for lists tests');
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
  
  // List creation tests
  describe('Create List', () => {
    it('should create a new list', async () => {
      const result = await handleApiRequest(
        () => apiClient.post('/lists', config.testData.lists.valid),
        'Create list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe(config.testData.lists.valid.name);
      
      // Save the list ID for later tests
      testListId = result.data.id;
    });
    
    it('should fail to create a list with invalid data', async () => {
      const result = await handleApiRequest(
        () => apiClient.post('/lists', { name: '' }), // Missing required fields
        'Create invalid list'
      );
      
      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });
  });
  
  // List retrieval tests
  describe('Get Lists', () => {
    it('should retrieve all lists for the user', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/lists'),
        'Get all lists'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should retrieve a specific list by ID', async () => {
      // Skip if no test list was created
      if (!testListId) {
        console.warn('Skipping test: No test list ID available');
        return;
      }
      
      const result = await handleApiRequest(
        () => apiClient.get(`/lists/${testListId}`),
        'Get list by ID'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('id', testListId);
    });
    
    it('should fail to retrieve a non-existent list', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.get(`/lists/${nonExistentId}`),
        'Get non-existent list'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
  
  // List update tests
  describe('Update List', () => {
    it('should update an existing list', async () => {
      // Skip if no test list was created
      if (!testListId) {
        console.warn('Skipping test: No test list ID available');
        return;
      }
      
      const updatedData = {
        name: 'Updated Test List',
        description: 'This list has been updated',
        is_public: false
      };
      
      const result = await handleApiRequest(
        () => apiClient.put(`/lists/${testListId}`, updatedData),
        'Update list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('name', updatedData.name);
      expect(result.data).toHaveProperty('description', updatedData.description);
      expect(result.data).toHaveProperty('is_public', updatedData.is_public);
    });
    
    it('should fail to update a non-existent list', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.put(`/lists/${nonExistentId}`, { name: 'Updated Name' }),
        'Update non-existent list'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
  
  // List item tests
  describe('List Items', () => {
    it('should add an item to a list', async () => {
      // Skip if no test list was created
      if (!testListId) {
        console.warn('Skipping test: No test list ID available');
        return;
      }
      
      const itemData = {
        item_id: 1, // Using the first restaurant from seed data
        item_type: 'restaurant',
        notes: 'Test note for restaurant'
      };
      
      const result = await handleApiRequest(
        () => apiClient.post(`/lists/${testListId}/items`, itemData),
        'Add item to list'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toHaveProperty('id');
      
      // Save the item ID for later tests
      testItemId = result.data.id;
    });
    
    it('should retrieve items in a list', async () => {
      // Skip if no test list was created
      if (!testListId) {
        console.warn('Skipping test: No test list ID available');
        return;
      }
      
      const result = await handleApiRequest(
        () => apiClient.get(`/lists/${testListId}/items`),
        'Get list items'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should update a list item', async () => {
      // Skip if no test item was created
      if (!testListId || !testItemId) {
        console.warn('Skipping test: No test list or item ID available');
        return;
      }
      
      const updatedData = {
        notes: 'Updated test note'
      };
      
      const result = await handleApiRequest(
        () => apiClient.put(`/lists/${testListId}/items/${testItemId}`, updatedData),
        'Update list item'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('notes', updatedData.notes);
    });
    
    it('should remove an item from a list', async () => {
      // Skip if no test item was created
      if (!testListId || !testItemId) {
        console.warn('Skipping test: No test list or item ID available');
        return;
      }
      
      const result = await handleApiRequest(
        () => apiClient.delete(`/lists/${testListId}/items/${testItemId}`),
        'Remove item from list'
      );
      
      expect(result.success).toBe(true);
      expect([200, 204]).toContain(result.status);
    });
  });
  
  // List deletion tests
  describe('Delete List', () => {
    it('should delete an existing list', async () => {
      // Skip if no test list was created
      if (!testListId) {
        console.warn('Skipping test: No test list ID available');
        return;
      }
      
      const result = await handleApiRequest(
        () => apiClient.delete(`/lists/${testListId}`),
        'Delete list'
      );
      
      expect(result.success).toBe(true);
      expect([200, 204]).toContain(result.status);
      
      // Verify the list is deleted
      const verifyResult = await handleApiRequest(
        () => apiClient.get(`/lists/${testListId}`),
        'Verify list deletion'
      );
      
      expect(verifyResult.success).toBe(false);
      expect(verifyResult.status).toBe(404);
    });
    
    it('should fail to delete a non-existent list', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      
      const result = await handleApiRequest(
        () => apiClient.delete(`/lists/${nonExistentId}`),
        'Delete non-existent list'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
});
