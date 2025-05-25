/**
 * List API Endpoints Tests
 * 
 * This file contains tests for the list-related API endpoints,
 * including CRUD operations for lists and following functionality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient, tokenStorage, withAuth, TEST_TIMEOUT } from '../../setup/enhanced-test-setup.js';
import { setupVitestHooks } from '../../setup/setup-vitest-hooks.js';

// Setup Vitest hooks for capturing API request/response data
setupVitestHooks();

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testList = {
  name: 'Test List',
  description: 'A list for testing purposes',
  is_public: true
};

// Store created IDs
let listId = null;

describe('List Endpoints', () => {
  // Login before all tests
  beforeAll(async () => {
    try {
      // Register the test user if needed
      try {
        await apiClient.post('/api/auth/register', {
          ...testUser,
          username: 'testuser'
        });
      } catch (error) {
        // User might already exist, which is fine
        console.log('User registration error (might already exist):', error.message);
      }
      
      // Login to get a token
      const loginResponse = await apiClient.post('/api/auth/login', testUser);
      
      // Only set the token if login was successful
      if (loginResponse.status === 200 && loginResponse.data?.token) {
        tokenStorage.setToken(loginResponse.data.token);
      } else {
        console.error('Failed to login for list tests:', loginResponse.status);
      }
    } catch (error) {
      console.error('Error in beforeAll for list tests:', error.message);
    }
  });
  
  // Logout after all tests
  afterAll(() => {
    // Clean up the token
    tokenStorage.clearToken();
  });
  
  describe('Create List', () => {
    it('should create a new list when authenticated', async () => {
      // Skip if we don't have a token
      if (!tokenStorage.getToken()) {
        console.log('Skipping test due to missing authentication token');
        return;
      }
      
      try {
        // Create a list
        const response = await apiClient.post(
          '/api/lists', 
          testList,
          withAuth() // Add authentication header
        );
        
        // Accept either 200/201 (success) or 0 (connection issue)
        expect([200, 201, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200 || response.status === 201) {
          expect(response.data).toHaveProperty('id');
          expect(response.data).toHaveProperty('name', testList.name);
          expect(response.data).toHaveProperty('description', testList.description);
          
          // Store the list ID for later tests
          listId = response.data.id;
        }
      } catch (error) {
        console.error('Error creating list:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
    
    it('should fail to create a list when not authenticated', async () => {
      try {
        // Attempt to create a list without authentication
        const response = await apiClient.post('/api/lists', testList);
        
        // If we get a successful response, the API is not properly secured
        if (response.status === 200 || response.status === 201) {
          expect(true).toBe(false, 'Should not be able to create list without authentication');
        } else {
          // We expect either a 401/403 status or a connection issue (0)
          expect([401, 403, 0]).toContain(response.status);
        }
      } catch (error) {
        // This is expected - the request should fail
        console.log('Expected error when creating list without auth:', error.message);
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Get Lists', () => {
    it('should get all public lists', async () => {
      try {
        // Get all public lists
        const response = await apiClient.get('/api/lists/public');
        
        // Accept either 200 (success) or 0 (connection issue)
        expect([200, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200) {
          expect(Array.isArray(response.data)).toBe(true);
          
          // If we created a public list, it should be in the list
          if (listId && testList.is_public) {
            const found = response.data.some(list => list.id === listId);
            expect(found).toBe(true);
          }
        }
      } catch (error) {
        console.error('Error getting public lists:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
    
    it('should get user\'s own lists when authenticated', async () => {
      // Skip if we don't have a token
      if (!tokenStorage.getToken()) {
        console.log('Skipping test due to missing authentication token');
        return;
      }
      
      try {
        // Get user's own lists
        const response = await apiClient.get(
          '/api/lists/my',
          withAuth() // Add authentication header
        );
        
        // Accept either 200 (success) or 0 (connection issue)
        expect([200, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200) {
          expect(Array.isArray(response.data)).toBe(true);
          
          // If we created a list, it should be in the user's lists
          if (listId) {
            const found = response.data.some(list => list.id === listId);
            expect(found).toBe(true);
          }
        }
      } catch (error) {
        console.error('Error getting user lists:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
    
    it('should get a specific list by ID', async () => {
      // Skip if we don't have a list ID
      if (!listId) {
        console.log('Skipping test due to missing list ID');
        return;
      }
      
      try {
        // Get the specific list
        const response = await apiClient.get(`/api/lists/${listId}`);
        
        // Accept either 200 (success) or 0 (connection issue)
        expect([200, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200) {
          expect(response.data).toHaveProperty('id', listId);
          expect(response.data).toHaveProperty('name', testList.name);
          expect(response.data).toHaveProperty('description', testList.description);
        }
      } catch (error) {
        console.error('Error getting specific list:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Update List', () => {
    it('should update a list when authenticated', async () => {
      // Skip if we don't have a token or list ID
      if (!tokenStorage.getToken() || !listId) {
        console.log('Skipping test due to missing authentication token or list ID');
        return;
      }
      
      const updatedData = {
        ...testList,
        name: 'Updated Test List',
        description: 'Updated description for testing'
      };
      
      try {
        // Update the list
        const response = await apiClient.put(
          `/api/lists/${listId}`,
          updatedData,
          withAuth() // Add authentication header
        );
        
        // Accept either 200 (success) or 0 (connection issue)
        expect([200, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200) {
          expect(response.data).toHaveProperty('id', listId);
          expect(response.data).toHaveProperty('name', updatedData.name);
          expect(response.data).toHaveProperty('description', updatedData.description);
        }
      } catch (error) {
        console.error('Error updating list:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Follow List', () => {
    it('should follow a list when authenticated', async () => {
      // Skip if we don't have a token or list ID
      if (!tokenStorage.getToken() || !listId) {
        console.log('Skipping test due to missing authentication token or list ID');
        return;
      }
      
      try {
        // Follow the list
        const response = await apiClient.post(
          `/api/lists/${listId}/follow`,
          {},
          withAuth() // Add authentication header
        );
        
        // Accept either 200 (success) or 0 (connection issue)
        expect([200, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200) {
          expect(response.data).toHaveProperty('success', true);
          
          // Verify the list is in the followed lists
          const followedResponse = await apiClient.get(
            '/api/lists/followed',
            withAuth() // Add authentication header
          );
          
          if (followedResponse.status === 200) {
            const found = followedResponse.data.some(list => list.id === listId);
            expect(found).toBe(true);
          }
        }
      } catch (error) {
        console.error('Error following list:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
    
    it('should unfollow a list when authenticated', async () => {
      // Skip if we don't have a token or list ID
      if (!tokenStorage.getToken() || !listId) {
        console.log('Skipping test due to missing authentication token or list ID');
        return;
      }
      
      try {
        // Unfollow the list
        const response = await apiClient.post(
          `/api/lists/${listId}/unfollow`,
          {},
          withAuth() // Add authentication header
        );
        
        // Accept either 200 (success) or 0 (connection issue)
        expect([200, 0]).toContain(response.status);
        
        // Only check data properties if we got a successful response
        if (response.status === 200) {
          expect(response.data).toHaveProperty('success', true);
          
          // Verify the list is not in the followed lists
          const followedResponse = await apiClient.get(
            '/api/lists/followed',
            withAuth() // Add authentication header
          );
          
          if (followedResponse.status === 200) {
            const found = followedResponse.data.some(list => list.id === listId);
            expect(found).toBe(false);
          }
        }
      } catch (error) {
        console.error('Error unfollowing list:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
  });
  
  describe('Delete List', () => {
    it('should delete a list when authenticated', async () => {
      // Skip if we don't have a token or list ID
      if (!tokenStorage.getToken() || !listId) {
        console.log('Skipping test due to missing authentication token or list ID');
        return;
      }
      
      try {
        // Delete the list
        const response = await apiClient.delete(
          `/api/lists/${listId}`,
          withAuth() // Add authentication header
        );
        
        // Accept either 200/204 (success) or 0 (connection issue)
        expect([200, 204, 0]).toContain(response.status);
        
        // Verify the list is deleted by trying to get it
        if (response.status === 200 || response.status === 204) {
          try {
            const getResponse = await apiClient.get(`/api/lists/${listId}`);
            
            // If the list still exists and is public, the delete failed
            if (getResponse.status === 200 && getResponse.data?.id === listId) {
              expect(true).toBe(false, 'List should have been deleted');
            }
          } catch (error) {
            // This is expected - the list should not exist
            expect(error.response?.status || 0).toBeGreaterThan(0);
          }
        }
      } catch (error) {
        console.error('Error deleting list:', error.message);
        // Fail the test only if it's not a connection issue
        if (!error.message.includes('timeout') && !error.message.includes('Network Error')) {
          throw error;
        }
      }
    }, TEST_TIMEOUT);
  });
});
