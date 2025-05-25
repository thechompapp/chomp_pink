// Filename: test/services/listService.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';
import listService from '../../src/services/listService';

// API configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Simple fetch wrapper for API calls with per-request timeout
const apiRequest = async (method, path, data = null, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Test-Request': 'true',
    ...options.headers
  };

  // Per-request timeout (ms)
  const REQUEST_TIMEOUT = 10000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const config = {
    method,
    headers,
    credentials: 'include',
    signal: controller.signal,
    ...options
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`[TEST] ${method.toUpperCase()} ${url}`);
    const response = await fetch(url, config);
    clearTimeout(timeout);
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
      config: { url, ...config }
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.error(`[TEST] API Error (TIMEOUT after ${REQUEST_TIMEOUT}ms): ${method} ${url}`);
      throw new Error(`[API TIMEOUT] ${method} ${url} after ${REQUEST_TIMEOUT}ms`);
    }
    console.error(`[TEST] API Error (${method} ${path}):`, error);
    throw error;
  }
};

// Increase test timeout to 30 seconds for API calls
const TEST_TIMEOUT = 30000;

// Test configuration
const TEST_LIST_NAME = 'Test List ' + Math.random().toString(36).substring(7);
const TEST_ITEM = {
  item_id: 1, // This should be a valid item ID in your system
  item_type: 'restaurant',
  notes: 'Test note'
};

// Store created test data for cleanup
let testListId = null;
let testItemId = null;

