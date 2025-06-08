/**
 * List Validation
 * 
 * Single Responsibility: Parameter validation and data sanitization
 * - Validate and sanitize input parameters
 * - Ensure data types and formats are correct
 * - Provide safe defaults for missing parameters
 * - Validate IDs and prevent injection attacks
 */

import { logDebug, logWarn } from '@/utils/logger';

/**
 * ID validation utilities
 */
export const idValidator = {
  /**
   * Validate and sanitize ID parameters
   * @param {string|number} id - ID to validate
   * @param {string} fieldName - Name of the field for error messages
   * @returns {string} - Sanitized ID
   * @throws {Error} - If ID is invalid
   */
  validateId(id, fieldName = 'id') {
    if (!id) {
      throw new Error(`${fieldName} is required`);
    }

    // Convert to string and trim
    const sanitizedId = String(id).trim();

    if (!sanitizedId) {
      throw new Error(`${fieldName} cannot be empty`);
    }

    // Basic validation - alphanumeric and some special characters
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedId)) {
      throw new Error(`${fieldName} contains invalid characters`);
    }

    logDebug(`[ListValidation] Validated ${fieldName}: ${sanitizedId}`);
    return sanitizedId;
  },

  /**
   * Validate array of IDs
   * @param {Array} ids - Array of IDs to validate
   * @param {string} fieldName - Name of the field for error messages
   * @returns {Array} - Array of sanitized IDs
   */
  validateIdArray(ids, fieldName = 'ids') {
    if (!Array.isArray(ids)) {
      throw new Error(`${fieldName} must be an array`);
    }

    if (ids.length === 0) {
      throw new Error(`${fieldName} array cannot be empty`);
    }

    return ids.map((id, index) => 
      this.validateId(id, `${fieldName}[${index}]`)
    );
  }
};

/**
 * Parameter validation for different list operations
 */
