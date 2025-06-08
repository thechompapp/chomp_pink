/**
 * List Error Handler
 * 
 * Single Responsibility: Error recovery and fallback mechanisms
 * - Handle authentication errors with fallback requests
 * - Manage retry logic for failed operations
 * - Provide graceful degradation for network issues
 * - Integrate with store updates and user notifications
 */

import { logDebug, logError, logInfo, logWarn } from '@/utils/logger';
import { parseApiError } from '@/utils/parseApiError';
import { fallbackApi } from './ListApiClient';
import { errorProcessor } from './ListResponseHandler';

/**
 * Authentication error handling
 */
export const authErrorHandler = {
  /**
   * Check if error is authentication related
   * @param {Object} error - Error object
   * @returns {boolean} - Whether this is an auth error
   */
  isAuthError(error) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  },

  /**
   * Handle authentication errors with fallback
   * @param {Object} error - Original error
   * @param {string} operation - Operation that failed
   * @param {Object} fallbackOptions - Fallback configuration
   * @returns {Promise<Object>} - Fallback response or re-thrown error
   */
  async handleAuthError(error, operation, fallbackOptions = {}) {
    const { listId, allowFallback = true, operation: operationType } = fallbackOptions;
    
    logWarn(`[ListErrorHandler] Authentication error in ${operation}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      allowFallback
    });

    if (!allowFallback) {
      throw error;
    }

    // Try fallback methods for read-only operations
    if (operationType === 'getList' && listId) {
      return this.tryListFallback(listId, operation);
    }

    if (operationType === 'getListItems' && listId) {
      return this.tryListItemsFallback(listId, operation);
    }

    // For write operations, cannot use fallback
    logError(`[ListErrorHandler] No fallback available for write operation: ${operation}`);
    throw error;
  },

  /**
   * Try fallback request for getting list data
   * @param {string} listId - List ID
   * @param {string} operation - Operation name
   * @returns {Promise<Object>} - Fallback response
   */
  async tryListFallback(listId, operation) {
    logInfo(`[ListErrorHandler] Trying fallback for list ${listId}`);
    
    try {
      const fallbackData = await fallbackApi.getListWithoutAuth(listId);
      
      logInfo(`[ListErrorHandler] Fallback successful for list ${listId}`);
      
      return {
        success: true,
        data: fallbackData.data || fallbackData,
        message: 'Retrieved via fallback method',
        error: null,
        usedFallback: true
      };
    } catch (fallbackError) {
      logError(`[ListErrorHandler] Fallback also failed for list ${listId}:`, fallbackError);
      throw new Error(`${operation} failed: Authentication required and fallback unavailable`);
    }
  },

  /**
   * Try fallback request for getting list items
   * @param {string} listId - List ID
   * @param {string} operation - Operation name
   * @returns {Promise<Object>} - Fallback response
   */
  async tryListItemsFallback(listId, operation) {
    logInfo(`[ListErrorHandler] Trying items fallback for list ${listId}`);
    
    try {
      const fallbackData = await fallbackApi.getListItemsWithoutAuth(listId);
      
      logInfo(`[ListErrorHandler] Items fallback successful for list ${listId}`);
      
      return {
        success: true,
        data: fallbackData.data || fallbackData,
        pagination: fallbackData.pagination || null,
        message: 'Retrieved via fallback method',
        error: null,
        usedFallback: true
      };
    } catch (fallbackError) {
      logError(`[ListErrorHandler] Items fallback also failed for list ${listId}:`, fallbackError);
      throw new Error(`${operation} failed: Authentication required and fallback unavailable`);
    }
  }
};

/**
 * Network error handling
 */
export const networkErrorHandler = {
  /**
   * Check if error is network related
   * @param {Object} error - Error object
   * @returns {boolean} - Whether this is a network error
   */
  isNetworkError(error) {
    return !error.response && error.request;
  },

  /**
   * Handle network errors with retry logic
   * @param {Object} error - Network error
   * @param {string} operation - Operation that failed
   * @param {Object} retryOptions - Retry configuration
   * @returns {Promise<Object>} - Retry result or error
   */
  async handleNetworkError(error, operation, retryOptions = {}) {
    const { maxRetries = 2, retryDelay = 1000, exponentialBackoff = true } = retryOptions;
    
    logWarn(`[ListErrorHandler] Network error in ${operation}, considering retry`);

    // For now, don't implement retry here since it's handled by HTTP interceptors
    // Just return a standardized error response
    return errorProcessor.processErrorResponse(error, operation, retryOptions.params || {});
  }
};

/**
 * Validation error handling
 */
export const validationErrorHandler = {
  /**
   * Handle validation errors with user-friendly messages
   * @param {Error} error - Validation error
   * @param {string} operation - Operation that failed
   * @returns {Object} - Standardized error response
   */
  handleValidationError(error, operation) {
    logWarn(`[ListErrorHandler] Validation error in ${operation}:`, error.message);

    return {
      success: false,
      data: null,
      message: error.message,
      pagination: null,
      error: {
        type: 'validation_error',
        message: error.message,
        operation
      }
    };
  },

  /**
   * Extract field-specific validation errors
   * @param {Error} error - Validation error
   * @returns {Object} - Field-specific error details
   */
  extractFieldErrors(error) {
    const fieldErrors = {};
    
    // Parse common validation error patterns
    if (error.message.includes('name')) {
      fieldErrors.name = error.message;
    }
    if (error.message.includes('description')) {
      fieldErrors.description = error.message;
    }
    if (error.message.includes('type')) {
      fieldErrors.type = error.message;
    }

    return fieldErrors;
  }
};

/**
 * Store integration for error handling
 */
export const storeErrorHandler = {
  /**
   * Handle follow/unfollow errors with store updates
   * @param {Object} error - Follow operation error
   * @param {string} listId - List ID
   * @param {boolean} wasFollowing - Previous follow state
   * @returns {Object} - Error response with store rollback
   */
  handleFollowError(error, listId, wasFollowing) {
    logError(`[ListErrorHandler] Follow operation failed for list ${listId}:`, error);

    // Rollback follow state in store
    try {
      const useFollowStore = require('../../stores/useFollowStore').default;
      useFollowStore.getState().setFollowState(listId, wasFollowing);
      logDebug(`[ListErrorHandler] Rolled back follow state for list ${listId}`);
    } catch (storeError) {
      logError('[ListErrorHandler] Failed to rollback follow state:', storeError);
    }

    return {
      success: false,
      error: parseApiError(error),
      message: `Failed to ${wasFollowing ? 'unfollow' : 'follow'} list`,
      listId,
      rolledBack: true
    };
  }
};

/**
 * Operation-specific error handlers
 */
export const operationErrorHandlers = {
  /**
   * Handle list creation errors
   * @param {Object} error - Creation error
   * @param {Object} listData - Original list data
   * @returns {Object} - Standardized error response
   */
  handleCreateListError(error, listData) {
    logError('[ListErrorHandler] List creation failed:', error);

    if (error.response?.status === 400) {
      return {
        success: false,
        data: null,
        message: error.response.data?.message || 'Invalid list data provided',
        error: {
          type: 'validation_error',
          details: error.response.data?.errors || {},
          originalData: listData
        }
      };
    }

    return errorProcessor.processErrorResponse(error, 'Create list');
  },

  /**
   * Handle list deletion errors
   * @param {Object} error - Deletion error
   * @param {string} listId - List ID
   * @returns {Object} - Standardized error response
   */
  handleDeleteListError(error, listId) {
    logError(`[ListErrorHandler] List deletion failed for ID ${listId}:`, error);

    if (error.response?.status === 404) {
      return {
        success: false,
        data: null,
        message: 'List not found or already deleted',
        error: {
          type: 'not_found_error',
          listId
        }
      };
    }

    if (error.response?.status === 403) {
      return {
        success: false,
        data: null,
        message: 'You do not have permission to delete this list',
        error: {
          type: 'permission_error',
          listId
        }
      };
    }

    return errorProcessor.processErrorResponse(error, 'Delete list');
  },

  /**
   * Handle bulk operation errors
   * @param {Object} error - Bulk operation error
   * @param {Array} items - Items that were being processed
   * @returns {Object} - Standardized error response with partial results
   */
  handleBulkOperationError(error, items) {
    logError('[ListErrorHandler] Bulk operation failed:', error);

    return {
      success: false,
      data: [],
      results: null,
      message: 'Bulk operation failed',
      error: {
        type: 'bulk_error',
        itemCount: items.length,
        details: parseApiError(error)
      }
    };
  },

  /**
   * Handle search operation errors
   * @param {Object} error - Search error
   * @param {Object} searchParams - Search parameters
   * @returns {Object} - Standardized error response
   */
  handleSearchError(error, searchParams) {
    logError('[ListErrorHandler] Search operation failed:', error);

    return {
      success: false,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      message: 'Search failed',
      searchTerm: searchParams.term,
      searchType: searchParams.type,
      error: {
        type: 'search_error',
        details: parseApiError(error)
      }
    };
  }
};

/**
 * Main error handling coordinator
 */
export const listErrorHandler = {
  /**
   * Handle any list service error with appropriate strategy
   * @param {Object} error - Error object
   * @param {string} operation - Operation that failed
   * @param {Object} options - Error handling options
   * @returns {Promise<Object>} - Handled error response
   */
  async handleError(error, operation, options = {}) {
    logDebug(`[ListErrorHandler] Handling error for ${operation}:`, {
      hasResponse: !!error.response,
      status: error.response?.status,
      message: error.message
    });

    const { allowFallback = true, retryOptions = {}, storeOptions = {} } = options;

    // Handle validation errors first
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return validationErrorHandler.handleValidationError(error, operation);
    }

    // Handle authentication errors with fallback
    if (authErrorHandler.isAuthError(error)) {
      try {
        return await authErrorHandler.handleAuthError(error, operation, {
          ...options,
          allowFallback
        });
      } catch (fallbackError) {
        return errorProcessor.processErrorResponse(fallbackError, operation, options.params);
      }
    }

    // Handle network errors
    if (networkErrorHandler.isNetworkError(error)) {
      return await networkErrorHandler.handleNetworkError(error, operation, retryOptions);
    }

    // Handle specific operation errors
    if (operation.includes('create')) {
      return operationErrorHandlers.handleCreateListError(error, options.data);
    }

    if (operation.includes('delete')) {
      return operationErrorHandlers.handleDeleteListError(error, options.listId);
    }

    if (operation.includes('bulk')) {
      return operationErrorHandlers.handleBulkOperationError(error, options.items || []);
    }

    if (operation.includes('search')) {
      return operationErrorHandlers.handleSearchError(error, options.params || {});
    }

    if (operation.includes('follow')) {
      return storeErrorHandler.handleFollowError(error, options.listId, options.wasFollowing);
    }

    // Default error handling
    return errorProcessor.processErrorResponse(error, operation, options.params);
  }
}; 