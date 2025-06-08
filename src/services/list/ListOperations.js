/**
 * List Operations
 * 
 * Single Responsibility: Business logic operations and workflows
 * - Coordinate between API client, validation, and response handling
 * - Manage store integrations and state updates
 * - Handle engagement tracking and analytics
 * - Provide high-level business operations
 */

import { logDebug, logInfo } from '@/utils/logger';
import { logEngagement } from '@/utils/logEngagement';
import useFollowStore from '../../stores/useFollowStore';

// Import our modular components
import {
  listCrudApi,
  listItemApi,
  followApi,
  searchApi,
  bulkApi,
  advancedApi
} from './ListApiClient';

import {
  responseProcessor,
  specializedHandlers,
  dataTransformer
} from './ListResponseHandler';

import {
  idValidator,
  paramValidator,
  batchValidator
} from './ListValidation';

import { listErrorHandler } from './ListErrorHandler';

/**
 * Core list operations
 */
export const listOperations = {
  /**
   * Get lists with parameter validation and response processing
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Standardized response
   */
  async getLists(params = {}) {
    logDebug('[ListOperations] getLists called');
    
    try {
      // Validate and sanitize parameters
      const validatedParams = paramValidator.validateGetListsParams(params);
      
      // Make API request
      const response = await listCrudApi.getLists(validatedParams);
      
      // Process response
      const result = responseProcessor.processSuccessResponse(response, validatedParams);
      
      // Transform data if successful
      if (result.success && result.data) {
        result.data = dataTransformer.normalizeLists(result.data);
      }
      
      logInfo('[ListOperations] getLists completed successfully', {
        dataLength: result.data?.length,
        pagination: result.pagination
      });
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get lists', { params });
    }
  },

  /**
   * Get a specific list with fallback handling
   * @param {string} id - List ID
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} - Standardized response
   */
  async getList(id, userId = null) {
    logDebug(`[ListOperations] getList called for ID: ${id}`);
    
    try {
      // Validate ID
      const safeId = idValidator.validateId(id, 'listId');
      const params = userId ? { userId } : {};
      
      // Make API request
      const response = await listCrudApi.getList(safeId, params);
      
      // Process response
      const result = responseProcessor.processSingleItemResponse(response);
      
      logInfo(`[ListOperations] getList completed for ID: ${safeId}`);
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get list', {
        listId: id,
        operation: 'getList',
        allowFallback: true
      });
    }
  },

  /**
   * Create a new list with validation
   * @param {Object} listData - List creation data
   * @returns {Promise<Object>} - Standardized response
   */
  async createList(listData) {
    logDebug('[ListOperations] createList called');
    
    try {
      // Validate list data
      const validatedData = paramValidator.validateListCreationData(listData);
      
      // Make API request
      const response = await listCrudApi.createList(validatedData);
      
      // Process response
      const result = responseProcessor.processSingleItemResponse(response);
      
      if (result.success) {
        logEngagement('list_create', {
          list_id: result.data?.id,
          list_name: result.data?.name,
          list_type: result.data?.listType || 'mixed',
          location: 'ListOperations.createList'
        });
        
        logInfo('[ListOperations] List created successfully', {
          listId: result.data?.id
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Create list', { data: listData });
    }
  },

  /**
   * Update an existing list
   * @param {string} id - List ID
   * @param {Object} listData - Updated list data
   * @returns {Promise<Object>} - Standardized response
   */
  async updateList(id, listData) {
    logDebug(`[ListOperations] updateList called for ID: ${id}`);
    
    try {
      // Validate ID and data
      const safeId = idValidator.validateId(id, 'listId');
      const validatedData = paramValidator.validateListCreationData(listData);
      
      // Make API request
      const response = await listCrudApi.updateList(safeId, validatedData);
      
      // Process response
      const result = responseProcessor.processSingleItemResponse(response);
      
      if (result.success) {
        logEngagement('list_update', {
          list_id: safeId,
          location: 'ListOperations.updateList'
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Update list', {
        listId: id,
        data: listData
      });
    }
  },

  /**
   * Delete a list
   * @param {string} id - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  async deleteList(id) {
    logDebug(`[ListOperations] deleteList called for ID: ${id}`);
    
    try {
      // Validate ID
      const safeId = idValidator.validateId(id, 'listId');
      
      // Make API request
      const response = await listCrudApi.deleteList(safeId);
      
      // Process response
      const result = responseProcessor.processSingleItemResponse(response);
      
      if (result.success) {
        logEngagement('list_delete', {
          list_id: safeId,
          location: 'ListOperations.deleteList'
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Delete list', { listId: id });
    }
  }
};

/**
 * List item operations
 */
export const listItemOperations = {
  /**
   * Get items for a specific list
   * @param {string} listId - List ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Standardized response
   */
  async getListItems(listId, params = {}) {
    logDebug(`[ListOperations] getListItems called for list: ${listId}`);
    
    try {
      // Validate ID and parameters
      const safeId = idValidator.validateId(listId, 'listId');
      const validatedParams = paramValidator.validateGetListsParams(params);
      
      // Make API request
      const response = await listItemApi.getListItems(safeId, validatedParams);
      
      // Process response
      const result = responseProcessor.processSuccessResponse(response, validatedParams);
      
      // Transform data if successful
      if (result.success && result.data) {
        result.data = dataTransformer.normalizeListItems(result.data);
      }
      
      logInfo(`[ListOperations] getListItems completed for list: ${safeId}`, {
        itemCount: result.data?.length
      });
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get list items', {
        listId,
        operation: 'getListItems',
        allowFallback: true
      });
    }
  },

  /**
   * Add an item to a list
   * @param {string} listId - List ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} - Standardized response
   */
  async addItemToList(listId, itemData) {
    logDebug(`[ListOperations] addItemToList called for list: ${listId}`);
    
    try {
      // Validate ID and item data
      const safeId = idValidator.validateId(listId, 'listId');
      const validatedData = paramValidator.validateListItemData(itemData);
      
      // Make API request
      const response = await listItemApi.addItemToList(safeId, validatedData);
      
      // Process response
      const result = responseProcessor.processSingleItemResponse(response);
      
      if (result.success) {
        logEngagement('list_item_add', {
          list_id: safeId,
          item_type: validatedData.type,
          dish_id: validatedData.dish_id,
          restaurant_id: validatedData.restaurant_id,
          location: 'ListOperations.addItemToList'
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Add item to list', {
        listId,
        data: itemData
      });
    }
  },

  /**
   * Update a list item
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} - Standardized response
   */
  async updateListItem(listId, itemId, itemData) {
    logDebug(`[ListOperations] updateListItem called`);
    
    try {
      // Validate IDs and data
      const safeListId = idValidator.validateId(listId, 'listId');
      const safeItemId = idValidator.validateId(itemId, 'itemId');
      const validatedData = paramValidator.validateListItemData(itemData);
      
      // Make API request
      const response = await listItemApi.updateListItem(safeListId, safeItemId, validatedData);
      
      // Process response
      return responseProcessor.processSingleItemResponse(response);
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Update list item', {
        listId,
        itemId,
        data: itemData
      });
    }
  },

  /**
   * Delete a list item
   * @param {string} listId - List ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} - Standardized response
   */
  async deleteListItem(listId, itemId) {
    logDebug(`[ListOperations] deleteListItem called`);
    
    try {
      // Validate IDs
      const safeListId = idValidator.validateId(listId, 'listId');
      const safeItemId = idValidator.validateId(itemId, 'itemId');
      
      // Make API request
      const response = await listItemApi.deleteListItem(safeListId, safeItemId);
      
      // Process response
      const result = responseProcessor.processSingleItemResponse(response);
      
      if (result.success) {
        logEngagement('list_item_remove', {
          list_id: safeListId,
          item_id: safeItemId,
          location: 'ListOperations.deleteListItem'
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Delete list item', {
        listId,
        itemId
      });
    }
  }
};

/**
 * Follow operations with store integration
 */
export const followOperations = {
  /**
   * Follow a list with store updates
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  async followList(listId) {
    logDebug(`[ListOperations] followList called for ID: ${listId}`);
    
    try {
      // Validate ID
      const safeId = idValidator.validateId(listId, 'listId');
      
      // Make API request
      const response = await followApi.followList(safeId);
      
      // Process response
      const result = specializedHandlers.handleFollowResponse(response, safeId);
      
      if (result.success) {
        // Update follow store
        useFollowStore.getState().setFollowState(safeId, true);
        
        logEngagement('list_follow', {
          list_id: safeId,
          location: 'ListOperations.followList'
        });
        
        logInfo(`[ListOperations] Successfully followed list: ${safeId}`);
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Follow list', {
        listId,
        wasFollowing: false
      });
    }
  },

  /**
   * Unfollow a list with store updates
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  async unfollowList(listId) {
    logDebug(`[ListOperations] unfollowList called for ID: ${listId}`);
    
    try {
      // Validate ID
      const safeId = idValidator.validateId(listId, 'listId');
      
      // Make API request
      const response = await followApi.unfollowList(safeId);
      
      // Process response
      const result = specializedHandlers.handleFollowResponse(response, safeId);
      
      if (result.success) {
        // Update follow store
        useFollowStore.getState().setFollowState(safeId, false);
        
        logEngagement('list_unfollow', {
          list_id: safeId,
          location: 'ListOperations.unfollowList'
        });
        
        logInfo(`[ListOperations] Successfully unfollowed list: ${safeId}`);
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Unfollow list', {
        listId,
        wasFollowing: true
      });
    }
  },

  /**
   * Toggle follow status for a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} - Standardized response
   */
  async toggleFollowList(listId) {
    logDebug(`[ListOperations] toggleFollowList called for ID: ${listId}`);
    
    try {
      // Validate ID
      const safeId = idValidator.validateId(listId, 'listId');
      
      // Check current follow status
      const currentStatus = useFollowStore.getState().followedLists[safeId] || false;
      
      // Call appropriate operation
      if (currentStatus) {
        return await this.unfollowList(safeId);
      } else {
        return await this.followList(safeId);
      }
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Toggle follow list', { listId });
    }
  },

  /**
   * Get lists followed by a user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Standardized response
   */
  async getFollowedLists(userId, params = {}) {
    logDebug(`[ListOperations] getFollowedLists called for user: ${userId}`);
    
    try {
      // Validate ID and parameters
      const safeUserId = idValidator.validateId(userId, 'userId');
      const validatedParams = paramValidator.validateGetListsParams(params);
      
      // Make API request
      const response = await followApi.getFollowedLists(safeUserId, validatedParams);
      
      // Process response
      const result = responseProcessor.processSuccessResponse(response, validatedParams);
      
      // Transform data if successful
      if (result.success && result.data) {
        result.data = dataTransformer.normalizeLists(result.data);
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get followed lists', {
        userId,
        params
      });
    }
  }
};

/**
 * Search operations
 */
export const searchOperations = {
  /**
   * Search lists with parameter validation
   * @param {string} searchTerm - Search term
   * @param {string} searchType - Search type
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Standardized response
   */
  async searchLists(searchTerm, searchType = 'all', options = {}) {
    logDebug('[ListOperations] searchLists called', { searchTerm, searchType });
    
    try {
      // Validate search parameters
      const searchParams = paramValidator.validateSearchParams({
        term: searchTerm,
        type: searchType,
        ...options
      });
      
      // Make API request
      const response = await searchApi.searchLists(searchParams);
      
      // Process response
      const result = specializedHandlers.handleSearchResponse(response, searchParams);
      
      // Transform data if successful
      if (result.success && result.data) {
        result.data = dataTransformer.normalizeLists(result.data);
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Search lists', {
        params: { term: searchTerm, type: searchType, ...options }
      });
    }
  },

  /**
   * Get list suggestions for autocomplete
   * @param {string} query - Query string
   * @param {Object} options - Suggestion options
   * @returns {Promise<Object>} - Standardized response
   */
  async getListSuggestions(query, options = {}) {
    logDebug('[ListOperations] getListSuggestions called');
    
    try {
      const params = { q: query, limit: 5, ...options };
      
      // Make API request
      const response = await searchApi.getListSuggestions(params);
      
      // Process response
      return responseProcessor.processSuccessResponse(response, params);
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get list suggestions', { params: { query, ...options } });
    }
  }
};

