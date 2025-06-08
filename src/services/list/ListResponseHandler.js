/**
 * List Response Handler
 * 
 * Single Responsibility: Response processing and data transformation
 * - Standardize API response format
 * - Handle pagination logic
 * - Process and normalize list data
 * - Handle success and error responses consistently
 */

import { logDebug, logWarn } from '@/utils/logger';

/**
 * Standard response format for list operations
 */
const createStandardResponse = (success, data = null, message = '', pagination = null, error = null) => ({
  success,
  data,
  message,
  pagination,
  error
});

/**
 * Create default pagination object
 */
const createDefaultPagination = (page = 1, limit = 25, total = 0) => ({
  page: parseInt(page) || 1,
  limit: parseInt(limit) || 25,
  total: parseInt(total) || 0,
  totalPages: Math.ceil((parseInt(total) || 0) / (parseInt(limit) || 25))
});

/**
 * Response processing utilities
 */
export const responseProcessor = {
  /**
   * Process a successful API response
   * @param {Object} response - Raw axios response
   * @param {Object} params - Original request parameters
   * @returns {Object} - Standardized response
   */
  processSuccessResponse(response, params = {}) {
    logDebug('[ListResponseHandler] Processing success response:', {
      status: response?.status,
      hasData: !!response?.data,
      dataType: response?.data ? typeof response.data : 'none'
    });

    // Handle empty or invalid responses
    if (!response || !response.data) {
      logWarn('[ListResponseHandler] No response or response data received');
      return createStandardResponse(
        false,
        [],
        'No response from server',
        createDefaultPagination(params.page, params.limit, 0)
      );
    }

    // Handle HTTP error status codes
    if (response.status < 200 || response.status >= 300) {
      const errorMessage = response.data?.message || `HTTP Error ${response.status}`;
      logWarn(`[ListResponseHandler] API error ${response.status}: ${errorMessage}`);
      return createStandardResponse(
        false,
        [],
        errorMessage,
        createDefaultPagination(params.page, params.limit, 0)
      );
    }

    const responseData = response.data;

    // Check if the API response indicates failure
    if (responseData.success === false) {
      logWarn('[ListResponseHandler] API returned success: false:', responseData.message);
      return createStandardResponse(
        false,
        [],
        responseData.message || 'Operation failed',
        createDefaultPagination(params.page, params.limit, 0)
      );
    }

    // Process successful response
    const data = Array.isArray(responseData.data) ? responseData.data : [];
    const total = responseData.total || responseData.pagination?.totalCount || data.length || 0;
    const pagination = createDefaultPagination(params.page, params.limit, total);

    // Override with actual pagination data if available
    if (responseData.pagination) {
      Object.assign(pagination, {
        page: parseInt(responseData.pagination.page) || pagination.page,
        limit: parseInt(responseData.pagination.limit) || pagination.limit,
        total: parseInt(responseData.pagination.totalCount || responseData.pagination.total) || pagination.total,
        totalPages: parseInt(responseData.pagination.totalPages) || pagination.totalPages
      });
    }

    return createStandardResponse(
      true,
      data,
      responseData.message || 'Operation completed successfully',
      pagination
    );
  },

  /**
   * Process a single item response (no pagination)
   * @param {Object} response - Raw axios response
   * @returns {Object} - Standardized response
   */
  processSingleItemResponse(response) {
    logDebug('[ListResponseHandler] Processing single item response');

    if (!response || !response.data) {
      return createStandardResponse(false, null, 'No response from server');
    }

    if (response.status < 200 || response.status >= 300) {
      const errorMessage = response.data?.message || `HTTP Error ${response.status}`;
      return createStandardResponse(false, null, errorMessage);
    }

    const responseData = response.data;

    if (responseData.success === false) {
      return createStandardResponse(false, null, responseData.message || 'Operation failed');
    }

    return createStandardResponse(
      true,
      responseData.data || responseData,
      responseData.message || 'Operation completed successfully'
    );
  },

  /**
   * Process bulk operation response
   * @param {Object} response - Raw axios response
   * @returns {Object} - Standardized response with results
   */
  processBulkResponse(response) {
    logDebug('[ListResponseHandler] Processing bulk operation response');

    if (!response || !response.data) {
      return createStandardResponse(false, [], 'No response from server');
    }

    const responseData = response.data;

    if (responseData.success === false) {
      return createStandardResponse(false, [], responseData.message || 'Bulk operation failed');
    }

    return {
      success: true,
      data: responseData.data || responseData,
      results: responseData.results || null, // Individual operation results
      message: responseData.message || 'Bulk operation completed successfully',
      pagination: null,
      error: null
    };
  }
};

/**
 * Data transformation utilities
 */
