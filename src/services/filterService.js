/* src/services/filterService.js */
import apiClient from './apiClient';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { handleApiResponse, validateId, createQueryParams } from '@/utils/serviceHelpers';

/**
 * Cache for expensive operations
 */
const operationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Mock data for development fallback when API returns unexpected format
 */
const MOCK_CITIES = [
  { id: 1, name: 'New York', has_boroughs: true },
  { id: 2, name: 'Los Angeles', has_boroughs: false },
  { id: 3, name: 'Chicago', has_boroughs: false }
];

const MOCK_BOROUGHS = [
  { id: 1, name: 'Manhattan', city_id: 1 },
  { id: 2, name: 'Brooklyn', city_id: 1 },
  { id: 3, name: 'Queens', city_id: 1 },
  { id: 4, name: 'The Bronx', city_id: 1 },
  { id: 5, name: 'Staten Island', city_id: 1 }
];

/**
 * Cache helper functions
 */
const getCacheKey = (operation, params = '') => `${operation}_${params}`;

const getCachedResult = (key) => {
  const cached = operationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  operationCache.delete(key);
  return null;
};

const setCachedResult = (key, data) => {
  operationCache.set(key, { data, timestamp: Date.now() });
};

/**
 * Memoized city normalization function
 */
const cityNameNormalizations = new Map();

const memoizedNormalizeCityName = (cityName) => {
  if (cityNameNormalizations.has(cityName)) {
    return cityNameNormalizations.get(cityName);
  }
  
  const normalized = String(cityName)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(city|borough|county)\b/g, '');
    
  cityNameNormalizations.set(cityName, normalized);
  return normalized;
};

/**
 * Filter service for standardized API access to filter-related endpoints
 */
