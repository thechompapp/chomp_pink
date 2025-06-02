import * as AdminModel from '../../models/adminModel.js';
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

// ================================
// CITIES CONTROLLER FUNCTIONS
// ================================

/**
 * Get all cities with admin privileges
 */
export const getCities = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const { data, total } = await AdminModel.findAllResources('cities', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('cities');
    const formattedData = Array.isArray(data) ? data.map(formatter) : [];
    const pagination = createPagination(page, limit, total);
    
    sendSuccessResponse(res, formattedData, 'Cities fetched successfully', pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch cities');
  }
};

/**
 * Create new city with admin privileges
 */
export const createCity = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newItem = await AdminModel.createResource('cities', req.body);
    const formatter = getFormatterForResourceType('cities');
    sendSuccessResponse(res, formatter(newItem), 'City created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create city');
  }
};

/**
 * Update city with admin privileges
 */
export const updateCity = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update city');
    }
    
    const updatedItem = await AdminModel.updateResource('cities', resourceId, req.body);
    if (!updatedItem) {
      return sendErrorResponse(res, `City with ID ${resourceId} not found.`, 404, 'update city');
    }
    
    const formatter = getFormatterForResourceType('cities');
    sendSuccessResponse(res, formatter(updatedItem), 'City updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update city');
  }
};

/**
 * Delete city with admin privileges
 */
export const deleteCity = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete city');
    }
    
    const deletedItem = await AdminModel.deleteResource('cities', resourceId);
    if (!deletedItem) {
      return sendErrorResponse(res, `City with ID ${resourceId} not found.`, 404, 'delete city');
    }
    
    sendSuccessResponse(res, null, 'City deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete city');
  }
};

// ================================
// NEIGHBORHOODS CONTROLLER FUNCTIONS
// ================================

/**
 * Get all neighborhoods with admin privileges
 */
export const getNeighborhoods = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const { data, total } = await AdminModel.findAllResources('neighborhoods', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('neighborhoods');
    const formattedData = Array.isArray(data) ? data.map(formatter) : [];
    const pagination = createPagination(page, limit, total);
    
    sendSuccessResponse(res, formattedData, 'Neighborhoods fetched successfully', pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch neighborhoods');
  }
};

/**
 * Create new neighborhood with admin privileges
 */
export const createNeighborhood = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const newItem = await AdminModel.createResource('neighborhoods', req.body);
    const formatter = getFormatterForResourceType('neighborhoods');
    sendSuccessResponse(res, formatter(newItem), 'Neighborhood created successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'create neighborhood');
  }
};

/**
 * Update neighborhood with admin privileges
 */
export const updateNeighborhood = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update neighborhood');
    }
    
    const updatedItem = await AdminModel.updateResource('neighborhoods', resourceId, req.body);
    if (!updatedItem) {
      return sendErrorResponse(res, `Neighborhood with ID ${resourceId} not found.`, 404, 'update neighborhood');
    }
    
    const formatter = getFormatterForResourceType('neighborhoods');
    sendSuccessResponse(res, formatter(updatedItem), 'Neighborhood updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update neighborhood');
  }
};

/**
 * Delete neighborhood with admin privileges
 */
export const deleteNeighborhood = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete neighborhood');
    }
    
    const deletedItem = await AdminModel.deleteResource('neighborhoods', resourceId);
    if (!deletedItem) {
      return sendErrorResponse(res, `Neighborhood with ID ${resourceId} not found.`, 404, 'delete neighborhood');
    }
    
    sendSuccessResponse(res, null, 'Neighborhood deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete neighborhood');
  }
};

// ================================
// AUTOSUGGEST FUNCTIONS
// ================================

/**
 * Get autosuggest cities for admin
 */
export const getAutosuggestCities = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return sendSuccessResponse(res, [], 'Query too short for autosuggest');
    }
    
    const result = await db.query(
      `SELECT id, name, state, country 
       FROM cities 
       WHERE name ILIKE $1 
       ORDER BY name 
       LIMIT 10`,
      [`%${query.trim()}%`]
    );
    
    sendSuccessResponse(res, result.rows, 'Cities autosuggest fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch cities autosuggest');
  }
};

/**
 * Get autosuggest neighborhoods for admin
 */
export const getAutosuggestNeighborhoods = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return sendSuccessResponse(res, [], 'Query too short for autosuggest');
    }
    
    const result = await db.query(
      `SELECT n.id, n.name, n.city_id, c.name as city_name 
       FROM neighborhoods n
       JOIN cities c ON n.city_id = c.id
       WHERE n.name ILIKE $1 
       ORDER BY n.name 
       LIMIT 10`,
      [`%${query.trim()}%`]
    );
    
    sendSuccessResponse(res, result.rows, 'Neighborhoods autosuggest fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch neighborhoods autosuggest');
  }
};

/**
 * Get autosuggest neighborhoods by city for admin
 */