export const dataTransformer = {
  /**
   * Normalize list data structure
   * @param {Array} lists - Raw list data
   * @returns {Array} - Normalized list data
   */
  normalizeLists(lists) {
    if (!Array.isArray(lists)) {
      logWarn('[ListResponseHandler] Expected array for lists, got:', typeof lists);
      return [];
    }

    return lists.map(list => ({
      ...list,
      id: list.id || list.list_id,
      name: list.name || list.list_name || '',
      description: list.description || '',
      isPublic: list.is_public ?? list.isPublic ?? true,
      itemCount: list.item_count || list.items?.length || 0,
      createdAt: list.created_at || list.createdAt,
      updatedAt: list.updated_at || list.updatedAt
    }));
  },

  /**
   * Normalize list item data structure
   * @param {Array} items - Raw item data
   * @returns {Array} - Normalized item data
   */
  normalizeListItems(items) {
    if (!Array.isArray(items)) {
      logWarn('[ListResponseHandler] Expected array for items, got:', typeof items);
      return [];
    }

    return items.map(item => ({
      ...item,
      id: item.id || item.item_id,
      listId: item.list_id || item.listId,
      type: item.type || 'unknown',
      position: item.position || item.order || 0,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt
    }));
  },

  /**
   * Normalize user data in lists
   * @param {Object} user - Raw user data
   * @returns {Object} - Normalized user data
   */
  normalizeUser(user) {
    if (!user || typeof user !== 'object') {
      return null;
    }

    return {
      id: user.id || user.user_id,
      username: user.username || user.name || '',
      email: user.email || '',
      avatar: user.avatar || user.profile_picture || null,
      isAdmin: user.is_admin || user.role === 'admin' || false
    };
  }
};

/**
 * Error response handlers
 */
export const errorProcessor = {
  /**
   * Process error response and create standardized error object
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   * @param {Object} params - Original request parameters
   * @returns {Object} - Standardized error response
   */
  processErrorResponse(error, operation = 'Unknown operation', params = {}) {
    logWarn(`[ListResponseHandler] Processing error for ${operation}:`, error);

    // Handle different error types
    let errorMessage = 'An unexpected error occurred';
    let errorType = 'unknown_error';
    let statusCode = null;

    if (error.response) {
      // HTTP error response
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
      errorType = 'http_error';
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection.';
      errorType = 'network_error';
    } else {
      // Other error
      errorMessage = error.message || errorMessage;
      errorType = 'request_error';
    }

    return createStandardResponse(
      false,
      [],
      `${operation} failed: ${errorMessage}`,
      createDefaultPagination(params.page, params.limit, 0),
      {
        type: errorType,
        message: errorMessage,
        status: statusCode,
        details: error
      }
    );
  },

  /**
   * Process fallback response when primary request fails
   * @param {Object} fallbackData - Data from fallback request
   * @param {string} operation - Operation that used fallback
   * @returns {Object} - Standardized response
   */
  processFallbackResponse(fallbackData, operation = 'Operation') {
    logDebug(`[ListResponseHandler] Processing fallback response for ${operation}`);

    return createStandardResponse(
      true,
      fallbackData.data || fallbackData,
      `${operation} completed via fallback method`,
      fallbackData.pagination || null
    );
  }
};

/**
 * Specialized response handlers for different list operations
 */
export const specializedHandlers = {
  /**
   * Handle user lists response with specific formatting
   * @param {Object} response - Raw response
   * @param {Object} params - Request parameters
   * @returns {Object} - Formatted user lists response
   */
  handleUserListsResponse(response, params) {
    const standardResponse = responseProcessor.processSuccessResponse(response, params);
    
    // Apply user-specific list normalization
    if (standardResponse.success && standardResponse.data) {
      standardResponse.data = dataTransformer.normalizeLists(standardResponse.data);
    }

    return standardResponse;
  },

  /**
   * Handle follow/unfollow operation response
   * @param {Object} response - Raw response
   * @param {string} listId - List ID that was followed/unfollowed
   * @returns {Object} - Formatted follow response
   */
  handleFollowResponse(response, listId) {
    const standardResponse = responseProcessor.processSingleItemResponse(response);
    
    if (standardResponse.success) {
      // Add follow-specific data
      standardResponse.isFollowing = response.data?.data?.is_following ?? true;
      standardResponse.listId = listId;
    }

    return standardResponse;
  },

  /**
   * Handle search results with highlighting and relevance
   * @param {Object} response - Raw search response
   * @param {Object} searchParams - Search parameters
   * @returns {Object} - Formatted search response
   */
  handleSearchResponse(response, searchParams) {
    const standardResponse = responseProcessor.processSuccessResponse(response, searchParams);
    
    if (standardResponse.success) {
      // Add search-specific metadata
      standardResponse.searchTerm = searchParams.term || searchParams.searchTerm;
      standardResponse.searchType = searchParams.type || searchParams.searchType || 'all';
    }

    return standardResponse;
  }
}; 