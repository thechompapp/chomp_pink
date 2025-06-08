/**
 * FilterDataService.js
 * 
 * Single Responsibility: Centralized filter data fetching
 * - Cities, boroughs, neighborhoods API calls
 * - Cuisine/hashtag data fetching  
 * - Error handling with retry logic
 * - Request deduplication
 * - Standardized response format
 */

import { apiClient } from '@/services/apiClient';
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger';
import { handleApiResponse, validateId, createQueryParams } from '@/utils/serviceHelpers';

/**
 * Default configuration for data fetching
 */
const DEFAULT_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 10000,
  cacheKeyPrefix: 'filter_data'
};

/**
 * Mock data for development fallback when API returns unexpected format
 */
const MOCK_DATA = {
  cities: [
    { id: 1, name: 'New York', has_boroughs: true, state: 'NY', country: 'USA' },
    { id: 2, name: 'Los Angeles', has_boroughs: false, state: 'CA', country: 'USA' },
    { id: 3, name: 'Chicago', has_boroughs: false, state: 'IL', country: 'USA' }
  ],
  boroughs: [
    { id: 1, name: 'Manhattan', city_id: 1 },
    { id: 2, name: 'Brooklyn', city_id: 1 },
    { id: 3, name: 'Queens', city_id: 1 },
    { id: 4, name: 'The Bronx', city_id: 1 },
    { id: 5, name: 'Staten Island', city_id: 1 }
  ],
  neighborhoods: [
    { id: 1, name: 'SoHo', borough_id: 1, city_id: 1 },
    { id: 2, name: 'Chelsea', borough_id: 1, city_id: 1 },
    { id: 3, name: 'Williamsburg', borough_id: 2, city_id: 1 }
  ],
  cuisines: [
    { id: 1, name: 'Italian', usage_count: 150, category: 'cuisine' },
    { id: 2, name: 'Mexican', usage_count: 120, category: 'cuisine' },
    { id: 3, name: 'Japanese', usage_count: 100, category: 'cuisine' },
    { id: 4, name: 'French', usage_count: 80, category: 'cuisine' }
  ]
};

/**
 * FilterDataService class - Centralized filter data operations
 */
