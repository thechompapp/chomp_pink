/**
 * Restaurant Service
 * 
 * Standardized service for restaurant-related API endpoints.
 * Uses the new HTTP service and service helpers for consistent behavior.
 */
import { apiClient } from '@/services/http';
import { validateId, createQueryParams, handleApiResponse } from '@/services/utils/serviceHelpers';
import { logDebug } from '@/utils/logger';

/**
 * Base URL for restaurant endpoints
 * @type {string}
 */
const BASE_URL = '/api/restaurants';

/**
 * Service for restaurant management
 */
class RestaurantService {
  /**
   * Get all restaurants
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} List of restaurants
   */
  async getAll(params = {}) {
    logDebug('[RestaurantService] Getting all restaurants');
    
    const queryParams = createQueryParams(params);
    const url = queryParams ? `${BASE_URL}?${queryParams}` : BASE_URL;
    
    return handleApiResponse(
      apiClient.get(url),
      {
        entity: 'restaurants',
        operation: 'fetch',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
  
  /**
   * Get a restaurant by ID
   * @param {number|string} id - Restaurant ID
   * @returns {Promise<Object|null>} Restaurant or null if not found
   */
  async getById(id) {
    const validId = validateId(id, 'restaurant');
    if (!validId) return null;
    
    logDebug(`[RestaurantService] Getting restaurant by ID: ${validId}`);
    
    return handleApiResponse(
      apiClient.get(`${BASE_URL}/${validId}`),
      {
        entity: 'restaurant',
        operation: 'fetch',
        defaultValue: null
      }
    );
  }
  
  /**
   * Get restaurant details (alias for getById for backward compatibility)
   * @param {number|string} id - Restaurant ID
   * @returns {Promise<Object|null>} Restaurant details or null if not found
   */
  async getRestaurantDetails(id) {
    return this.getById(id);
  }
  
  /**
   * Create a new restaurant
   * @param {Object} data - Restaurant data
   * @returns {Promise<Object|null>} Created restaurant or null on error
   */
  async create(data) {
    if (!data) return null;
    
    logDebug('[RestaurantService] Creating restaurant');
    
    return handleApiResponse(
      apiClient.post(BASE_URL, data),
      {
        entity: 'restaurant',
        operation: 'create',
        defaultValue: null
      }
    );
  }
  
  /**
   * Update a restaurant
   * @param {number|string} id - Restaurant ID
   * @param {Object} data - Updated restaurant data
   * @returns {Promise<Object|null>} Updated restaurant or null on error
   */
  async update(id, data) {
    const validId = validateId(id, 'restaurant');
    if (!validId || !data) return null;
    
    logDebug(`[RestaurantService] Updating restaurant: ${validId}`);
    
    return handleApiResponse(
      apiClient.put(`${BASE_URL}/${validId}`, data),
      {
        entity: 'restaurant',
        operation: 'update',
        defaultValue: null
      }
    );
  }
  
  /**
   * Delete a restaurant
   * @param {number|string} id - Restaurant ID
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async delete(id) {
    const validId = validateId(id, 'restaurant');
    if (!validId) return false;
    
    logDebug(`[RestaurantService] Deleting restaurant: ${validId}`);
    
    return handleApiResponse(
      apiClient.delete(`${BASE_URL}/${validId}`),
      {
        entity: 'restaurant',
        operation: 'delete',
        defaultValue: false,
        transform: () => true
      }
    );
  }
  
  /**
   * Search for restaurants
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} Search results
   */
  async search(params = {}) {
    logDebug(`[RestaurantService] Searching restaurants`);
    
    const queryParams = createQueryParams(params);
    const url = queryParams ? `${BASE_URL}/search?${queryParams}` : `${BASE_URL}/search`;
    
    return handleApiResponse(
      apiClient.get(url),
      {
        entity: 'restaurants',
        operation: 'search',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
  
  /**
   * Get featured restaurants
   * @param {number} limit - Maximum number of restaurants to return
   * @returns {Promise<Array>} List of featured restaurants
   */
  async getFeatured(limit = 10) {
    logDebug(`[RestaurantService] Getting featured restaurants (limit: ${limit})`);
    
    return handleApiResponse(
      apiClient.get(`${BASE_URL}/featured?limit=${limit}`),
      {
        entity: 'featured restaurants',
        operation: 'fetch',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
  
  /**
   * Get restaurants by neighborhood
   * @param {number|string} neighborhoodId - Neighborhood ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} List of restaurants in the neighborhood
   */
  async getByNeighborhood(neighborhoodId, params = {}) {
    const validId = validateId(neighborhoodId, 'neighborhood');
    if (!validId) return [];
    
    logDebug(`[RestaurantService] Getting restaurants by neighborhood: ${validId}`);
    
    const queryParams = createQueryParams({
      ...params,
      neighborhood_id: validId
    });
    
    return handleApiResponse(
      apiClient.get(`${BASE_URL}?${queryParams}`),
      {
        entity: 'restaurants by neighborhood',
        operation: 'fetch',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
  
  /**
   * Get restaurants by cuisine
   * @param {string} cuisine - Cuisine type
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} List of restaurants with the specified cuisine
   */
  async getByCuisine(cuisine, params = {}) {
    if (!cuisine) return [];
    
    logDebug(`[RestaurantService] Getting restaurants by cuisine: ${cuisine}`);
    
    const queryParams = createQueryParams({
      ...params,
      cuisine
    });
    
    return handleApiResponse(
      apiClient.get(`${BASE_URL}?${queryParams}`),
      {
        entity: 'restaurants by cuisine',
        operation: 'fetch',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
}

// Create and export a singleton instance
export const restaurantService = new RestaurantService();

// Export the class for testing or extension
export default RestaurantService;
