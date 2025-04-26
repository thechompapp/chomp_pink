/* src/services/listService.js */
import apiClient from './apiClient.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';

export const listService = {
  async getUserLists(params = {}) {
    console.log('[listService.getUserLists] Function called with params:', params);
    const queryParams = new URLSearchParams();
    if (params.view) queryParams.append('view', params.view);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cityId) queryParams.append('cityId', params.cityId);
    if (params.boroughId) queryParams.append('boroughId', params.boroughId);
    if (params.neighborhoodId) queryParams.append('neighborhoodId', params.neighborhoodId);
    if (params.query) queryParams.append('query', params.query);
    if (Array.isArray(params.hashtags) && params.hashtags.length > 0) {
      params.hashtags.forEach(tag => queryParams.append('hashtags', tag));
    }

    const endpoint = `/lists${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    try {
      logDebug(`[listService.getUserLists] Fetching lists from endpoint: ${endpoint}`);
      console.log('[listService.getUserLists] Making API call to:', endpoint);
      const response = await apiClient(endpoint, 'Get User Lists', { method: 'GET' });
      console.log('[listService.getUserLists] API response:', response);
      logDebug(`[listService.getUserLists] Response:`, response);
      if (response.success && response.data?.success) {
        return {
          items: Array.isArray(response.data.data) ? response.data.data : [],
          total: response.data.pagination?.totalItems || 0,
        };
      } else {
        logWarn(`[listService.getUserLists] Invalid response: ${response.data?.message}`);
        return { items: [], total: 0 };
      }
    } catch (error) {
      logError('[listService.getUserLists] Error fetching lists:', error);
      console.error('[listService.getUserLists] Error:', error);
      throw error;
    }
  },

  async getListPreviewItems(listId, limit = 3) {
    const numericListId = parseInt(String(listId), 10);
    if (isNaN(numericListId) || numericListId <= 0) {
      logWarn('[listService.getListPreviewItems] Invalid listId provided:', listId);
      return [];
    }
    const endpoint = `/lists/previewbyid/${numericListId}`;
    try {
      logDebug(`[listService.getListPreviewItems] Fetching preview items for list ID: ${numericListId}, Limit: ${limit}`);
      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(limit));
      const requestConfig = { method: 'GET', params: queryParams };

      logDebug(`[listService.getListPreviewItems] PRE-CALL CHECK - Endpoint: ${endpoint}, Config: ${JSON.stringify(requestConfig)}`);

      const response = await apiClient(endpoint, 'Get List Preview Items', requestConfig);

      logDebug(`[listService.getListPreviewItems] Response for list ${numericListId}:`, response);
      if (response.success && response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        logWarn(`[listService.getListPreviewItems] No preview items found or invalid response for list ${numericListId}. Message: ${response.data?.message}`);
        return [];
      }
    } catch (error) {
      logError(`[listService.getListPreviewItems] Error fetching preview items for list ${numericListId}:`, error);
      logError(`[listService.getListPreviewItems] FAILED CALL CHECK - Endpoint: ${endpoint}, Config: ${JSON.stringify({ method: 'GET', params: { limit } })}`);
      throw error;
    }
  },

  // New method to fetch list items using the correct endpoint
  async getListItems(listId, limit = 3) {
    const numericListId = parseInt(String(listId), 10);
    if (isNaN(numericListId) || numericListId <= 0) {
      logWarn('[listService.getListItems] Invalid listId provided:', listId);
      return [];
    }
    const endpoint = `/lists/${numericListId}/items`;
    try {
      logDebug(`[listService.getListItems] Fetching items for list ID: ${numericListId}, Limit: ${limit}`);
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', String(limit));
      const requestConfig = { method: 'GET', params: queryParams };

      logDebug(`[listService.getListItems] PRE-CALL CHECK - Endpoint: ${endpoint}, Config: ${JSON.stringify(requestConfig)}`);

      const response = await apiClient(endpoint, 'Get List Items', requestConfig);

      logDebug(`[listService.getListItems] Response for list ${numericListId}:`, response);
      if (response.success && response.data?.success && Array.isArray(response.data.data)) {
        return response.data;
      } else {
        logWarn(`[listService.getListItems] No items found or invalid response for list ${numericListId}. Message: ${response.data?.message}`);
        return [];
      }
    } catch (error) {
      logError(`[listService.getListItems] Error fetching items for list ${numericListId}:`, error);
      logError(`[listService.getListItems] FAILED CALL CHECK - Endpoint: ${endpoint}, Config: ${JSON.stringify({ method: 'GET', params: { limit } })}`);
      throw error;
    }
  },

  async getListDetails(listId) { /* ... */ },
  async createList(listData) { /* ... */ },
  async updateList(listId, listData) { /* ... */ },
  async deleteList(listId) { /* ... */ },
  async addItemToList(listId, itemData) { /* ... */ },
  async removeItemFromList(listId, listItemId) { /* ... */ },
  async updateListItem(listId, listItemId, itemData) { /* ... */ },
};