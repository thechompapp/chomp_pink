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
    const list = await listModel.findListByIdRaw(id);
    if (!list) {
      throw new Error(`List with ID ${id} not found`);
    }
    return list;
  },

  // Get lists created by or followed by a user
  getUserLists: async (userId, options = {}) => {
    logDebug(`[ListService.getUserLists] Fetching lists for user ${userId} with options:`, options);
    try {
      // Map view parameter to model options
      const { view = 'all', ...otherOptions } = options;
      
      let modelOptions = { ...otherOptions };
      
      // Set the appropriate filtering based on view
      if (view === 'created') {
        modelOptions.createdByUser = true;
        modelOptions.followedByUser = false;
        modelOptions.allLists = false;
      } else if (view === 'followed') {
        modelOptions.createdByUser = false;
        modelOptions.followedByUser = true;
        modelOptions.allLists = false;
      } else {
        // 'all' view - show both created and followed lists
        modelOptions.createdByUser = false;
        modelOptions.followedByUser = false;
        modelOptions.allLists = true;
      }
      
      logDebug(`[ListService.getUserLists] Calling model with options:`, modelOptions);
      
      const result = await listModel.findListsByUser(userId, modelOptions);
      logDebug(`[ListService.getUserLists] Result from model:`, {
        hasData: !!result,
        dataLength: Array.isArray(result) ? result.length : 0,
      });
      
      // Wrap the result in the expected structure for the controller
      return {
        success: true,
        data: result || [],
        total: Array.isArray(result) ? result.length : 0,
        pagination: {
          page: modelOptions.page || 1,
          limit: modelOptions.limit || 10,
          total: Array.isArray(result) ? result.length : 0,
          totalPages: Math.ceil((Array.isArray(result) ? result.length : 0) / (modelOptions.limit || 10))
        }
      };
    } catch (error) {
      logDebug(`[ListService.getUserLists] Error:`, error.message);
      throw error;
    }
  },
  
  // Get items in a list
  getListItems: async (listId, options = {}) => {
    console.log(`[ListService.getListItems] Called with listId: ${listId}, options:`, options);
    logDebug(`[ListService.getListItems] Fetching items for list ${listId} with options:`, options);
    
    try {
      const items = await listModel.findListItemsByListId(listId, options);
      console.log(`[ListService.getListItems] Model returned:`, items);
      
      // Return items directly - the service wrapper will handle the wrapping
      console.log(`[ListService.getListItems] Returning items directly:`, items);
      return items || [];
    } catch (error) {
      console.error(`[ListService.getListItems] Error:`, error);
      console.error(`[ListService.getListItems] Error stack:`, error.stack);
      throw error;
    }
  },
  
  // Create a new list
  createList: async (listData, userId, userHandle) => {
    logDebug(`[ListService.createList] Creating new list:`, listData, `for user ${userId} (${userHandle})`);
    const newList = await listModel.createList(listData, userId, userHandle);
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
    
    // Extract the required fields from itemData
    const { itemId, itemType, notes } = itemData;
    
    if (!itemId || !itemType) {
      throw new Error('itemId and itemType are required');
    }
    
    // Call the model with the correct parameters
    const newItem = await listModel.addItemToList(listId, itemId, itemType);
    
    // Return the new item with any additional data
    return {
      data: newItem,
      success: true
    };
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