/**
 * User-specific list operations
 */
export const userListOperations = {
  /**
   * Get lists for a specific user with consistent formatting
   * @param {string|Object} userIdOrParams - User ID or parameters object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Standardized response
   */
  async getUserLists(userIdOrParams, options = {}) {
    logDebug('[ListOperations] getUserLists called');
    
    try {
      // Parse parameters
      let params = {
        page: 1,
        limit: 10,
        listType: null,
        includePrivate: false,
        ...(typeof userIdOrParams === 'object' ? userIdOrParams : { userId: userIdOrParams }),
        ...options
      };
      
      // Validate parameters
      const validatedParams = paramValidator.validateGetListsParams(params);
      
      // Call base getLists operation
      const result = await listOperations.getLists({
        ...validatedParams,
        isPublic: validatedParams.includePrivate ? undefined : true
      });
      
      // Apply user-specific formatting
      return specializedHandlers.handleUserListsResponse(
        { data: result, status: 200 },
        validatedParams
      );
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Get user lists', {
        params: userIdOrParams
      });
    }
  }
};

/**
 * Bulk operations
 */
export const bulkOperations = {
  /**
   * Add items to list in bulk
   * @param {string} listId - List ID
   * @param {Array} items - Array of items to add
   * @returns {Promise<Object>} - Standardized response
   */
  async addItemsToListBulk(listId, items) {
    logDebug(`[ListOperations] addItemsToListBulk called for list: ${listId}`);
    
    try {
      // Validate ID and items
      const safeId = idValidator.validateId(listId, 'listId');
      const validatedItems = batchValidator.validateBulkItems(
        items,
        paramValidator.validateListItemData
      );
      
      // Make API request
      const response = await listItemApi.addItemsToListBulk(safeId, validatedItems);
      
      // Process response
      const result = responseProcessor.processBulkResponse(response);
      
      if (result.success) {
        logEngagement('list_bulk_add', {
          list_id: safeId,
          item_count: validatedItems.length,
          location: 'ListOperations.addItemsToListBulk'
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Bulk add items to list', {
        listId,
        items
      });
    }
  },

  /**
   * Add dish to multiple lists
   * @param {string} dishId - Dish ID
   * @param {Array} listIds - Array of list IDs
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} - Standardized response
   */
  async addDishToMultipleLists(dishId, listIds, notes = null) {
    logDebug('[ListOperations] addDishToMultipleLists called');
    
    try {
      // Validate parameters
      const safeDishId = idValidator.validateId(dishId, 'dishId');
      const safeListIds = batchValidator.validateMultipleListIds(listIds);
      
      const payload = { dish_id: safeDishId, list_ids: safeListIds };
      if (notes) payload.notes = notes;
      
      // Make API request
      const response = await bulkApi.addToMultipleLists(payload);
      
      // Process response
      const result = responseProcessor.processBulkResponse(response);
      
      if (result.success) {
        logEngagement('dish_add_multiple_lists', {
          dish_id: safeDishId,
          list_count: safeListIds.length,
          location: 'ListOperations.addDishToMultipleLists'
        });
      }
      
      return result;
      
    } catch (error) {
      return await listErrorHandler.handleError(error, 'Add dish to multiple lists', {
        dishId,
        listIds,
        notes
      });
    }
  }
}; 