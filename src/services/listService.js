/* src/services/listService.js */
import apiClient from './apiClient.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import { handleApiResponse, createQueryParams, validateId } from '@/utils/serviceHelpers.js';

export const listService = {
  async getUserLists(params = {}) {
    console.log('[listService.getUserLists] Function called with params:', params);
    const queryParams = createQueryParams({
      view: params.view,
      page: params.page,
      limit: params.limit,
      cityId: params.cityId,
      boroughId: params.boroughId,
      neighborhoodId: params.neighborhoodId,
      query: params.query,
      hashtags: params.hashtags
    });

    const endpoint = `/lists${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    logDebug(`[listService.getUserLists] Fetching lists from endpoint: ${endpoint}`);
    
    return handleApiResponse(
      () => apiClient.get(endpoint),
      'listService.getUserLists',
      (data) => ({
        items: Array.isArray(data) ? data : [],
        total: data.pagination?.totalItems || 0,
      })
    );
  },

  async getListPreviewItems(listId, limit = 3) {
    try {
      // Validate listId using the utility function
      const numericListId = validateId(listId, 'listId');
      
      // Use createQueryParams for consistent parameter handling
      const queryParams = createQueryParams({ limit });
      const endpoint = `/lists/previewbyid/${numericListId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      logDebug(`[listService.getListPreviewItems] Fetching preview items for list ID: ${numericListId}, Limit: ${limit}`);
      
      // Use handleApiResponse for standardized API handling
      return handleApiResponse(
        () => apiClient.get(endpoint),
        'listService.getListPreviewItems',
        (data) => Array.isArray(data) ? data : []
      );
    } catch (error) {
      logError(`[listService.getListPreviewItems] Error fetching preview items for list ${listId}:`, error);
      throw error;
    }
  },

  // New method to fetch list items using the correct endpoint
  async getListItems(listId, limit = 10) {
    try {
      // Validate listId using the utility function
      const numericListId = validateId(listId, 'listId');
      
      // Use createQueryParams for consistent parameter handling
      const queryParams = createQueryParams({ limit });
      const endpoint = `/lists/${numericListId}/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      logDebug(`[listService.getListItems] Fetching items for list ID: ${numericListId}, Limit: ${limit}`);
      
      // Use handleApiResponse for standardized API handling
      return handleApiResponse(
        () => apiClient.get(endpoint),
        'listService.getListItems',
        (data) => Array.isArray(data) ? data : []
      );
    } catch (error) {
      logError(`[listService.getListItems] Error fetching items for list ${listId}:`, error);
      throw error;
    }
  },

  async getListDetails(listId) {
    try {
      // Validate listId using the enhanced utility function without throwing
      const numericListId = validateId(listId, 'listId', false);
      
      // Handle invalid IDs with a standardized response
      if (numericListId <= 0) {
        logWarn(`[listService.getListDetails] Invalid list ID: ${listId}`);
        return {
          success: false,
          error: { message: `Invalid list ID: ${listId}`, status: 400 },
          list: null,
          items: []
        };
      }
      
      logDebug(`[listService.getListDetails] Fetching details for list ID: ${numericListId}`);
      
      // First, fetch the list metadata
      const listResponse = await handleApiResponse(
        () => apiClient.get(`/lists/${numericListId}`),
        'listService.getListDetails (metadata)'
      );
      
      // Then fetch the list items
      const itemsResponse = await handleApiResponse(
        () => apiClient.get(`/lists/${numericListId}/items`),
        'listService.getListDetails (items)'
      );
      
      // Combine both responses into a single standardized response object
      return {
        success: true,
        list: listResponse?.data || listResponse, // Support both response formats
        items: Array.isArray(itemsResponse?.data) ? itemsResponse.data : 
               Array.isArray(itemsResponse) ? itemsResponse : []
      };
    } catch (error) {
      logError(`[listService.getListDetails] Error fetching details for list ${listId}:`, error);
      // Return a standardized error object instead of throwing
      // This allows the component to display a proper error UI
      return {
        success: false,
        error: error,
        list: null,
        items: []
      };
    }
  },
  async createList(listData) { /* ... */ },
  async updateList(listId, listData) { /* ... */ },
  async deleteList(listId) { /* ... */ },
  async addItemToList(listId, itemData) { /* ... */ },
  async removeItemFromList(listId, listItemId) { /* ... */ },
  async updateListItem(listId, listItemId, itemData) { /* ... */ },
};