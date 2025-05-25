/**
 * Simplified Lists Test
 * 
 * This file contains tests for the lists endpoints
 * using our robust API client.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  login, 
  createList, 
  getLists, 
  getList, 
  updateList, 
  deleteList,
  tokenStorage 
} from '../setup/robust-api-client.js';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

// Test user credentials
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword',
  username: 'testuser'
};

// Test list data
const TEST_LIST = {
  name: 'Test List',
  description: 'This is a test list',
  isPublic: true
};

describe('Lists API Integration Tests', () => {
  let createdListId;
  let authToken;

  beforeAll(async () => {
    // Log in before running tests
    const loginResponse = await login(TEST_CREDENTIALS);
    expect(loginResponse.success).toBe(true, `Login failed: ${loginResponse.error || 'Unknown error'}`);
    authToken = loginResponse.data?.token;
    expect(authToken).toBeTruthy('No auth token received');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Clean up: Delete the created list if it exists
    if (createdListId) {
      try {
        await deleteList(createdListId);
      } catch (error) {
        console.warn('Failed to clean up test list:', error.message);
      }
    }
    
    // Clear the auth token
    tokenStorage.clearToken();
  });

  it('should create a new list', async () => {
    const response = await createList(TEST_LIST);
    expect(response.success, `Create list failed: ${response.error || 'Unknown error'}`).toBe(true);
    expect(response.data).toHaveProperty('id');
    expect(response.data.name).toBe(TEST_LIST.name);
    createdListId = response.data.id;
  }, TEST_TIMEOUT);

  it('should get all lists', async () => {
    const response = await getLists();
    expect(response.success, `Get lists failed: ${response.error || 'Unknown error'}`).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    
    // Verify the created list is in the response
    const foundList = response.data.find(list => list.id === createdListId);
    expect(foundList).toBeDefined();
    expect(foundList.name).toBe(TEST_LIST.name);
  }, TEST_TIMEOUT);

  it('should get a specific list', async () => {
    const response = await getList(createdListId);
    expect(response.success, `Get list failed: ${response.error || 'Unknown error'}`).toBe(true);
    expect(response.data.id).toBe(createdListId);
    expect(response.data.name).toBe(TEST_LIST.name);
  }, TEST_TIMEOUT);

  it('should update a list', async () => {
    const updatedData = { 
      ...TEST_LIST, 
      name: 'Updated Test List',
      description: 'Updated description'
    };
    
    const response = await updateList(createdListId, updatedData);
    expect(response.success, `Update list failed: ${response.error || 'Unknown error'}`).toBe(true);
    expect(response.data.name).toBe(updatedData.name);
    expect(response.data.description).toBe(updatedData.description);
    
    // Verify the update by fetching the list again
    const getResponse = await getList(createdListId);
    expect(getResponse.data.name).toBe(updatedData.name);
  }, TEST_TIMEOUT);

  it('should delete a list', async () => {
    // First create a new list to delete
    const createResponse = await createList({
      ...TEST_LIST,
      name: 'List to be deleted'
    });
    expect(createResponse.success).toBe(true, 'Failed to create test list for delete test');
    
    const listToDeleteId = createResponse.data.id;
    
    // Now delete it
    const deleteResponse = await deleteList(listToDeleteId);
    expect(deleteResponse.success, `Delete list failed: ${deleteResponse.error || 'Unknown error'}`).toBe(true);
    
    // Verify the list is deleted
    const getResponse = await getList(listToDeleteId);
    expect(getResponse.success).toBe(false);
    expect(getResponse.status).toBe(404);
  }, TEST_TIMEOUT);

  it('should handle non-existent list', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await getList(nonExistentId);
    expect(response.success).toBe(false);
    expect(response.status).toBe(404);
  }, TEST_TIMEOUT);

}, TEST_TIMEOUT * 2); // Give the whole suite more time
