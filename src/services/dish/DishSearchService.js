/**
 * Dish Search Service
 * 
 * Handles search operations for dishes, including text search,
 * filtering, and recommendations.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * Dish Search Service class
 */
class DishSearchService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/dishes');
  }
  
  /**
   * Search dishes with various filters
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.cuisine - Cuisine type
   * @param {number} params.minPrice - Minimum price
   * @param {number} params.maxPrice - Maximum price
   * @param {number} params.minRating - Minimum rating
   * @param {number} params.maxRating - Maximum rating
   * @param {string} params.restaurantId - Filter by restaurant
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Response with search results
   */
  async searchDishes(params = {}) {
    logDebug(`[DishSearchService] Searching dishes with params:`, params);
    
    // Default pagination
    const searchParams = {
      page: 1,
      limit: 20,
      ...params
    };
    
    try {
      const result = await this.get('/search', { params: searchParams });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishSearchService] No dishes found with search params:`, searchParams);
        return {
          success: false,
          message: 'No dishes found',
          data: {
            dishes: [],
            pagination: {
              page: searchParams.page,
              limit: searchParams.limit,
              total: 0,
              totalPages: 0
            }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes found successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error searching dishes:`, error);
      return {
        success: false,
        message: 'Failed to search dishes',
        data: {
          dishes: [],
          pagination: {
            page: searchParams.page,
            limit: searchParams.limit,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
  }
  
  /**
   * Get dish suggestions for autocomplete
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of suggestions
   * @returns {Promise<Object>} Response with dish suggestions
   */
  async getDishSuggestions(query, { limit = 5 } = {}) {
    if (!query) {
      return {
        success: false,
        message: 'Query is required',
        suggestions: []
      };
    }
    
    logDebug(`[DishSearchService] Getting dish suggestions for query: ${query}`);
    
    try {
      const result = await this.get('/suggestions', {
        params: { query, limit }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.suggestions)) {
        logWarn(`[DishSearchService] No suggestions found for query: ${query}`);
        return {
          success: false,
          message: 'No suggestions found',
          suggestions: []
        };
      }
      
      return {
        success: true,
        suggestions: result.data.suggestions,
        message: 'Suggestions retrieved successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error getting dish suggestions:`, error);
      return {
        success: false,
        message: 'Failed to get dish suggestions',
        suggestions: []
      };
    }
  }
  
  /**
   * Search dishes by cuisine
   * @param {string} cuisine - Cuisine type
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with dishes
   */
  async searchDishesByCuisine(cuisine, { page = 1, limit = 20 } = {}) {
    if (!cuisine) {
      return {
        success: false,
        message: 'Cuisine is required',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishSearchService] Searching dishes by cuisine: ${cuisine}`);
    
    try {
      const result = await this.get('/cuisine', {
        params: {
          cuisine,
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishSearchService] No dishes found for cuisine: ${cuisine}`);
        return {
          success: false,
          message: `No dishes found for cuisine: ${cuisine}`,
          data: {
            dishes: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes found successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error searching dishes by cuisine:`, error);
      return {
        success: false,
        message: 'Failed to search dishes by cuisine',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Get similar dishes
   * @param {string|number} dishId - Dish ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of similar dishes
   * @returns {Promise<Object>} Response with similar dishes
   */
  async getSimilarDishes(dishId, { limit = 5 } = {}) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: []
      };
    }
    
    logDebug(`[DishSearchService] Getting similar dishes for ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}/similar`, {
        params: { limit }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[DishSearchService] No similar dishes found for ID: ${dishId}`);
        return {
          success: false,
          message: 'No similar dishes found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Similar dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error getting similar dishes:`, error);
      return {
        success: false,
        message: 'Failed to get similar dishes',
        data: []
      };
    }
  }
  
  /**
   * Get trending dishes
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of dishes
   * @param {string} options.timeframe - Timeframe (day, week, month)
   * @param {string} options.cuisine - Filter by cuisine
   * @returns {Promise<Object>} Response with trending dishes
   */
  async getTrendingDishes({ limit = 10, timeframe = 'week', cuisine = null } = {}) {
    logDebug(`[DishSearchService] Getting trending dishes, timeframe: ${timeframe}`);
    
    const params = { limit, timeframe };
    if (cuisine) params.cuisine = cuisine;
    
    try {
      const result = await this.get('/trending', { params });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[DishSearchService] No trending dishes found`);
        return {
          success: false,
          message: 'No trending dishes found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Trending dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error getting trending dishes:`, error);
      return {
        success: false,
        message: 'Failed to get trending dishes',
        data: []
      };
    }
  }
  
  /**
   * Search dishes by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with dishes
   */
  async searchDishesByPriceRange(minPrice, maxPrice, { page = 1, limit = 20 } = {}) {
    if (minPrice === undefined || maxPrice === undefined) {
      return {
        success: false,
        message: 'Both minPrice and maxPrice are required',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishSearchService] Searching dishes by price range: $${minPrice} - $${maxPrice}`);
    
    try {
      const result = await this.get('/price-range', {
        params: {
          minPrice,
          maxPrice,
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishSearchService] No dishes found in price range: $${minPrice} - $${maxPrice}`);
        return {
          success: false,
          message: `No dishes found in price range: $${minPrice} - $${maxPrice}`,
          data: {
            dishes: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes found successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error searching dishes by price range:`, error);
      return {
        success: false,
        message: 'Failed to search dishes by price range',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Search dishes by dietary restrictions
   * @param {Array<string>} dietaryRestrictions - Array of dietary restrictions
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with dishes
   */
  async searchDishesByDietaryRestrictions(dietaryRestrictions, { page = 1, limit = 20 } = {}) {
    if (!Array.isArray(dietaryRestrictions) || dietaryRestrictions.length === 0) {
      return {
        success: false,
        message: 'Dietary restrictions must be a non-empty array',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishSearchService] Searching dishes by dietary restrictions: ${dietaryRestrictions.join(', ')}`);
    
    try {
      const result = await this.get('/dietary', {
        params: {
          restrictions: dietaryRestrictions.join(','),
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishSearchService] No dishes found for dietary restrictions: ${dietaryRestrictions.join(', ')}`);
        return {
          success: false,
          message: `No dishes found for dietary restrictions: ${dietaryRestrictions.join(', ')}`,
          data: {
            dishes: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes found successfully'
      };
    } catch (error) {
      logError(`[DishSearchService] Error searching dishes by dietary restrictions:`, error);
      return {
        success: false,
        message: 'Failed to search dishes by dietary restrictions',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
}

// Create and export a singleton instance
export const dishSearchService = new DishSearchService();

export default DishSearchService;