export const getAutosuggestNeighborhoodsByCity = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { query, city_id } = req.query;
    
    if (!city_id) {
      return sendErrorResponse(res, 'City ID is required', 400, 'fetch neighborhoods by city');
    }
    
    const cityIdInt = parseInt(city_id, 10);
    if (isNaN(cityIdInt)) {
      return sendErrorResponse(res, 'Invalid city ID format', 400, 'fetch neighborhoods by city');
    }
    
    let sqlQuery, params;
    
    if (query && query.trim().length >= 2) {
      sqlQuery = `
        SELECT n.id, n.name, n.city_id, c.name as city_name 
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE n.city_id = $1 AND n.name ILIKE $2
        ORDER BY n.name 
        LIMIT 10
      `;
      params = [cityIdInt, `%${query.trim()}%`];
    } else {
      sqlQuery = `
        SELECT n.id, n.name, n.city_id, c.name as city_name 
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE n.city_id = $1
        ORDER BY n.name 
        LIMIT 10
      `;
      params = [cityIdInt];
    }
    
    const result = await db.query(sqlQuery, params);
    
    sendSuccessResponse(res, result.rows, 'Neighborhoods by city fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch neighborhoods by city');
  }
};

// ================================
// VALIDATION FUNCTIONS
// ================================

/**
 * Bulk validate cities
 */
export const bulkValidateCities = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminLocationController] Starting bulk city validation');
    const { cities } = req.body;
    
    if (!cities || !Array.isArray(cities)) {
      return sendErrorResponse(res, 'Invalid cities data provided', 400, 'validate cities');
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      try {
        // Basic validation
        if (!city.name || !city.name.trim()) {
          errors.push('City name is required');
        }
        
        if (!city.state || !city.state.trim()) {
          errors.push('State is required');
        }
        
        if (!city.country || !city.country.trim()) {
          errors.push('Country is required');
        }
        
        // Warnings for data quality
        if (city.name && city.name.length > 100) {
          warns.push('City name is quite long (>100 characters)');
        }
        
        if (errors.length > 0) {
          results.invalid.push({
            rowNumber,
            original: city,
            errors
          });
        } else {
          const resolved = {
            name: city.name.trim(),
            state: city.state.trim(),
            country: city.country.trim()
          };
          
          const validItem = {
            rowNumber,
            original: city,
            resolved
          };
          
          if (warns.length > 0) {
            results.warnings.push({
              ...validItem,
              warnings: warns
            });
          }
          
          results.valid.push(validItem);
        }
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: city,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    logInfo(`City validation complete: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.warnings.length} warnings`);
    
    sendSuccessResponse(res, {
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings,
      summary: {
        total: cities.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        warnings: results.warnings.length
      }
    }, 'City validation completed');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate cities');
  }
};

/**
 * Bulk validate neighborhoods
 */
export const bulkValidateNeighborhoods = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminLocationController] Starting bulk neighborhood validation');
    const { neighborhoods } = req.body;
    
    if (!neighborhoods || !Array.isArray(neighborhoods)) {
      return sendErrorResponse(res, 'Invalid neighborhoods data provided', 400, 'validate neighborhoods');
    }
    
    // Get all city IDs for validation
    const cityIds = await db.query('SELECT id FROM cities');
    const validCityIds = new Set(cityIds.rows.map(c => c.id));
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < neighborhoods.length; i++) {
      const neighborhood = neighborhoods[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      try {
        // Basic validation
        if (!neighborhood.name || !neighborhood.name.trim()) {
          errors.push('Neighborhood name is required');
        }
        
        if (!neighborhood.city_id) {
          errors.push('City ID is required');
        } else {
          const cityId = parseInt(neighborhood.city_id);
          if (isNaN(cityId) || !validCityIds.has(cityId)) {
            errors.push('Invalid city ID - city does not exist');
          }
        }
        
        // Warnings for data quality
        if (neighborhood.name && neighborhood.name.length > 100) {
          warns.push('Neighborhood name is quite long (>100 characters)');
        }
        
        if (errors.length > 0) {
          results.invalid.push({
            rowNumber,
            original: neighborhood,
            errors
          });
        } else {
          const resolved = {
            name: neighborhood.name.trim(),
            city_id: parseInt(neighborhood.city_id)
          };
          
          const validItem = {
            rowNumber,
            original: neighborhood,
            resolved
          };
          
          if (warns.length > 0) {
            results.warnings.push({
              ...validItem,
              warnings: warns
            });
          }
          
          results.valid.push(validItem);
        }
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: neighborhood,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    logInfo(`Neighborhood validation complete: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.warnings.length} warnings`);
    
    sendSuccessResponse(res, {
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings,
      summary: {
        total: neighborhoods.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        warnings: results.warnings.length
      }
    }, 'Neighborhood validation completed');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate neighborhoods');
  }
}; 