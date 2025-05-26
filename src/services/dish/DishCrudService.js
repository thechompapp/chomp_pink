/**
 * Dish CRUD Service
 * 
 * Handles basic CRUD operations for dishes.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * Dish CRUD Service class
 */
class DishCrudService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/dishes');
  }
  
  /**
   * Get dish details by ID
   * @param {string|number} dishId - Dish ID
   * @returns {Promise<Object>} Response with dish details
   */
  async getDishDetails(dishId) {
    if (!validateId(dishId)) {
      return { 
        success: false, 
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    logDebug(`[DishCrudService] Fetching dish details for ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}`);
      
      if (!result.success || !result.data) {
        logWarn(`[DishCrudService] No dish found with ID: ${dishId}`);
        return {
          success: false,
          message: 'Dish not found',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dish details retrieved successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error fetching dish details:`, error);
      return {
        success: false,
        message: 'Failed to retrieve dish details',
        data: null
      };
    }
  }
  
  /**
   * Get multiple dishes by IDs
   * @param {Array<string|number>} dishIds - Array of dish IDs
   * @returns {Promise<Object>} Response with dishes
   */
  async getDishesByIds(dishIds) {
    if (!Array.isArray(dishIds) || dishIds.length === 0) {
      return {
        success: false,
        message: 'Invalid dish IDs',
        data: []
      };
    }
    
    // Validate all IDs
    const validIds = dishIds.filter(id => validateId(id));
    
    if (validIds.length === 0) {
      return {
        success: false,
        message: 'No valid dish IDs provided',
        data: []
      };
    }
    
    logDebug(`[DishCrudService] Fetching multiple dishes by IDs: ${validIds.join(', ')}`);
    
    try {
      const result = await this.get('/batch', { 
        params: { ids: validIds.join(',') }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[DishCrudService] No dishes found for the provided IDs`);
        return {
          success: false,
          message: 'No dishes found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error fetching multiple dishes:`, error);
      return {
        success: false,
        message: 'Failed to retrieve dishes',
        data: []
      };
    }
  }
  
  /**
   * Get dishes by restaurant ID
   * @param {string|number} restaurantId - Restaurant ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with dishes
   */
  async getDishesByRestaurantId(restaurantId, { page = 1, limit = 20 } = {}) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishCrudService] Fetching dishes for restaurant ID: ${restaurantId}`);
    
    try {
      const result = await this.get('', {
        params: {
          restaurantId,
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishCrudService] No dishes found for restaurant ID: ${restaurantId}`);
        return {
          success: false,
          message: 'No dishes found for this restaurant',
          data: {
            dishes: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error fetching dishes for restaurant:`, error);
      return {
        success: false,
        message: 'Failed to retrieve dishes for this restaurant',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Create a new dish
   * @param {Object} dishData - Dish data
   * @returns {Promise<Object>} Response with created dish
   */
  async createDish(dishData) {
    if (!dishData || typeof dishData !== 'object') {
      return {
        success: false,
        message: 'Invalid dish data',
        data: null
      };
    }
    
    // Validate required fields
    if (!dishData.name) {
      return {
        success: false,
        message: 'Dish name is required',
        data: null
      };
    }
    
    if (!validateId(dishData.restaurantId)) {
      return {
        success: false,
        message: 'Valid restaurant ID is required',
        data: null
      };
    }
    
    logDebug(`[DishCrudService] Creating new dish: ${dishData.name}`);
    
    try {
      const result = await this.post('', dishData);
      
      return {
        success: true,
        data: result.data,
        message: 'Dish created successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error creating dish:`, error);
      return {
        success: false,
        message: 'Failed to create dish',
        data: null
      };
    }
  }
  
  /**
   * Update a dish
   * @param {string|number} dishId - Dish ID
   * @param {Object} updateData - Dish update data
   * @returns {Promise<Object>} Response with updated dish
   */
  async updateDish(dishId, updateData) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
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
    
    logDebug(`[DishCrudService] Updating dish ${dishId}`);
    
    try {
      const result = await this.put(`/${dishId}`, updateData);
      
      return {
        success: true,
        data: result.data,
        message: 'Dish updated successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error updating dish:`, error);
      return {
        success: false,
        message: 'Failed to update dish',
        data: null
      };
    }
  }
  
  /**
   * Delete a dish
   * @param {string|number} dishId - Dish ID
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteDish(dishId) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID'
      };
    }
    
    logDebug(`[DishCrudService] Deleting dish ${dishId}`);
    
    try {
      await this.delete(`/${dishId}`);
      
      return {
        success: true,
        message: 'Dish deleted successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error deleting dish:`, error);
      return {
        success: false,
        message: 'Failed to delete dish'
      };
    }
  }
  
  /**
   * Get featured dishes
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of dishes to return
   * @param {number} options.page - Page number
   * @returns {Promise<Object>} Response with featured dishes
   */
  async getFeaturedDishes({ limit = 10, page = 1 } = {}) {
    logDebug(`[DishCrudService] Fetching featured dishes, limit: ${limit}, page: ${page}`);
    
    try {
      const result = await this.get('/featured', {
        params: { limit, page }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishCrudService] No featured dishes found`);
        return {
          success: false,
          message: 'No featured dishes found',
          data: {
            dishes: [],
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
        message: 'Featured dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error fetching featured dishes:`, error);
      return {
        success: false,
        message: 'Failed to retrieve featured dishes',
        data: {
          dishes: [],
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
   * Get popular dishes
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of dishes to return
   * @param {number} options.page - Page number
   * @param {string} options.timeframe - Timeframe for popularity (day, week, month, year)
   * @returns {Promise<Object>} Response with popular dishes
   */
  async getPopularDishes({ limit = 10, page = 1, timeframe = 'week' } = {}) {
    logDebug(`[DishCrudService] Fetching popular dishes, limit: ${limit}, page: ${page}, timeframe: ${timeframe}`);
    
    try {
      const result = await this.get('/popular', {
        params: { limit, page, timeframe }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishCrudService] No popular dishes found`);
        return {
          success: false,
          message: 'No popular dishes found',
          data: {
            dishes: [],
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
        message: 'Popular dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishCrudService] Error fetching popular dishes:`, error);
      return {
        success: false,
        message: 'Failed to retrieve popular dishes',
        data: {
          dishes: [],
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
export const dishCrudService = new DishCrudService();

export default DishCrudService;
