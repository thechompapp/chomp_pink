import * as AdminModel from '../../models/adminModel.js';
import * as RestaurantModel from '../../models/restaurantModel.js';
import * as CityModel from '../../models/cityModel.js';
import * as NeighborhoodModel from '../../models/neighborhoodModel.js';
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
 * Get all restaurants with admin privileges
 */
export const getRestaurants = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const { data, total } = await AdminModel.findAllResources('restaurants', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('restaurants');
    const formattedData = Array.isArray(data) ? data.map(formatter) : [];
    const pagination = createPagination(page, limit, total);
    
    sendSuccessResponse(res, formattedData, 'Restaurants fetched successfully', pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch restaurants');
  }
};

/**
 * Get restaurant by ID with admin privileges
 */
export const getRestaurantById = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'fetch restaurant');
    }
    
    const item = await AdminModel.findResourceById('restaurants', resourceId);
    if (!item) {
      return sendErrorResponse(res, `Restaurant with ID ${resourceId} not found.`, 404, 'fetch restaurant');
    }
    
    const formatter = getFormatterForResourceType('restaurants');
    sendSuccessResponse(res, formatter(item), 'Restaurant fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch restaurant');
  }
};

/**
 * Create new restaurant with admin privileges
 */
export const createRestaurant = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newItem = await AdminModel.createResource('restaurants', req.body);
    const formatter = getFormatterForResourceType('restaurants');
    sendSuccessResponse(res, formatter(newItem), 'Restaurant created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create restaurant');
  }
};

/**
 * Update restaurant with admin privileges
 */
export const updateRestaurant = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update restaurant');
    }
    
    const updatedItem = await AdminModel.updateResource('restaurants', resourceId, req.body);
    if (!updatedItem) {
      return sendErrorResponse(res, `Restaurant with ID ${resourceId} not found.`, 404, 'update restaurant');
    }
    
    const formatter = getFormatterForResourceType('restaurants');
    sendSuccessResponse(res, formatter(updatedItem), 'Restaurant updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update restaurant');
  }
};

/**
 * Delete restaurant with admin privileges
 */
export const deleteRestaurant = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete restaurant');
    }
    
    const deletedItem = await AdminModel.deleteResource('restaurants', resourceId);
    if (!deletedItem) {
      return sendErrorResponse(res, `Restaurant with ID ${resourceId} not found.`, 404, 'delete restaurant');
    }
    
    sendSuccessResponse(res, null, 'Restaurant deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete restaurant');
  }
};

/**
 * Bulk add restaurants
 */
