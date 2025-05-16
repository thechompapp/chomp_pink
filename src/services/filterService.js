/* src/services/filterService.js */
import apiClient from './apiClient';
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger'; // Using named imports
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
    console.log('[filterService] Fetching cities from API');
    try {
      // Make direct API call without using the wrapper to see exact response
      const response = await apiClient.get('/filters/cities');
      console.log('[filterService] Direct API response:', response);
      
      // Check response structure
      let citiesArray = [];
      
      if (response && response.data) {
        // Handle standard API response with data field
        if (Array.isArray(response.data)) {
          citiesArray = response.data;
        }
        // Handle nested data structure
        else if (response.data.data && Array.isArray(response.data.data)) {
          citiesArray = response.data.data;
        }
      }
      
      if (citiesArray.length === 0) {
        console.error('[filterService] Could not extract cities array from response:', response);
        return [];
      }
      
      // Process the cities data
      const processedCities = citiesArray.map(city => ({
        ...city,
        has_boroughs: !!city.has_boroughs
      }));
      
      console.log(`[filterService] Processed ${processedCities.length} cities:`, processedCities);
      return processedCities;
    } catch (error) {
      console.error('[filterService] Error fetching cities:', error);
      return [];
    }
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
      () => apiClient.get(`/neighborhoods/by-zipcode/${zipcode}`),
      `FilterService Find Neighborhood By Zipcode (${zipcode})`,
      (data) => {
        // Check if the response has a nested data structure
        const neighborhoods = data.data ? data.data : data;
        
        if (!neighborhoods || !Array.isArray(neighborhoods)) {
          logWarn(`[FilterService] No neighborhoods found for zipcode: ${zipcode}`);
          return null;
        }
        
        if (neighborhoods.length === 0) {
          logDebug(`[FilterService] No neighborhoods match zipcode: ${zipcode}`);
          return null;
        }
        
        // Return the first matching neighborhood
        const neighborhood = neighborhoods[0];
        logDebug(`[FilterService] Found ${neighborhoods.length} neighborhoods for zipcode: ${zipcode}:`, neighborhood);
        
        // Ensure both neighborhood and neighborhood_name are set for compatibility
        if (neighborhood) {
          neighborhood.neighborhood = neighborhood.name;
          neighborhood.neighborhood_name = neighborhood.name;
        }
        
        return neighborhood;
      }
    ).catch(error => {
      logError(`[FilterService] Error finding neighborhood by zipcode ${zipcode}:`, error);
      return null;
    });
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
    console.log(`[FilterService] Getting neighborhoods for city ID: ${numericCityId}`);
    
    return handleApiResponse(
      () => apiClient.get(`/filters/neighborhoods?cityId=${numericCityId}`),
      `FilterService Get Neighborhoods By City (${numericCityId})`,
      (data) => {
        console.log(`[FilterService] Raw neighborhoods response for city ${numericCityId}:`, data);
        
        if (!data || !data.success || !Array.isArray(data.data)) {
          logWarn(`[FilterService] No neighborhoods found for city ID: ${numericCityId}`);
          return [];
        }
        
        // Return the neighborhoods with both name properties
        logDebug(`[FilterService] Found ${data.data.length} neighborhoods for city ID: ${numericCityId}`);
        const processedNeighborhoods = data.data.map(neighborhood => {
          // Ensure both neighborhood and neighborhood_name are set for compatibility
          return {
            ...neighborhood,
            neighborhood: neighborhood.name,
            neighborhood_name: neighborhood.name
          };
        });
        
        console.log(`[FilterService] Processed ${processedNeighborhoods.length} neighborhoods for city ${numericCityId}:`, 
          processedNeighborhoods.length > 0 ? processedNeighborhoods.slice(0, 3) : []);
        
        return processedNeighborhoods;
      }
    ).catch(error => {
      logError(`[FilterService] Error getting neighborhoods for city ID ${numericCityId}:`, error);
      return [];
    });
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
      return { id: 1, name: 'New York', has_boroughs: true };
    }

    logDebug(`[FilterService] Looking up city by name: ${cityName}`);
    
    // Normalize city name to handle common variations
    const normalizedCityName = this.normalizeCityName(cityName);
    
    try {
      // First get all cities
      const citiesResponse = await this.getCities();
      
      // Extract the cities array from the response
      const cities = Array.isArray(citiesResponse) 
        ? citiesResponse 
        : (citiesResponse.data && Array.isArray(citiesResponse.data) 
            ? citiesResponse.data 
            : null);
      
      if (!cities || !Array.isArray(cities) || cities.length === 0) {
        logWarn(`[FilterService] No cities found in the database`);
        // Return default New York City object instead of null
        return { id: 1, name: 'New York', has_boroughs: true };
      }
      
      // Find the city by name (case insensitive)
      const city = cities.find(c => 
        this.normalizeCityName(c.name) === normalizedCityName);
      
      if (!city) {
        logDebug(`[FilterService] No city found with name: ${cityName}`);
        // Check for partial matches if exact match fails
        const partialMatch = cities.find(c => 
          this.normalizeCityName(c.name).includes(normalizedCityName) || 
          normalizedCityName.includes(this.normalizeCityName(c.name)));
        
        if (partialMatch) {
          logDebug(`[FilterService] Found partial match for ${cityName}: ${partialMatch.name} (ID: ${partialMatch.id})`);
          return partialMatch;
        }
        
        // Return default New York City object instead of null
        return { id: 1, name: 'New York', has_boroughs: true };
      }
      
      logDebug(`[FilterService] Found city: ${city.name} (ID: ${city.id})`);
      return city;
    } catch (error) {
      logError(`[FilterService] Error finding city by name ${cityName}:`, error);
      // Return default New York City object instead of null
      return { id: 1, name: 'New York', has_boroughs: true };
    }
  },
  
  /**
   * Normalize city name for consistent matching
   * @param {string} cityName - The city name to normalize
   * @returns {string} Normalized city name
   */
  normalizeCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') return '';
    
    // Convert to lowercase and remove extra spaces
    let normalized = cityName.toLowerCase().trim();
    
    // Remove common suffixes and prefixes
    normalized = normalized
      .replace(/\s+city$/i, '') // Remove 'city' suffix
      .replace(/^city\s+of\s+/i, ''); // Remove 'city of' prefix
    
    // Handle common city name variations
    const cityMappings = {
      'ny': 'new york',
      'nyc': 'new york',
      'new york city': 'new york',
      'la': 'los angeles',
      'sf': 'san francisco',
      'dc': 'washington'
    };
    
    return cityMappings[normalized] || normalized;
  },
};