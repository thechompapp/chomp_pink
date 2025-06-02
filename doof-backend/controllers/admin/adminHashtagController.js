import * as AdminModel from '../../models/adminModel.js';
import * as HashtagModel from '../../models/hashtagModel.js';
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
 * Get all hashtags with admin privileges
 */
export const getHashtags = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const result = await AdminModel.findAllResources('hashtags', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('hashtags');
    const formattedData = Array.isArray(result.items) ? result.items.map(formatter) : [];
    
    sendSuccessResponse(res, formattedData, 'Hashtags fetched successfully', result.pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch hashtags');
  }
};

/**
 * Create hashtag with admin privileges
 */
export const createHashtag = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newHashtag = await AdminModel.createResource('hashtags', req.body);
    const formatter = getFormatterForResourceType('hashtags');
    sendSuccessResponse(res, formatter(newHashtag), 'Hashtag created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create hashtag');
  }
};

/**
 * Update hashtag with admin privileges
 */
export const updateHashtag = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update hashtag');
    }
    
    const updatedHashtag = await AdminModel.updateResource('hashtags', resourceId, req.body);
    if (!updatedHashtag) {
      return sendErrorResponse(res, `Hashtag with ID ${resourceId} not found.`, 404, 'update hashtag');
    }
    
    const formatter = getFormatterForResourceType('hashtags');
    sendSuccessResponse(res, formatter(updatedHashtag), 'Hashtag updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update hashtag');
  }
};

/**
 * Delete hashtag with admin privileges
 */
export const deleteHashtag = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete hashtag');
    }
    
    const result = await AdminModel.deleteResource('hashtags', resourceId);
    if (!result) {
      return sendErrorResponse(res, `Hashtag with ID ${resourceId} not found.`, 404, 'delete hashtag');
    }
    
    sendSuccessResponse(res, result, 'Hashtag deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete hashtag');
  }
};

/**
 * Bulk validate hashtags
 */
export const bulkValidateHashtags = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminHashtagController] Starting bulk hashtag validation');
    const { hashtags } = req.body;
    
    if (!hashtags || !Array.isArray(hashtags)) {
      return sendErrorResponse(res, 'Invalid hashtags data provided', 400, 'validate hashtags');
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < hashtags.length; i++) {
      const hashtag = hashtags[i];
      const rowNumber = i + 1;
      
      try {
        // Basic validation
        if (!hashtag.name) {
          results.invalid.push({
            rowNumber,
            original: hashtag,
            errors: ['Hashtag name is required']
          });
          continue;
        }
        
        // Clean hashtag name (remove # if present, ensure no spaces)
        let cleanName = hashtag.name.replace(/^#/, '').toLowerCase();
        cleanName = cleanName.replace(/\s+/g, '_');
        
        if (!cleanName) {
          results.invalid.push({
            rowNumber,
            original: hashtag,
            errors: ['Invalid hashtag name']
          });
          continue;
        }
        
        // Create resolved data
        const resolved = {
          name: cleanName,
          category: hashtag.category || 'general'
        };
        
        results.valid.push({
          rowNumber,
          original: hashtag,
          resolved
        });
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: hashtag,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    sendSuccessResponse(res, {
      total: hashtags.length,
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings
    }, 'Hashtag validation completed');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate hashtags');
  }
};

/**
 * Bulk add hashtags
 */
export const bulkAddHashtags = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminHashtagController] Starting bulk add hashtags');
    const { hashtags } = req.body;
    
    if (!hashtags || !Array.isArray(hashtags)) {
      return sendErrorResponse(res, 'Invalid hashtags data provided', 400, 'bulk add hashtags');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: hashtags.length,
      errors: []
    };
    
    // Process each hashtag
    for (const hashtag of hashtags) {
      try {
        // Basic validation
        if (!hashtag.name || !hashtag.name.trim()) {
          results.failed++;
          results.errors.push(`Missing required name for hashtag: ${hashtag.name || 'Unknown'}`);
          continue;
        }
        
        // Clean hashtag name
        let cleanName = hashtag.name.replace(/^#/, '').toLowerCase();
        cleanName = cleanName.replace(/\s+/g, '_');
        
        const hashtagData = {
          name: cleanName,
          category: hashtag.category || 'general'
        };
        
        await AdminModel.createResource('hashtags', hashtagData);
        results.success++;
        
      } catch (error) {
        logError(`Error adding hashtag ${hashtag.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${hashtag.name}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk hashtag add completed: ${results.success} success, ${results.failed} failed`);
    
    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} added, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk add hashtags');
  }
};

