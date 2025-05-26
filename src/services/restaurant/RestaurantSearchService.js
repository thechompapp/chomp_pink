/**
 * Restaurant Search Service
 * 
 * Handles search operations for restaurants, including text search,
 * filtering, and recommendations.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * Restaurant Search Service class
 */
class RestaurantSearchService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/restaurants');
  }
  
  /**
   * Search restaurants with various filters
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.cuisine - Cuisine type
   * @param {string} params.location - Location search
   * @param {number} params.minRating - Minimum rating
   * @param {number} params.maxRating - Maximum rating
   * @param {number} params.minPrice - Minimum price level
   * @param {number} params.maxPrice - Maximum price level
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Response with search results
   */
  async searchRestaurants(params = {}) {
    logDebug(`[RestaurantSearchService] Searching restaurants with params:`, params);
    
    // Default pagination
    const searchParams = {
      page: 1,
      limit: 20,
      ...params
    };
    
    try {
      const result = await this.get('/search', { params: searchParams });
      
      if (!result.success || !result.data || !Array.isArray(result.data.restaurants)) {
        logWarn(`[RestaurantSearchService] No restaurants found with search params:`, searchParams);
        return {
          success: false,
          message: 'No restaurants found',
          data: {
            restaurants: [],
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
        message: 'Restaurants found successfully'
      };
    } catch (error) {
      logError(`[RestaurantSearchService] Error searching restaurants:`, error);
      return {
        success: false,
        message: 'Failed to search restaurants',
        data: {
          restaurants: [],
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
   * Get restaurant suggestions for autocomplete
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of suggestions
   * @returns {Promise<Object>} Response with restaurant suggestions
   */
  async getRestaurantSuggestions(query, { limit = 5 } = {}) {
    if (!query) {
      return {
        success: false,
        message: 'Query is required',
        suggestions: []
      };
    }
    
    logDebug(`[RestaurantSearchService] Getting restaurant suggestions for query: ${query}`);
    
    try {
      const result = await this.get('/suggestions', {
        params: { query, limit }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.suggestions)) {
        logWarn(`[RestaurantSearchService] No suggestions found for query: ${query}`);
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
      logError(`[RestaurantSearchService] Error getting restaurant suggestions:`, error);
      return {
        success: false,
        message: 'Failed to get restaurant suggestions',
        suggestions: []
      };
    }
  }
  
  /**
   * Search restaurants by location
   * @param {Object} locationParams - Location parameters
   * @param {string} locationParams.city - City name
   * @param {string} locationParams.state - State name
   * @param {string} locationParams.zipcode - ZIP code
   * @param {number} locationParams.latitude - Latitude
   * @param {number} locationParams.longitude - Longitude
   * @param {number} locationParams.radius - Search radius in miles
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with restaurants
   */
  async searchRestaurantsByLocation(locationParams, { page = 1, limit = 20 } = {}) {
    if (!locationParams || typeof locationParams !== 'object') {
      return {
        success: false,
        message: 'Invalid location parameters',
        data: {
          restaurants: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    // Check if at least one location parameter is provided
    const hasLocationParam = ['city', 'state', 'zipcode', 'latitude', 'longitude'].some(
      param => locationParams[param]
    );
    
    if (!hasLocationParam) {
      return {
        success: false,
        message: 'At least one location parameter is required',
        data: {
          restaurants: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[RestaurantSearchService] Searching restaurants by location:`, locationParams);
    
    try {
      const result = await this.get('/location', {
        params: {
          ...locationParams,
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.restaurants)) {
        logWarn(`[RestaurantSearchService] No restaurants found for location:`, locationParams);
        return {
          success: false,
          message: 'No restaurants found for the specified location',
          data: {
            restaurants: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Restaurants found successfully'
      };
    } catch (error) {
      logError(`[RestaurantSearchService] Error searching restaurants by location:`, error);
      return {
        success: false,
        message: 'Failed to search restaurants by location',
        data: {
          restaurants: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Search restaurants by cuisine
   * @param {string} cuisine - Cuisine type
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with restaurants
   */
  async searchRestaurantsByCuisine(cuisine, { page = 1, limit = 20 } = {}) {
    if (!cuisine) {
      return {
        success: false,
        message: 'Cuisine is required',
        data: {
          restaurants: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[RestaurantSearchService] Searching restaurants by cuisine: ${cuisine}`);
    
    try {
      const result = await this.get('/cuisine', {
        params: {
          cuisine,
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.restaurants)) {
        logWarn(`[RestaurantSearchService] No restaurants found for cuisine: ${cuisine}`);
        return {
          success: false,
          message: `No restaurants found for cuisine: ${cuisine}`,
          data: {
            restaurants: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Restaurants found successfully'
      };
    } catch (error) {
      logError(`[RestaurantSearchService] Error searching restaurants by cuisine:`, error);
      return {
        success: false,
        message: 'Failed to search restaurants by cuisine',
        data: {
          restaurants: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Get similar restaurants
   * @param {string|number} restaurantId - Restaurant ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of similar restaurants
   * @returns {Promise<Object>} Response with similar restaurants
   */
  async getSimilarRestaurants(restaurantId, { limit = 5 } = {}) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID',
        data: []
      };
    }
    
    logDebug(`[RestaurantSearchService] Getting similar restaurants for ID: ${restaurantId}`);
    
    try {
      const result = await this.get(`/${restaurantId}/similar`, {
        params: { limit }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[RestaurantSearchService] No similar restaurants found for ID: ${restaurantId}`);
        return {
          success: false,
          message: 'No similar restaurants found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Similar restaurants retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantSearchService] Error getting similar restaurants:`, error);
      return {
        success: false,
        message: 'Failed to get similar restaurants',
        data: []
      };
    }
  }
  
  /**
   * Get trending restaurants
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of restaurants
   * @param {string} options.timeframe - Timeframe (day, week, month)
   * @param {string} options.location - Location filter
   * @returns {Promise<Object>} Response with trending restaurants
   */
  async getTrendingRestaurants({ limit = 10, timeframe = 'week', location = null } = {}) {
    logDebug(`[RestaurantSearchService] Getting trending restaurants, timeframe: ${timeframe}`);
    
    const params = { limit, timeframe };
    if (location) params.location = location;
    
    try {
      const result = await this.get('/trending', { params });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[RestaurantSearchService] No trending restaurants found`);
        return {
          success: false,
          message: 'No trending restaurants found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Trending restaurants retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantSearchService] Error getting trending restaurants:`, error);
      return {
        success: false,
        message: 'Failed to get trending restaurants',
        data: []
      };
    }
  }
}

// Create and export a singleton instance
export const restaurantSearchService = new RestaurantSearchService();

export default RestaurantSearchService;
