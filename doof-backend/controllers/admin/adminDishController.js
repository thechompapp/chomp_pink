import * as AdminModel from '../../models/adminModel.js';
import * as DishModel from '../../models/dishModel.js';
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
 * Get all dishes with admin privileges
 */
export const getDishes = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const { data, total } = await AdminModel.findAllResources('dishes', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('dishes');
    const formattedData = Array.isArray(data) ? data.map(formatter) : [];
    const pagination = createPagination(page, limit, total);
    
    sendSuccessResponse(res, formattedData, 'Dishes fetched successfully', pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch dishes');
  }
};

/**
 * Get dish by ID with admin privileges
 */
export const getDishById = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'fetch dish');
    }
    
    const item = await AdminModel.findResourceById('dishes', resourceId);
    if (!item) {
      return sendErrorResponse(res, `Dish with ID ${resourceId} not found.`, 404, 'fetch dish');
    }
    
    const formatter = getFormatterForResourceType('dishes');
    sendSuccessResponse(res, formatter(item), 'Dish fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch dish');
  }
};

/**
 * Create new dish with admin privileges
 */
export const createDish = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newItem = await AdminModel.createResource('dishes', req.body);
    const formatter = getFormatterForResourceType('dishes');
    sendSuccessResponse(res, formatter(newItem), 'Dish created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create dish');
  }
};

/**
 * Update dish with admin privileges
 */
export const updateDish = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update dish');
    }
    
    const updatedItem = await AdminModel.updateResource('dishes', resourceId, req.body);
    if (!updatedItem) {
      return sendErrorResponse(res, `Dish with ID ${resourceId} not found.`, 404, 'update dish');
    }
    
    const formatter = getFormatterForResourceType('dishes');
    sendSuccessResponse(res, formatter(updatedItem), 'Dish updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update dish');
  }
};

/**
 * Delete dish with admin privileges
 */
export const deleteDish = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete dish');
    }
    
    const deletedItem = await AdminModel.deleteResource('dishes', resourceId);
    if (!deletedItem) {
      return sendErrorResponse(res, `Dish with ID ${resourceId} not found.`, 404, 'delete dish');
    }
    
    sendSuccessResponse(res, null, 'Dish deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete dish');
  }
};

/**
 * Bulk validate dishes
 */
export const bulkValidateDishes = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminDishController] Starting bulk dish validation');
    const { dishes } = req.body;
    
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return sendErrorResponse(res, 'No dish data provided', 400, 'validate dishes');
    }
    
    const valid = [];
    const invalid = [];
    const warnings = [];
    
    // Get all restaurant IDs for validation
    const restaurantIds = await db.query('SELECT id FROM restaurants');
    const validRestaurantIds = new Set(restaurantIds.rows.map(r => r.id));
    
    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      // Validate required fields
      if (!dish.name || !dish.name.trim()) {
        errors.push('Dish name is required');
      }
      
      if (!dish.restaurant_id) {
        errors.push('Restaurant ID is required');
      } else {
        const restaurantId = parseInt(dish.restaurant_id);
        if (isNaN(restaurantId) || !validRestaurantIds.has(restaurantId)) {
          errors.push('Invalid restaurant ID - restaurant does not exist');
        }
      }
      
      // Add optional validation warnings
      if (dish.name && dish.name.length > 100) {
        warns.push('Dish name is quite long (>100 characters)');
      }
      
      if (dish.description && dish.description.length > 500) {
        warns.push('Description is quite long (>500 characters)');
      }
      
      if (errors.length > 0) {
        invalid.push({
          rowNumber,
          original: dish,
          errors
        });
      } else {
        const resolved = {
          name: dish.name.trim(),
          description: dish.description ? dish.description.trim() : null,
          restaurant_id: parseInt(dish.restaurant_id),
          price: dish.price ? parseFloat(dish.price) : null,
          category: dish.category ? dish.category.trim() : null
        };
        
        const validItem = {
          rowNumber,
          original: dish,
          resolved
        };
        
        if (warns.length > 0) {
          warnings.push({
            ...validItem,
            warnings: warns
          });
        }
        
        valid.push(validItem);
      }
    }
    
    logInfo(`Dish validation complete: ${valid.length} valid, ${invalid.length} invalid, ${warnings.length} warnings`);
    
    sendSuccessResponse(res, {
      valid,
      invalid,
      warnings,
      summary: {
        total: dishes.length,
        valid: valid.length,
        invalid: invalid.length,
        warnings: warnings.length
      }
    }, 'Dish validation completed');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate dishes');
  }
};

/**
 * Bulk add dishes
 */
export const bulkAddDishes = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminDishController] Starting bulk add dishes');
    const { dishes } = req.body;
    
    if (!dishes || !Array.isArray(dishes)) {
      return sendErrorResponse(res, 'Invalid dishes data provided', 400, 'bulk add dishes');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: dishes.length,
      errors: []
    };
    
    // Get valid restaurant IDs for validation
    const restaurantIds = await db.query('SELECT id FROM restaurants');
    const validRestaurantIds = new Set(restaurantIds.rows.map(r => r.id));
    
    // Process each dish
    for (const dish of dishes) {
      try {
        // Basic validation
        if (!dish.name || !dish.restaurant_id) {
          results.failed++;
          results.errors.push(`Missing required fields for dish: ${dish.name || 'Unknown'}`);
          continue;
        }
        
        const restaurantId = parseInt(dish.restaurant_id);
        if (isNaN(restaurantId) || !validRestaurantIds.has(restaurantId)) {
          results.failed++;
          results.errors.push(`Invalid restaurant ID ${dish.restaurant_id} for dish: ${dish.name}`);
          continue;
        }
        
        const dishData = {
          name: dish.name.trim(),
          description: dish.description ? dish.description.trim() : null,
          restaurant_id: restaurantId,
          price: dish.price ? parseFloat(dish.price) : null,
          category: dish.category ? dish.category.trim() : null
        };
        
        await DishModel.createDish(dishData);
        results.success++;
        
      } catch (error) {
        logError(`Error adding dish ${dish.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${dish.name}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk dish add completed: ${results.success} success, ${results.failed} failed`);
    
    // Clear cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} added, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk add dishes');
  }
}; 