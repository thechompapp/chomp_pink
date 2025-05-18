/**
 * ListService - Provides access to list data and operations
 * 
 * Uses the serviceWrapper for standardized:
 * - Error handling
 * - Response formatting
 * - Logging
 * - Caching
 */
import { createService, createServiceMethod } from '../utils/serviceWrapper.js';
import * as listModel from '../models/listModel.js';
import { logDebug } from '../utils/logger.js';

// Helper to generate cache keys for list operations
const getCacheKeyForList = (listId) => `list:${listId}`;
const getCacheKeyForUserLists = (userId, options) => `user:${userId}:lists:${JSON.stringify(options)}`;
const getCacheKeyForListItems = (listId, options) => `list:${listId}:items:${JSON.stringify(options)}`;

/**
 * Raw service methods that will be wrapped
 */
const rawMethods = {
  // Get a specific list by ID
  getList: async (id, userId = null) => {
    logDebug(`[ListService.getList] Fetching list ${id} for user ${userId || 'anonymous'}`);
    const list = await listModel.findListById(id, userId);
    if (!list) {
      throw new Error(`List with ID ${id} not found`);
    }
    return list;
  },

  // Get lists created by or followed by a user
  getUserLists: async (userId, options = {}) => {
    logDebug(`[ListService.getUserLists] Fetching lists for user ${userId} with options:`, options);
    return await listModel.findListsByUser(userId, options);
  },
  
  // Get items in a list
  getListItems: async (listId, options = {}) => {
    logDebug(`[ListService.getListItems] Fetching items for list ${listId} with options:`, options);
    const result = await listModel.findListItems(listId, options);
    if (!result || !result.data) {
      return { data: [], total: 0 };
    }
    return result;
  },
  
  // Create a new list
  createList: async (listData) => {
    logDebug(`[ListService.createList] Creating new list:`, listData);
    const newList = await listModel.createList(listData);
    return newList;
  },
  
  // Update an existing list
  updateList: async (id, listData) => {
    logDebug(`[ListService.updateList] Updating list ${id} with:`, listData);
    const updated = await listModel.updateList(id, listData);
    if (!updated) {
      throw new Error(`List with ID ${id} not found or could not be updated`);
    }
    return updated;
  },
  
  // Delete a list
  deleteList: async (id) => {
    logDebug(`[ListService.deleteList] Deleting list ${id}`);
    const deleted = await listModel.deleteList(id);
    if (!deleted) {
      throw new Error(`List with ID ${id} not found or could not be deleted`);
    }
    return { success: true, message: 'List deleted successfully' };
  },
  
  // Add an item to a list
  addItemToList: async (listId, itemData) => {
    logDebug(`[ListService.addItemToList] Adding item to list ${listId}:`, itemData);
    const newItem = await listModel.addListItem(listId, itemData);
    return newItem;
  },
  
  // Remove an item from a list
  removeItemFromList: async (listId, itemId) => {
    logDebug(`[ListService.removeItemFromList] Removing item ${itemId} from list ${listId}`);
    const removed = await listModel.removeListItem(listId, itemId);
    if (!removed) {
      throw new Error(`Item ${itemId} in list ${listId} not found or could not be removed`);
    }
    return { success: true, message: 'Item removed successfully' };
  },
  
  // Search lists
  searchLists: async (searchTerm, options = {}) => {
    logDebug(`[ListService.searchLists] Searching lists with term "${searchTerm}" and options:`, options);
    return await listModel.searchLists(searchTerm, options);
  },
  
  // Toggle following a list
  toggleFollowList: async (userId, listId) => {
    logDebug(`[ListService.toggleFollowList] Toggling follow for user ${userId} on list ${listId}`);
    const result = await listModel.toggleListFollow(userId, listId);
    return result;
  },
  
  // Check if a user is following a list
  isUserFollowingList: async (userId, listId) => {
    logDebug(`[ListService.isUserFollowingList] Checking if user ${userId} follows list ${listId}`);
    return await listModel.checkListFollow(userId, listId);
  }
};

/**
 * Create the service with wrapped methods
 */
const listService = createService({
  name: 'ListService',
  methods: {
    // READ operations (cacheable)
    getList: {
      fn: rawMethods.getList,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      getCacheKey: (id, userId) => `${getCacheKeyForList(id)}:${userId || 'anon'}`
    },
    getUserLists: {
      fn: rawMethods.getUserLists,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
      getCacheKey: getCacheKeyForUserLists
    },
    getListItems: {
      fn: rawMethods.getListItems,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
      getCacheKey: getCacheKeyForListItems
    },
    searchLists: {
      fn: rawMethods.searchLists,
      enableCache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes (shorter for search results)
      getCacheKey: (term, options) => `lists:search:${term}:${JSON.stringify(options)}`
    },
    isUserFollowingList: {
      fn: rawMethods.isUserFollowingList,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
      getCacheKey: (userId, listId) => `user:${userId}:follows:list:${listId}`
    },
    
    // WRITE operations (not cached)
    createList: {
      fn: rawMethods.createList
    },
    updateList: {
      fn: rawMethods.updateList
    },
    deleteList: {
      fn: rawMethods.deleteList
    },
    addItemToList: {
      fn: rawMethods.addItemToList
    },
    removeItemFromList: {
      fn: rawMethods.removeItemFromList
    },
    toggleFollowList: {
      fn: rawMethods.toggleFollowList
    }
  },
  // Global options for all methods
  options: {
    transformResponse: (data) => {
      // If data is already in our expected format, return it
      if (!data) return null;
      
      // Ensure consistent property naming
      if (Array.isArray(data)) {
        return data.map(item => {
          // Normalize property names if needed
          return item;
        });
      }
      
      return data;
    }
  }
});

export default listService; 