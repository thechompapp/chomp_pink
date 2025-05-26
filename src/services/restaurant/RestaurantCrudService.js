/**
 * Restaurant CRUD Service
 * 
 * Handles basic CRUD operations for restaurants.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * Restaurant CRUD Service class
 */
class RestaurantCrudService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/restaurants');
  }
  
  /**
   * Get restaurant details by ID
   * @param {string|number} restaurantId - Restaurant ID
   * @returns {Promise<Object>} Response with restaurant details
   */
  async getRestaurantDetails(restaurantId) {
    if (!validateId(restaurantId)) {
      return { 
        success: false, 
        message: 'Invalid restaurant ID',
        data: null
      };
    }
    
    logDebug(`[RestaurantCrudService] Fetching restaurant details for ID: ${restaurantId}`);
    
    try {
      const result = await this.get(`/${restaurantId}`);
      
      if (!result.success || !result.data) {
        logWarn(`[RestaurantCrudService] No restaurant found with ID: ${restaurantId}`);
        return {
          success: false,
          message: 'Restaurant not found',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Restaurant details retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error fetching restaurant details:`, error);
      return {
        success: false,
        message: 'Failed to retrieve restaurant details',
        data: null
      };
    }
  }
  
  /**
   * Get restaurant by ID (alias for getRestaurantDetails for backward compatibility)
   * @param {string|number} restaurantId - Restaurant ID
   * @returns {Promise<Object>} Response with restaurant details
   */
  async getRestaurantById(restaurantId) {
    return this.getRestaurantDetails(restaurantId);
  }
  
  /**
   * Get multiple restaurants by IDs
   * @param {Array<string|number>} restaurantIds - Array of restaurant IDs
   * @returns {Promise<Object>} Response with restaurants
   */
  async getRestaurantsByIds(restaurantIds) {
    if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return {
        success: false,
        message: 'Invalid restaurant IDs',
        data: []
      };
    }
    
    // Validate all IDs
    const validIds = restaurantIds.filter(id => validateId(id));
    
    if (validIds.length === 0) {
      return {
        success: false,
        message: 'No valid restaurant IDs provided',
        data: []
      };
    }
    
    logDebug(`[RestaurantCrudService] Fetching multiple restaurants by IDs: ${validIds.join(', ')}`);
    
    try {
      const result = await this.get('/batch', { 
        params: { ids: validIds.join(',') }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[RestaurantCrudService] No restaurants found for the provided IDs`);
        return {
          success: false,
          message: 'No restaurants found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Restaurants retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error fetching multiple restaurants:`, error);
      return {
        success: false,
        message: 'Failed to retrieve restaurants',
        data: []
      };
    }
  }
  
  /**
   * Create a new restaurant
   * @param {Object} restaurantData - Restaurant data
   * @returns {Promise<Object>} Response with created restaurant
   */
  async createRestaurant(restaurantData) {
    if (!restaurantData || typeof restaurantData !== 'object') {
      return {
        success: false,
        message: 'Invalid restaurant data',
        data: null
      };
    }
    
    // Validate required fields
    if (!restaurantData.name) {
      return {
        success: false,
        message: 'Restaurant name is required',
        data: null
      };
    }
    
    logDebug(`[RestaurantCrudService] Creating new restaurant: ${restaurantData.name}`);
    
    try {
      const result = await this.post('', restaurantData);
      
      return {
        success: true,
        data: result.data,
        message: 'Restaurant created successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error creating restaurant:`, error);
      return {
        success: false,
        message: 'Failed to create restaurant',
        data: null
      };
    }
  }
  
  /**
   * Update a restaurant
   * @param {string|number} restaurantId - Restaurant ID
   * @param {Object} updateData - Restaurant update data
   * @returns {Promise<Object>} Response with updated restaurant
   */
  async updateRestaurant(restaurantId, updateData) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID',
        data: null
      };
    }
    
    if (!updateData || typeof updateData !== 'object') {
      return {
        success: false,
        message: 'Invalid update data',
        data: null
      };
    }
    
    logDebug(`[RestaurantCrudService] Updating restaurant ${restaurantId}`);
    
    try {
      const result = await this.put(`/${restaurantId}`, updateData);
      
      return {
        success: true,
        data: result.data,
        message: 'Restaurant updated successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error updating restaurant:`, error);
      return {
        success: false,
        message: 'Failed to update restaurant',
        data: null
      };
    }
  }
  
  /**
   * Delete a restaurant
   * @param {string|number} restaurantId - Restaurant ID
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteRestaurant(restaurantId) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID'
      };
    }
    
    logDebug(`[RestaurantCrudService] Deleting restaurant ${restaurantId}`);
    
    try {
      await this.delete(`/${restaurantId}`);
      
      return {
        success: true,
        message: 'Restaurant deleted successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error deleting restaurant:`, error);
      return {
        success: false,
        message: 'Failed to delete restaurant'
      };
    }
  }
  
  /**
   * Get featured restaurants
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of restaurants to return
   * @param {number} options.page - Page number
   * @returns {Promise<Object>} Response with featured restaurants
   */
  async getFeaturedRestaurants({ limit = 10, page = 1 } = {}) {
    logDebug(`[RestaurantCrudService] Fetching featured restaurants, limit: ${limit}, page: ${page}`);
    
    try {
      const result = await this.get('/featured', {
        params: { limit, page }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.restaurants)) {
        logWarn(`[RestaurantCrudService] No featured restaurants found`);
        return {
          success: false,
          message: 'No featured restaurants found',
          data: {
            restaurants: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Featured restaurants retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error fetching featured restaurants:`, error);
      return {
        success: false,
        message: 'Failed to retrieve featured restaurants',
        data: {
          restaurants: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
  }
  
  /**
   * Get popular restaurants
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of restaurants to return
   * @param {number} options.page - Page number
   * @param {string} options.timeframe - Timeframe for popularity (day, week, month, year)
   * @returns {Promise<Object>} Response with popular restaurants
   */
  async getPopularRestaurants({ limit = 10, page = 1, timeframe = 'week' } = {}) {
    logDebug(`[RestaurantCrudService] Fetching popular restaurants, limit: ${limit}, page: ${page}, timeframe: ${timeframe}`);
    
    try {
      const result = await this.get('/popular', {
        params: { limit, page, timeframe }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.restaurants)) {
        logWarn(`[RestaurantCrudService] No popular restaurants found`);
        return {
          success: false,
          message: 'No popular restaurants found',
          data: {
            restaurants: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Popular restaurants retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantCrudService] Error fetching popular restaurants:`, error);
      return {
        success: false,
        message: 'Failed to retrieve popular restaurants',
        data: {
          restaurants: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
  }
}

// Create and export a singleton instance
export const restaurantCrudService = new RestaurantCrudService();

export default RestaurantCrudService;
