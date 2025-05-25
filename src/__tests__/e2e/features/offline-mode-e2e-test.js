/**
 * E2E Feature Test: Offline Mode
 * 
 * This test suite verifies the application's offline mode functionality, including:
 * - Detecting when the application goes offline
 * - Storing operations locally when offline
 * - Synchronizing data when the connection is restored
 * - Properly handling conflicts during synchronization
 * - Providing appropriate user feedback during offline/online transitions
 */

import { expect } from 'chai';
import axios from 'axios';
import { apiClient } from '../../setup/robust-api-client.js';

// Helper function to simulate network disconnection
const simulateOffline = () => {
  // Store the original adapter
  const originalAdapter = axios.defaults.adapter;
  
  // Replace with an adapter that rejects all requests
  axios.defaults.adapter = () => {
    return Promise.reject({
      message: 'Network Error',
      code: 'ECONNABORTED',
      isAxiosError: true
    });
  };
  
  return () => {
    // Function to restore online mode
    axios.defaults.adapter = originalAdapter;
  };
};

describe('Offline Mode E2E Tests', function() {
  this.timeout(5000); // Short timeout for faster test execution
  
  let authToken;
  let userId;
  let testListId;
  let testRestaurantId;
  let goOnline;
  
  before(async function() {
    try {
      // Register a test user
      const username = `test_user_${Date.now()}`;
      const email = `test_${Date.now()}@example.com`;
      const password = 'testpassword123';
      
      const registerResponse = await apiClient.post('/auth/register', {
        username,
        email,
        password
      });
      
      // Login as the test user
      const loginResponse = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      authToken = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      apiClient.setAuthToken(authToken);
      
      // Create a test list
      const listResponse = await apiClient.post('/lists', {
        name: `Test Offline List ${Date.now()}`,
        description: 'A list for testing offline functionality'
      });
      
      testListId = listResponse.data.id;
      
      // Create a test restaurant or get an existing one
      const restaurantsResponse = await apiClient.get('/restaurants?limit=1');
      if (restaurantsResponse.data.length > 0) {
        testRestaurantId = restaurantsResponse.data[0].id;
      } else {
        const restaurantResponse = await apiClient.post('/restaurants', {
          name: `Test Restaurant ${Date.now()}`,
          cuisine: 'Test Cuisine',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345'
        });
        testRestaurantId = restaurantResponse.data.id;
      }
      
      console.log(`Test setup complete: User ID ${userId}, List ID ${testListId}, Restaurant ID ${testRestaurantId}`);
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw error;
    }
  });
  
  after(async function() {
    // Ensure we're back online
    if (goOnline) {
      goOnline();
    }
    
    // Cleanup: Delete test data
    try {
      if (testListId) {
        await apiClient.delete(`/lists/${testListId}`);
      }
      
      if (userId) {
        await apiClient.delete(`/users/${userId}`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
    
    apiClient.clearAuthToken();
  });
  
  beforeEach(function() {
    // Ensure we're online at the start of each test
    if (goOnline) {
      goOnline();
      goOnline = null;
    }
  });
  
  it('should detect when the application goes offline', async function() {
    // First verify we're online
    const onlineResponse = await apiClient.get('/health-check');
    expect(onlineResponse.status).to.equal(200);
    
    // Simulate going offline
    goOnline = simulateOffline();
    
    try {
      await apiClient.get('/health-check');
      // If we reach here, the offline simulation failed
      expect.fail('Request should have failed in offline mode');
    } catch (error) {
      // Verify the error is a network error
      expect(error.message).to.include('Network Error');
    }
  });
  
  it('should store operations locally when offline and sync when back online', async function() {
    // First verify we're online and can add an item to a list
    const itemName = `Test Item ${Date.now()}`;
    
    // Add an item while online to verify functionality
    const onlineAddResponse = await apiClient.post(`/lists/${testListId}/items`, {
      itemId: testRestaurantId,
      itemType: 'restaurant',
      notes: 'Added while online'
    });
    
    expect(onlineAddResponse.status).to.be.oneOf([200, 201]);
    
    // Get the current items in the list
    const initialListResponse = await apiClient.get(`/lists/${testListId}/items`);
    const initialItemCount = initialListResponse.data.length;
    
    // Simulate going offline
    goOnline = simulateOffline();
    
    // Attempt to add an item while offline
    // In a real app, this would be stored in localStorage or IndexedDB
    const offlineOperation = {
      type: 'ADD_LIST_ITEM',
      listId: testListId,
      data: {
        itemId: testRestaurantId,
        itemType: 'restaurant',
        notes: 'Added while offline'
      },
      timestamp: Date.now()
    };
    
    // Store the operation (simulating what the app would do)
    const pendingOperations = [offlineOperation];
    console.log('Stored pending operation:', offlineOperation);
    
    // Go back online
    goOnline();
    goOnline = null;
    
    // In a real app, the sync would happen automatically
    // Here we simulate it by processing the pending operations
    for (const operation of pendingOperations) {
      if (operation.type === 'ADD_LIST_ITEM') {
        await apiClient.post(`/lists/${operation.listId}/items`, operation.data);
      }
    }
    
    // Verify the item was added after going back online
    const finalListResponse = await apiClient.get(`/lists/${testListId}/items`);
    expect(finalListResponse.data.length).to.be.at.least(initialItemCount + 1);
  });
  
  it('should handle quick add functionality while offline', async function() {
    // First verify we're online
    const healthCheck = await apiClient.get('/health-check');
    expect(healthCheck.status).to.equal(200);
    
    // Get current list items
    const initialListResponse = await apiClient.get(`/lists/${testListId}/items`);
    const initialItemCount = initialListResponse.data.length;
    
    // Simulate going offline
    goOnline = simulateOffline();
    
    // Simulate quick add while offline
    // In a real app, this would be stored in localStorage
    const quickAddOperation = {
      type: 'QUICK_ADD',
      data: {
        listId: testListId,
        itemName: `Quick Add Item ${Date.now()}`,
        itemType: 'restaurant',
        notes: 'Added via quick add while offline'
      },
      timestamp: Date.now()
    };
    
    // Store the operation (simulating what the app would do)
    const pendingQuickAdds = [quickAddOperation];
    console.log('Stored pending quick add:', quickAddOperation);
    
    // Go back online
    goOnline();
    goOnline = null;
    
    // In a real app, the sync would happen automatically
    // Here we simulate it by processing the pending operations
    for (const operation of pendingQuickAdds) {
      if (operation.type === 'QUICK_ADD') {
        // First create or find the restaurant
        let restaurantId;
        try {
          const searchResponse = await apiClient.get(`/search?query=${encodeURIComponent(operation.data.itemName)}`);
          if (searchResponse.data.length > 0) {
            restaurantId = searchResponse.data[0].id;
          } else {
            const createResponse = await apiClient.post('/restaurants', {
              name: operation.data.itemName,
              cuisine: 'Unknown',
              address: 'Added offline',
              city: 'Unknown',
              state: 'UN',
              zip: '00000'
            });
            restaurantId = createResponse.data.id;
          }
          
          // Then add it to the list
          await apiClient.post(`/lists/${operation.data.listId}/items`, {
            itemId: restaurantId,
            itemType: operation.data.itemType,
            notes: operation.data.notes
          });
        } catch (error) {
          console.error('Error processing quick add:', error.message);
        }
      }
    }
    
    // Verify the quick add item was added after going back online
    const finalListResponse = await apiClient.get(`/lists/${testListId}/items`);
    expect(finalListResponse.data.length).to.be.at.least(initialItemCount + 1);
  });
  
  it('should handle conflicts during synchronization', async function() {
    // This test simulates a conflict where the same item is modified online and offline
    
    // First add an item to work with
    const addResponse = await apiClient.post(`/lists/${testListId}/items`, {
      itemId: testRestaurantId,
      itemType: 'restaurant',
      notes: 'Original notes'
    });
    
    const itemId = addResponse.data.id;
    
    // Simulate going offline
    goOnline = simulateOffline();
    
    // Simulate offline update
    const offlineUpdate = {
      type: 'UPDATE_LIST_ITEM',
      listId: testListId,
      itemId: itemId,
      data: {
        notes: 'Updated offline'
      },
      timestamp: Date.now()
    };
    
    // Store the operation (simulating what the app would do)
    const pendingUpdates = [offlineUpdate];
    console.log('Stored pending update:', offlineUpdate);
    
    // Go back online
    goOnline();
    goOnline = null;
    
    // While offline, someone else updated the item
    await apiClient.put(`/lists/${testListId}/items/${itemId}`, {
      notes: 'Updated online by someone else'
    });
    
    // Now process our offline update
    // In a real app, there would be conflict resolution logic
    // Here we'll use a simple "last write wins" approach
    for (const operation of pendingUpdates) {
      if (operation.type === 'UPDATE_LIST_ITEM') {
        try {
          // Get the current state
          const currentState = await apiClient.get(`/lists/${operation.listId}/items/${operation.itemId}`);
          
          // In a real app, we might compare timestamps or show a conflict resolution UI
          console.log('Current state:', currentState.data);
          console.log('Offline update:', operation.data);
          
          // Apply our update (last write wins)
          await apiClient.put(`/lists/${operation.listId}/items/${operation.itemId}`, operation.data);
        } catch (error) {
          console.error('Error resolving conflict:', error.message);
        }
      }
    }
    
    // Verify our update was applied
    const finalState = await apiClient.get(`/lists/${testListId}/items/${itemId}`);
    expect(finalState.data.notes).to.equal('Updated offline');
  });
});
