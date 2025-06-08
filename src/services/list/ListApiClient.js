/**
 * List API Client
 * 
 * Single Responsibility: Pure HTTP communication with list-related endpoints
 * - Basic CRUD operations for lists and list items
 * - Follow/unfollow operations
 * - Search and discovery operations
 * - Bulk operations
 */

import apiClient from '../apiClient';
import { logDebug, logInfo } from '@/utils/logger';

/**
 * Core list CRUD operations
 */
export const listCrudApi = {
  /**
   * Get lists with query parameters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getLists(params = {}) {
    logDebug('[ListApiClient] getLists called with params:', params);
    return apiClient.get('/lists', { params });
  },

  /**
   * Get a specific list by ID
   * @param {string} listId - List ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getList(listId, params = {}) {
    logDebug(`[ListApiClient] getList called for ID: ${listId}`);
    return apiClient.get(`/lists/${listId}`, { params });
  },

  /**
   * Create a new list
   * @param {Object} listData - List creation data
   * @returns {Promise<Object>} - Raw API response
   */
  async createList(listData) {
    logDebug('[ListApiClient] createList called');
    return apiClient.post('/lists', listData);
  },

  /**
   * Update an existing list
   * @param {string} listId - List ID
   * @param {Object} listData - Updated list data
   * @returns {Promise<Object>} - Raw API response
   */
  async updateList(listId, listData) {
    logDebug(`[ListApiClient] updateList called for ID: ${listId}`);
    return apiClient.put(`/lists/${listId}`, listData);
  },

  /**
   * Delete a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Raw API response
   */
  async deleteList(listId) {
    logDebug(`[ListApiClient] deleteList called for ID: ${listId}`);
    return apiClient.delete(`/lists/${listId}`);
  }
};

/**
 * List item operations
 */
export const listItemApi = {
  /**
   * Get items for a specific list
   * @param {string} listId - List ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getListItems(listId, params = {}) {
    logDebug(`[ListApiClient] getListItems called for list: ${listId}`);
    return apiClient.get(`/lists/${listId}/items`, { params });
  },

  /**
   * Add an item to a list
   * @param {string} listId - List ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} - Raw API response
   */
  async addItemToList(listId, itemData) {
    logDebug(`[ListApiClient] addItemToList called for list: ${listId}`);
    return apiClient.post(`/lists/${listId}/items`, itemData);
  },

  /**
   * Update a list item
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} - Raw API response
   */
  async updateListItem(listId, itemId, itemData) {
    logDebug(`[ListApiClient] updateListItem called for list: ${listId}, item: ${itemId}`);
    return apiClient.put(`/lists/${listId}/items/${itemId}`, itemData);
  },

  /**
   * Remove an item from a list
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} - Raw API response
   */
  async deleteListItem(listId, itemId) {
    logDebug(`[ListApiClient] deleteListItem called for list: ${listId}, item: ${itemId}`);
    return apiClient.delete(`/lists/${listId}/items/${itemId}`);
  },

  /**
   * Bulk add items to a list
   * @param {string} listId - List ID
   * @param {Array} items - Array of item data
   * @returns {Promise<Object>} - Raw API response
   */
  async addItemsToListBulk(listId, items) {
    logDebug(`[ListApiClient] addItemsToListBulk called for list: ${listId}, items count: ${items.length}`);
    return apiClient.post(`/lists/${listId}/items/bulk`, { items });
  },

  /**
   * Reorder items within a list
   * @param {string} listId - List ID
   * @param {Array} orderedItemIds - Array of item IDs in new order
   * @returns {Promise<Object>} - Raw API response
   */
  async reorderListItems(listId, orderedItemIds) {
    logDebug(`[ListApiClient] reorderListItems called for list: ${listId}`);
    return apiClient.put(`/lists/${listId}/items/reorder`, { orderedItemIds });
  }
};

/**
 * Follow/unfollow operations
 */
