/**
 * List Follows/Unfollows Integration Tests
 * Tests for following and unfollowing lists
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { 
  login,
  createList,
  followList,
  unfollowList,
  getListFollowers,
  getFollowedLists,
  deleteList,
  tokenStorage
} from '../setup/robust-api-client.js';

// Test timeout (15 seconds)
const TEST_TIMEOUT = 15000;

// Test user credentials
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword',
  username: 'testuser'
};

// Test list data
const TEST_LIST = {
  name: 'Test List for Follows',
  description: 'A test list for follow/unfollow operations',
  isPublic: true
};

describe('List Follows/Unfollows Integration Tests', () => {
  let authToken;
  let testListId;
  let testUserId;

  beforeAll(async () => {
    // Log in before running tests
    const loginResponse = await login(TEST_CREDENTIALS);
    expect(loginResponse.success).toBe(true, `Login failed: ${loginResponse.error || 'Unknown error'}`);
    authToken = loginResponse.data?.token;
    testUserId = loginResponse.data?.user?.id;
    expect(authToken).toBeTruthy('No auth token received');
    expect(testUserId).toBeTruthy('No user ID received');

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

  describe('Following Lists', () => {
    it('should follow a public list', async () => {
      const response = await followList(testListId);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('list_id', testListId);
      expect(response.data).toHaveProperty('user_id', testUserId);
      expect(response.data).toHaveProperty('followed_at');
    }, TEST_TIMEOUT);

    it('should not allow following the same list twice', async () => {
      const response = await followList(testListId);
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(409); // Conflict
    }, TEST_TIMEOUT);

    it('should appear in user\'s followed lists', async () => {
      const response = await getFollowedLists();
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      
      const followedList = response.data.find(list => list.id === testListId);
      expect(followedList).toBeDefined();
      expect(followedList.name).toBe(TEST_LIST.name);
    }, TEST_TIMEOUT);
  });

  describe('Unfollowing Lists', () => {
    it('should unfollow a list', async () => {
      const response = await unfollowList(testListId);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('unfollowed', true);
    }, TEST_TIMEOUT);

    it('should not be in user\'s followed lists after unfollowing', async () => {
      const response = await getFollowedLists();
      
      expect(response.success).toBe(true);
      if (Array.isArray(response.data)) {
        const followedList = response.data.find(list => list.id === testListId);
        expect(followedList).toBeUndefined();
      }
    }, TEST_TIMEOUT);

    it('should handle unfollowing a not-followed list gracefully', async () => {
      const response = await unfollowList(testListId);
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    }, TEST_TIMEOUT);
  });

  describe('List Followers', () => {
    beforeAll(async () => {
      // Follow the list again for these tests
      await followList(testListId);
    }, TEST_TIMEOUT);

    it('should get list of followers', async () => {
      const response = await getListFollowers(testListId);
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      
      const follower = response.data.find(f => f.user_id === testUserId);
      expect(follower).toBeDefined();
      expect(follower).toHaveProperty('username', TEST_CREDENTIALS.username);
    }, TEST_TIMEOUT);

    it('should return empty array for list with no followers', async () => {
      // Create a new list with no followers
      const newList = await createList({
        name: 'Empty List',
        description: 'A list with no followers',
        isPublic: true
      });
      
      const response = await getListFollowers(newList.data.id);
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
      
      // Clean up
      await deleteList(newList.data.id);
    }, TEST_TIMEOUT);
  });

  describe('Private Lists', () => {
    let privateListId;
    
    beforeAll(async () => {
      // Create a private list
      const privateList = await createList({
        name: 'Private Test List',
        description: 'A private test list',
        isPublic: false
      });
      privateListId = privateList.data.id;
    }, TEST_TIMEOUT);
    
    afterAll(async () => {
      // Clean up private list
      if (privateListId) {
        await deleteList(privateListId);
      }
    });
    
    it('should not allow following a private list without permission', async () => {
      const response = await followList(privateListId);
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(403); // Forbidden
    });
  });

  describe('Follow Counts', () => {
    it('should update follow count when following/unfollowing', async () => {
      // Get initial follow count
      const initialList = await getList(testListId);
      const initialFollowerCount = initialList.data.follower_count || 0;
      
      // Follow the list
      await followList(testListId);
      
      // Verify count increased
      const afterFollow = await getList(testListId);
      expect(afterFollow.data.follower_count).toBe(initialFollowerCount + 1);
      
      // Unfollow the list
      await unfollowList(testListId);
      
      // Verify count decreased
      const afterUnfollow = await getList(testListId);
      expect(afterUnfollow.data.follower_count).toBe(initialFollowerCount);
    }, TEST_TIMEOUT);
  });
}, TEST_TIMEOUT * 2);
