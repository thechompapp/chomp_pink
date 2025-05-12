/* src/services/filterService.js */
import apiClient from './apiClient';
import { logDebug, logError, logWarn } from '@/utils/logger'; // Using named imports
import { handleApiResponse } from '@/utils/serviceHelpers.js';

/**
 * Filter service for standardized API access to filter-related endpoints
 * Follows the API standardization pattern with named exports
 */
export const filterService = {
  /**
   * Get all available cities from the API
   * @returns {Promise<Array>} List of cities with standardized boolean properties
   */
  async getCities() {
    return handleApiResponse(
      () => apiClient.get('/filters/cities'),
      'FilterService Get Cities',
      (data) => {
        if (!Array.isArray(data)) {
          logError('Unexpected response structure for cities:', data);
          throw new Error('Unexpected response structure for cities');
        }
        
        // Ensure boolean conversion for has_boroughs
        return data.map(city => ({
          ...city,
          has_boroughs: !!city.has_boroughs
        }));
      }
    );
  },
  
  /**
   * Get all available cuisines from the API
   * Currently disabled but preserved for API standardization
   */
  async getCuisines() {
    /* Implement if needed */
    return [];
  },

  /**
   * Find a neighborhood by zipcode
   * @param {string} zipcode - The zipcode to look up
   * @returns {Promise<Object|null>} The neighborhood object if found, null otherwise
   */
  async findNeighborhoodByZipcode(zipcode) {
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
      logWarn(`[FilterService] Invalid zipcode format: ${zipcode}`);
      return null;
    }

    logDebug(`[FilterService] Looking up neighborhood for zipcode: ${zipcode}`);
    
    return handleApiResponse(
      () => apiClient.get(`/api/neighborhoods/by-zipcode/${zipcode}`),
      `FilterService Find Neighborhood By Zipcode (${zipcode})`,
      (data) => {
        if (!data || !Array.isArray(data)) {
          logWarn(`[FilterService] No neighborhoods found for zipcode: ${zipcode}`);
          return null;
        }
        
        if (data.length === 0) {
          logDebug(`[FilterService] No neighborhoods match zipcode: ${zipcode}`);
          return null;
        }
        
        // Return the first matching neighborhood
        logDebug(`[FilterService] Found ${data.length} neighborhoods for zipcode: ${zipcode}`);
        return data[0];
      }
    ).catch(error => {
      logError(`[FilterService] Error finding neighborhood by zipcode ${zipcode}:`, error);
      return null;
    });
  }
};