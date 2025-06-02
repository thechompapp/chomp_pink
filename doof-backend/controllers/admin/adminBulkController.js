import * as AdminModel from '../../models/adminModel.js';
import { logInfo, logError } from '../../utils/logger.js';
import {
  validateSuperuserAccess,
  sendSuccessResponse,
  sendErrorResponse
} from './adminBaseController.js';

/**
 * Generic bulk delete function for any resource type
 */
export const bulkDelete = async (req, res, resourceType) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo(`[AdminBulkController] Starting bulk delete ${resourceType}`);
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendErrorResponse(res, 'Array of IDs is required', 400, `bulk delete ${resourceType}`);
    }

    // Validate all IDs are numbers
    const validIds = ids.filter(id => !isNaN(parseInt(id)));
    if (validIds.length !== ids.length) {
      return sendErrorResponse(res, 'All IDs must be valid numbers', 400, `bulk delete ${resourceType}`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Delete each item
    for (const id of validIds) {
      try {
        const deleted = await AdminModel.deleteResource(resourceType, parseInt(id));
        if (deleted) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${resourceType} with ID ${id} not found`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to delete ${resourceType} ${id}: ${error.message}`);
      }
    }

    // Clear cache headers to force frontend refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    logInfo(`Bulk delete ${resourceType} completed: ${results.success} success, ${results.failed} failed`);
    sendSuccessResponse(res, results, `Bulk delete completed: ${results.success} deleted, ${results.failed} failed`);

  } catch (error) {
    sendErrorResponse(res, error, 500, `bulk delete ${resourceType}`);
  }
};

/**
 * Generic bulk update function for any resource type
 */
export const bulkUpdate = async (req, res, resourceType) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo(`[AdminBulkController] Starting bulk update ${resourceType}`);
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return sendErrorResponse(res, 'Array of updates is required (each with id and fields to update)', 400, `bulk update ${resourceType}`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Update each item
    for (const update of updates) {
      try {
        if (!update.id) {
          results.failed++;
          results.errors.push('Update missing ID field');
          continue;
        }

        const { id, ...updateData } = update;
        const updated = await AdminModel.updateResource(resourceType, parseInt(id), updateData);
        
        if (updated) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${resourceType} with ID ${id} not found`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update ${resourceType} ${update.id}: ${error.message}`);
      }
    }

    logInfo(`Bulk update ${resourceType} completed: ${results.success} success, ${results.failed} failed`);
    sendSuccessResponse(res, results, `Bulk update completed: ${results.success} updated, ${results.failed} failed`);

  } catch (error) {
    sendErrorResponse(res, error, 500, `bulk update ${resourceType}`);
  }
};

/**
 * Generic bulk add function for any resource type
 */
export const bulkAdd = async (req, res, resourceType) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo(`[AdminBulkController] Starting bulk add ${resourceType}`);
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return sendErrorResponse(res, 'Array of records is required', 400, `bulk add ${resourceType}`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      created: []
    };

    // Create each item
    for (const record of records) {
      try {
        const created = await AdminModel.createResource(resourceType, record);
        if (created) {
          results.success++;
          results.created.push(created);
        } else {
          results.failed++;
          results.errors.push(`Failed to create ${resourceType} record`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to create ${resourceType}: ${error.message}`);
      }
    }

    logInfo(`Bulk add ${resourceType} completed: ${results.success} success, ${results.failed} failed`);
    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} created, ${results.failed} failed`);

  } catch (error) {
    sendErrorResponse(res, error, 500, `bulk add ${resourceType}`);
  }
};

/**
 * Generic import function (file-based bulk add) for any resource type
 */
export const importData = async (req, res, resourceType) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo(`[AdminBulkController] Starting import ${resourceType}`);
    
    // Handle file upload and parsing
    const file = req.file;
    if (!file) {
      return sendErrorResponse(res, 'File is required', 400, `import ${resourceType}`);
    }

    // Parse CSV/JSON file content
    let records = [];
    const fileContent = file.buffer.toString('utf8');
    
    if (file.mimetype === 'application/json') {
      records = JSON.parse(fileContent);
    } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      // Basic CSV parsing (for production, use a proper CSV parser)
      const lines = fileContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        return record;
      });
    } else {
      return sendErrorResponse(res, 'Unsupported file type. Please use CSV or JSON files.', 400, `import ${resourceType}`);
    }

    if (!Array.isArray(records) || records.length === 0) {
      return sendErrorResponse(res, 'No valid records found in file', 400, `import ${resourceType}`);
    }

    // Use the bulk add function
    req.body = { records };
    return bulkAdd(req, res, resourceType);

  } catch (error) {
    sendErrorResponse(res, error, 500, `import ${resourceType}`);
  }
};