export const paramValidator = {
  /**
   * Validate parameters for getting lists
   * @param {Object} params - Query parameters
   * @returns {Object} - Validated and sanitized parameters
   */
  validateGetListsParams(params = {}) {
    logDebug('[ListValidation] Validating getLists parameters');

    const validated = {};

    // User ID validation
    if (params.userId) {
      if (typeof params.userId === 'object') {
        validated.userId = String(params.userId.id || params.userId.userId || '');
      } else {
        validated.userId = String(params.userId);
      }
    }

    // City ID validation
    if (params.cityId) {
      validated.cityId = String(params.cityId);
    }

    // Pagination validation
    if (params.page) {
      const page = parseInt(params.page, 10);
      if (isNaN(page) || page < 1) {
        logWarn('[ListValidation] Invalid page number, using default');
        validated.page = 1;
      } else {
        validated.page = page;
      }
    }

    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        logWarn('[ListValidation] Invalid limit, using default');
        validated.limit = 25;
      } else {
        validated.limit = limit;
      }
    }

    // Sort validation
    if (params.sortBy) {
      const allowedSortFields = ['name', 'created_at', 'updated_at', 'item_count'];
      if (allowedSortFields.includes(params.sortBy)) {
        validated.sortBy = String(params.sortBy);
      } else {
        logWarn('[ListValidation] Invalid sortBy field, ignoring');
      }
    }

    if (params.sortOrder) {
      const order = String(params.sortOrder).toLowerCase();
      if (['asc', 'desc'].includes(order)) {
        validated.sortOrder = order;
      } else {
        logWarn('[ListValidation] Invalid sortOrder, using default');
      }
    }

    // List type validation
    if (params.listType) {
      const allowedTypes = ['dish', 'restaurant', 'mixed', 'custom'];
      if (allowedTypes.includes(params.listType)) {
        validated.listType = String(params.listType);
      } else {
        logWarn('[ListValidation] Invalid listType, ignoring');
      }
    }

    // Boolean parameters
    if (typeof params.isPublic !== 'undefined') {
      validated.isPublic = Boolean(params.isPublic);
    }

    // Search term validation
    if (params.searchTerm) {
      const searchTerm = String(params.searchTerm).trim();
      if (searchTerm.length > 0 && searchTerm.length <= 100) {
        validated.searchTerm = searchTerm;
      } else {
        logWarn('[ListValidation] Invalid search term length, ignoring');
      }
    }

    // Other user ID parameters
    if (params.isFollowedByUserId) {
      if (typeof params.isFollowedByUserId === 'object') {
        validated.isFollowedByUserId = String(params.isFollowedByUserId.id || params.isFollowedByUserId.userId || '');
      } else {
        validated.isFollowedByUserId = String(params.isFollowedByUserId);
      }
    }

    if (params.excludeUserId) {
      validated.excludeUserId = String(params.excludeUserId);
    }

    return validated;
  },

  /**
   * Validate list creation data
   * @param {Object} listData - List data to validate
   * @returns {Object} - Validated list data
   */
  validateListCreationData(listData) {
    logDebug('[ListValidation] Validating list creation data');

    if (!listData || typeof listData !== 'object') {
      throw new Error('List data is required and must be an object');
    }

    const validated = {};

    // Required fields
    if (!listData.name || typeof listData.name !== 'string') {
      throw new Error('List name is required and must be a string');
    }
    
    const name = listData.name.trim();
    if (name.length === 0) {
      throw new Error('List name cannot be empty');
    }
    if (name.length > 200) {
      throw new Error('List name cannot exceed 200 characters');
    }
    validated.name = name;

    // Optional fields
    if (listData.description) {
      const description = String(listData.description).trim();
      if (description.length > 1000) {
        throw new Error('List description cannot exceed 1000 characters');
      }
      validated.description = description;
    }

    if (typeof listData.isPublic !== 'undefined') {
      validated.isPublic = Boolean(listData.isPublic);
    }

    if (listData.listType) {
      const allowedTypes = ['dish', 'restaurant', 'mixed', 'custom'];
      if (allowedTypes.includes(listData.listType)) {
        validated.listType = listData.listType;
      } else {
        throw new Error('Invalid list type');
      }
    }

    return validated;
  },

  /**
   * Validate list item data
   * @param {Object} itemData - Item data to validate
   * @returns {Object} - Validated item data
   */
  validateListItemData(itemData) {
    logDebug('[ListValidation] Validating list item data');

    if (!itemData || typeof itemData !== 'object') {
      throw new Error('Item data is required and must be an object');
    }

    const validated = {};

    // Item type validation
    if (!itemData.type) {
      throw new Error('Item type is required');
    }

    const allowedTypes = ['dish', 'restaurant', 'custom'];
    if (!allowedTypes.includes(itemData.type)) {
      throw new Error('Invalid item type');
    }
    validated.type = itemData.type;

    // Type-specific validation
    switch (itemData.type) {
      case 'dish':
        if (!itemData.dish_id) {
          throw new Error('dish_id is required for dish items');
        }
        validated.dish_id = idValidator.validateId(itemData.dish_id, 'dish_id');
        break;

      case 'restaurant':
        if (!itemData.restaurant_id) {
          throw new Error('restaurant_id is required for restaurant items');
        }
        validated.restaurant_id = idValidator.validateId(itemData.restaurant_id, 'restaurant_id');
        break;

      case 'custom':
        if (!itemData.custom_item_name) {
          throw new Error('custom_item_name is required for custom items');
        }
        const customName = String(itemData.custom_item_name).trim();
        if (customName.length === 0 || customName.length > 200) {
          throw new Error('Custom item name must be between 1 and 200 characters');
        }
        validated.custom_item_name = customName;

        if (itemData.custom_item_description) {
          const customDesc = String(itemData.custom_item_description).trim();
          if (customDesc.length > 500) {
            throw new Error('Custom item description cannot exceed 500 characters');
          }
          validated.custom_item_description = customDesc;
        }
        break;
    }

    // Optional notes
    if (itemData.notes) {
      const notes = String(itemData.notes).trim();
      if (notes.length > 500) {
        throw new Error('Notes cannot exceed 500 characters');
      }
      validated.notes = notes;
    }

    // Position validation
    if (itemData.position !== undefined) {
      const position = parseInt(itemData.position, 10);
      if (!isNaN(position) && position >= 0) {
        validated.position = position;
      }
    }

    return validated;
  },

  /**
   * Validate search parameters
   * @param {Object} params - Search parameters
   * @returns {Object} - Validated search parameters
   */
  validateSearchParams(params) {
    logDebug('[ListValidation] Validating search parameters');

    const validated = {};

    // Search term validation
    if (params.term || params.searchTerm) {
      const searchTerm = String(params.term || params.searchTerm).trim();
      if (searchTerm.length === 0) {
        throw new Error('Search term cannot be empty');
      }
      if (searchTerm.length > 100) {
        throw new Error('Search term cannot exceed 100 characters');
      }
      validated.term = searchTerm;
    }

    // Search type validation
    if (params.type || params.searchType) {
      const searchType = String(params.type || params.searchType);
      const allowedTypes = ['all', 'dish', 'restaurant', 'custom'];
      if (allowedTypes.includes(searchType)) {
        validated.type = searchType;
      } else {
        logWarn('[ListValidation] Invalid search type, using default');
        validated.type = 'all';
      }
    }

    // Pagination
    if (params.page) {
      const page = parseInt(params.page, 10);
      validated.page = isNaN(page) || page < 1 ? 1 : page;
    }

    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      validated.limit = isNaN(limit) || limit < 1 || limit > 50 ? 20 : limit;
    }

    // Optional filters
    if (params.userId) {
      validated.userId = idValidator.validateId(params.userId, 'userId');
    }

    if (params.cityId) {
      validated.cityId = idValidator.validateId(params.cityId, 'cityId');
    }

    if (typeof params.includePrivate !== 'undefined') {
      validated.includePrivate = Boolean(params.includePrivate);
    }

    return validated;
  }
};

