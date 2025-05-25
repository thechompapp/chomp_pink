/**
 * Quick Adds Integration Tests
 * Tests for quick add functionality
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { 
  login,
  createQuickAdd,
  getQuickAdds,
  updateQuickAdd,
  deleteQuickAdd,
  tokenStorage,
  createList
} from '../setup/robust-api-client.js';

// Test timeout (15 seconds)
const TEST_TIMEOUT = 15000;

// Test user credentials
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword',
  username: 'testuser'
};

// Test quick add data
const TEST_QUICK_ADD = {
  name: 'Test Quick Add',
  description: 'A test quick add',
  url: 'https://example.com',
  image_url: 'https://example.com/image.jpg',
  tags: ['test', 'example']
};

// Test list data
const TEST_LIST = {
  name: 'Test List for Quick Adds',
  description: 'A test list for quick add operations',
  isPublic: true
};

describe('Quick Adds Integration Tests', () => {
  let authToken;
  let testListId;
  let testQuickAddId;

  beforeAll(async () => {
    // Log in before running tests
    const loginResponse = await login(TEST_CREDENTIALS);
    expect(loginResponse.success).toBe(true, `Login failed: ${loginResponse.error || 'Unknown error'}`);
    authToken = loginResponse.data?.token;
    expect(authToken).toBeTruthy('No auth token received');

    // Create a test list
    const listResponse = await createList(TEST_LIST);
    expect(listResponse.success).toBe(true, 'Failed to create test list');
    testListId = listResponse.data.id;
    expect(testListId).toBeTruthy('No list ID received');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Clean up: Delete the test list
    if (testListId) {
      try {
        await deleteList(testListId);
      } catch (error) {
        console.warn('Failed to clean up test list:', error.message);
      }
    }
    
    // Clear the auth token
    tokenStorage.clearToken();
  });

  afterEach(async () => {
    // Clean up quick adds after each test
    if (testQuickAddId) {
      try {
        await deleteQuickAdd(testQuickAddId);
        testQuickAddId = null;
      } catch (error) {
        console.warn('Failed to clean up quick add:', error.message);
      }
    }
  });

  describe('Creating Quick Adds', () => {
    it('should create a new quick add', async () => {
      const response = await createQuickAdd({
        ...TEST_QUICK_ADD,
        list_id: testListId
      });
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(TEST_QUICK_ADD.name);
      expect(response.data.description).toBe(TEST_QUICK_ADD.description);
      expect(response.data.url).toBe(TEST_QUICK_ADD.url);
      expect(response.data.image_url).toBe(TEST_QUICK_ADD.image_url);
      expect(Array.isArray(response.data.tags)).toBe(true);
      expect(response.data.tags).toEqual(expect.arrayContaining(TEST_QUICK_ADD.tags));
      
      testQuickAddId = response.data.id;
    }, TEST_TIMEOUT);

    it('should require a valid list ID', async () => {
      const response = await createQuickAdd({
        ...TEST_QUICK_ADD,
        list_id: 'invalid-list-id'
      });
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    }, TEST_TIMEOUT);

    it('should validate required fields', async () => {
      const response = await createQuickAdd({
        // Missing required name and list_id
        description: 'Missing required fields'
      });
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.errors).toContain('name is required');
      expect(response.errors).toContain('list_id is required');
    }, TEST_TIMEOUT);
  });

  describe('Retrieving Quick Adds', () => {
    beforeEach(async () => {
      // Create a quick add for retrieval tests
      const response = await createQuickAdd({
        ...TEST_QUICK_ADD,
        list_id: testListId
      });
      testQuickAddId = response.data.id;
    }, TEST_TIMEOUT);

    it('should retrieve quick adds for a list', async () => {
      const response = await getQuickAdds({
        list_id: testListId
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      
      const quickAdd = response.data.find(qa => qa.id === testQuickAddId);
      expect(quickAdd).toBeDefined();
      expect(quickAdd.name).toBe(TEST_QUICK_ADD.name);
    }, TEST_TIMEOUT);

    it('should filter quick adds by tag', async () => {
      // Create another quick add with a different tag
      const otherQuickAdd = await createQuickAdd({
        name: 'Another Quick Add',
        description: 'With different tag',
        url: 'https://example.com/another',
        tags: ['other'],
        list_id: testListId
      });
      
      // Get quick adds with the test tag
      const response = await getQuickAdds({
        list_id: testListId,
        tag: 'test'
      });
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Should only include quick adds with the 'test' tag
      const hasTestTag = response.data.every(qa => 
        qa.tags && qa.tags.includes('test')
      );
      expect(hasTestTag).toBe(true);
      
      // Clean up the other quick add
      await deleteQuickAdd(otherQuickAdd.data.id);
    }, TEST_TIMEOUT);
  });

  describe('Updating Quick Adds', () => {
    beforeEach(async () => {
      // Create a quick add for update tests
      const response = await createQuickAdd({
        ...TEST_QUICK_ADD,
        list_id: testListId
      });
      testQuickAddId = response.data.id;
    }, TEST_TIMEOUT);

    it('should update a quick add', async () => {
      const updates = {
        name: 'Updated Quick Add Name',
        description: 'Updated description',
        tags: ['updated', 'test']
      };
      
      const response = await updateQuickAdd(testQuickAddId, updates);
      
      expect(response.success).toBe(true);
      expect(response.data.name).toBe(updates.name);
      expect(response.data.description).toBe(updates.description);
      expect(response.data.tags).toEqual(expect.arrayContaining(updates.tags));
    }, TEST_TIMEOUT);

    it('should validate updates', async () => {
      const response = await updateQuickAdd(testQuickAddId, {
        name: '' // Invalid: empty name
      });
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    }, TEST_TIMEOUT);
  });

  describe('Deleting Quick Adds', () => {
    it('should delete a quick add', async () => {
      // Create a quick add to delete
      const createResponse = await createQuickAdd({
        ...TEST_QUICK_ADD,
        list_id: testListId
      });
      const quickAddId = createResponse.data.id;
      
      // Delete it
      const deleteResponse = await deleteQuickAdd(quickAddId);
      expect(deleteResponse.success).toBe(true);
      
      // Verify it's gone
      const getResponse = await getQuickAdds({
        list_id: testListId,
        id: quickAddId
      });
      
      expect(getResponse.success).toBe(true);
      expect(getResponse.data.length).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle deleting non-existent quick adds', async () => {
      const response = await deleteQuickAdd('non-existent-id');
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    }, TEST_TIMEOUT);
  });

  describe('Quick Add Limits', () => {
    const MAX_QUICK_ADDS = 50; // Example limit, adjust based on your app's settings
    
    it(`should enforce the maximum number of quick adds (${MAX_QUICK_ADDS}) per list`, async () => {
      // Create quick adds up to the limit
      const quickAddIds = [];
      let reachedLimit = false;
      
      try {
        for (let i = 0; i < MAX_QUICK_ADDS + 5; i++) {
          const response = await createQuickAdd({
            name: `Quick Add ${i + 1}`,
            description: `Test quick add #${i + 1}`,
            url: `https://example.com/${i}`,
            list_id: testListId
          });
          
          if (response.success) {
            quickAddIds.push(response.data.id);
          } else if (response.status === 429) {
            // Reached the limit
            reachedLimit = true;
            break;
          }
        }
        
        // Should have reached the limit
        expect(reachedLimit).toBe(true);
        expect(quickAddIds.length).toBe(MAX_QUICK_ADDS);
        
      } finally {
        // Clean up
        await Promise.all(
          quickAddIds.map(id => deleteQuickAdd(id).catch(console.error))
        );
      }
    }, TEST_TIMEOUT * 2);
  });
}, TEST_TIMEOUT * 2);
