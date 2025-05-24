/* src/services/restaurantService.js */
import apiClient from './apiClient.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';
import { handleApiResponse, validateId } from '@/utils/serviceHelpers.js';

/**
 * Mock restaurant data for development and testing
 */
const MOCK_RESTAURANTS = [
  {
    id: 1,
    name: "Joe's Pizza",
    cuisine: "Italian",
    rating: 4.5,
    price_level: 2,
    location: {
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zipcode: "10001"
    }
  },
  {
    id: 2,
    name: "Sushi Palace",
    cuisine: "Japanese",
    rating: 4.8,
    price_level: 3,
    location: {
      address: "456 Broadway",
      city: "New York",
      state: "NY",
      zipcode: "10002"
    }
  },
  {
    id: 3,
    name: "Taco Heaven",
    cuisine: "Mexican",
    rating: 4.2,
    price_level: 1,
    location: {
      address: "789 Park Ave",
      city: "New York",
      state: "NY",
      zipcode: "10003"
    }
  }
];

// Note: These functions are no longer needed since we're using handleApiResponse and validateId helpers
// which standardize the response format, error handling, and ID validation

/**
 * Restaurant service for standardized API access to restaurant-related endpoints
 */
export const restaurantService = {
  /**
   * Get restaurant details by ID
   * @param {string|number} restaurantId - Restaurant ID
   * @returns {Promise<Object|null>} - Restaurant details or null if not found
   */
  async getRestaurantDetails(restaurantId) {
    const id = validateId(restaurantId, 'restaurantId');
    if (!id) return null;
    
    logDebug(`[RestaurantService] Fetching restaurant details for ID: ${id}`);
    
    const result = await handleApiResponse(
      () => apiClient.get(`/restaurants/${id}`),
      'RestaurantService.getRestaurantDetails'
    );
    
    if (!result.success || !result.data) {
      logWarn(`[RestaurantService] No restaurant found with ID: ${id}`);
      // Check mock data for development fallback
      if (process.env.NODE_ENV === 'development') {
        const mockRestaurant = MOCK_RESTAURANTS.find(r => r.id === id);
        return mockRestaurant || null;
      }
      return null;
    }
    
    return result.data;
  },

  /**
   * Get restaurant by ID (alias for getRestaurantDetails for backward compatibility)
   * @param {string|number} restaurantId - Restaurant ID
   * @returns {Promise<Object|null>} - Restaurant details or null if not found
   */
  async getRestaurantById(restaurantId) {
    return this.getRestaurantDetails(restaurantId);
  },

  /**
   * Search restaurants with various filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} - List of restaurants matching criteria
   */
  async searchRestaurants(params = {}) {
    logDebug(`[RestaurantService] Searching restaurants with params:`, params);
    
    const result = await handleApiResponse(
      () => apiClient.get('/restaurants', { params }),
      'RestaurantService.searchRestaurants'
    );
    
    if (!result.success || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      logWarn(`[RestaurantService] No restaurants found with search params:`, params);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        // Apply basic filtering to mock data
        let filteredMocks = [...MOCK_RESTAURANTS];
        
        if (params.cuisine) {
          filteredMocks = filteredMocks.filter(r => 
            r.cuisine.toLowerCase().includes(params.cuisine.toLowerCase()));
        }
        
        if (params.name) {
          filteredMocks = filteredMocks.filter(r => 
            r.name.toLowerCase().includes(params.name.toLowerCase()));
        }
        
        return filteredMocks;
      }
      
      return [];
    }
    
    return result.data;
  },
  
  /**
   * Get featured restaurants
   * @param {number} limit - Maximum number of restaurants to return
   * @returns {Promise<Array>} - List of featured restaurants
   */
  async getFeaturedRestaurants(limit = 10) {
    try {
      logDebug(`[RestaurantService] Fetching featured restaurants, limit: ${limit}`);
      
      const response = await apiClient.get('/restaurants/featured');
      const data = extractDataFromResponse(response, 'getFeaturedRestaurants');
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        logWarn(`[RestaurantService] No featured restaurants found`);
        
        // Return mock data for development
        if (process.env.NODE_ENV === 'development') {
          return MOCK_RESTAURANTS.slice(0, limit);
        }
        
        return [];
      }
      
      return data;
    } catch (error) {
      logError(`[RestaurantService] Error fetching featured restaurants:`, error);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return MOCK_RESTAURANTS.slice(0, limit);
      }
      
      return [];
    }
  }
};

// Export mock data for testing and development
export { MOCK_RESTAURANTS };

// Export default for backward compatibility
export default restaurantService;