/* src/services/filterService.js */
import apiClient from './apiClient';
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger';

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
 * Extract data from various API response formats
 * @param {Object|Array} response - API response
 * @param {string} context - Context for logging
 * @returns {Array} - Extracted data array
 */
const extractDataFromResponse = (response, context) => {
  // Case 1: Direct array response
  if (Array.isArray(response)) {
    return response;
  }
  
  // Case 2: { data: [...] } format
  if (response && typeof response === 'object') {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Case 3: { success: true, data: [...] } format
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Case 4: { data: { data: [...] } } format (nested data)
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
  }
  
  // No valid data found
  logWarn(`[FilterService] Could not extract data array from ${context} response:`, response);
  return [];
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
    logDebug('[FilterService] Fetching cities from API with options:', options);
    try {
      // Build params as a plain object
      const params = options && Object.keys(options).length > 0 ? Object.fromEntries(Object.entries(options).map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)])) : undefined;
      const response = await apiClient.get('/filters/cities', params ? { params } : undefined);
      
      // Extract cities array from the response
      const citiesArray = extractDataFromResponse(response, 'cities');
      
      if (citiesArray.length === 0) {
        logWarn('[FilterService] No cities found in response, using mock data');
        return MOCK_CITIES;
      }
      
      // Process the cities data
      const processedCities = citiesArray.map(city => ({
        id: parseInt(city.id, 10) || null,
        name: city.name || '',
        has_boroughs: Boolean(city.has_boroughs),
        state: city.state || null,
        country: city.country || 'USA'
      }));
      
      logDebug(`[FilterService] Processed ${processedCities.length} cities`);
      return processedCities;
    } catch (error) {
      logError('[FilterService] Error fetching cities:', error);
      return MOCK_CITIES;
    }
  },
  
  /**
   * Get all available cuisines from the API
   * @returns {Promise<Array>} List of cuisine hashtags
   */
  async getCuisines() {
    logDebug('[FilterService] Fetching cuisines');
    try {
      const response = await apiClient.get('/hashtags/cuisines');
      const cuisines = extractDataFromResponse(response, 'cuisines');
      
      if (cuisines.length === 0) {
        logWarn('[FilterService] No cuisines found, using mock data');
        // Import from hashtagService to avoid duplication
        const { MOCK_HASHTAGS } = await import('./hashtagService');
        return MOCK_HASHTAGS;
      }
      
      return cuisines.map(cuisine => ({
        id: parseInt(cuisine.id, 10) || null,
        name: cuisine.name || '',
        usage_count: parseInt(cuisine.usage_count, 10) || 0
      }));
    } catch (error) {
      logError('[FilterService] Error fetching cuisines:', error);
      const { MOCK_HASHTAGS } = await import('./hashtagService');
      return MOCK_HASHTAGS;
    }
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
    
    try {
      const response = await apiClient.get(`/neighborhoods/by-zipcode/${zipcode}`);
      const neighborhoods = extractDataFromResponse(response, 'neighborhoods');
      
      if (!neighborhoods || neighborhoods.length === 0) {
        logDebug(`[FilterService] No neighborhoods match zipcode: ${zipcode}`);
        return null;
      }
      
      // Return the first matching neighborhood
      const neighborhood = neighborhoods[0];
      logDebug(`[FilterService] Found neighborhood for zipcode ${zipcode}:`, neighborhood.name);
      
      // Normalize the neighborhood object
      return {
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
    } catch (error) {
      logError(`[FilterService] Error finding neighborhood by zipcode ${zipcode}:`, error);
      return null;
    }
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
    logDebug(`[FilterService] Getting neighborhoods for city ID: ${numericCityId}`);
    
    try {
      const response = await apiClient.get(`/filters/neighborhoods?cityId=${numericCityId}`);
      const neighborhoods = extractDataFromResponse(response, 'neighborhoods');
      
      if (neighborhoods.length === 0) {
        logWarn(`[FilterService] No neighborhoods found for city ID: ${numericCityId}`);
        
        // For New York City (ID 1), return mock boroughs as fallback
        if (numericCityId === 1) {
          logDebug('[FilterService] Using mock boroughs for New York City');
          return MOCK_BOROUGHS;
        }
        return [];
      }
      
      // Process the neighborhoods data
      const processedNeighborhoods = neighborhoods.map(neighborhood => ({
        id: parseInt(neighborhood.id, 10) || null,
        name: neighborhood.name || '',
        neighborhood: neighborhood.name || '', // For compatibility
        neighborhood_name: neighborhood.name || '', // For compatibility
        borough_id: parseInt(neighborhood.borough_id, 10) || null,
        borough_name: neighborhood.borough_name || '',
        city_id: numericCityId
      }));
      
      logDebug(`[FilterService] Processed ${processedNeighborhoods.length} neighborhoods for city ID: ${numericCityId}`);
      return processedNeighborhoods;
    } catch (error) {
      logError(`[FilterService] Error getting neighborhoods for city ID ${numericCityId}:`, error);
      
      // For New York City (ID 1), return mock boroughs as fallback
      if (numericCityId === 1) {
        return MOCK_BOROUGHS;
      }
      return [];
    }
  },

  /**
   * Helper to find a city by partial name match
   * @param {Array} cities - List of city objects
   * @param {string} normalizedCityName - Normalized city name to match
   * @returns {Object|null} - Matching city object or null
   */
  findCityByPartialMatch(cities, normalizedCityName) {
    for (const city of cities) {
      const cityNameNormalized = this.normalizeCityName(city.name);
      if (cityNameNormalized.includes(normalizedCityName) ||
        normalizedCityName.includes(cityNameNormalized)) {
        return city;
      }
    }
    return null;
  },

  /**
   * Find a city by name
   * @param {string} cityName - The name of the city to look up
   * @returns {Promise<Object|null>} The city object if found, null otherwise
   */
  async findCityByName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      logWarn(`[FilterService] Invalid city name: ${cityName}`);
      // Return default New York City object instead of null
      return MOCK_CITIES[0]; // New York City
    }

    logDebug(`[FilterService] Looking up city by name: ${cityName}`);

    // Normalize city name to handle common variations
    const normalizedCityName = this.normalizeCityName(cityName);

    try {
      // First get all cities
      const cities = await this.getCities();

      if (!Array.isArray(cities) || cities.length === 0) {
        logWarn('[FilterService] No cities found in the database');
        return MOCK_CITIES[0]; // Default to New York City
      }

      // Find the city by name (case insensitive)
      const city = cities.find(c =>
        this.normalizeCityName(c.name) === normalizedCityName);

      if (city) {
        logDebug(`[FilterService] Found city by name: ${cityName} -> ${city.name} (ID: ${city.id})`);
        return city;
      }

      // Special case handling for common city aliases
      if (normalizedCityName === 'nyc' || normalizedCityName === 'newyorkcity') {
        const nyc = cities.find(c => c.name.toLowerCase().includes('new york'));
        if (nyc) {
          logDebug(`[FilterService] Found city by alias: ${cityName} -> ${nyc.name} (ID: ${nyc.id})`);
          return nyc;
        }
      }

      // Try partial matching if exact match fails
      const partialMatch = this.findCityByPartialMatch(cities, normalizedCityName);
      if (partialMatch) {
        logDebug(`[FilterService] Found city by partial match: ${cityName} -> ${partialMatch.name} (ID: ${partialMatch.id})`);
        return partialMatch;
      }

      logWarn(`[FilterService] City not found by name: ${cityName}, using default`);
      return MOCK_CITIES[0]; // Default to New York City
    } catch (error) {
      logError(`[FilterService] Error finding city by name ${cityName}:`, error);
      return MOCK_CITIES[0]; // Default to New York City
    }
  },

  /**
   * Normalize city name for consistent matching
   * @param {string} cityName - The city name to normalize
   * @returns {string} Normalized city name
   */
  normalizeCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      return '';
    }

    // Remove spaces, punctuation, and convert to lowercase
    let normalized = cityName.toLowerCase()
      .replace(/[\s\-.,'\/&()]/g, '') // Remove spaces, hyphens, periods, commas, apostrophes, slashes, parentheses
      .replace(/saint/g, 'st') // Normalize saint to st
      .trim();

    // Handle special cases
    const specialCases = {
      'newyorkcity': 'newyork',
      'nyc': 'newyork',
      'sf': 'sanfrancisco',
      'sanfran': 'sanfrancisco',
      'la': 'losangeles',
      'dc': 'washingtondc',
      'philly': 'philadelphia',
      'chi': 'chicago',
      'atl': 'atlanta',
      'vegas': 'lasvegas',
      'nola': 'neworleans'
    };

    return specialCases[normalized] || normalized;
  },
};

// Export the service object and mock data for testing and fallbacks
export { MOCK_CITIES, MOCK_BOROUGHS };