export const followApi = {
  /**
   * Follow a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Raw API response
   */
  async followList(listId) {
    logDebug(`[ListApiClient] followList called for ID: ${listId}`);
    return apiClient.post(`/lists/${listId}/follow`);
  },

  /**
   * Unfollow a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Raw API response
   */
  async unfollowList(listId) {
    logDebug(`[ListApiClient] unfollowList called for ID: ${listId}`);
    return apiClient.post(`/lists/${listId}/unfollow`);
  },

  /**
   * Get lists followed by a user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getFollowedLists(userId, params = {}) {
    logDebug(`[ListApiClient] getFollowedLists called for user: ${userId}`);
    return apiClient.get(`/users/${userId}/followed-lists`, { params });
  }
};

/**
 * Search and discovery operations
 */
export const searchApi = {
  /**
   * Search lists by term and type
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async searchLists(params) {
    logDebug('[ListApiClient] searchLists called with params:', params);
    return apiClient.get('/lists/search', { params });
  },

  /**
   * Get list suggestions for autocomplete
   * @param {Object} params - Suggestion parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getListSuggestions(params) {
    logDebug('[ListApiClient] getListSuggestions called');
    return apiClient.get('/lists/suggestions', { params });
  },

  /**
   * Get featured lists
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getFeaturedLists(params = {}) {
    logDebug('[ListApiClient] getFeaturedLists called');
    return apiClient.get('/lists/featured', { params });
  }
};

/**
 * Bulk and multi-list operations
 */
export const bulkApi = {
  /**
   * Add dish to multiple lists
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} - Raw API response
   */
  async addToMultipleLists(payload) {
    logDebug('[ListApiClient] addToMultipleLists called');
    return apiClient.post('/lists/items/add-to-multiple', payload);
  },

  /**
   * Get lists containing specific item
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getListsContainingItem(params) {
    logDebug('[ListApiClient] getListsContainingItem called');
    return apiClient.get('/lists/containing-item', { params });
  },

  /**
   * Get summary for multiple lists
   * @param {Array} listIds - Array of list IDs
   * @returns {Promise<Object>} - Raw API response
   */
  async getMultipleListSummary(listIds) {
    logDebug(`[ListApiClient] getMultipleListSummary called for ${listIds.length} lists`);
    return apiClient.get('/lists/summary', { params: { 'ids[]': listIds } });
  },

  /**
   * Get details for multiple list items
   * @param {Array} listItemIds - Array of list item IDs
   * @returns {Promise<Object>} - Raw API response
   */
  async getMultipleListItemsDetails(listItemIds) {
    logDebug(`[ListApiClient] getMultipleListItemsDetails called for ${listItemIds.length} items`);
    return apiClient.get('/list-items/details', { params: { 'ids[]': listItemIds } });
  }
};

/**
 * Advanced list operations
 */
export const advancedApi = {
  /**
   * Duplicate a list
   * @param {string} listId - List ID to duplicate
   * @param {Object} payload - Duplication options
   * @returns {Promise<Object>} - Raw API response
   */
  async duplicateList(listId, payload = {}) {
    logDebug(`[ListApiClient] duplicateList called for ID: ${listId}`);
    return apiClient.post(`/lists/${listId}/duplicate`, payload);
  },

  /**
   * Merge two lists
   * @param {Object} payload - Merge configuration
   * @returns {Promise<Object>} - Raw API response
   */
  async mergeLists(payload) {
    logDebug('[ListApiClient] mergeLists called');
    return apiClient.post('/lists/merge', payload);
  },

  /**
   * Get list activity feed
   * @param {string} listId - List ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getListActivity(listId, params = {}) {
    logDebug(`[ListApiClient] getListActivity called for ID: ${listId}`);
    return apiClient.get(`/lists/${listId}/activity`, { params });
  },

  /**
   * Get recent lists for a user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getRecentListsForUser(userId, params = {}) {
    logDebug(`[ListApiClient] getRecentListsForUser called for user: ${userId}`);
    return apiClient.get(`/users/${userId}/recent-lists`, { params });
  },

  /**
   * Get lists user collaborates on
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Raw API response
   */
  async getCollaboratingLists(userId, params = {}) {
    logDebug(`[ListApiClient] getCollaboratingLists called for user: ${userId}`);
    return apiClient.get(`/users/${userId}/collaborating-lists`, { params });
  }
};

/**
 * Fallback API methods for authentication issues
 */
export const fallbackApi = {
  /**
   * Get list without authentication (fallback)
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Raw fetch response
   */
  async getListWithoutAuth(listId) {
    logInfo(`[ListApiClient] getListWithoutAuth fallback for ID: ${listId}`);
    const response = await fetch(`/api/lists/${listId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Get list items without authentication (fallback)
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Raw fetch response
   */
  async getListItemsWithoutAuth(listId) {
    logInfo(`[ListApiClient] getListItemsWithoutAuth fallback for ID: ${listId}`);
    const response = await fetch(`/api/lists/${listId}/items`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}; 