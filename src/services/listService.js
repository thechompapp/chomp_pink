// File: src/services/listService.js
import apiClient from './apiClient';
import logger from '../utils/logger'; // frontend logger
import useFollowStore from '../stores/useFollowStore'; // Changed to default import
import { logEngagement } from '../utils/logEngagement';
import { parseApiError } from '../utils/parseApiError';
import { handleApiResponse, createQueryParams, validateId } from '@/utils/serviceHelpers';
// import { MOCK_LIST_DETAIL, MOCK_USER_LISTS, MOCK_LIST_ITEMS } from '../utils/mockData'; // For testing

const listService = {
  // Fetch all lists with optional query parameters
  // Params can include: userId, cityId, page, limit, sortBy, sortOrder, listType, isPublic, isFollowedByUserId
  getLists: async function(params = {}) {
    logger.debug('[listService] getLists called with params:', JSON.stringify(params));
    
    try {
      // Build params as a plain object
      const paramsObj = {};
      if (params.userId) paramsObj.userId = typeof params.userId === 'object' ? (params.userId.id || params.userId.userId || '') : String(params.userId);
      if (params.cityId) paramsObj.cityId = String(params.cityId);
      if (params.page) paramsObj.page = String(params.page);
      if (params.limit) paramsObj.limit = String(params.limit);
      if (params.sortBy) paramsObj.sortBy = String(params.sortBy);
      if (params.sortOrder) paramsObj.sortOrder = String(params.sortOrder);
      if (params.listType) paramsObj.listType = String(params.listType);
      if (typeof params.isPublic !== 'undefined') paramsObj.isPublic = String(params.isPublic);
      if (params.isFollowedByUserId) paramsObj.isFollowedByUserId = typeof params.isFollowedByUserId === 'object' ? (params.isFollowedByUserId.id || params.isFollowedByUserId.userId || '') : String(params.isFollowedByUserId);
      if (params.searchTerm) paramsObj.searchTerm = String(params.searchTerm);
      if (params.excludeUserId) paramsObj.excludeUserId = String(params.excludeUserId);

      logger.debug(`[listService] Making request to /lists with params:`, paramsObj);
      
      // Make the API request
      const response = await apiClient.get('/lists', { params: paramsObj });
      
      // Log the raw response for debugging
      logger.debug('[listService] Raw API response:', {
        status: response?.status,
        statusText: response?.statusText,
        hasData: !!response?.data,
        dataType: response?.data ? typeof response.data : 'none',
        dataKeys: response?.data ? Object.keys(response.data) : 'no data',
        responseData: response?.data // Log the actual response data for debugging
      });

      // Handle empty or invalid responses
      if (!response) {
        logger.warn('[listService] No response received from API');
        return {
          success: false,
          message: 'No response from server',
          data: [],
          pagination: {
            page: parseInt(params.page) || 1,
            limit: parseInt(params.limit) || 25,
            total: 0,
            totalPages: 0
          }
        };
      }

      // Handle HTTP error status codes
      if (response.status < 200 || response.status >= 300) {
        const errorMessage = response.data?.message || `HTTP Error ${response.status}`;
        logger.warn(`[listService] API error ${response.status}: ${errorMessage}`);
        return {
          success: false,
          message: errorMessage,
          data: [],
          pagination: {
            page: parseInt(params.page) || 1,
            limit: parseInt(params.limit) || 25,
            total: 0,
            totalPages: 0
          }
        };
      }
      
      // Process the response
      let result = {
        success: true,
        message: 'Success',
        data: [],
        pagination: {
          page: parseInt(params.page) || 1,
          limit: parseInt(params.limit) || 25,
          total: 0,
          totalPages: 0
        }
      };

      // If we have response data, process it
      if (response.data) {
        // Handle different response formats
        if (Array.isArray(response.data)) {
          // Case 1: Response is an array of lists
          result.data = response.data;
          result.pagination.total = response.data.length;
          result.pagination.totalPages = Math.ceil(response.data.length / result.pagination.limit);
        } else if (response.data.data && response.data.data.data && response.data.data.data.data && Array.isArray(response.data.data.data.data)) {
          // Case 2a: Backend service wrapper creates quadruple-nested structure
          logger.debug('[listService] Using Case 2a: quadruple-nested structure (response.data.data.data.data)');
          result.data = response.data.data.data.data; // Extract the actual list items from response.data.data.data.data
          
          // Handle total/pagination from the triple-nested level
          if (response.data.data.data.total !== undefined) {
            result.pagination.total = response.data.data.data.total;
            result.pagination.totalPages = Math.ceil(response.data.data.data.total / result.pagination.limit);
          } else {
            result.pagination.total = result.data.length;
            result.pagination.totalPages = Math.ceil(result.data.length / result.pagination.limit);
          }
          
        } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          // Case 2b: Backend service wrapper creates triple-nested structure
          logger.debug('[listService] Using Case 2b: triple-nested structure (response.data.data.data)');
          result.data = response.data.data.data; // Extract the actual list items from response.data.data.data
          
          // Handle total/pagination from the double-nested level
          if (response.data.data.total !== undefined) {
            result.pagination.total = response.data.data.total;
            result.pagination.totalPages = Math.ceil(response.data.data.total / result.pagination.limit);
          } else {
            result.pagination.total = result.data.length;
            result.pagination.totalPages = Math.ceil(result.data.length / result.pagination.limit);
          }
          
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Case 2c: Response has double-nested data property containing the array
          result.data = response.data.data; // Extract the actual list items
          
          // Handle pagination if available
          if (response.data.pagination) {
            result.pagination = {
              ...result.pagination,
              ...response.data.pagination,
              page: response.data.pagination.page || result.pagination.page,
              limit: response.data.pagination.limit || result.pagination.limit,
              total: response.data.pagination.total || response.data.data.length,
              totalPages: response.data.pagination.totalPages || 
                         Math.ceil((response.data.pagination.total || response.data.data.length) / (response.data.pagination.limit || result.pagination.limit))
            };
          } else {
            // Use total from the response.data if available, otherwise use array length
            result.pagination.total = response.data.total || response.data.data.length;
            result.pagination.totalPages = Math.ceil(result.pagination.total / result.pagination.limit);
          }
        } else if (typeof response.data === 'object') {
          // Case 3: Single list object
          result.data = [response.data];
          result.pagination.total = 1;
          result.pagination.totalPages = 1;
        }
      }

      logger.debug('[listService] Final result:', {
        success: result.success,
        dataLength: result.data.length,
        pagination: result.pagination
      });

      return result;
      
    } catch (error) {
      logger.error('[listService] Error in getLists:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: 'Failed to fetch lists due to an error',
        error: {
          type: 'api_error',
          message: error.message,
          details: error
        }
      };
    }
  },

  // Fetch a specific list by its ID
  getList: async function(id, userId = null) {
    const safeId = validateId(id, 'listId');
    const params = userId ? { userId } : {};
    
    return handleApiResponse(
      () => apiClient.get(`/lists/${safeId}`, { params }),
      'ListService.getList'
    );
  },

  // Create a new list
  createList: async function(listData) {
    return handleApiResponse(
      () => apiClient.post('/lists', listData),
      'ListService.createList'
    );
  },

  // Update an existing list by its ID
  updateList: async function(id, listData) {
    const safeId = validateId(id, 'listId');
    
    return handleApiResponse(
      () => apiClient.put(`/lists/${safeId}`, listData),
      'ListService.updateList'
    );
  },

  // Delete a list by its ID
  deleteList: async function(id) {
    const safeId = validateId(id, 'listId');
    
    return handleApiResponse(
      () => apiClient.delete(`/lists/${safeId}`),
      'ListService.deleteList'
    );
  },

  // Fetch items within a specific list
  getListItems: async function(listId, params = {}) {
    const safeId = validateId(listId, 'listId');
    
    const result = await handleApiResponse(
      () => apiClient.get(`/lists/${safeId}/items`, { params }),
      'ListService.getListItems'
    );
    
    // Format the response to maintain backward compatibility
    return {
      success: result.success,
      data: result.data,
      pagination: result.pagination || null,
      message: result.message,
      error: result.error
    };
  },

  // Add an item to a specific list
  // itemData can be { dish_id, restaurant_id, notes, custom_item_name, custom_item_description, type: 'dish' | 'restaurant' | 'custom' }
  addItemToList: async function(listId, itemData) {
    const safeId = validateId(listId, 'listId');
    
    return handleApiResponse(
      () => apiClient.post(`/lists/${safeId}/items`, itemData),
      'ListService.addItemToList'
    );
  },

  // Update an item within a list
  updateListItem: async function(listId, itemId, itemData) {
    const safeListId = validateId(listId, 'listId');
    const safeItemId = validateId(itemId, 'itemId');
    
    return handleApiResponse(
      () => apiClient.put(`/lists/${safeListId}/items/${safeItemId}`, itemData),
      'ListService.updateListItem'
    );
  },

  // Remove an item from a list
  deleteListItem: async function(listId, itemId) {
    const safeListId = validateId(listId, 'listId');
    const safeItemId = validateId(itemId, 'itemId');
    
    return handleApiResponse(
      () => apiClient.delete(`/lists/${safeListId}/items/${safeItemId}`),
      'ListService.deleteListItem'
    );
  },

  // Search lists by term and type (e.g., 'dish', 'restaurant', 'all')
  // `options` can include { page, limit, userId, cityId, includePrivate }
  searchLists: async function(searchTerm, searchType = 'all', { page = 1, limit = 20, userId = null, cityId = null, includePrivate = false } = {}) {
    const params = { term: searchTerm, type: searchType, page, limit };
    if (userId) params.userId = userId;
    if (cityId) params.cityId = cityId;
    if (includePrivate) params.includePrivate = true;
    
    logger.debug(`Searching lists with term: "${searchTerm}", type: "${searchType}", params:`, params);
    
    const result = await handleApiResponse(
      () => apiClient.get('/lists/search', { params }),
      'ListService.searchLists'
    );
    
    // Format the response to maintain backward compatibility
    return {
      success: result.success,
      data: result.data,
      pagination: result.pagination || null,
      message: result.message,
      error: result.error
    };
  },

  // Method to get list suggestions for autocomplete or quick search
  getListSuggestions: async function(query, { limit = 5, listType = null, forUserId = null } = {}) {
    const params = { q: query, limit };
    if (listType) params.listType = listType;
    if (forUserId) params.userId = forUserId;
    
    return handleApiResponse(
      () => apiClient.get('/lists/suggestions', { params }),
      'ListService.getListSuggestions'
    );
  },

  /**
   * Fetches lists for a specific user with consistent response structure
   * @param {string|Object} userIdOrParams - Either a user ID string or a params object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Normalized response with { success, data, pagination, message }
   */
  getUserLists: async function(userIdOrParams, options = {}) {
    try {
      // Initialize parameters with defaults
      let params = {
        page: 1,
        limit: 10,
        listType: null,
        includePrivate: false,
        ...(typeof userIdOrParams === 'object' ? userIdOrParams : { userId: userIdOrParams }),
        ...options
      };
      
      const { 
        userId, 
        page, 
        limit, 
        listType, 
        includePrivate,
        ...otherParams 
      } = params;

      logger.debug('[listService] getUserLists called with params:', {
        userId,
        page,
        limit,
        listType,
        includePrivate,
        ...(Object.keys(otherParams).length ? { otherParams } : {})
      });

      // Ensure userId is a string if it exists
      const safeUserId = userId ? String(userId) : undefined;
      
      // Make the API call through getLists
      const result = await this.getLists({
        ...otherParams,
        userId: safeUserId,
        page,
        limit,
        listType,
        isPublic: includePrivate ? undefined : true
      });

      // Log the raw result for debugging
      logger.debug('[listService] Raw getUserLists result:', {
        success: result?.success,
        dataLength: Array.isArray(result?.data) ? result.data.length : 'not an array',
        hasPagination: !!result?.pagination,
        rawResult: result
      });

      // Extract data and pagination from the result
      const items = Array.isArray(result?.data) ? result.data : [];
      const pagination = result?.pagination || {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        total: 0,
        totalPages: 0
      };

      // Ensure pagination has all required fields
      const normalizedPagination = {
        page: parseInt(pagination.page) || 1,
        limit: parseInt(pagination.limit) || 10,
        total: parseInt(pagination.total) || items.length,
        totalPages: parseInt(pagination.totalPages) || 
                   Math.ceil((parseInt(pagination.total) || items.length) / (parseInt(pagination.limit) || 10))
      };

      // Return the normalized response
      return {
        success: result?.success || false,
        data: items,
        pagination: normalizedPagination,
        message: result?.message || 'User lists retrieved'
      };
    } catch (error) {
      logger.error('[listService] Error in getUserLists:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        message: error.message || 'Failed to fetch user lists'
      };
    }
  },

  // Fetch lists followed by a specific user
  getFollowedLists: async function(userId, { page = 1, limit = 10 } = {}) {
    try {
      // logger.debug(`Workspaceing followed lists for user ${userId} with page: ${page}, limit: ${limit}`);
      const response = await apiClient.get(`/users/${userId}/followed-lists`, { params: { page, limit } });
      // logger.debug('Followed lists response:', response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching followed lists for user ${userId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch followed lists for user ${userId}` };
    }
  },

  // User follows a list
  followList: async function(listId) {
    try {
      // logger.debug(`User attempting to follow list ${listId}`);
      const response = await apiClient.post(`/lists/${listId}/follow`);
      // logger.info(`User successfully followed list ${listId}:`, response.data);
      // Update Zustand store
      useFollowStore.getState().setFollowState(listId, true);
       logEngagement('list_follow', { list_id: listId, location: 'listService_followList' });
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'Successfully followed list.' };
    } catch (error) {
      logger.error(`Error following list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to follow list ${listId}` };
    }
  },

  // User unfollows a list
  unfollowList: async function(listId) {
    try {
      // logger.debug(`User attempting to unfollow list ${listId}`);
      const response = await apiClient.post(`/lists/${listId}/unfollow`); // Or DELETE /lists/:listId/follow
      // logger.info(`User successfully unfollowed list ${listId}:`, response.data);
      // Update Zustand store
      useFollowStore.getState().setFollowState(listId, false);
      logEngagement('list_unfollow', { list_id: listId, location: 'listService_unfollowList' });
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'Successfully unfollowed list.' };
    } catch (error) {
      logger.error(`Error unfollowing list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to unfollow list ${listId}` };
    }
  },

  // Toggle follow status for a list
  toggleFollowList: async function(listId) {
    try {
      // logger.debug(`Attempting to toggle follow for list ${listId}`);
      const response = await apiClient.post(`/lists/${listId}/follow`);
      // logger.info(`Follow status toggled for list ${listId}:`, response.data);
      return { 
        success: true, 
        isFollowing: response.data.data?.is_following || false,
        message: response.data.message || 'Follow status toggled.' 
      };
    } catch (error) {
      logger.error('Error toggling follow status:', listId, error);
      return { 
        success: false, 
        error: parseApiError(error), 
        message: `Failed to toggle follow status for list: ${listId}` 
      };
    }
  },

  // Check if a user follows a specific list
  // This might often be derived from other data or a dedicated endpoint
  checkFollowStatus: async function(listId, userId) { // userId might be implicit if auth token is used
    try {
      // logger.debug(`Checking follow status for list ${listId} by user (conceptually) ${userId}`);
      // This endpoint might not exist; often follow status is part of list data or user data.
      // Forcing a re-fetch or relying on Zustand store might be more practical.
      // Example: apiClient.get(`/lists/${listId}/is-followed`); 
      // For now, we'll assume this information comes with the list details or is managed client-side.
      const isFollowed = useFollowStore.getState().followedLists[listId] || false;
      // logger.debug(`Client-side follow status for list ${listId}: ${isFollowed}`);
      return { success: true, data: { is_followed: isFollowed } }; 
    } catch (error) {
      // This is unlikely to be an API error if we are checking client-side state.
      logger.error(`Error checking follow status for list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to check follow status for list ${listId}` };
    }
  },
  
  // Add multiple items to a list (bulk operation)
  // items should be an array of itemData objects
  addItemsToListBulk: async function(listId, items) {
    try {
      // logger.debug(`Attempting to bulk add ${items.length} items to list ${listId}:`, items);
      const response = await apiClient.post(`/lists/${listId}/items/bulk`, { items });
      // logger.info(`${items.length} items added to list ${listId} successfully:`, response.data);
      return { 
        success: true, 
        data: response.data.data || response.data, 
        results: response.data.results, // Individual results if backend provides them
        message: response.data.message || 'Items added successfully in bulk.' 
      };
    } catch (error) {
      logger.error('Error bulk adding items to list:', listId, items, error);
      return { success: false, error: parseApiError(error), message: 'Failed to bulk add items to list.' };
    }
  },

  // Reorder items within a list
  // orderedItemIds should be an array of item IDs in the desired new order
  reorderListItems: async function(listId, orderedItemIds) {
    try {
      // logger.debug(`Attempting to reorder items in list ${listId}:`, orderedItemIds);
      const response = await apiClient.put(`/lists/${listId}/items/reorder`, { orderedItemIds });
      // logger.info(`Items in list ${listId} reordered successfully:`, response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'Items reordered successfully.' };
    } catch (error) {
      logger.error('Error reordering items in list:', listId, orderedItemIds, error);
      return { success: false, error: parseApiError(error), message: 'Failed to reorder items.' };
    }
  },

  // Get public lists, possibly with pagination, filtering by city, etc.
  getPublicLists: async function({ cityId, page = 1, limit = 10, listType = null, searchTerm = null } = {}) {
    // logger.debug(`Workspaceing public lists with cityId: ${cityId}, page: ${page}, limit: ${limit}, type: ${listType}, search: ${searchTerm}`);
    return this.getLists({ 
      cityId, 
      page, 
      limit, 
      listType,
      isPublic: true,
      searchTerm
    });
  },

  // Get lists curated by the "platform" or featured lists
  getFeaturedLists: async function({ cityId, page = 1, limit = 5 } = {}) {
    try {
      const params = { page, limit, featured: true };
      if (cityId) params.cityId = cityId;
      const response = await apiClient.get(`/lists/featured`, { params });
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error('Error fetching featured lists:', error);
      return { success: false, error: parseApiError(error), message: 'Failed to fetch featured lists.' };
    }
  },
  
  // Add a dish to multiple lists
  addDishToMultipleLists: async function(dishId, listIds, notes = null) {
    try {
      const payload = { dish_id: dishId, list_ids: listIds };
      if (notes) payload.notes = notes; // Optional notes for each new list_item
      // logger.debug(`Adding dish ${dishId} to lists ${listIds.join(', ')}:`, payload);
      const response = await apiClient.post('/lists/items/add-to-multiple', payload);
      // logger.info(`Dish ${dishId} added to multiple lists successfully:`, response.data);
      return { 
        success: true, 
        data: response.data.data || response.data, 
        results: response.data.results, // Backend might return status for each list
        message: response.data.message || 'Dish added to selected lists.' 
      };
    } catch (error) {
      logger.error(`Error adding dish ${dishId} to multiple lists:`, error);
      return { success: false, error: parseApiError(error), message: 'Failed to add dish to multiple lists.' };
    }
  },
  
  // Add a restaurant to multiple lists
  addRestaurantToMultipleLists: async function(restaurantId, listIds, notes = null) {
    try {
      const payload = { restaurant_id: restaurantId, list_ids: listIds };
      if (notes) payload.notes = notes;
      // logger.debug(`Adding restaurant ${restaurantId} to lists ${listIds.join(', ')}:`, payload);
      const response = await apiClient.post('/lists/items/add-to-multiple', payload); // Same endpoint, type determined by payload
      // logger.info(`Restaurant ${restaurantId} added to multiple lists successfully:`, response.data);
      return { 
        success: true, 
        data: response.data.data || response.data, 
        results: response.data.results,
        message: response.data.message || 'Restaurant added to selected lists.' 
      };
    } catch (error) {
      logger.error(`Error adding restaurant ${restaurantId} to multiple lists:`, error);
      return { success: false, error: parseApiError(error), message: 'Failed to add restaurant to multiple lists.' };
    }
  },

  // Fetch lists that contain a specific dish ID
  getListsContainingDish: async function(dishId, { userId, page = 1, limit = 10 } = {}) {
    try {
      const params = { dish_id: dishId, page, limit };
      if (userId) params.user_id = userId;
      const response = await apiClient.get(`/lists/containing-item`, { params });
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching lists containing dish ${dishId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch lists containing dish ${dishId}.` };
    }
  },

  // Fetch lists that contain a specific restaurant ID
  getListsContainingRestaurant: async function(restaurantId, { userId, page = 1, limit = 10 } = {}) {
    try {
      const params = { restaurant_id: restaurantId, page, limit };
      if (userId) params.user_id = userId;
      const response = await apiClient.get(`/lists/containing-item`, { params });
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching lists containing restaurant ${restaurantId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch lists containing restaurant ${restaurantId}.` };
    }
  },
  
  // Get metadata or summary for multiple lists by their IDs
  getMultipleListSummary: async function(listIds) {
    if (!listIds || listIds.length === 0) {
      return { success: true, data: [] };
    }
    try {
      const params = { 'ids[]': listIds };
      const response = await apiClient.get(`/lists/summary`, { params });
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      logger.error(`Error fetching summary for lists ${listIds.join(', ')}:`, error);
      return { success: false, error: parseApiError(error), message: 'Failed to fetch list summaries.' };
    }
  },

  // Duplicate an existing list
  duplicateList: async function(listId, newName = null, makePublic = null) {
    try {
      const payload = {};
      if (newName) payload.name = newName;
      if (typeof makePublic === 'boolean') payload.is_public = makePublic;
      // logger.debug(`Attempting to duplicate list ${listId} with payload:`, payload);
      const response = await apiClient.post(`/lists/${listId}/duplicate`, payload);
      // logger.info(`List ${listId} duplicated successfully:`, response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'List duplicated successfully.' };
    } catch (error) {
      logger.error(`Error duplicating list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to duplicate list ${listId}.` };
    }
  },

  // Get a user's recently viewed or interacted lists
  // This would require backend tracking of user activity
  getRecentListsForUser: async function(userId, { limit = 5 } = {}) {
    try {
      // logger.debug(`Workspaceing recent lists for user ${userId}, limit ${limit}`);
      const response = await apiClient.get(`/users/${userId}/recent-lists`, { params: { limit } });
      // logger.debug('Recent lists response:', response.data);
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      logger.error(`Error fetching recent lists for user ${userId}:`, error);
      return { success: false, error: parseApiError(error), message: 'Failed to fetch recent lists.' };
    }
  },

  // Merge two lists
  // sourceListId: the list to merge from (will often be deleted or archived after)
  // targetListId: the list to merge into
  // options: e.g., { deleteSourceList: true, conflictResolution: 'keep_target' | 'keep_source' | 'keep_both' }
  mergeLists: async function(sourceListId, targetListId, options = {}) {
    try {
      const payload = {
        source_list_id: sourceListId,
        target_list_id: targetListId,
        options: options,
      };
      // logger.debug('Attempting to merge lists:', payload);
      const response = await apiClient.post('/lists/merge', payload);
      // logger.info('Lists merged successfully:', response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'Lists merged successfully.' };
    } catch (error) {
      logger.error('Error merging lists:', sourceListId, targetListId, error);
      return { success: false, error: parseApiError(error), message: 'Failed to merge lists.' };
    }
  },

  // Get list activity feed (e.g., recent additions, comments if implemented)
  getListActivity: async function(listId, { page = 1, limit = 15 } = {}) {
    try {
      // logger.debug(`Workspaceing activity for list ${listId}, page ${page}, limit ${limit}`);
      const response = await apiClient.get(`/lists/${listId}/activity`, { params: { page, limit } });
      // logger.debug('List activity response:', response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching activity for list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch activity for list ${listId}.` };
    }
  },
  
  // Fetch details for multiple list items by their global IDs (if list_items have unique IDs across all lists)
  getMultipleListItemsDetails: async function(listItemIds) {
    if (!listItemIds || listItemIds.length === 0) {
      return { success: true, data: [] };
    }
    try {
      const params = { 'ids[]': listItemIds };
      const response = await apiClient.get(`/list-items/details`, { params });
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      logger.error(`Error fetching details for list items ${listItemIds.join(', ')}:`, error);
      return { success: false, error: parseApiError(error), message: 'Failed to fetch list item details.' };
    }
  },

  // Get a shareable link or details for a list
  getShareableListLink: async function(listId, shareOptions = {}) { // shareOptions for custom links if supported
    try {
      // logger.debug(`Generating shareable link for list ${listId} with options:`, shareOptions);
      // This might just return list data from which a frontend link is constructed,
      // or it could be an endpoint that generates a short URL or specific share token.
      // For now, let's assume it returns the list data.
      const listDetails = await this.getList(listId);
      if (listDetails.success) {
        // Construct a frontend URL. This logic might live more appropriately in a UI util.
        const shareUrl = `${window.location.origin}/lists/${listDetails.data.id}`; // Basic example
        return { success: true, data: { ...listDetails.data, share_url: shareUrl }, message: 'Shareable link information ready.' };
      } else {
        throw listDetails.error; // Or re-wrap
      }
    } catch (error) {
      logger.error(`Error generating shareable link for list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to get shareable link for list ${listId}.` };
    }
  },
  
  // Fetch lists that a user has collaborated on (if collaboration is a feature)
  getCollaboratingLists: async function(userId, { page = 1, limit = 10 } = {}) {
    try {
      // logger.debug(`Workspaceing lists user ${userId} collaborates on, page ${page}, limit ${limit}`);
      const response = await apiClient.get(`/users/${userId}/collaborating-lists?page=${page}&limit=${limit}`);
      // logger.debug('Collaborating lists response:', response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching collaborating lists for user ${userId}:`, error);
      return { success: false, error: parseApiError(error), message: 'Failed to fetch collaborating lists.' };
    }
  },

  // Manage collaborators (add, remove, update roles) - requires more specific endpoints
  // Example: addCollaboratorToList(listId, collaboratorUserId, role)
  // Example: removeCollaboratorFromList(listId, collaboratorUserId)

  // Method to handle following/unfollowing a list, used by FollowButton
  handleFollowList: async function(id) {
    // This is an alias method for toggleFollowList that the FollowButton component uses
    return this.toggleFollowList(id);
  }
};

export { listService };