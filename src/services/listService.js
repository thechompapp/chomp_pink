// File: src/services/listService.js
import apiClient from './apiClient';
import logger from '../utils/logger'; // frontend logger
import useFollowStore from '../stores/useFollowStore'; // Changed to default import
import { logEngagement } from '../utils/logEngagement';
import { parseApiError } from '../utils/parseApiError';
// import { MOCK_LIST_DETAIL, MOCK_USER_LISTS, MOCK_LIST_ITEMS } from '../utils/mockData'; // For testing

const listService = {
  // Fetch all lists with optional query parameters
  // Params can include: userId, cityId, page, limit, sortBy, sortOrder, listType, isPublic, isFollowedByUserId
  getLists: async function(params = {}) {
    try {
      // Log the params for debugging
      logger.debug('[listService] getLists called with params:', JSON.stringify(params));
      
      const queryParams = new URLSearchParams();
      
      // Ensure all parameters are properly converted to strings
      if (params.userId) {
        // Handle the case where userId might be an object
        const userId = typeof params.userId === 'object' ? 
          (params.userId.id || params.userId.userId || '') : String(params.userId);
        queryParams.append('userId', userId);
      }
      
      if (params.cityId) queryParams.append('cityId', String(params.cityId));
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.sortBy) queryParams.append('sortBy', String(params.sortBy));
      if (params.sortOrder) queryParams.append('sortOrder', String(params.sortOrder));
      if (params.listType) queryParams.append('listType', String(params.listType));
      if (typeof params.isPublic !== 'undefined') queryParams.append('isPublic', String(params.isPublic));
      
      if (params.isFollowedByUserId) {
        // Handle the case where isFollowedByUserId might be an object
        const followedByUserId = typeof params.isFollowedByUserId === 'object' ? 
          (params.isFollowedByUserId.id || params.isFollowedByUserId.userId || '') : String(params.isFollowedByUserId);
        queryParams.append('isFollowedByUserId', followedByUserId);
      }
      
      if (params.searchTerm) queryParams.append('searchTerm', String(params.searchTerm));
      if (params.excludeUserId) queryParams.append('excludeUserId', String(params.excludeUserId));

      // Log the final query string for debugging
      const queryString = queryParams.toString();
      logger.debug(`[listService] Making request to /lists?${queryString}`);

      const response = await apiClient.get(`/lists?${queryString}`);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error('Error fetching lists:', error);
      return { success: false, error: parseApiError(error), message: 'Failed to fetch lists.' };
    }
  },

  // Fetch a specific list by its ID
  getList: async function(id, userId = null) {
    try {
      let url = `/lists/${id}`;
      if (userId) {
        url += `?userId=${userId}`;
      }
      const response = await apiClient.get(url);
      // logger.debug(`getList response for ID ${id}:`, response.data);
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      logger.error('Error fetching list:', id, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch list: ${id}` };
    }
  },

  // Create a new list
  createList: async function(listData) {
    try {
      // logger.debug('Attempting to create list with data:', listData);
      const response = await apiClient.post('/lists', listData);
      // logger.info('List created successfully:', response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'List created successfully.' };
    } catch (error) {
      logger.error('Error creating list:', listData, error);
      return { success: false, error: parseApiError(error), message: 'Failed to create list.' };
    }
  },

  // Update an existing list by its ID
  updateList: async function(id, listData) {
    try {
      // logger.debug(`Attempting to update list ${id} with data:`, listData);
      const response = await apiClient.put(`/lists/${id}`, listData);
      // logger.info(`List ${id} updated successfully:`, response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'List updated successfully.' };
    } catch (error) {
      logger.error('Error updating list:', id, listData, error);
      return { success: false, error: parseApiError(error), message: `Failed to update list: ${id}` };
    }
  },

  // Delete a list by its ID
  deleteList: async function(id) {
    try {
      // logger.debug(`Attempting to delete list ${id}`);
      const response = await apiClient.delete(`/lists/${id}`);
      // logger.info(`List ${id} deleted successfully:`, response.data);
      return { success: true, message: response.data.message || 'List deleted successfully.' };
    } catch (error) {
      logger.error('Error deleting list:', id, error);
      return { success: false, error: parseApiError(error), message: `Failed to delete list: ${id}` };
    }
  },

  // Fetch items within a specific list
  getListItems: async function(listId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy); // e.g., 'created_at', 'name'
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder); // 'asc' or 'desc'

      const response = await apiClient.get(`/lists/${listId}/items?${queryParams.toString()}`);
      // logger.debug(`getListItems response for list ID ${listId}:`, response.data);
      return { 
        success: true, 
        data: response.data.data || response.data, 
        pagination: response.data.pagination 
      };
    } catch (error) {
      logger.error('Error fetching items for list:', listId, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch items for list: ${listId}` };
    }
  },

  // Add an item to a specific list
  // itemData can be { dish_id, restaurant_id, notes, custom_item_name, custom_item_description, type: 'dish' | 'restaurant' | 'custom' }
  addItemToList: async function(listId, itemData) {
    try {
      // logger.debug(`Attempting to add item to list ${listId}:`, itemData);
      const response = await apiClient.post(`/lists/${listId}/items`, itemData);
      // logger.info(`Item added to list ${listId} successfully:`, response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'Item added successfully.' };
    } catch (error) {
      logger.error('Error adding item to list:', listId, itemData, error);
      return { success: false, error: parseApiError(error), message: 'Failed to add item to list.' };
    }
  },

  // Update an item within a list
  updateListItem: async function(listId, itemId, itemData) {
    try {
      // logger.debug(`Attempting to update item ${itemId} in list ${listId}:`, itemData);
      const response = await apiClient.put(`/lists/${listId}/items/${itemId}`, itemData);
      // logger.info(`Item ${itemId} in list ${listId} updated successfully:`, response.data);
      return { success: true, data: response.data.data || response.data, message: response.data.message || 'Item updated successfully.' };
    } catch (error) {
      logger.error('Error updating item in list:', listId, itemId, itemData, error);
      return { success: false, error: parseApiError(error), message: `Failed to update item: ${itemId} in list.` };
    }
  },

  // Remove an item from a list
  deleteListItem: async function(listId, itemId) {
    try {
      // logger.debug(`Attempting to delete item ${itemId} from list ${listId}`);
      const response = await apiClient.delete(`/lists/${listId}/items/${itemId}`);
      // logger.info(`Item ${itemId} deleted from list ${listId} successfully:`, response.data);
      return { success: true, message: response.data.message || 'Item removed successfully.' };
    } catch (error) {
      logger.error('Error deleting item from list:', listId, itemId, error);
      return { success: false, error: parseApiError(error), message: `Failed to remove item: ${itemId} from list.` };
    }
  },

  // Search lists by term and type (e.g., 'dish', 'restaurant', 'all')
  // `options` can include { page, limit, userId, cityId, includePrivate }
  searchLists: async function(searchTerm, searchType = 'all', { page = 1, limit = 20, userId = null, cityId = null, includePrivate = false } = {}) {
    try {
      const params = new URLSearchParams({
        term: searchTerm,
        type: searchType,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (userId) params.append('userId', userId);
      if (cityId) params.append('cityId', cityId.toString());
      if (includePrivate) params.append('includePrivate', 'true');
      
      logger.debug(`Searching lists with term: "${searchTerm}", type: "${searchType}", params: ${params.toString()}`);
      const response = await apiClient.get(`/lists/search?${params.toString()}`);
      logger.debug('Search lists response:', response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination }; // Adjusted to match typical structure
    } catch (error) {
      logger.error('Error searching lists:', error);
      return { success: false, error: parseApiError(error), message: `Failed to search lists: ${searchTerm}` };
    }
  },

  // Method to get list suggestions for autocomplete or quick search
  getListSuggestions: async function(query, { limit = 5, listType = null, forUserId = null } = {}) {
    try {
      const params = new URLSearchParams({ q: query, limit: limit.toString() });
      if (listType) {
        params.append('listType', listType);
      }
      if (forUserId) {
        params.append('userId', forUserId);
      }
      // logger.debug(`Workspaceing list suggestions for query "${query}" with params: ${params.toString()}`);
      const response = await apiClient.get(`/lists/suggestions?${params.toString()}`);
      // logger.debug('List suggestions response:', response.data);
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      logger.error(`Error fetching list suggestions for query "${query}":`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch list suggestions for "${query}"` };
    }
  },

  // Fetch lists created by a specific user
  getUserLists: async function(userIdOrParams, options = {}) {
    // Check if userIdOrParams is an object (params) or a string (userId)
    if (typeof userIdOrParams === 'object' && userIdOrParams !== null) {
      // It's a params object, extract userId from it if exists
      const { userId, page = 1, limit = 10, listType = null, includePrivate = false, ...otherParams } = userIdOrParams;
      
      // Log the params for debugging
      logger.debug(`[listService] getUserLists called with params object:`, userIdOrParams);
      
      // Ensure userId is a string if it exists
      const safeUserId = userId ? String(userId) : undefined;
      
      return this.getLists({
        ...otherParams,
        userId: safeUserId,
        page, 
        limit,
        listType,
        isPublic: includePrivate ? undefined : true
      });
    } else {
      // It's a userId string with separate options
      const { page = 1, limit = 10, listType = null, includePrivate = false } = options;
      
      // Ensure userId is a string
      const safeUserId = userIdOrParams ? String(userIdOrParams) : undefined;
      
      logger.debug(`[listService] getUserLists called with userId: ${safeUserId}`);
      
      return this.getLists({ 
        userId: safeUserId, 
        page, 
        limit, 
        listType, 
        isPublic: includePrivate ? undefined : true
      });
    }
  },

  // Fetch lists followed by a specific user
  getFollowedLists: async function(userId, { page = 1, limit = 10 } = {}) {
    try {
      // logger.debug(`Workspaceing followed lists for user ${userId} with page: ${page}, limit: ${limit}`);
      const response = await apiClient.get(`/users/${userId}/followed-lists?page=${page}&limit=${limit}`);
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        featured: 'true' // Assuming a query param for featured
      });
      if (cityId) {
        params.append('cityId', cityId.toString());
      }
      // logger.debug(`Workspaceing featured lists with params: ${params.toString()}`);
      const response = await apiClient.get(`/lists/featured?${params.toString()}`); // Or just /lists with a filter
      // logger.debug('Featured lists response:', response.data);
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
      const params = new URLSearchParams({
        dish_id: dishId,
        page: page.toString(),
        limit: limit.toString()
      });
      if (userId) { // To get user's lists (public or private if owner) that contain this dish
        params.append('user_id', userId);
      }
      // logger.debug(`Workspaceing lists containing dish ${dishId} with params: ${params.toString()}`);
      const response = await apiClient.get(`/lists/containing-item?${params.toString()}`);
      // logger.debug(`Response for lists containing dish ${dishId}:`, response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching lists containing dish ${dishId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch lists containing dish ${dishId}.` };
    }
  },

  // Fetch lists that contain a specific restaurant ID
  getListsContainingRestaurant: async function(restaurantId, { userId, page = 1, limit = 10 } = {}) {
    try {
      const params = new URLSearchParams({
        restaurant_id: restaurantId,
        page: page.toString(),
        limit: limit.toString()
      });
      if (userId) {
        params.append('user_id', userId);
      }
      // logger.debug(`Workspaceing lists containing restaurant ${restaurantId} with params: ${params.toString()}`);
      const response = await apiClient.get(`/lists/containing-item?${params.toString()}`);
      // logger.debug(`Response for lists containing restaurant ${restaurantId}:`, response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching lists containing restaurant ${restaurantId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch lists containing restaurant ${restaurantId}.` };
    }
  },
  
  // Get metadata or summary for multiple lists by their IDs
  getMultipleListSummary: async function(listIds) {
    if (!listIds || listIds.length === 0) {
      return { success: true, data: [] }; // Return empty if no IDs provided
    }
    try {
      const params = new URLSearchParams();
      listIds.forEach(id => params.append('ids[]', id)); // Or 'ids' with comma-separated string, depending on backend
      // logger.debug(`Workspaceing summary for lists: ${listIds.join(', ')}`);
      const response = await apiClient.get(`/lists/summary?${params.toString()}`);
      // logger.debug('Multiple list summary response:', response.data);
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
      const response = await apiClient.get(`/users/${userId}/recent-lists?limit=${limit}`);
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
      const response = await apiClient.get(`/lists/${listId}/activity?page=${page}&limit=${limit}`);
      // logger.debug('List activity response:', response.data);
      return { success: true, data: response.data.data || response.data, pagination: response.data.pagination };
    } catch (error) {
      logger.error(`Error fetching activity for list ${listId}:`, error);
      return { success: false, error: parseApiError(error), message: `Failed to fetch activity for list ${listId}.` };
    }
  },
  
  // Fetch details for multiple list items by their global IDs (if list_items have unique IDs across all lists)
  // This is more complex and depends heavily on backend schema.
  // A simpler version might be fetching items from a *specific* list by their item IDs within that list.
  getMultipleListItemsDetails: async function(listItemIds) {
    if (!listItemIds || listItemIds.length === 0) {
      return { success: true, data: [] };
    }
    try {
      const params = new URLSearchParams();
      listItemIds.forEach(id => params.append('ids[]', id));
      // logger.debug(`Workspaceing details for list items: ${listItemIds.join(', ')}`);
      const response = await apiClient.get(`/list-items/details?${params.toString()}`); // Example endpoint
      // logger.debug('Multiple list items details response:', response.data);
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