/**
 * List CRUD Service
 * 
 * Handles basic CRUD operations for lists.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logInfo } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * List CRUD Service class
 */
class ListCrudService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/lists');
  }
  
  /**
   * Fetch all lists with optional query parameters
   * @param {Object} params - Query parameters
   * @param {string|Object} params.userId - User ID to filter by
   * @param {string} params.cityId - City ID to filter by
   * @param {number} params.page - Page number for pagination
   * @param {number} params.limit - Number of items per page
   * @param {string} params.sortBy - Field to sort by
   * @param {string} params.sortOrder - Sort order (asc or desc)
   * @param {string} params.listType - Type of list to filter by
   * @param {boolean} params.isPublic - Filter by public/private status
   * @param {string|Object} params.isFollowedByUserId - Filter by lists followed by user
   * @param {string} params.searchTerm - Search term
   * @param {string} params.excludeUserId - Exclude lists by user ID
   * @returns {Promise<Object>} Response with lists data
   */
  async getLists(params = {}) {
    logDebug('[ListCrudService] getLists called with params:', JSON.stringify(params));
    
    // Normalize parameters
    const normalizedParams = this.normalizeParams(params);
    
    // Make the API request
    const result = await this.get('', { params: normalizedParams });
    
    if (!result.success) {
      logError('[ListCrudService] Error fetching lists:', result.message);
      return result;
    }
    
    logDebug(`[ListCrudService] Successfully fetched ${result.data?.lists?.length || 0} lists`);
    
    return {
      success: true,
      data: result.data.lists || [],
      pagination: result.data.pagination || {
        page: 1,
        limit: 10,
        total: result.data.lists?.length || 0,
        totalPages: 1
      },
      message: 'Lists fetched successfully'
    };
  }
  
  /**
   * Fetch a specific list by its ID
   * @param {string} id - List ID
   * @param {string} userId - Optional user ID for personalized content
   * @returns {Promise<Object>} Response with list data
   */
  async getList(id, userId = null) {
    if (!validateId(id)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListCrudService] Getting list with ID: ${id}`);
    
    const params = userId ? { userId } : {};
    
    return this.get(`/${id}`, { params });
  }
  
  /**
   * Create a new list
   * @param {Object} listData - List data
   * @returns {Promise<Object>} Response with created list
   */
  async createList(listData) {
    logDebug('[ListCrudService] Creating new list');
    
    if (!listData || !listData.name) {
      return { success: false, message: 'List name is required' };
    }
    
    return this.post('', listData);
  }
  
  /**
   * Update an existing list by its ID
   * @param {string} id - List ID
   * @param {Object} listData - Updated list data
   * @returns {Promise<Object>} Response with updated list
   */
  async updateList(id, listData) {
    if (!validateId(id)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListCrudService] Updating list with ID: ${id}`);
    
    return this.put(`/${id}`, listData);
  }
  
  /**
   * Delete a list by its ID
   * @param {string} id - List ID
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteList(id) {
    if (!validateId(id)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListCrudService] Deleting list with ID: ${id}`);
    
    return this.delete(`/${id}`);
  }
  
  /**
   * Duplicate an existing list
   * @param {string} listId - List ID to duplicate
   * @param {string} newName - Optional new name for the duplicated list
   * @param {boolean} makePublic - Optional public status for the duplicated list
   * @returns {Promise<Object>} Response with duplicated list
   */
  async duplicateList(listId, newName = null, makePublic = null) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListCrudService] Duplicating list with ID: ${listId}`);
    
    const data = {
      sourceListId: listId
    };
    
    if (newName) data.name = newName;
    if (makePublic !== null) data.isPublic = makePublic;
    
    return this.post('/duplicate', data);
  }
  
  /**
   * Get public lists, possibly with pagination, filtering by city, etc.
   * @param {Object} options - Query options
   * @param {string} options.cityId - City ID to filter by
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.listType - Type of list
   * @param {string} options.searchTerm - Search term
   * @returns {Promise<Object>} Response with public lists
   */
  async getPublicLists({ cityId, page = 1, limit = 10, listType = null, searchTerm = null } = {}) {
    logDebug('[ListCrudService] Getting public lists');
    
    const params = {
      isPublic: true,
      page,
      limit
    };
    
    if (cityId) params.cityId = cityId;
    if (listType) params.listType = listType;
    if (searchTerm) params.searchTerm = searchTerm;
    
    return this.getLists(params);
  }
  
  /**
   * Get lists curated by the "platform" or featured lists
   * @param {Object} options - Query options
   * @param {string} options.cityId - City ID to filter by
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with featured lists
   */
  async getFeaturedLists({ cityId, page = 1, limit = 5 } = {}) {
    logDebug('[ListCrudService] Getting featured lists');
    
    const params = {
      featured: true,
      page,
      limit
    };
    
    if (cityId) params.cityId = cityId;
    
    return this.getLists(params);
  }
  
  /**
   * Get metadata or summary for multiple lists by their IDs
   * @param {Array<string>} listIds - Array of list IDs
   * @returns {Promise<Object>} Response with list summaries
   */
  async getMultipleListSummary(listIds) {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      return { success: false, message: 'No list IDs provided' };
    }
    
    logDebug(`[ListCrudService] Getting summary for ${listIds.length} lists`);
    
    return this.post('/summaries', { listIds });
  }
  
  /**
   * Normalize parameters for API requests
   * @param {Object} params - Raw parameters
   * @returns {Object} Normalized parameters
   * @private
   */
  normalizeParams(params) {
    const normalized = {};
    
    // Convert all params to strings for consistency
    if (params.userId) normalized.userId = typeof params.userId === 'object' ? 
      (params.userId.id || params.userId.userId || '') : String(params.userId);
    
    if (params.cityId) normalized.cityId = String(params.cityId);
    if (params.page) normalized.page = String(params.page);
    if (params.limit) normalized.limit = String(params.limit);
    if (params.sortBy) normalized.sortBy = String(params.sortBy);
    if (params.sortOrder) normalized.sortOrder = String(params.sortOrder);
    if (params.listType) normalized.listType = String(params.listType);
    
    if (typeof params.isPublic !== 'undefined') 
      normalized.isPublic = String(params.isPublic);
    
    if (params.isFollowedByUserId) normalized.isFollowedByUserId = typeof params.isFollowedByUserId === 'object' ? 
      (params.isFollowedByUserId.id || params.isFollowedByUserId.userId || '') : String(params.isFollowedByUserId);
    
    if (params.searchTerm) normalized.searchTerm = String(params.searchTerm);
    if (params.excludeUserId) normalized.excludeUserId = String(params.excludeUserId);
    
    return normalized;
  }
}

// Create and export a singleton instance
export const listCrudService = new ListCrudService();

export default ListCrudService;