describe('listService', () => {
  // Create a test list before running tests
  beforeAll(async () => {
    // Set a timeout for the beforeAll hook
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay before starting tests
    try {
      const response = await apiRequest('POST', '/lists', {
        name: TEST_LIST_NAME,
        description: 'Test list for integration tests',
        is_public: true,
        list_type: 'restaurant'
      });
      
      if (response.data && response.data.id) {
        testListId = response.data.id;
        console.log(`Created test list with ID: ${testListId}`);
        
        // Add a test item
        const itemResponse = await apiRequest('POST', `/lists/${testListId}/items`, TEST_ITEM);
        if (itemResponse.data && itemResponse.data.id) {
          testItemId = itemResponse.data.id;
        }
      }
      console.log('[DEBUG] beforeAll: finished');
    } catch (error) {
      console.error('[DEBUG] beforeAll: ERROR', error);
      throw error;
    }
  }, TEST_TIMEOUT);
  
  // Clean up test data after all tests
  afterAll(async () => {
    try {
      if (testListId) {
        try {
          await apiRequest('DELETE', `/lists/${testListId}`);
        } catch (error) {
          console.warn('[DEBUG] afterAll: Cleanup warning:', error.message);
        }
      }
      console.log('[DEBUG] afterAll: finished');
    } catch (err) {
      console.error('[DEBUG] afterAll: ERROR', err);
      throw err;
    }
  }, TEST_TIMEOUT);

  // --- getListDetails ---
  describe('getListDetails', () => {
    it('should fetch list details from the API', async () => {
      console.log('[DEBUG] Test: should fetch list details from the API');
      try {
        jest.setTimeout(TEST_TIMEOUT);
        if (!testListId) {
          throw new Error('Test list not created');
        }
        const result = await listService.getListDetails(testListId);
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testListId);
        expect(result.data.name).toBe(TEST_LIST_NAME);
        console.log('[DEBUG] Test: should fetch list details from the API - done');
      } catch (err) {
        console.error('[DEBUG] Test: should fetch list details from the API - ERROR', err);
        throw err;
      }
    }, TEST_TIMEOUT);

    it('should handle missing listId', async () => {
      try {
        const result = await listService.getListDetails(null);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('listId')
        });
        console.log('[DEBUG] Test: should handle missing listId - done');
      } catch (err) {
        console.error('[DEBUG] Test: should handle missing listId - ERROR', err);
        throw err;
      }
    }, TEST_TIMEOUT);

    it('should handle non-existent list', async () => {
      try {
        const nonExistentId = 9999999; // Assuming this ID doesn't exist
        const result = await listService.getListDetails(nonExistentId);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('Failed to fetch list:')
        });
        console.log('[DEBUG] Test: should handle non-existent list - done');
      } catch (err) {
        console.error('[DEBUG] Test: should handle non-existent list - ERROR', err);
        throw err;
      }
    }, TEST_TIMEOUT);
  });

  // --- createList ---
  describe('createList', () => {
    it('should create a new list via the API', async () => {
      console.log('[DEBUG] Test: should create a new list via the API');
      try {
      jest.setTimeout(TEST_TIMEOUT);
      const newListData = {
        name: 'New Test List ' + Math.random().toString(36).substring(7),
        description: 'Test Description',
        is_public: true,
        list_type: 'restaurant'
      };

      const result = await listService.createList(newListData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(newListData.name);
      expect(result.data.description).toBe(newListData.description);
      expect(result.data.is_public).toBe(true);
      expect(result.data.list_type).toBe('restaurant');

        // Clean up the created list
        if (result.data && result.data.id) {
          await apiRequest('DELETE', `/lists/${result.data.id}`);
        }
      } catch (error) {
        console.error('[DEBUG] Test: should create a new list via the API - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle missing list data', async () => {
      console.log('[DEBUG] Test: should handle missing list data');
      try {
        const result = await listService.createList(null);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('list data')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing list data - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  // --- deleteList ---
  describe('deleteList', () => {
    it('should delete a list via the API', async () => {
      console.log('[DEBUG] Test: should delete a list via the API');
      try {
        jest.setTimeout(TEST_TIMEOUT);
        if (!testListId) {
          throw new Error('Test list not created');
        }
        
        // First create a list to delete
        const createResponse = await apiRequest('POST', '/lists', {
          name: 'List to delete ' + Math.random().toString(36).substring(7),
          description: 'Will be deleted',
          is_public: true,
          list_type: 'restaurant'
        });
        
        const listToDeleteId = createResponse.data.id;
        
        // Now delete it
        const result = await listService.deleteList(listToDeleteId);
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);

        // Verify it's gone
        try {
          await apiRequest('GET', `/lists/${listToDeleteId}`);
          // If we get here, the list still exists
          throw new Error('List was not deleted');
        } catch (error) {
          // We expect a 404 error
          expect(error.response.status).toBe(404);
        }
      } catch (error) {
        console.error('[DEBUG] Test: should delete a list via the API - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing listId', async () => {
      try {
        const result = await listService.deleteList(null);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('listId')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing listId - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle non-existent list', async () => {
      try {
        const nonExistentId = 9999999;
        const result = await listService.deleteList(nonExistentId);
        
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('Failed to delete list')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle non-existent list - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  // --- addItemToList ---
  describe('addItemToList', () => {
    it('should add an item to a list via the API', async () => {
      console.log('[DEBUG] Test: should add an item to a list via the API');
      try {
        jest.setTimeout(TEST_TIMEOUT);
        if (!testListId) {
          throw new Error('Test list not created');
        }
        
        const itemData = {
          item_id: 1, // This should be a valid item ID in your system
          item_type: 'restaurant',
          notes: 'Test note ' + Math.random().toString(36).substring(7)
        };
        
        const result = await listService.addItemToList(testListId, itemData);
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.list_id).toBe(testListId);
        expect(result.data.item_id).toBe(itemData.item_id);
        expect(result.data.item_type).toBe(itemData.item_type);
        expect(result.data.notes).toBe(itemData.notes);
      } catch (error) {
        console.error('[DEBUG] Test: should add an item to a list via the API - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing listId', async () => {
      try {
        const result = await listService.addItemToList(null, { item_id: 1, item_type: 'restaurant' });
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('listId')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing listId - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing item data', async () => {
      console.log('[DEBUG] Test: should handle missing item data (addItemToList)');
      try {
        const result = await listService.addItemToList('test-list-id', null);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('item data')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing item data - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  // --- removeItemFromList ---
  describe('removeItemFromList', () => {
    it('should remove an item from a list via the API', async () => {
      console.log('[DEBUG] Test: should remove an item from a list via the API');
      try {
        jest.setTimeout(TEST_TIMEOUT);
        if (!testListId || !testItemId) {
          throw new Error('Test data not properly set up');
        }
        
        // First, verify the item exists
        const getResponse = await apiRequest('GET', `/lists/${testListId}/items/${testItemId}`);
        expect(getResponse.status).toBe(200);
        expect(getResponse.data.id).toBe(testItemId);

        // Now remove it
        const result = await listService.removeItemFromList(testListId, testItemId);
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);

        // Verify it's gone
        try {
          await apiRequest('GET', `/lists/${testListId}/items/${testItemId}`);
          // If we get here, the item still exists
          throw new Error('Item was not removed from the list');
        } catch (error) {
          // We expect a 404 error
          expect(error.response.status).toBe(404);
        }
      } catch (error) {
        console.error('[DEBUG] Test: should remove an item from a list via the API - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing listId', async () => {
      try {
        const result = await listService.removeItemFromList(null, 1);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('listId')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing listId - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing itemId', async () => {
      try {
        const result = await listService.removeItemFromList('test-list-id', null);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('itemId')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing itemId - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  // --- updateListItem ---
  describe('updateListItem', () => {
    let testItemId;
    
    beforeAll(async () => {
      console.log('[DEBUG] updateListItem beforeAll: starting');
      try {
        // Add a test item to update
        if (testListId) {
          const response = await apiRequest('POST', `/lists/${testListId}/items`, {
            item_id: 1,
            item_type: 'restaurant',
            notes: 'Initial note'
          });
          testItemId = response.data.id;
        }
      } catch (error) {
        console.error('[DEBUG] updateListItem beforeAll: ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    afterAll(async () => {
      console.log('[DEBUG] updateListItem afterAll: cleaning up');
      try {
        // Clean up the test item
        if (testListId && testItemId) {
          try {
            await apiRequest('DELETE', `/lists/${testListId}/items/${testItemId}`);
          } catch (error) {
            console.warn('Failed to clean up test item:', error.message);
          }
        }
        console.log('[DEBUG] updateListItem afterAll: finished');
      } catch (err) {
        console.error('[DEBUG] updateListItem afterAll: ERROR', err);
        throw err;
      }
    }, TEST_TIMEOUT);

    it('should update a list item via the API', async () => {
      console.log('[DEBUG] Test: should update a list item via the API');
      try {
        if (!testListId || !testItemId) {
          throw new Error('Test data not properly set up');
        }

        const updateData = {
          notes: 'Updated note'
        };

        const result = await listService.updateListItem(testListId, testItemId, updateData);
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testItemId);
        expect(result.data.notes).toBe(updateData.notes);
      } catch (error) {
        console.error('[DEBUG] Test: should update a list item via the API - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing listId', async () => {
      try {
        const result = await listService.updateListItem(null, 1, { notes: 'test' });
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('listId')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing listId - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing itemId', async () => {
      try {
        const result = await listService.updateListItem('test-list-id', null, { notes: 'test' });
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('itemId')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing itemId - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
    
    it('should handle missing update data', async () => {
      console.log('[DEBUG] Test: should handle missing update data (updateListItem)');
      try {
        const result = await listService.updateListItem('test-list-id', 1, null);
        expect(result).toMatchObject({
          success: false,
          message: expect.stringContaining('update data')
        });
      } catch (error) {
        console.error('[DEBUG] Test: should handle missing update data - ERROR:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  // --- getLists ---
  describe('getLists', () => {
    it('should fetch lists from the API', async () => {
      console.log('[DEBUG] Test: should fetch lists from the API');
      try {
        const params = {
          page: 1,
          limit: 10,
          list_type: 'restaurant'
        };
        const result = await listService.getLists(params);
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
        // If we have the test list, verify it's in the results
        if (testListId) {
          const testList = result.data.find(list => list.id === testListId);
          expect(testList).toBeDefined();
          expect(testList.name).toBe(TEST_LIST_NAME);
        }
        console.log('[DEBUG] Test: should fetch lists from the API - done');
      } catch (err) {
        console.error('[DEBUG] Test: should fetch lists from the API - ERROR', err);
        throw err;
      }
    }, TEST_TIMEOUT);
    
    it('should handle empty params', async () => {
      console.log('[DEBUG] Test: should handle empty params (getLists)');
      try {
        const result = await listService.getLists({});
        expect(result).toMatchObject({
          success: true,
          data: expect.any(Array)
        });
        console.log('[DEBUG] Test: should handle empty params (getLists) - done');
      } catch (err) {
        console.error('[DEBUG] Test: should handle empty params (getLists) - ERROR', err);
        throw err;
      }
    }, TEST_TIMEOUT);
  });
});