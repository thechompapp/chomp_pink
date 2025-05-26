/**
 * List Search Service
 * 
 * Handles search operations for lists, including text search,
 * suggestions, and filtering.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logInfo } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * List Search Service class
 */
class ListSearchService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/lists');
  }
  
  /**
   * Search lists by term and type
   * @param {string} searchTerm - Search term
   * @param {string} searchType - Search type ('dish', 'restaurant', 'all')
   * @param {Object} options - Search options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.userId - User ID for personalized results
   * @param {string} options.cityId - City ID for location-based results
   * @param {boolean} options.includePrivate - Whether to include private lists
   * @returns {Promise<Object>} Response with search results
   */
  async searchLists(searchTerm, searchType = 'all', { page = 1, limit = 20, userId = null, cityId = null, includePrivate = false } = {}) {
    if (!searchTerm) {
      return { 
        success: false, 
        message: 'Search term is required',
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
    
    logDebug(`[ListSearchService] Searching lists with term: ${searchTerm}, type: ${searchType}`);
    
    const params = {
      searchTerm,
      searchType,
      page,
      limit
    };
    
    if (userId) params.userId = userId;
    if (cityId) params.cityId = cityId;
    if (includePrivate) params.includePrivate = includePrivate;
    
    try {
      const result = await this.get('/search', { params });
      
      if (!result.success) {
        logError('[ListSearchService] Error searching lists:', result.message);
        return {
          success: false,
          message: result.message,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }
      
      return {
        success: true,
        data: result.data.lists || [],
        pagination: result.data.pagination || {
          page,
          limit,
          total: result.data.lists?.length || 0,
          totalPages: Math.ceil((result.data.lists?.length || 0) / limit)
        },
        message: 'Search completed successfully'
      };
    } catch (error) {
      logError('[ListSearchService] Error searching lists:', error);
      return {
        success: false,
        message: 'Failed to search lists',
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
  }
  
  /**
   * Get list suggestions for autocomplete or quick search
   * @param {string} query - Search query
   * @param {Object} options - Suggestion options
   * @param {number} options.limit - Maximum number of suggestions
   * @param {string} options.listType - Type of list to filter by
   * @param {string} options.forUserId - User ID for personalized suggestions
   * @returns {Promise<Object>} Response with list suggestions
   */
  async getListSuggestions(query, { limit = 5, listType = null, forUserId = null } = {}) {
    if (!query) {
      return { success: false, message: 'Query is required', suggestions: [] };
    }
    
    logDebug(`[ListSearchService] Getting list suggestions for query: ${query}`);
    
    const params = {
      query,
      limit
    };
    
    if (listType) params.listType = listType;
    if (forUserId) params.forUserId = forUserId;
    
    try {
      const result = await this.get('/suggestions', { params });
      
      return {
        success: true,
        suggestions: result.data?.suggestions || []
      };
    } catch (error) {
      logError('[ListSearchService] Error getting list suggestions:', error);
      return {
        success: false,
        message: 'Failed to get list suggestions',
        suggestions: []
      };
    }
  }
  
  /**
   * Get a user's recently viewed or interacted lists
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of lists
   * @returns {Promise<Object>} Response with recent lists
   */
  async getRecentListsForUser(userId, { limit = 5 } = {}) {
    if (!validateId(userId)) {
      return { success: false, message: 'Invalid user ID', data: [] };
    }
    
    logDebug(`[ListSearchService] Getting recent lists for user ${userId}`);
    
    const params = {
      userId,
      limit,
      sortBy: 'lastViewed',
      sortOrder: 'desc'
    };
    
    try {
      const result = await this.get('/recent', { params });
      
      return {
        success: true,
        data: result.data?.lists || []
      };
    } catch (error) {
      logError('[ListSearchService] Error getting recent lists:', error);
      return {
        success: false,
        message: 'Failed to get recent lists',
        data: []
      };
    }
  }
  
  /**
   * Get list activity feed
   * @param {string} listId - List ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with list activity
   */
  async getListActivity(listId, { page = 1, limit = 15 } = {}) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID', activities: [] };
    }
    
    logDebug(`[ListSearchService] Getting activity for list ${listId}`);
    
    const params = {
      page,
      limit
    };
    
    try {
      const result = await this.get(`/${listId}/activity`, { params });
      
      return {
        success: true,
        activities: result.data?.activities || [],
        pagination: result.data?.pagination || {
          page,
          limit,
          total: result.data?.activities?.length || 0,
          totalPages: Math.ceil((result.data?.activities?.length || 0) / limit)
        }
      };
    } catch (error) {
      logError('[ListSearchService] Error getting list activity:', error);
      return {
        success: false,
        message: 'Failed to get list activity',
        activities: []
      };
    }
  }
  
  /**
   * Get user lists with consistent response structure
   * @param {string|Object} userIdOrParams - Either a user ID string or a params object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Normalized response
   */
  async getUserLists(userIdOrParams, options = {}) {
    // Handle different parameter formats
    let params = {};
    
    if (typeof userIdOrParams === 'string') {
      params.userId = userIdOrParams;
    } else if (typeof userIdOrParams === 'object') {
      params = { ...userIdOrParams };
    } else {
      return { 
        success: false, 
        message: 'Invalid user ID or parameters',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
    
    // Apply defaults and options
    params = {
      page: 1,
      limit: 10,
      ...params,
      ...options
    };
    
    logDebug(`[ListSearchService] Getting user lists with params:`, params);
    
    try {
      // Use the standard getLists method from the base service
      const result = await this.get('', { params });
      
      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Failed to get user lists',
          data: [],
          pagination: { 
            page: params.page, 
            limit: params.limit, 
            total: 0, 
            totalPages: 0 
          }
        };
      }
      
      // Normalize the response format
      return {
        success: true,
        data: result.data.lists || [],
        pagination: result.data.pagination || {
          page: params.page,
          limit: params.limit,
          total: result.data.lists?.length || 0,
          totalPages: Math.ceil((result.data.lists?.length || 0) / params.limit)
        },
        message: 'Lists retrieved successfully'
      };
    } catch (error) {
      logError('[ListSearchService] Error getting user lists:', error);
      return {
        success: false,
        message: 'Failed to get user lists',
        data: [],
        pagination: { 
          page: params.page, 
          limit: params.limit, 
          total: 0, 
          totalPages: 0 
        }
      };
    }
  }
}

// Create and export a singleton instance
export const listSearchService = new ListSearchService();

export default ListSearchService;