// ============================================================================
// RESTAURANT BULK OPERATIONS
// ============================================================================

export const bulkDeleteRestaurants = (req, res) => bulkDelete(req, res, 'restaurants');
export const bulkUpdateRestaurants = (req, res) => bulkUpdate(req, res, 'restaurants');
export const bulkAddRestaurants = (req, res) => bulkAdd(req, res, 'restaurants');
export const importRestaurants = (req, res) => importData(req, res, 'restaurants');

// ============================================================================
// DISH BULK OPERATIONS
// ============================================================================

export const bulkDeleteDishes = (req, res) => bulkDelete(req, res, 'dishes');
export const bulkUpdateDishes = (req, res) => bulkUpdate(req, res, 'dishes');
export const bulkAddDishes = (req, res) => bulkAdd(req, res, 'dishes');
export const importDishes = (req, res) => importData(req, res, 'dishes');

// ============================================================================
// USER BULK OPERATIONS
// ============================================================================

export const bulkDeleteUsers = (req, res) => bulkDelete(req, res, 'users');
export const bulkUpdateUsers = (req, res) => bulkUpdate(req, res, 'users');
export const bulkAddUsers = (req, res) => bulkAdd(req, res, 'users');
export const importUsers = (req, res) => importData(req, res, 'users');

// ============================================================================
// CITY BULK OPERATIONS
// ============================================================================

export const bulkDeleteCities = (req, res) => bulkDelete(req, res, 'cities');
export const bulkUpdateCities = (req, res) => bulkUpdate(req, res, 'cities');
export const bulkAddCities = (req, res) => bulkAdd(req, res, 'cities');
export const importCities = (req, res) => importData(req, res, 'cities');

// ============================================================================
// NEIGHBORHOOD BULK OPERATIONS
// ============================================================================

export const bulkDeleteNeighborhoods = (req, res) => bulkDelete(req, res, 'neighborhoods');
export const bulkUpdateNeighborhoods = (req, res) => bulkUpdate(req, res, 'neighborhoods');
export const bulkAddNeighborhoods = (req, res) => bulkAdd(req, res, 'neighborhoods');
export const importNeighborhoods = (req, res) => importData(req, res, 'neighborhoods');

// ============================================================================
// HASHTAG BULK OPERATIONS
// ============================================================================

export const bulkDeleteHashtags = (req, res) => bulkDelete(req, res, 'hashtags');
export const bulkUpdateHashtags = (req, res) => bulkUpdate(req, res, 'hashtags');
export const bulkAddHashtags = (req, res) => bulkAdd(req, res, 'hashtags');
export const importHashtags = (req, res) => importData(req, res, 'hashtags');

// ============================================================================
// RESTAURANT CHAIN BULK OPERATIONS
// ============================================================================

export const bulkDeleteRestaurantChains = (req, res) => bulkDelete(req, res, 'restaurant_chains');
export const bulkUpdateRestaurantChains = (req, res) => bulkUpdate(req, res, 'restaurant_chains');
export const bulkAddRestaurantChains = (req, res) => bulkAdd(req, res, 'restaurant_chains');
export const importRestaurantChains = (req, res) => importData(req, res, 'restaurant_chains');

// ============================================================================
// LIST BULK OPERATIONS
// ============================================================================

export const bulkDeleteLists = (req, res) => bulkDelete(req, res, 'lists');
export const bulkUpdateLists = (req, res) => bulkUpdate(req, res, 'lists');
export const bulkAddLists = (req, res) => bulkAdd(req, res, 'lists');
export const importLists = (req, res) => importData(req, res, 'lists'); 