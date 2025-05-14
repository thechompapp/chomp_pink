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
      const cities = await this.getCities();
      
      if (!cities || !Array.isArray(cities)) {
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