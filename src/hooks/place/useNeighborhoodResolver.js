/**
 * useNeighborhoodResolver Hook
 * 
 * Custom hook for resolving neighborhoods from zipcodes.
 * Extracted from usePlaceResolver.js to improve separation of concerns.
 */
import { useRef, useCallback } from 'react';
import { filterService } from '@/services/filterService';
import { retryWithBackoff, APP_CONFIG } from '@/utils/generalUtils';
import { logDebug, logError } from '@/utils/logger';

/**
 * Custom hook for resolving neighborhoods
 * @returns {Object} Neighborhood resolution state and functions
 */
const useNeighborhoodResolver = () => {
  // Cache for neighborhoods to avoid redundant API calls
  const neighborhoodCache = useRef(new Map());
  
  /**
   * Fetch neighborhood by zipcode with caching
   * @param {string} zipcode - Zipcode to lookup
   * @param {number} cityId - City ID
   * @returns {Promise<Object>} - Neighborhood data
   */
  const fetchNeighborhoodByZipcode = useCallback(async (zipcode, cityId = APP_CONFIG.defaultCityId) => {
    if (!zipcode) {
      return getDefaultNeighborhood(cityId);
    }
    
    // Check cache first
    const cacheKey = `${zipcode}_${cityId}`;
    if (neighborhoodCache.current.has(cacheKey)) {
      return neighborhoodCache.current.get(cacheKey);
    }
    
    try {
      // Try to find neighborhood by zipcode with retry logic
      const neighborhood = await retryWithBackoff(() => 
        filterService.findNeighborhoodByZipcode(zipcode)
      );
      
      if (neighborhood && neighborhood.id) {
        // Cache the result
        neighborhoodCache.current.set(cacheKey, neighborhood);
        return neighborhood;
      }
      
      // If not found, get default neighborhood
      return await getDefaultNeighborhood(cityId);
    } catch (error) {
      logError(`[useNeighborhoodResolver] Error fetching neighborhood for zipcode ${zipcode}:`, error);
      return await getDefaultNeighborhood(cityId);
    }
  }, []);
  
  /**
   * Get default neighborhood for a city
   * @param {number} cityId - City ID
   * @returns {Promise<Object>} - Default neighborhood
   */
  const getDefaultNeighborhood = useCallback(async (cityId = APP_CONFIG.defaultCityId) => {
    try {
      // Try to get neighborhoods for the city
      const neighborhoods = await retryWithBackoff(() => 
        filterService.getNeighborhoodsByCity(cityId)
      );
      
      if (neighborhoods && Array.isArray(neighborhoods) && neighborhoods.length > 0) {
        return neighborhoods[0];
      }
      
      // Default fallback
      return {
        id: 1,
        name: "Default Neighborhood",
        city_id: cityId
      };
    } catch (error) {
      logError(`[useNeighborhoodResolver] Error getting default neighborhood:`, error);
      
      // Ultimate fallback
      return {
        id: 1,
        name: "Default Neighborhood",
        city_id: cityId
      };
    }
  }, []);
  
  /**
   * Clear the neighborhood cache
   */
  const clearCache = useCallback(() => {
    neighborhoodCache.current.clear();
    logDebug('[useNeighborhoodResolver] Neighborhood cache cleared');
  }, []);
  
  return {
    fetchNeighborhoodByZipcode,
    getDefaultNeighborhood,
    clearCache
  };
};

export default useNeighborhoodResolver;
