/**
 * List Management Integration Tests
 * 
 * These tests verify the complete list management functionality, including:
 * - List creation, reading, updating, and deletion
 * - List item management
 * - List sharing and permissions
 * - Following/unfollowing lists
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// Create axios instance
let api = null;

// Test module
const listTests = {
  /**
   * Run all list management tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('List Management');
    
    // Save config and logger for use in other methods
    this.config = config;
    this.logger = logger;
    
    // Initialize API client
    api = axios.create({
      baseURL: config.BACKEND_URL,
      timeout: config.TIMEOUT_MS, // Use global timeout configuration
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Authenticate as admin
    let token = null;
    try {
      const authResponse = await api.post('/api/auth/login', {
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD
      });
      
      token = authResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.success('Authenticated as admin for list tests');
    } catch (error) {
      logger.error('Failed to authenticate as admin for list tests', error);
      return;
    }
    
    // Run tests - in parallel if in fast mode, otherwise sequentially
    if (config.FAST_MODE) {
      logger.info('Running list tests in parallel (FAST MODE)');
      
      // Create a test list for use in other tests
      const testList = await this.createTestList();
      
      if (!testList) {
        logger.error('Failed to create test list. Skipping list tests.');
        return;
      }
      
      // Run core tests in parallel
      await Promise.all([
        this.runTest(section, 'List retrieval', async () => {
          try {
            await api.get(`/api/lists/${testList.id}`);
            return { success: true, message: 'List retrieval successful' };
          } catch (error) {
            return { success: false, message: `List retrieval failed: ${error.message}` };
          }
        }),
        this.runTest(section, 'List update', async () => {
          try {
            await api.put(`/api/lists/${testList.id}`, { name: 'Updated Test List' });
            return { success: true, message: 'List update successful' };
          } catch (error) {
            return { success: false, message: `List update failed: ${error.message}` };
          }
        }),
        // Skip more complex tests in fast mode
        this.runTest(section, 'List item management', async () => {
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        }),
        this.runTest(section, 'List sharing', async () => {
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        }),
        this.runTest(section, 'List following', async () => {
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        })
      ]);
      
      // Clean up test list
      try {
        await api.delete(`/api/lists/${testList.id}`);
        logger.info('Test list deleted successfully');
      } catch (error) {
        logger.error('Failed to delete test list', error);
      }
    } else {
      // Standard mode - run tests sequentially
      // Login first to get authentication token
      const loginResult = await this.login(config, logger, section);
      if (!loginResult.success) {
        logger.error('Login failed. Skipping list management tests.');
        return;
      }
      
      // Set auth token for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${loginResult.token}`;
      
      // Test data
      let testListId = null;
      let testItemId = null;
      
      // Test 1: Create List
      const createListResult = await this.testCreateList(config, logger, section);
      if (createListResult.success) {
        testListId = createListResult.listId;
      } else {
        logger.error('Failed to create test list. Skipping related tests.');
        return;
      }
      
      // Test 2: Get List
      await this.testGetList(config, logger, section, testListId);
      
      // Test 3: Get All Lists
      await this.testGetAllLists(config, logger, section);
      
      // Test 4: Update List
      await this.testUpdateList(config, logger, section, testListId);
      
      // Test 5: Add Item to List
      const addItemResult = await this.testAddItemToList(config, logger, section, testListId);
      if (addItemResult.success) {
        testItemId = addItemResult.itemId;
      }
      
      // Test 6: Get List Items
      await this.testGetListItems(config, logger, section, testListId);
      
      // Test 7: Update List Item
      if (testItemId) {
        await this.testUpdateListItem(config, logger, section, testListId, testItemId);
      } else {
        await this.runTest(section, 'Update list item', async () => {
          return { success: false, skipped: true, message: 'Failed to add test item, cannot test update' };
        });
      }
      
      // Test 8: Remove Item from List
      if (testItemId) {
        await this.testRemoveItemFromList(config, logger, section, testListId, testItemId);
      } else {
        await this.runTest(section, 'Remove item from list', async () => {
          return { success: false, skipped: true, message: 'Failed to add test item, cannot test removal' };
        });
      }
      
      // Test 9: Follow List
      await this.testFollowList(config, logger, section, testListId);
      
      // Test 10: Get Followed Lists
      await this.testGetFollowedLists(config, logger, section);
      
      // Test 11: Unfollow List
      await this.testUnfollowList(config, logger, section, testListId);
      
      // Test 12: Delete List
      await this.testDeleteList(config, logger, section, testListId);
    }
  },
  
  /**
   * Login to get authentication token
   */
  async login(config, logger, section) {
    return await this.runTest(section, 'Login for list tests', async () => {
      try {
        const response = await api.post('/api/auth/login', config.AUTH.admin);
        
        logger.debug('Login response:', response.data);
        
        if (response.data && response.data.success) {
          // Extract token from response
          const token = response.data.token || 
                        response.data.accessToken || 
                        response.headers['authorization']?.replace('Bearer ', '');
          
          if (token) {
            return { 
              success: true,
              token
            };
          } else {
            return { 
              success: false, 
              message: 'Login succeeded but no token was returned' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Login failed: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Login failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test creating a list
   */
  async testCreateList(config, logger, section) {
    return await this.runTest(section, 'Create list', async () => {
      try {
        const listData = {
          name: `Test List ${Date.now()}`,
          description: 'Created by integration tests'
        };
        
        const response = await api.post('/api/lists', listData);
        
        logger.debug('Create list response:', response.data);
        
        if (response.data && response.data.id) {
          return { 
            success: true,
            listId: response.data.id
          };
        } else {
          return { 
            success: false, 
            message: 'Failed to create list: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to create list: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test getting a list by ID
   */
  async testGetList(config, logger, section, listId) {
    return await this.runTest(section, 'Get list by ID', async () => {
      try {
        const response = await api.get(`/api/lists/${listId}`);
        
        logger.debug('Get list response:', response.data);
        
        if (response.data && response.data.id === listId) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Failed to get list: Invalid response format or ID mismatch' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to get list: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test getting all lists
   */
  async testGetAllLists(config, logger, section) {
    return await this.runTest(section, 'Get all lists', async () => {
      try {
        const response = await api.get('/api/lists');
        
        logger.debug('Get all lists response:', response.data);
        
        if (Array.isArray(response.data) || Array.isArray(response.data.lists)) {
          const lists = Array.isArray(response.data) ? response.data : response.data.lists;
          return { 
            success: true,
            message: `Found ${lists.length} lists`
          };
        } else {
          return { 
            success: false, 
            message: 'Failed to get lists: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to get lists: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test updating a list
   */
  async testUpdateList(config, logger, section, listId) {
    return await this.runTest(section, 'Update list', async () => {
      try {
        const updateData = {
          name: `Updated Test List ${Date.now()}`,
          description: 'Updated by integration tests'
        };
        
        const response = await api.put(`/api/lists/${listId}`, updateData);
        
        logger.debug('Update list response:', response.data);
        
        // Check if update was successful
        const getResponse = await api.get(`/api/lists/${listId}`);
        
        if (getResponse.data && getResponse.data.name === updateData.name) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'List was updated but name does not match' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to update list: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test adding an item to a list
   */
  async testAddItemToList(config, logger, section, listId) {
    return await this.runTest(section, 'Add item to list', async () => {
      try {
        const itemData = {
          name: `Test Item ${Date.now()}`,
          description: 'Added by integration tests',
          location: 'Test Location'
        };
        
        const response = await api.post(`/api/lists/${listId}/items`, itemData);
        
        logger.debug('Add item response:', response.data);
        
        if (response.data && response.data.id) {
          return { 
            success: true,
            itemId: response.data.id
          };
        } else {
          return { 
            success: false, 
            message: 'Failed to add item: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to add item: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test getting list items
   */
  async testGetListItems(config, logger, section, listId) {
    return await this.runTest(section, 'Get list items', async () => {
      try {
        const response = await api.get(`/api/lists/${listId}/items`);
        
        logger.debug('Get list items response:', response.data);
        
        if (Array.isArray(response.data) || Array.isArray(response.data.items)) {
          const items = Array.isArray(response.data) ? response.data : response.data.items;
          return { 
            success: true,
            message: `Found ${items.length} items`
          };
        } else {
          return { 
            success: false, 
            message: 'Failed to get list items: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to get list items: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test updating a list item
   */
  async testUpdateListItem(config, logger, section, listId, itemId) {
    return await this.runTest(section, 'Update list item', async () => {
      try {
        const updateData = {
          name: `Updated Test Item ${Date.now()}`,
          description: 'Updated by integration tests',
          location: 'Updated Test Location'
        };
        
        const response = await api.put(`/api/lists/${listId}/items/${itemId}`, updateData);
        
        logger.debug('Update item response:', response.data);
        
        // Check if update was successful by getting the item
        const getResponse = await api.get(`/api/lists/${listId}/items`);
        const items = Array.isArray(getResponse.data) ? getResponse.data : getResponse.data.items;
        const updatedItem = items.find(item => item.id === itemId);
        
        if (updatedItem && updatedItem.name === updateData.name) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Item was updated but name does not match' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to update item: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test removing an item from a list
   */
  async testRemoveItemFromList(config, logger, section, listId, itemId) {
    return await this.runTest(section, 'Remove item from list', async () => {
      try {
        const response = await api.delete(`/api/lists/${listId}/items/${itemId}`);
        
        logger.debug('Remove item response:', response.data);
        
        // Check if removal was successful by getting the items
        const getResponse = await api.get(`/api/lists/${listId}/items`);
        const items = Array.isArray(getResponse.data) ? getResponse.data : getResponse.data.items;
        const removedItem = items.find(item => item.id === itemId);
        
        if (!removedItem) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Item was not removed from list' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to remove item: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test following a list
   */
  async testFollowList(config, logger, section, listId) {
    return await this.runTest(section, 'Follow list', async () => {
      try {
        const response = await api.post(`/api/lists/${listId}/follow`);
        
        logger.debug('Follow list response:', response.data);
        
        // Check if follow was successful
        if (response.status === 200 || response.status === 201) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Unexpected status code: ${response.status}` 
          };
        }
      } catch (error) {
        // If endpoint doesn't exist, try alternative
        try {
          const altResponse = await api.post(`/api/lists/follow/${listId}`);
          if (altResponse.status === 200 || altResponse.status === 201) {
            return { success: true };
          }
        } catch (altError) {
          // If both fail, this might be a permissions issue or the endpoint doesn't exist
          return { 
            success: false, 
            message: `Failed to follow list: ${error.message}` 
          };
        }
      }
    });
  },
  
  /**
   * Test getting followed lists
   */
  async testGetFollowedLists(config, logger, section) {
    return await this.runTest(section, 'Get followed lists', async () => {
      try {
        const response = await api.get('/api/lists/followed');
        
        logger.debug('Get followed lists response:', response.data);
        
        if (Array.isArray(response.data) || Array.isArray(response.data.lists)) {
          const lists = Array.isArray(response.data) ? response.data : response.data.lists;
          return { 
            success: true,
            message: `Found ${lists.length} followed lists`
          };
        } else {
          // Try alternative endpoint
          try {
            const altResponse = await api.get('/api/lists?followed=true');
            if (Array.isArray(altResponse.data) || Array.isArray(altResponse.data.lists)) {
              const lists = Array.isArray(altResponse.data) ? altResponse.data : altResponse.data.lists;
              return { 
                success: true,
                message: `Found ${lists.length} followed lists using alternative endpoint`
              };
            }
          } catch (altError) {
            // Ignore alternative endpoint errors
          }
          
          return { 
            success: false, 
            message: 'Failed to get followed lists: Invalid response format' 
          };
        }
      } catch (error) {
        // Try alternative endpoint
        try {
          const altResponse = await api.get('/api/lists?followed=true');
          if (Array.isArray(altResponse.data) || Array.isArray(altResponse.data.lists)) {
            const lists = Array.isArray(altResponse.data) ? altResponse.data : altResponse.data.lists;
            return { 
              success: true,
              message: `Found ${lists.length} followed lists using alternative endpoint`
            };
          }
        } catch (altError) {
          // If both fail, endpoint might not exist
          return { 
            success: false, 
            message: `Failed to get followed lists: ${error.message}` 
          };
        }
      }
    });
  },
  
  /**
   * Test unfollowing a list
   */
  async testUnfollowList(config, logger, section, listId) {
    return await this.runTest(section, 'Unfollow list', async () => {
      try {
        const response = await api.delete(`/api/lists/${listId}/follow`);
        
        logger.debug('Unfollow list response:', response.data);
        
        // Check if unfollow was successful
        if (response.status === 200 || response.status === 204) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Unexpected status code: ${response.status}` 
          };
        }
      } catch (error) {
        // If endpoint doesn't exist, try alternative
        try {
          const altResponse = await api.delete(`/api/lists/follow/${listId}`);
          if (altResponse.status === 200 || altResponse.status === 204) {
            return { success: true };
          }
        } catch (altError) {
          // If both fail, this might be a permissions issue or the endpoint doesn't exist
          return { 
            success: false, 
            message: `Failed to unfollow list: ${error.message}` 
          };
        }
      }
    });
  },
  
  /**
   * Test deleting a list
   */
  async testDeleteList(config, logger, section, listId) {
    return await this.runTest(section, 'Delete list', async () => {
      try {
        const response = await api.delete(`/api/lists/${listId}`);
        
        logger.debug('Delete list response:', response.data);
        
        // Check if delete was successful
        if (response.status === 200 || response.status === 204) {
          // Verify list is actually deleted
          try {
            await api.get(`/api/lists/${listId}`);
            return { 
              success: false, 
              message: 'List was not deleted (still accessible)' 
            };
          } catch (getError) {
            // If we get a 404, the list was deleted
            if (getError.response && getError.response.status === 404) {
              return { success: true };
            } else {
              return { 
                success: false, 
                message: `Unexpected error when verifying deletion: ${getError.message}` 
              };
            }
          }
        } else {
          return { 
            success: false, 
            message: `Unexpected status code: ${response.status}` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to delete list: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Helper method to create a test list for fast mode
   */
  async createTestList() {
    try {
      const response = await api.post('/api/lists', {
        name: 'Fast Mode Test List',
        description: 'Created for fast mode testing',
        isPrivate: false
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create test list for fast mode', error);
      return null;
    }
  },
  
  /**
   * Run a test and handle timing/logging
   */
  async runTest(section, name, testFn) {
    const startTime = performance.now();
    try {
      const result = await testFn();
      const duration = Math.round(performance.now() - startTime);
      
      if (result.success) {
        this.logger.test(section, name, 'PASSED', duration);
      } else if (result.skipped) {
        this.logger.test(section, name, 'SKIPPED', 0, result.message);
      } else {
        this.logger.test(section, name, 'FAILED', duration, result.message);
      }
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error.message || 'Unknown error';
      this.logger.test(section, name, 'FAILED', duration, message);
      this.logger.error(`Test execution error: ${name}`, error);
      return { success: false, message };
    }
  }
};

export default listTests;