class FilterDataService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.requestCache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get all available cities from the API
   * @param {Object} options - Optional parameters for filtering/sorting
   * @returns {Promise<Array>} List of cities with standardized format
   */
  async getCities(options = {}) {
    const cacheKey = `cities_${JSON.stringify(options)}`;
    
    try {
      logDebug('[FilterDataService] Fetching cities with options:', options);
      
      // Deduplicate concurrent requests
      if (this.pendingRequests.has(cacheKey)) {
        return await this.pendingRequests.get(cacheKey);
      }

      const requestPromise = this._fetchCitiesInternal(options);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      logError('[FilterDataService] Error in getCities:', error);
      throw error;
    }
  }

  /**
   * Internal method to fetch cities from API
   * @private
   */
  async _fetchCitiesInternal(options) {
    const params = options && Object.keys(options).length > 0 ? 
      Object.fromEntries(Object.entries(options).map(([key, value]) => 
        [key, typeof value === 'object' ? JSON.stringify(value) : String(value)])) : undefined;
    
    const result = await handleApiResponse(
      () => apiClient.get('/filters/cities', params ? { params } : undefined),
      'FilterDataService.getCities'
    );
    
    // Extract and validate data
    const citiesArray = Array.isArray(result.data) ? result.data : [];
    
    if (citiesArray.length === 0) {
      logWarn('[FilterDataService] No cities found in response, using mock data');
      return MOCK_DATA.cities;
    }
    
    // Process and normalize cities data
    const processedCities = citiesArray.map(city => ({
      id: parseInt(city.id, 10) || null,
      name: city.name || '',
      has_boroughs: Boolean(city.has_boroughs),
      state: city.state || null,
      country: city.country || 'USA'
    })).filter(city => city.id && city.name);
    
    logDebug(`[FilterDataService] Successfully processed ${processedCities.length} cities`);
    return processedCities;
  }

  /**
   * Get boroughs for a specific city
   * @param {number} cityId - The ID of the city
   * @returns {Promise<Array>} List of boroughs for the city
   */
  async getBoroughs(cityId) {
    if (!validateId(cityId)) {
      logWarn(`[FilterDataService] Invalid cityId provided: ${cityId}`);
      return [];
    }

    const numericCityId = parseInt(cityId, 10);
    const cacheKey = `boroughs_${numericCityId}`;
    
    try {
      logDebug(`[FilterDataService] Fetching boroughs for city ID: ${numericCityId}`);
      
      // Deduplicate concurrent requests
      if (this.pendingRequests.has(cacheKey)) {
        return await this.pendingRequests.get(cacheKey);
      }

      const requestPromise = this._fetchBoroughsInternal(numericCityId);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      logError('[FilterDataService] Error in getBoroughs:', error);
      
      // Return mock data for NYC as fallback
      if (numericCityId === 1) {
        logInfo('[FilterDataService] Using mock boroughs for NYC');
        return MOCK_DATA.boroughs.filter(borough => borough.city_id === 1);
      }
      
      return [];
    }
  }

  /**
   * Internal method to fetch boroughs from API
   * @private
   */
  async _fetchBoroughsInternal(cityId) {
    const result = await handleApiResponse(
      () => apiClient.get('/filters/neighborhoods', { 
        params: { cityId, type: 'borough' } 
      }),
      'FilterDataService.getBoroughs'
    );
    
    const boroughsArray = Array.isArray(result.data) ? result.data : [];
    
    if (boroughsArray.length === 0) {
      logWarn(`[FilterDataService] No boroughs found for city ID: ${cityId}`);
      return [];
    }
    
    // Process and normalize boroughs data
    const processedBoroughs = boroughsArray.map(borough => ({
      id: parseInt(borough.id, 10) || null,
      name: borough.name || '',
      city_id: cityId
    })).filter(borough => borough.id && borough.name);
    
    logDebug(`[FilterDataService] Successfully processed ${processedBoroughs.length} boroughs for city ${cityId}`);
    return processedBoroughs;
  }

  /**
   * Get neighborhoods for a specific borough
   * @param {number} boroughId - The ID of the borough
   * @returns {Promise<Array>} List of neighborhoods for the borough
   */
  async getNeighborhoods(boroughId) {
    if (!validateId(boroughId)) {
      logWarn(`[FilterDataService] Invalid boroughId provided: ${boroughId}`);
      return [];
    }

    const numericBoroughId = parseInt(boroughId, 10);
    const cacheKey = `neighborhoods_${numericBoroughId}`;
    
    try {
      logDebug(`[FilterDataService] Fetching neighborhoods for borough ID: ${numericBoroughId}`);
      
      // Deduplicate concurrent requests
      if (this.pendingRequests.has(cacheKey)) {
        return await this.pendingRequests.get(cacheKey);
      }

      const requestPromise = this._fetchNeighborhoodsInternal(numericBoroughId);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      logError('[FilterDataService] Error in getNeighborhoods:', error);
      return [];
    }
  }

  /**
   * Internal method to fetch neighborhoods from API
   * @private
   */
  async _fetchNeighborhoodsInternal(boroughId) {
    const result = await handleApiResponse(
      () => apiClient.get('/filters/neighborhoods', { 
        params: { boroughId } 
      }),
      'FilterDataService.getNeighborhoods'
    );
    
    const neighborhoodsArray = Array.isArray(result.data) ? result.data : [];
    
    if (neighborhoodsArray.length === 0) {
      logWarn(`[FilterDataService] No neighborhoods found for borough ID: ${boroughId}`);
      return [];
    }
    
    // Process and normalize neighborhoods data
    const processedNeighborhoods = neighborhoodsArray.map(neighborhood => ({
      id: parseInt(neighborhood.id, 10) || null,
      name: neighborhood.name || '',
      borough_id: boroughId,
      city_id: parseInt(neighborhood.city_id, 10) || null
    })).filter(neighborhood => neighborhood.id && neighborhood.name);
    
    logDebug(`[FilterDataService] Successfully processed ${processedNeighborhoods.length} neighborhoods for borough ${boroughId}`);
    return processedNeighborhoods;
  }

  /**
   * Get cuisine/hashtag data with optional search functionality
   * @param {string} searchTerm - Optional search term to filter cuisines
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} List of cuisine hashtags
   */
  async getCuisines(searchTerm = '', limit = 15) {
    const cacheKey = `cuisines_${searchTerm}_${limit}`;
    
    try {
      logDebug('[FilterDataService] Fetching cuisines with search term:', searchTerm);
      
      // Deduplicate concurrent requests
      if (this.pendingRequests.has(cacheKey)) {
        return await this.pendingRequests.get(cacheKey);
      }

      const requestPromise = this._fetchCuisinesInternal(searchTerm, limit);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      logError('[FilterDataService] Error in getCuisines:', error);
      
      // Return filtered mock data as fallback
      let cuisines = MOCK_DATA.cuisines;
      if (searchTerm) {
        cuisines = cuisines.filter(cuisine => 
          cuisine.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return cuisines.slice(0, limit);
    }
  }

  /**
   * Internal method to fetch cuisines from API
   * @private
   */
  async _fetchCuisinesInternal(searchTerm, limit) {
    const params = {
      limit
    };
    
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    const result = await handleApiResponse(
      () => apiClient.get('/filters/cuisines', { params }),
      'FilterDataService.getCuisines'
    );
    
    const cuisinesArray = Array.isArray(result.data) ? result.data : [];
    
    if (cuisinesArray.length === 0) {
      logWarn('[FilterDataService] No cuisines found, using mock data');
      return MOCK_DATA.cuisines.slice(0, limit);
    }
    
    // Filter by search term if provided (since backend might not support search)
    let filteredCuisines = cuisinesArray;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      filteredCuisines = cuisinesArray.filter(cuisine => 
        cuisine.name && cuisine.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Process and normalize cuisines data
    const processedCuisines = filteredCuisines.map(cuisine => ({
      id: parseInt(cuisine.id, 10) || null,
      name: cuisine.name || '',
      usage_count: parseInt(cuisine.usage_count, 10) || 0,
      category: cuisine.category || 'cuisine'
    })).filter(cuisine => cuisine.name).slice(0, limit);
    
    logDebug(`[FilterDataService] Successfully processed ${processedCuisines.length} cuisines`);
    return processedCuisines;
  }

  /**
   * Clear all pending requests and cache
   */
  clearCache() {
    this.requestCache.clear();
    this.pendingRequests.clear();
    logDebug('[FilterDataService] Cache cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      cacheSize: this.requestCache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Create and export singleton instance
export const filterDataService = new FilterDataService();

// Export class for testing and custom instances
export { FilterDataService };

// Export default instance
export default filterDataService; 