/**
 * Data sanitization utilities
 */
export const dataSanitizer = {
  /**
   * Sanitize string input to prevent XSS
   * @param {string} input - Input string
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} - Sanitized string
   */
  sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove HTML tags and trim
    const sanitized = input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove remaining angle brackets
      .trim();

    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  },

  /**
   * Sanitize object keys and values
   * @param {Object} obj - Object to sanitize
   * @returns {Object} - Sanitized object
   */
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      
      if (typeof value === 'string') {
        sanitized[cleanKey] = this.sanitizeString(value);
      } else if (typeof value === 'number' && !isNaN(value)) {
        sanitized[cleanKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[cleanKey] = value;
      } else if (Array.isArray(value)) {
        sanitized[cleanKey] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      }
    }

    return sanitized;
  }
};

/**
 * Batch validation utilities
 */
export const batchValidator = {
  /**
   * Validate bulk operation data
   * @param {Array} items - Array of items to validate
   * @param {Function} itemValidator - Validation function for individual items
   * @param {number} maxItems - Maximum number of items allowed
   * @returns {Array} - Array of validated items
   */
  validateBulkItems(items, itemValidator, maxItems = 50) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    if (items.length === 0) {
      throw new Error('Items array cannot be empty');
    }

    if (items.length > maxItems) {
      throw new Error(`Cannot process more than ${maxItems} items at once`);
    }

    return items.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new Error(`Item ${index + 1}: ${error.message}`);
      }
    });
  },

  /**
   * Validate list IDs for multi-list operations
   * @param {Array} listIds - Array of list IDs
   * @param {number} maxLists - Maximum number of lists allowed
   * @returns {Array} - Array of validated list IDs
   */
  validateMultipleListIds(listIds, maxLists = 10) {
    if (!Array.isArray(listIds)) {
      throw new Error('List IDs must be an array');
    }

    if (listIds.length === 0) {
      throw new Error('At least one list ID is required');
    }

    if (listIds.length > maxLists) {
      throw new Error(`Cannot process more than ${maxLists} lists at once`);
    }

    // Remove duplicates and validate
    const uniqueIds = [...new Set(listIds)];
    return idValidator.validateIdArray(uniqueIds, 'listIds');
  }
}; 