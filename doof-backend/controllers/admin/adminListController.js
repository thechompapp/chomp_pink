import * as AdminModel from '../../models/adminModel.js';
import * as ListModel from '../../models/listModel.js';
import db from '../../db/index.js';
import { logInfo, logError } from '../../utils/logger.js';
import {
  validateSuperuserAccess,
  getFormatterForResourceType,
  sendSuccessResponse,
  sendErrorResponse,
  createPagination,
  parsePaginationParams
} from './adminBaseController.js';

/**
 * Get all lists with admin privileges
 */
export const getLists = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page = 1, limit = 50, search, userId, listType, isPublic, sort = 'updated_at', order = 'desc' } = req.query;
    
    const result = await ListModel.getAllLists({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      userId,
      listType,
      isPublic: isPublic !== undefined ? isPublic === 'true' : null,
      sort,
      order
    });
    
    sendSuccessResponse(res, result.lists, 'Lists fetched successfully', result.pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch lists');
  }
};

/**
 * Get list by ID with admin privileges
 */
export const getListById = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'fetch list');
    }
    
    const list = await ListModel.getListById(resourceId);
    if (!list) {
      return sendErrorResponse(res, `List with ID ${resourceId} not found.`, 404, 'fetch list');
    }
    
    const formatter = getFormatterForResourceType('lists');
    sendSuccessResponse(res, formatter(list), 'List fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch list');
  }
};

/**
 * Create new list with admin privileges
 */
export const createList = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newList = await ListModel.createList(req.body);
    const formatter = getFormatterForResourceType('lists');
    sendSuccessResponse(res, formatter(newList), 'List created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create list');
  }
};

/**
 * Update list with admin privileges
 */
export const updateList = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update list');
    }
    
    const updatedList = await ListModel.updateList(resourceId, req.body);
    if (!updatedList) {
      return sendErrorResponse(res, `List with ID ${resourceId} not found.`, 404, 'update list');
    }
    
    const formatter = getFormatterForResourceType('lists');
    sendSuccessResponse(res, formatter(updatedList), 'List updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update list');
  }
};

/**
 * Delete list with admin privileges
 */
export const deleteList = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete list');
    }
    
    const result = await ListModel.deleteList(resourceId);
    if (!result) {
      return sendErrorResponse(res, `List with ID ${resourceId} not found.`, 404, 'delete list');
    }
    
    // Clear cache headers to force frontend refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    sendSuccessResponse(res, result, 'List deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete list');
  }
};

/**
 * Bulk validate lists
 */
export const bulkValidateLists = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminListController] Starting bulk list validation');
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return sendErrorResponse(res, 'Data must be an array', 400, 'validate lists');
    }

    const validationResults = [];
    const validData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];
      const warns = [];
      
      // Name validation (required)
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
      }
      
      // Description validation (optional but must be string if provided)
      if (item.description && typeof item.description !== 'string') {
        errors.push('Description must be a string');
      }
      
      // List type validation (optional but must be valid enum if provided)
      if (item.list_type && !['restaurant', 'dish', 'mixed'].includes(item.list_type)) {
        errors.push('List type must be one of: restaurant, dish, mixed');
      }
      
      // City name validation (optional but must be string if provided)
      if (item.city_name && typeof item.city_name !== 'string') {
        errors.push('City name must be a string');
      }
      
      // Tags validation (optional but must be array if provided)
      if (item.tags && !Array.isArray(item.tags)) {
        errors.push('Tags must be an array');
      }
      
      // is_public validation (optional but must be boolean if provided)
      if (item.is_public !== undefined && typeof item.is_public !== 'boolean') {
        errors.push('is_public must be a boolean');
      }
      
      // creator_handle validation (optional but must be string if provided)
      if (item.creator_handle && typeof item.creator_handle !== 'string') {
        errors.push('Creator handle must be a string');
      }
      
      // user_id validation (optional but must be number if provided)
      if (item.user_id && (typeof item.user_id !== 'number' || item.user_id <= 0)) {
        errors.push('User ID must be a positive number');
      }
      
      // Additional warnings for data quality
      if (item.name && item.name.length > 100) {
        warns.push('List name is quite long (>100 characters)');
      }
      
      if (item.description && item.description.length > 500) {
        warns.push('Description is quite long (>500 characters)');
      }
      
      if (errors.length > 0) {
        validationResults.push({
          row: i + 1,
          isValid: false,
          errors,
          data: item
        });
      } else {
        validationResults.push({
          row: i + 1,
          isValid: true,
          errors: [],
          data: item
        });
        validData.push(item);
      }
    }

    const hasErrors = validationResults.some(result => !result.isValid);
    
    logInfo(`List validation complete: ${validData.length} valid, ${data.length - validData.length} invalid`);
    
    sendSuccessResponse(res, {
      validationResults,
      summary: {
        total: data.length,
        valid: validData.length,
        invalid: data.length - validData.length
      }
    }, hasErrors ? 'Validation completed with errors' : 'All data is valid');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate lists');
  }
};

/**
 * Bulk add lists
 */
export const bulkAddLists = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminListController] Starting bulk add lists');
    const { lists } = req.body;
    
    if (!lists || !Array.isArray(lists)) {
      return sendErrorResponse(res, 'Invalid lists data provided', 400, 'bulk add lists');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: lists.length,
      errors: []
    };
    
    // Process each list
    for (const list of lists) {
      try {
        // Basic validation
        if (!list.name || !list.name.trim()) {
          results.failed++;
          results.errors.push(`Missing required name for list: ${list.name || 'Unknown'}`);
          continue;
        }
        
        const listData = {
          name: list.name.trim(),
          description: list.description ? list.description.trim() : null,
          list_type: list.list_type || 'mixed',
          city_name: list.city_name ? list.city_name.trim() : null,
          tags: Array.isArray(list.tags) ? list.tags : [],
          is_public: typeof list.is_public === 'boolean' ? list.is_public : true,
          creator_handle: list.creator_handle ? list.creator_handle.trim() : null,
          user_id: list.user_id ? parseInt(list.user_id) : null
        };
        
        await ListModel.createList(listData);
        results.success++;
        
      } catch (error) {
        logError(`Error adding list ${list.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${list.name}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk list add completed: ${results.success} success, ${results.failed} failed`);
    
    // Clear cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} added, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk add lists');
  }
}; 