export const bulkAddRestaurants = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminRestaurantController] Starting bulk add restaurants');
    const { restaurants } = req.body;
    
    if (!restaurants || !Array.isArray(restaurants)) {
      return sendErrorResponse(res, 'Invalid restaurants data provided', 400, 'bulk add restaurants');
    }
    
    // Helper function to lookup city_id by city name
    const lookupCityId = async (cityName) => {
      if (!cityName) return null;
      try {
        const result = await db.query('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [cityName.trim()]);
        return result.rows.length > 0 ? result.rows[0].id : null;
      } catch (error) {
        logError(`Error looking up city "${cityName}":`, error);
        return null;
      }
    };
    
    const results = {
      success: 0,
      failed: 0,
      total: restaurants.length,
      errors: []
    };
    
    // Process each restaurant
    for (const restaurant of restaurants) {
      try {
        const isPreValidated = restaurant.city_id !== undefined;
        let restaurantData;
        
        if (isPreValidated) {
          restaurantData = {
            name: restaurant.name,
            address: restaurant.address,
            city_id: restaurant.city_id,
            neighborhood_id: restaurant.neighborhood_id || null,
            description: restaurant.description || null,
            cuisine: restaurant.cuisine || null
          };
        } else {
          if (!restaurant.name || !restaurant.address) {
            results.failed++;
            results.errors.push(`Missing required fields for restaurant: ${restaurant.name || 'Unknown'}`);
            continue;
          }
          
          restaurantData = {
            name: restaurant.name,
            address: restaurant.address,
            city_id: await lookupCityId(restaurant.city) || null,
            neighborhood_id: restaurant.neighborhood_id || null,
            description: restaurant.description || null,
            cuisine: restaurant.cuisine || null
          };
        }
        
        await RestaurantModel.createRestaurant(restaurantData);
        results.success++;
        
      } catch (error) {
        logError(`Error adding restaurant ${restaurant.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${restaurant.name}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk add completed: ${results.success} success, ${results.failed} failed`);
    
    // Clear cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} added, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk add restaurants');
  }
};

/**
 * Bulk validate restaurants
 */
export const bulkValidateRestaurants = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminRestaurantController] Starting bulk restaurant validation');
    const { restaurants } = req.body;
    
    if (!restaurants || !Array.isArray(restaurants) || restaurants.length === 0) {
      return sendErrorResponse(res, 'No restaurant data provided', 400, 'validate restaurants');
    }
    
    const valid = [];
    const invalid = [];
    const warnings = [];
    
    // Helper functions
    const lookupCityId = async (cityName) => {
      if (!cityName) return null;
      try {
        const result = await db.query('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [cityName.trim()]);
        return result.rows.length > 0 ? result.rows[0].id : null;
      } catch (error) {
        logError(`Error looking up city "${cityName}":`, error);
        return null;
      }
    };
    
    const lookupNeighborhoodId = async (neighborhoodName, cityId) => {
      if (!neighborhoodName || !cityId) return null;
      try {
        const result = await db.query(
          'SELECT id FROM neighborhoods WHERE name ILIKE $1 AND city_id = $2 LIMIT 1',
          [neighborhoodName.trim(), cityId]
        );
        return result.rows.length > 0 ? result.rows[0].id : null;
      } catch (error) {
        logError(`Error looking up neighborhood "${neighborhoodName}":`, error);
        return null;
      }
    };
    
    // Validate each restaurant
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      // Validation rules
      if (!restaurant.name || !restaurant.name.trim()) {
        errors.push('Restaurant name is required');
      }
      
      if (!restaurant.address || !restaurant.address.trim()) {
        errors.push('Address is required');
      }
      
      if (!restaurant.city || !restaurant.city.trim()) {
        errors.push('City is required');
      }
      
      if (restaurant.phone && !/^[\d\s\-\(\)\+\.x]+$/.test(restaurant.phone)) {
        warns.push('Phone number format may be invalid');
      }
      
      if (restaurant.website && !restaurant.website.startsWith('http')) {
        warns.push('Website should start with http:// or https://');
      }
      
      if (errors.length > 0) {
        invalid.push({
          rowNumber,
          original: restaurant,
          errors
        });
      } else {
        try {
          // Resolve city and neighborhood IDs
          const cityId = await lookupCityId(restaurant.city);
          const neighborhoodId = restaurant.neighborhood ? 
            await lookupNeighborhoodId(restaurant.neighborhood, cityId) : null;
          
          const resolved = {
            name: restaurant.name.trim(),
            address: restaurant.address.trim(),
            city: restaurant.city.trim(),
            city_id: cityId,
            neighborhood: restaurant.neighborhood ? restaurant.neighborhood.trim() : null,
            neighborhood_id: neighborhoodId,
            zip: restaurant.zip ? restaurant.zip.trim() : null,
            phone: restaurant.phone ? restaurant.phone.trim() : null,
            website: restaurant.website ? restaurant.website.trim() : null,
            cuisine: restaurant.cuisine ? restaurant.cuisine.trim() : null,
            description: restaurant.description ? restaurant.description.trim() : null
          };
          
          const validItem = {
            rowNumber,
            original: restaurant,
            resolved
          };
          
          if (warns.length > 0) {
            warnings.push({
              ...validItem,
              warnings: warns
            });
          }
          
          valid.push(validItem);
        } catch (error) {
          logError(`Error resolving restaurant data for row ${rowNumber}:`, error);
          invalid.push({
            rowNumber,
            original: restaurant,
            errors: ['Failed to resolve city/neighborhood data']
          });
        }
      }
    }
    
    logInfo(`Validation complete: ${valid.length} valid, ${invalid.length} invalid, ${warnings.length} warnings`);
    
    sendSuccessResponse(res, {
      valid,
      invalid,
      warnings,
      summary: {
        total: restaurants.length,
        valid: valid.length,
        invalid: invalid.length,
        warnings: warnings.length
      }
    }, 'Restaurant validation completed');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate restaurants');
  }
}; 