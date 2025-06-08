/**
 * List Service - Central Export Module
 * 
 * This module maintains 100% backward compatibility with the original listService
 * while providing access to the new modular architecture.
 * 
 * All existing imports and usage patterns continue to work unchanged.
 */

import { logDebug } from '@/utils/logger';

// Import all modular components
import {
  listOperations,
  listItemOperations,
  followOperations,
  searchOperations,
  userListOperations,
  bulkOperations
} from './ListOperations';

import {
  listCrudApi,
  listItemApi,
  followApi,
  searchApi,
  bulkApi,
  advancedApi
} from './ListApiClient';

import {
  idValidator,
  paramValidator,
  batchValidator
} from './ListValidation';

import {
  responseProcessor,
  dataTransformer,
  errorProcessor,
  specializedHandlers
} from './ListResponseHandler';

import { listErrorHandler } from './ListErrorHandler';

/**
 * Backward-compatible listService object
 * 
 * This maintains the exact same API surface as the original listService
 * while internally using the new modular architecture.
 */
const listService = {
  // ===== CORE LIST OPERATIONS =====
  
  /**
   * Fetch all lists with optional query parameters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Standardized response
   */
  getLists: async function(params = {}) {
    logDebug('[listService] getLists called (backward compatibility wrapper)');
    return await listOperations.getLists(params);
  },

  /**
   * Fetch a specific list by its ID
   * @param {string} id - List ID
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} - Standardized response
   */
  getList: async function(id, userId = null) {
    logDebug('[listService] getList called (backward compatibility wrapper)');
    return await listOperations.getList(id, userId);
  },

  /**
   * Fetch detailed information about a specific list including items
   * @param {string} id - List ID
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} - Standardized response
   */
  getListDetails: async function(id, userId = null) {
    logDebug('[listService] getListDetails called (backward compatibility wrapper)');
    return await listOperations.getList(id, userId);
  },

  /**
   * Create a new list
   * @param {Object} listData - List creation data
   * @returns {Promise<Object>} - Standardized response
   */
  createList: async function(listData) {
    logDebug('[listService] createList called (backward compatibility wrapper)');
    return await listOperations.createList(listData);
  },

  /**
   * Update an existing list by its ID
   * @param {string} id - List ID
   * @param {Object} listData - Updated list data
   * @returns {Promise<Object>} - Standardized response
   */
  updateList: async function(id, listData) {
    logDebug('[listService] updateList called (backward compatibility wrapper)');
    return await listOperations.updateList(id, listData);
  },

  /**
   * Delete a list by its ID
   * @param {string} id - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  deleteList: async function(id) {
    logDebug('[listService] deleteList called (backward compatibility wrapper)');
    return await listOperations.deleteList(id);
  },

  // ===== LIST ITEM OPERATIONS =====

  /**
   * Fetch items within a specific list
   * @param {string} listId - List ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Standardized response
   */
  getListItems: async function(listId, params = {}) {
    logDebug('[listService] getListItems called (backward compatibility wrapper)');
    return await listItemOperations.getListItems(listId, params);
  },

  /**
   * Add an item to a specific list
   * @param {string} listId - List ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} - Standardized response
   */
  addItemToList: async function(listId, itemData) {
    logDebug('[listService] addItemToList called (backward compatibility wrapper)');
    return await listItemOperations.addItemToList(listId, itemData);
  },

  /**
   * Update an item within a list
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} - Standardized response
   */
  updateListItem: async function(listId, itemId, itemData) {
    logDebug('[listService] updateListItem called (backward compatibility wrapper)');
    return await listItemOperations.updateListItem(listId, itemId, itemData);
  },

  /**
   * Remove an item from a list
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} - Standardized response
   */
  deleteListItem: async function(listId, itemId) {
    logDebug('[listService] deleteListItem called (backward compatibility wrapper)');
    return await listItemOperations.deleteListItem(listId, itemId);
  },

  // ===== SEARCH OPERATIONS =====

  /**
   * Search lists by term and type
   * @param {string} searchTerm - Search term
   * @param {string} searchType - Search type
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Standardized response
   */
  searchLists: async function(searchTerm, searchType = 'all', options = {}) {
    logDebug('[listService] searchLists called (backward compatibility wrapper)');
    return await searchOperations.searchLists(searchTerm, searchType, options);
  },

  /**
   * Method to get list suggestions for autocomplete or quick search
   * @param {string} query - Query string
   * @param {Object} options - Suggestion options
   * @returns {Promise<Object>} - Standardized response
   */
  getListSuggestions: async function(query, options = {}) {
    logDebug('[listService] getListSuggestions called (backward compatibility wrapper)');
    return await searchOperations.getListSuggestions(query, options);
  },

  // ===== USER LIST OPERATIONS =====

  /**
   * Fetches lists for a specific user with consistent response structure
   * @param {string|Object} userIdOrParams - User ID or parameters object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Standardized response
   */
  getUserLists: async function(userIdOrParams, options = {}) {
    logDebug('[listService] getUserLists called (backward compatibility wrapper)');
    return await userListOperations.getUserLists(userIdOrParams, options);
  },

  // ===== FOLLOW OPERATIONS =====

  /**
   * Fetch lists followed by a specific user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Standardized response
   */
  getFollowedLists: async function(userId, params = {}) {
    logDebug('[listService] getFollowedLists called (backward compatibility wrapper)');
    return await followOperations.getFollowedLists(userId, params);
  },

  /**
   * User follows a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  followList: async function(listId) {
    logDebug('[listService] followList called (backward compatibility wrapper)');
    return await followOperations.followList(listId);
  },

  /**
   * User unfollows a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  unfollowList: async function(listId) {
    logDebug('[listService] unfollowList called (backward compatibility wrapper)');
    return await followOperations.unfollowList(listId);
  },

  /**
   * Toggle follow status for a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  toggleFollowList: async function(listId) {
    logDebug('[listService] toggleFollowList called (backward compatibility wrapper)');
    return await followOperations.toggleFollowList(listId);
  },

  /**
   * Check if a user follows a specific list
   * @param {string} listId - List ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Standardized response
   */
  checkFollowStatus: async function(listId, userId) {
    logDebug('[listService] checkFollowStatus called (backward compatibility wrapper)');
    try {
      const useFollowStore = require('../../stores/useFollowStore').default;
      const isFollowed = useFollowStore.getState().followedLists[listId] || false;
      return { success: true, data: { is_followed: isFollowed } };
    } catch (error) {
      return { success: false, error: error.message, message: `Failed to check follow status for list ${listId}` };
    }
  },

  // ===== BULK OPERATIONS =====

  /**
   * Add multiple items to a list (bulk operation)
   * @param {string} listId - List ID
   * @param {Array} items - Array of item data
   * @returns {Promise<Object>} - Standardized response
   */
  addItemsToListBulk: async function(listId, items) {
    logDebug('[listService] addItemsToListBulk called (backward compatibility wrapper)');
    return await bulkOperations.addItemsToListBulk(listId, items);
  },

  /**
   * Reorder items within a list
   * @param {string} listId - List ID
   * @param {Array} orderedItemIds - Array of item IDs in new order
   * @returns {Promise<Object>} - Standardized response
   */
  reorderListItems: async function(listId, orderedItemIds) {
    logDebug('[listService] reorderListItems called (backward compatibility wrapper)');
    try {
      const safeId = idValidator.validateId(listId, 'listId');
      const response = await listItemApi.reorderListItems(safeId, orderedItemIds);
      return responseProcessor.processSingleItemResponse(response);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Reorder list items', { listId, orderedItemIds });
    }
  },

  // ===== MULTI-LIST OPERATIONS =====

  /**
   * Get public lists
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getPublicLists: async function(options = {}) {
    logDebug('[listService] getPublicLists called (backward compatibility wrapper)');
    return await listOperations.getLists({ 
      ...options, 
      isPublic: true 
    });
  },

  /**
   * Get lists curated by the platform or featured lists
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getFeaturedLists: async function(options = {}) {
    logDebug('[listService] getFeaturedLists called (backward compatibility wrapper)');
    try {
      const response = await advancedApi.getFeaturedLists(options);
      return responseProcessor.processSuccessResponse(response, options);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get featured lists', { params: options });
    }
  },

  /**
   * Add a dish to multiple lists
   * @param {string} dishId - Dish ID
   * @param {Array} listIds - Array of list IDs
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} - Standardized response
   */
  addDishToMultipleLists: async function(dishId, listIds, notes = null) {
    logDebug('[listService] addDishToMultipleLists called (backward compatibility wrapper)');
    return await bulkOperations.addDishToMultipleLists(dishId, listIds, notes);
  },

  /**
   * Add a restaurant to multiple lists
   * @param {string} restaurantId - Restaurant ID
   * @param {Array} listIds - Array of list IDs
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} - Standardized response
   */
  addRestaurantToMultipleLists: async function(restaurantId, listIds, notes = null) {
    logDebug('[listService] addRestaurantToMultipleLists called (backward compatibility wrapper)');
    try {
      const safeRestaurantId = idValidator.validateId(restaurantId, 'restaurantId');
      const safeListIds = batchValidator.validateMultipleListIds(listIds);
      
      const payload = { restaurant_id: safeRestaurantId, list_ids: safeListIds };
      if (notes) payload.notes = notes;
      
      const response = await bulkApi.addToMultipleLists(payload);
      return responseProcessor.processBulkResponse(response);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Add restaurant to multiple lists', {
        restaurantId, listIds, notes
      });
    }
  },

  // ===== ADVANCED OPERATIONS =====

  /**
   * Fetch lists that contain a specific dish ID
   * @param {string} dishId - Dish ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getListsContainingDish: async function(dishId, options = {}) {
    logDebug('[listService] getListsContainingDish called (backward compatibility wrapper)');
    try {
      const safeDishId = idValidator.validateId(dishId, 'dishId');
      const params = { dish_id: safeDishId, ...options };
      const response = await bulkApi.getListsContainingItem(params);
      return responseProcessor.processSuccessResponse(response, params);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get lists containing dish', { dishId, ...options });
    }
  },

  /**
   * Fetch lists that contain a specific restaurant ID
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getListsContainingRestaurant: async function(restaurantId, options = {}) {
    logDebug('[listService] getListsContainingRestaurant called (backward compatibility wrapper)');
    try {
      const safeRestaurantId = idValidator.validateId(restaurantId, 'restaurantId');
      const params = { restaurant_id: safeRestaurantId, ...options };
      const response = await bulkApi.getListsContainingItem(params);
      return responseProcessor.processSuccessResponse(response, params);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get lists containing restaurant', { restaurantId, ...options });
    }
  },

  /**
   * Get metadata or summary for multiple lists by their IDs
   * @param {Array} listIds - Array of list IDs
   * @returns {Promise<Object>} - Standardized response
   */
  getMultipleListSummary: async function(listIds) {
    logDebug('[listService] getMultipleListSummary called (backward compatibility wrapper)');
    try {
      if (!listIds || listIds.length === 0) {
        return { success: true, data: [] };
      }
      const safeListIds = batchValidator.validateMultipleListIds(listIds);
      const response = await bulkApi.getMultipleListSummary(safeListIds);
      return responseProcessor.processSuccessResponse(response);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get multiple list summary', { listIds });
    }
  },

  /**
   * Duplicate an existing list
   * @param {string} listId - List ID to duplicate
   * @param {string} newName - Optional new name
   * @param {boolean} makePublic - Optional public setting
   * @returns {Promise<Object>} - Standardized response
   */
  duplicateList: async function(listId, newName = null, makePublic = null) {
    logDebug('[listService] duplicateList called (backward compatibility wrapper)');
    try {
      const safeId = idValidator.validateId(listId, 'listId');
      const payload = {};
      if (newName) payload.name = newName;
      if (typeof makePublic === 'boolean') payload.is_public = makePublic;
      
      const response = await advancedApi.duplicateList(safeId, payload);
      return responseProcessor.processSingleItemResponse(response);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Duplicate list', { listId, newName, makePublic });
    }
  },

  /**
   * Get a user's recently viewed or interacted lists
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getRecentListsForUser: async function(userId, options = {}) {
    logDebug('[listService] getRecentListsForUser called (backward compatibility wrapper)');
    try {
      const safeUserId = idValidator.validateId(userId, 'userId');
      const response = await advancedApi.getRecentListsForUser(safeUserId, options);
      return responseProcessor.processSuccessResponse(response, options);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get recent lists for user', { userId, ...options });
    }
  },

  /**
   * Merge two lists
   * @param {string} sourceListId - Source list ID
   * @param {string} targetListId - Target list ID
   * @param {Object} options - Merge options
   * @returns {Promise<Object>} - Standardized response
   */
  mergeLists: async function(sourceListId, targetListId, options = {}) {
    logDebug('[listService] mergeLists called (backward compatibility wrapper)');
    try {
      const safeSourceId = idValidator.validateId(sourceListId, 'sourceListId');
      const safeTargetId = idValidator.validateId(targetListId, 'targetListId');
      
      const payload = {
        source_list_id: safeSourceId,
        target_list_id: safeTargetId,
        options: options
      };
      
      const response = await advancedApi.mergeLists(payload);
      return responseProcessor.processSingleItemResponse(response);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Merge lists', { sourceListId, targetListId, options });
    }
  },

  /**
   * Get list activity feed
   * @param {string} listId - List ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getListActivity: async function(listId, options = {}) {
    logDebug('[listService] getListActivity called (backward compatibility wrapper)');
    try {
      const safeId = idValidator.validateId(listId, 'listId');
      const response = await advancedApi.getListActivity(safeId, options);
      return responseProcessor.processSuccessResponse(response, options);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get list activity', { listId, ...options });
    }
  },

  /**
   * Fetch details for multiple list items by their global IDs
   * @param {Array} listItemIds - Array of list item IDs
   * @returns {Promise<Object>} - Standardized response
   */
  getMultipleListItemsDetails: async function(listItemIds) {
    logDebug('[listService] getMultipleListItemsDetails called (backward compatibility wrapper)');
    try {
      if (!listItemIds || listItemIds.length === 0) {
        return { success: true, data: [] };
      }
      const safeIds = idValidator.validateIdArray(listItemIds, 'listItemIds');
      const response = await bulkApi.getMultipleListItemsDetails(safeIds);
      return responseProcessor.processSuccessResponse(response);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get multiple list items details', { listItemIds });
    }
  },

  /**
   * Get a shareable link or details for a list
   * @param {string} listId - List ID
   * @param {Object} shareOptions - Share options
   * @returns {Promise<Object>} - Standardized response
   */
  getShareableListLink: async function(listId, shareOptions = {}) {
    logDebug('[listService] getShareableListLink called (backward compatibility wrapper)');
    try {
      const listDetails = await listOperations.getList(listId);
      if (listDetails.success) {
        const shareUrl = `${window.location.origin}/lists/${listDetails.data.id}`;
        return { 
          success: true, 
          data: { ...listDetails.data, share_url: shareUrl }, 
          message: 'Shareable link information ready.' 
        };
      } else {
        throw new Error(listDetails.message || 'Failed to get list details');
      }
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get shareable list link', { listId, shareOptions });
    }
  },

  /**
   * Fetch lists that a user has collaborated on
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Standardized response
   */
  getCollaboratingLists: async function(userId, options = {}) {
    logDebug('[listService] getCollaboratingLists called (backward compatibility wrapper)');
    try {
      const safeUserId = idValidator.validateId(userId, 'userId');
      const response = await advancedApi.getCollaboratingLists(safeUserId, options);
      return responseProcessor.processSuccessResponse(response, options);
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get collaborating lists', { userId, ...options });
    }
  },

  /**
   * Method to handle following/unfollowing a list, used by FollowButton
   * @param {string} id - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  handleFollowList: async function(id) {
    logDebug('[listService] handleFollowList called (backward compatibility wrapper)');
    return await followOperations.toggleFollowList(id);
  }
};

// ===== MODULAR EXPORTS =====

/**
 * Export modular components for advanced usage
 * 
 * These provide direct access to the modular architecture
 * for applications that want to use specific components.
 */
export {
  // High-level operations
  listOperations,
  listItemOperations,
  followOperations,
  searchOperations,
  userListOperations,
  bulkOperations,
  
  // Low-level API clients
  listCrudApi,
  listItemApi,
  followApi,
  searchApi,
  bulkApi,
  advancedApi,
  
  // Validation utilities
  idValidator,
  paramValidator,
  batchValidator,
  
  // Response processing
  responseProcessor,
  dataTransformer,
  errorProcessor,
  specializedHandlers,
  
  // Error handling
  listErrorHandler
};

// ===== DEFAULT EXPORT =====

/**
 * Default export maintains backward compatibility
 * 
 * Existing code can continue to use:
 * import listService from './listService'
 * or
 * import { listService } from './listService'
 */
export { listService };
export default listService;