// ============================================================================
// RESTAURANT CHAINS OPERATIONS
// ============================================================================

/**
 * Get all restaurant chains with admin privileges
 */
export const getRestaurantChains = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const result = await AdminModel.findAllResources('restaurant_chains', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('restaurant_chains');
    const formattedData = Array.isArray(result.items) ? result.items.map(formatter) : [];
    
    sendSuccessResponse(res, formattedData, 'Restaurant chains fetched successfully', result.pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch restaurant chains');
  }
};

/**
 * Create restaurant chain with admin privileges
 */
export const createRestaurantChain = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newChain = await AdminModel.createResource('restaurant_chains', req.body);
    const formatter = getFormatterForResourceType('restaurant_chains');
    sendSuccessResponse(res, formatter(newChain), 'Restaurant chain created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create restaurant chain');
  }
};

/**
 * Update restaurant chain with admin privileges
 */
export const updateRestaurantChain = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update restaurant chain');
    }
    
    const updatedChain = await AdminModel.updateResource('restaurant_chains', resourceId, req.body);
    if (!updatedChain) {
      return sendErrorResponse(res, `Restaurant chain with ID ${resourceId} not found.`, 404, 'update restaurant chain');
    }
    
    const formatter = getFormatterForResourceType('restaurant_chains');
    sendSuccessResponse(res, formatter(updatedChain), 'Restaurant chain updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update restaurant chain');
  }
};

/**
 * Delete restaurant chain with admin privileges
 */
export const deleteRestaurantChain = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete restaurant chain');
    }
    
    const result = await AdminModel.deleteResource('restaurant_chains', resourceId);
    if (!result) {
      return sendErrorResponse(res, `Restaurant chain with ID ${resourceId} not found.`, 404, 'delete restaurant chain');
    }
    
    sendSuccessResponse(res, result, 'Restaurant chain deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete restaurant chain');
  }
};

/**
 * Bulk validate restaurant chains
 */
export const bulkValidateRestaurantChains = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminHashtagController] Starting bulk restaurant chain validation');
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return sendErrorResponse(res, 'Data must be an array', 400, 'validate restaurant chains');
    }

    const validationResults = [];
    const validData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];
      
      // Name validation (required)
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
      }
      
      // Description validation (optional but must be string if provided)
      if (item.description && typeof item.description !== 'string') {
        errors.push('Description must be a string');
      }
      
      // Website validation (optional but must be string if provided)  
      if (item.website && typeof item.website !== 'string') {
        errors.push('Website must be a string');
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
    
    logInfo(`Restaurant chain validation complete: ${validData.length} valid, ${data.length - validData.length} invalid`);
    
    sendSuccessResponse(res, {
      validationResults,
      summary: {
        total: data.length,
        valid: validData.length,
        invalid: data.length - validData.length
      }
    }, hasErrors ? 'Validation completed with errors' : 'All data is valid');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate restaurant chains');
  }
};

/**
 * Bulk add restaurant chains
 */
export const bulkAddRestaurantChains = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminHashtagController] Starting bulk add restaurant chains');
    const { chains } = req.body;
    
    if (!chains || !Array.isArray(chains)) {
      return sendErrorResponse(res, 'Invalid chains data provided', 400, 'bulk add restaurant chains');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: chains.length,
      errors: []
    };
    
    // Process each chain
    for (const chain of chains) {
      try {
        // Basic validation
        if (!chain.name || !chain.name.trim()) {
          results.failed++;
          results.errors.push(`Missing required name for chain: ${chain.name || 'Unknown'}`);
          continue;
        }
        
        const chainData = {
          name: chain.name.trim(),
          description: chain.description ? chain.description.trim() : null,
          website: chain.website ? chain.website.trim() : null
        };
        
        await AdminModel.createResource('restaurant_chains', chainData);
        results.success++;
        
      } catch (error) {
        logError(`Error adding restaurant chain ${chain.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${chain.name}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk restaurant chain add completed: ${results.success} success, ${results.failed} failed`);
    
    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} added, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk add restaurant chains');
  }
}; 