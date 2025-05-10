/* src/services/filterService.js */
import apiClient from './apiClient';
import { logDebug, logError } from '@/utils/logger'; // Using named imports
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
  }
};