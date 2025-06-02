import db from '../../db/index.js';
import { getResourceConfig, logAdminOperation, createAdminModelError } from './AdminBaseModel.js';
import {
  buildFindAllQuery,
  buildFindByIdQuery,
  buildCreateQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildExistenceCheckQuery,
  buildLookupQuery,
  executeQuery
} from './AdminQueryBuilder.js';

/**
 * AdminResourceManager - Handles generic CRUD operations for all admin resources
 * Provides consistent interface for resource management across different entity types
 */

/**
 * Find all resources with pagination, sorting, and filtering
 * @param {string} resourceType - Type of resource to find
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @param {string} sort - Column to sort by
 * @param {string} order - Sort order (asc/desc)
 * @param {object} filters - Additional filters to apply
 * @returns {Promise<object>} Paginated results with items and metadata
 */
export const findAllResources = async (resourceType, page = 1, limit = 20, sort = 'id', order = 'asc', filters = {}) => {
  try {
    const config = getResourceConfig(resourceType);
    
    logAdminOperation('info', 'findAllResources', resourceType, 
      `Finding resources: page=${page}, limit=${limit}, sort=${sort}, order=${order}`);

    const queryObj = buildFindAllQuery(resourceType, page, limit, sort, order, filters);
    
    // Execute main query and count query in parallel
    const [resourcesResult, countResult] = await Promise.all([
      executeQuery(queryObj, 'findAllResources', resourceType),
      executeQuery({ query: queryObj.countQuery, params: queryObj.countParams }, 'findAllResourcesCount', resourceType)
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;
    
    // Apply formatters to the results
    const formattedItems = resourcesResult.rows.map(row => 
      config.formatter ? config.formatter(row) : row
    );

    return {
      items: formattedItems,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error) {
    logAdminOperation('error', 'findAllResources', resourceType, 'Failed to find resources', { error: error.message });
    throw createAdminModelError('findAllResources', resourceType, error);
  }
};

/**
 * Find a single resource by ID
 * @param {string} resourceType - Type of resource to find
 * @param {number} id - Resource ID
 * @returns {Promise<object|null>} Found resource or null if not found
 */
export const findResourceById = async (resourceType, id) => {
  try {
    const config = getResourceConfig(resourceType);
    
    logAdminOperation('info', 'findResourceById', resourceType, `Finding resource with ID: ${id}`);

    const queryObj = buildFindByIdQuery(resourceType, id);
    const result = await executeQuery(queryObj, 'findResourceById', resourceType);

    if (result.rows.length === 0) {
      logAdminOperation('info', 'findResourceById', resourceType, `Resource not found with ID: ${id}`);
      return null;
    }

    const formattedItem = config.formatter ? config.formatter(result.rows[0]) : result.rows[0];
    
    logAdminOperation('info', 'findResourceById', resourceType, `Resource found with ID: ${id}`);
    return formattedItem;
  } catch (error) {
    logAdminOperation('error', 'findResourceById', resourceType, `Failed to find resource with ID: ${id}`, { error: error.message });
    throw createAdminModelError('findResourceById', resourceType, error);
  }
};

/**
 * Create a new resource
 * @param {string} resourceType - Type of resource to create
 * @param {object} data - Resource data
 * @returns {Promise<object>} Created resource
 */
export const createResource = async (resourceType, data) => {
  try {
    const config = getResourceConfig(resourceType);
    
    logAdminOperation('info', 'createResource', resourceType, 'Creating new resource', { 
      providedFields: Object.keys(data).length 
    });

    const queryObj = buildCreateQuery(resourceType, data);
    const result = await executeQuery(queryObj, 'createResource', resourceType);

    if (result.rows.length === 0) {
      throw new Error('Insert operation did not return a record');
    }

    const formattedItem = config.formatter ? config.formatter(result.rows[0]) : result.rows[0];
    
    logAdminOperation('info', 'createResource', resourceType, `Resource created with ID: ${formattedItem.id}`);
    return formattedItem;
  } catch (error) {
    logAdminOperation('error', 'createResource', resourceType, 'Failed to create resource', { error: error.message });
    throw createAdminModelError('createResource', resourceType, error);
  }
};

/**
 * Update an existing resource
 * @param {string} resourceType - Type of resource to update
 * @param {number} id - Resource ID
 * @param {object} data - Updated data
 * @returns {Promise<object|null>} Updated resource or null if not found
 */
export const updateResource = async (resourceType, id, data) => {
  try {
    const config = getResourceConfig(resourceType);
    
    logAdminOperation('info', 'updateResource', resourceType, `Updating resource with ID: ${id}`, {
      updateFields: Object.keys(data).length
    });

    const queryObj = buildUpdateQuery(resourceType, id, data);
    const result = await executeQuery(queryObj, 'updateResource', resourceType);

    if (result.rows.length === 0) {
      logAdminOperation('info', 'updateResource', resourceType, `Resource not found with ID: ${id}`);
      return null;
    }

    const formattedItem = config.formatter ? config.formatter(result.rows[0]) : result.rows[0];
    
    logAdminOperation('info', 'updateResource', resourceType, `Resource updated with ID: ${id}`);
    return formattedItem;
  } catch (error) {
    logAdminOperation('error', 'updateResource', resourceType, `Failed to update resource with ID: ${id}`, { error: error.message });
    throw createAdminModelError('updateResource', resourceType, error);
  }
};

/**
 * Delete a resource
 * @param {string} resourceType - Type of resource to delete
 * @param {number} id - Resource ID
 * @returns {Promise<object|null>} Deleted resource or null if not found
 */
export const deleteResource = async (resourceType, id) => {
  try {
    const config = getResourceConfig(resourceType);
    
    logAdminOperation('info', 'deleteResource', resourceType, `Deleting resource with ID: ${id}`);

    const queryObj = buildDeleteQuery(resourceType, id);
    const result = await executeQuery(queryObj, 'deleteResource', resourceType);

    if (result.rows.length === 0) {
      logAdminOperation('info', 'deleteResource', resourceType, `Resource not found with ID: ${id}`);
      return null;
    }

    const formattedItem = config.formatter ? config.formatter(result.rows[0]) : result.rows[0];
    
    logAdminOperation('info', 'deleteResource', resourceType, `Resource deleted with ID: ${id}`);
    return formattedItem;
  } catch (error) {
    logAdminOperation('error', 'deleteResource', resourceType, `Failed to delete resource with ID: ${id}`, { error: error.message });
    throw createAdminModelError('deleteResource', resourceType, error);
  }
};

/**
 * Bulk add resources with transaction support
 * @param {string} resourceType - Type of resources to add
 * @param {Array} items - Array of items to add
 * @param {number} adminUserId - ID of admin performing the operation
 * @returns {Promise<object>} Results with success/failure counts and details
 */
export const bulkAddResources = async (resourceType, items, adminUserId) => {
  const config = getResourceConfig(resourceType);
  const client = await db.getClient();
  const results = { successCount: 0, failureCount: 0, errors: [], createdItems: [] };
  
  try {
    await client.query('BEGIN');
    
    logAdminOperation('info', 'bulkAddResources', resourceType, `Starting bulk add of ${items.length} items`);
    
    for (const item of items) {
      try {
        const createdItem = await createResource(resourceType, item);
        if (createdItem) {
          results.createdItems.push(createdItem);
          results.successCount++;
        } else {
          throw new Error('Insert did not return a record via createResource.');
        }
      } catch (itemError) {
        results.failureCount++;
        results.errors.push({
          itemProvided: item,
          error: itemError.message,
          detail: itemError.detail || (itemError.original ? itemError.original.detail : null)
        });
      }
    }
    
    if (results.failureCount > 0 && results.successCount === 0) {
      await client.query('ROLLBACK');
      logAdminOperation('warn', 'bulkAddResources', resourceType, 'All items failed, rolling back transaction');
    } else if (results.failureCount > 0) {
      await client.query('COMMIT');
      logAdminOperation('warn', 'bulkAddResources', resourceType, 'Partial success, committed successful items');
    } else {
      await client.query('COMMIT');
      logAdminOperation('info', 'bulkAddResources', resourceType, `Successfully added all ${results.successCount} items`);
    }
    
    return results;
  } catch (batchError) {
    await client.query('ROLLBACK');
    logAdminOperation('error', 'bulkAddResources', resourceType, 'Critical error during bulk add', { error: batchError.message });
    throw createAdminModelError('bulkAddResources', resourceType, batchError);
  } finally {
    client.release();
  }
};

/**
 * Check for existing items to prevent duplicates during bulk operations
 * @param {string} resourceType - Type of resources to check
 * @param {Array} itemsToCheck - Array of items to check for existence
 * @returns {Promise<Array>} Array of results with item and existing record information
 */
export const checkExistingItems = async (resourceType, itemsToCheck) => {
  try {
    const config = getResourceConfig(resourceType);
    const results = [];
    
    logAdminOperation('info', 'checkExistingItems', resourceType, `Checking ${itemsToCheck.length} items for duplicates`);
    
    for (const item of itemsToCheck) {
      let existingDbRecord = null;
      
      const queryObj = buildExistenceCheckQuery(resourceType, item);
      
      if (queryObj) {
        try {
          const result = await executeQuery(queryObj, 'checkExistingItems', resourceType);
          if (result.rows.length > 0) {
            existingDbRecord = result.rows[0];
          }
        } catch (error) {
          logAdminOperation('warn', 'checkExistingItems', resourceType, 
            'Failed to check existence for item', { error: error.message, item });
        }
      }
      
      results.push({
        item,
        existing: existingDbRecord ? (config.formatter || (x => x))(existingDbRecord) : null
      });
    }
    
    const duplicateCount = results.filter(r => r.existing).length;
    logAdminOperation('info', 'checkExistingItems', resourceType, 
      `Found ${duplicateCount} duplicates out of ${itemsToCheck.length} items`);
    
    return results;
  } catch (error) {
    logAdminOperation('error', 'checkExistingItems', resourceType, 'Failed to check existing items', { error: error.message });
    throw createAdminModelError('checkExistingItems', resourceType, error);
  }
};

/**
 * Get lookup data for resource relationships
 * @param {string} lookupType - Type of lookup data needed
 * @returns {Promise<Map>} Map of ID to name for quick lookups
 */
export const getLookupData = async (lookupType) => {
  try {
    logAdminOperation('info', 'getLookupData', lookupType, 'Fetching lookup data');
    
    const queryObj = buildLookupQuery(lookupType);
    const result = await executeQuery(queryObj, 'getLookupData', lookupType);
    
    const lookupMap = new Map(result.rows.map(row => [row.id, row.name]));
    
    logAdminOperation('info', 'getLookupData', lookupType, `Loaded ${lookupMap.size} lookup entries`);
    return lookupMap;
  } catch (error) {
    logAdminOperation('error', 'getLookupData', lookupType, 'Failed to fetch lookup data', { error: error.message });
    throw createAdminModelError('getLookupData', lookupType, error);
  }
};

/**
 * Default export containing all resource management functions
 */
export default {
  findAllResources,
  findResourceById,
  createResource,
  updateResource,
  deleteResource,
  bulkAddResources,
  checkExistingItems,
  getLookupData
}; 