export const filterService = {
  /**
   * Get all available cities from the API
   * @param {Object} options - Optional parameters
   * @returns {Promise<Array>} List of cities with standardized boolean properties
   */
  async getCities(options = {}) {
    const cacheKey = getCacheKey('cities', JSON.stringify(options));
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    logDebug('[FilterService] Fetching cities from API');
    
    // Convert options to proper params format efficiently
    const params = Object.keys(options).length > 0 ? 
      Object.fromEntries(
        Object.entries(options).map(([key, value]) => 
          [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
        )
      ) : undefined;
    
    const result = await handleApiResponse(
      () => apiClient.get('/filters/cities', params ? { params } : undefined),
      'FilterService.getCities'
    );
    
    // Extract and process data
    const citiesArray = Array.isArray(result.data) ? result.data : [];
    
    if (citiesArray.length === 0) {
      logWarn('[FilterService] No cities found in response, using mock data');
      setCachedResult(cacheKey, MOCK_CITIES);
      return MOCK_CITIES;
    }
    
    // Process the cities data efficiently
    const processedCities = citiesArray.map(city => ({
      id: parseInt(city.id, 10) || null,
      name: city.name || '',
      has_boroughs: Boolean(city.has_boroughs),
      state: city.state || null,
      country: city.country || 'USA'
    }));
    
    setCachedResult(cacheKey, processedCities);
    logDebug(`[FilterService] Processed ${processedCities.length} cities`);
    return processedCities;
  },
  
  /**
   * Get all available cuisines from the API
   * @returns {Promise<Array>} List of cuisine hashtags
   */
  async getCuisines() {
    const cacheKey = getCacheKey('cuisines');
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    logDebug('[FilterService] Fetching cuisines');
    
    const result = await handleApiResponse(
      () => apiClient.get('/hashtags/cuisines'),
      'FilterService.getCuisines'
    );
    
    // Extract and process data
    const cuisines = Array.isArray(result.data) ? result.data : [];
    
    if (cuisines.length === 0) {
      logWarn('[FilterService] No cuisines found, using mock data');
      // Import from hashtagService to avoid duplication
      const { MOCK_HASHTAGS } = await import('./hashtagService');
      setCachedResult(cacheKey, MOCK_HASHTAGS);
      return MOCK_HASHTAGS;
    }
    
    const processedCuisines = cuisines.map(cuisine => ({
      id: parseInt(cuisine.id, 10) || null,
      name: cuisine.name || '',
      usage_count: parseInt(cuisine.usage_count, 10) || 0
    }));

    setCachedResult(cacheKey, processedCuisines);
    return processedCuisines;
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

    const cacheKey = getCacheKey('neighborhood_zipcode', zipcode);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    logDebug(`[FilterService] Looking up neighborhood for zipcode: ${zipcode}`);
    
    const result = await handleApiResponse(
      () => apiClient.get(`/neighborhoods/zip/${zipcode}`),
      'FilterService.findNeighborhoodByZipcode'
    );
    
    // Extract neighborhoods data
    const neighborhoods = Array.isArray(result.data) ? result.data : [];
    
    if (neighborhoods.length === 0) {
      logDebug(`[FilterService] No neighborhoods match zipcode: ${zipcode}`);
      setCachedResult(cacheKey, null);
      return null;
    }
    
    // Return the first matching neighborhood with normalized structure
    const neighborhood = neighborhoods[0];
    logDebug(`[FilterService] Found neighborhood for zipcode ${zipcode}:`, neighborhood.name);
    
    const normalizedNeighborhood = {
      id: parseInt(neighborhood.id, 10) || null,
      name: neighborhood.name || '',
      neighborhood: neighborhood.name || '',  // For compatibility
      neighborhood_name: neighborhood.name || '',  // For compatibility
      borough_id: parseInt(neighborhood.borough_id, 10) || null,
      borough_name: neighborhood.borough_name || null,
      city_id: parseInt(neighborhood.city_id, 10) || null,
      city_name: neighborhood.city_name || null,
      zipcode: zipcode
    };

    setCachedResult(cacheKey, normalizedNeighborhood);
    return normalizedNeighborhood;
  },

  /**
   * Get neighborhoods by city ID
   * @param {number} cityId - The ID of the city
   * @returns {Promise<Array>} List of neighborhoods in the city
   */
  async getNeighborhoodsByCity(cityId) {
    if (!cityId || isNaN(parseInt(cityId, 10))) {
      logWarn(`[FilterService] Invalid cityId: ${cityId}`);
      return [];
    }

    const numericCityId = parseInt(cityId, 10);
    const cacheKey = getCacheKey('neighborhoods_city', numericCityId.toString());
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    logDebug(`[FilterService] Getting neighborhoods for city ID: ${numericCityId}`);
    
    const result = await handleApiResponse(
      () => apiClient.get('/filters/neighborhoods', { 
        params: { cityId: numericCityId } 
      }),
      'FilterService.getNeighborhoodsByCity'
    );
    
    // Extract and process data
    const neighborhoods = Array.isArray(result.data) ? result.data : [];
    
    if (neighborhoods.length === 0) {
      logWarn(`[FilterService] No neighborhoods found for city ID: ${numericCityId}`);
      
      // For New York City (ID 1), return mock boroughs as fallback
      if (numericCityId === 1) {
        logDebug('[FilterService] Using mock boroughs for New York City');
        setCachedResult(cacheKey, MOCK_BOROUGHS);
        return MOCK_BOROUGHS;
      }
      setCachedResult(cacheKey, []);
      return [];
    }
    
    // Process the neighborhoods data efficiently
    const processedNeighborhoods = neighborhoods.map(neighborhood => ({
      id: parseInt(neighborhood.id, 10) || null,
      name: neighborhood.name || '',
      neighborhood: neighborhood.name || '', // For compatibility
      neighborhood_name: neighborhood.name || '', // For compatibility
      borough_id: parseInt(neighborhood.borough_id, 10) || null,
      borough_name: neighborhood.borough_name || '',
      city_id: numericCityId
    }));
    
    setCachedResult(cacheKey, processedNeighborhoods);
    logDebug(`[FilterService] Processed ${processedNeighborhoods.length} neighborhoods for city ID: ${numericCityId}`);
    return processedNeighborhoods;
  },

  /**
   * Helper to find a city by partial name match (pure function)
   * @param {Array} cities - List of city objects
   * @param {string} normalizedCityName - Normalized city name to match
   * @param {Function} normalizeFn - Function to normalize city names
   * @param {Function} [logFn] - Optional logger for ambiguous matches
   * @returns {Object|null} - Matching city object or null
   */
  findCityByPartialMatch: function(cities, normalizedCityName, normalizeFn, logFn) {
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return null;
    }

    // Try exact match first
    const exactMatch = cities.find(city => {
      const normalized = normalizeFn(city.name);
      return normalized === normalizedCityName;
    });
    
    if (exactMatch) {
      return exactMatch;
    }

    // Try partial matches
    const partialMatches = cities.filter(city => {
      const normalized = normalizeFn(city.name);
      return normalized.includes(normalizedCityName) || normalizedCityName.includes(normalized);
    });

    if (partialMatches.length === 1) {
      return partialMatches[0];
    }

    if (partialMatches.length > 1 && logFn) {
      logFn(`[FilterService] Multiple city matches for "${normalizedCityName}":`, partialMatches.map(c => c.name));
    }

    return partialMatches.length > 0 ? partialMatches[0] : null;
  },

  /**
   * Find a city by name with flexible matching
   * @param {string} cityName - The city name to search for
   * @returns {Promise<Object|null>} The matching city object or null
   */
  async findCityByName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      logWarn('[FilterService] Invalid city name provided');
      return null;
    }

    const normalizedInput = memoizedNormalizeCityName(cityName);
    const cacheKey = getCacheKey('city_by_name', normalizedInput);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const cities = await this.getCities();
      
      if (!cities || cities.length === 0) {
        logWarn('[FilterService] No cities available for search');
        setCachedResult(cacheKey, null);
        return null;
      }

      const result = this.findCityByPartialMatch(
        cities, 
        normalizedInput, 
        memoizedNormalizeCityName, 
        logWarn
      );

      setCachedResult(cacheKey, result);
      
      if (result) {
        logDebug(`[FilterService] Found city match for "${cityName}":`, result.name);
      } else {
        logDebug(`[FilterService] No city match found for "${cityName}"`);
      }

      return result;
    } catch (error) {
      logError('[FilterService] Error finding city by name:', error);
      return null;
    }
  },

  /**
   * Optimized city name normalization (exposed for external use)
   * @param {string} cityName - The city name to normalize
   * @returns {string} - Normalized city name
   */
  normalizeCityName: memoizedNormalizeCityName,

  /**
   * Clear operation cache (for testing or manual cache invalidation)
   */
  clearCache() {
    operationCache.clear();
    cityNameNormalizations.clear();
  },

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      operationCacheSize: operationCache.size,
      cityNormalizationCacheSize: cityNameNormalizations.size
    };
  }
};

// Export the service object and mock data for testing and fallbacks
export { MOCK_CITIES, MOCK_BOROUGHS };