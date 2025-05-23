/* src/services/neighborhoodService.js */
import apiClient from '@/services/apiClient.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';
import { MOCK_BOROUGHS } from './filterService.js';

/**
 * Mock data for neighborhoods (children of boroughs)
 */
const MOCK_NEIGHBORHOODS = [
  // Manhattan neighborhoods
  { id: 101, name: 'Upper East Side', city_id: 1, parent_id: 1, location_level: 2 },
  { id: 102, name: 'Upper West Side', city_id: 1, parent_id: 1, location_level: 2 },
  { id: 103, name: 'Midtown', city_id: 1, parent_id: 1, location_level: 2 },
  { id: 104, name: 'Chelsea', city_id: 1, parent_id: 1, location_level: 2 },
  
  // Brooklyn neighborhoods
  { id: 201, name: 'Williamsburg', city_id: 1, parent_id: 2, location_level: 2 },
  { id: 202, name: 'Park Slope', city_id: 1, parent_id: 2, location_level: 2 },
  { id: 203, name: 'DUMBO', city_id: 1, parent_id: 2, location_level: 2 },
  
  // Queens neighborhoods
  { id: 301, name: 'Astoria', city_id: 1, parent_id: 3, location_level: 2 },
  { id: 302, name: 'Long Island City', city_id: 1, parent_id: 3, location_level: 2 },
  { id: 303, name: 'Flushing', city_id: 1, parent_id: 3, location_level: 2 }
];

// Zipcode to neighborhood mapping for caching and quick lookups
const ZIPCODE_TO_NEIGHBORHOOD_MAP = {
  '10001': { id: 103, name: 'Midtown', city_id: 1, parent_id: 1, location_level: 2 },
  '10002': { id: 104, name: 'Chelsea', city_id: 1, parent_id: 1, location_level: 2 },
  '10003': { id: 101, name: 'Upper East Side', city_id: 1, parent_id: 1, location_level: 2 },
  '10004': { id: 102, name: 'Upper West Side', city_id: 1, parent_id: 1, location_level: 2 },
  '11201': { id: 201, name: 'Williamsburg', city_id: 1, parent_id: 2, location_level: 2 },
  '11215': { id: 202, name: 'Park Slope', city_id: 1, parent_id: 2, location_level: 2 },
  '11201': { id: 203, name: 'DUMBO', city_id: 1, parent_id: 2, location_level: 2 },
  '11106': { id: 301, name: 'Astoria', city_id: 1, parent_id: 3, location_level: 2 },
  '11101': { id: 302, name: 'Long Island City', city_id: 1, parent_id: 3, location_level: 2 },
  '11355': { id: 303, name: 'Flushing', city_id: 1, parent_id: 3, location_level: 2 }
};

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
  }
  
  // No valid data found
  logWarn(`[NeighborhoodService] Could not extract data from ${context} response:`, response);
  return [];
};

/**
 * Format neighborhood data consistently
 * @param {Object} neighborhood - Raw neighborhood object
 * @returns {Object|null} - Formatted neighborhood object or null if invalid
 */
const formatNeighborhood = (neighborhood) => {
  if (!neighborhood || !neighborhood.id) {
    return null;
  }
  
  return {
    id: neighborhood.id,
    name: neighborhood.name || 'Unknown Neighborhood',
    cityId: neighborhood.city_id || neighborhood.cityId || 1,
    parentId: neighborhood.parent_id || neighborhood.parentId || null,
    locationLevel: neighborhood.location_level || neighborhood.locationLevel || 2
  };
};

export const neighborhoodService = {
  /**
   * Fetches boroughs (level 1 locations) for a given city.
   * @param {number|string} cityId - The ID of the city
   * @returns {Promise<Array>} - List of boroughs
   */
  getBoroughs: async (cityId = 1) => {
    const safeId = parseInt(cityId, 10) || 1;
    const context = `Boroughs for city ${safeId}`;
    
    logDebug(`[NeighborhoodService] Fetching boroughs for city ID: ${safeId}`);
    
    try {
      const response = await apiClient.get(`/api/locations/boroughs?city_id=${safeId}`);
      const data = extractDataFromResponse(response, context);
      
      if (!data || data.length === 0) {
        logWarn(`[NeighborhoodService] No boroughs found for city ID: ${safeId}`);
        return MOCK_BOROUGHS;
      }
      
      return data.map(borough => ({
        id: borough.id,
        name: borough.name,
        cityId: borough.city_id || safeId
      }));
    } catch (error) {
      logError(`[NeighborhoodService] Error fetching boroughs for city ${safeId}:`, error);
      return MOCK_BOROUGHS;
    }
  },
  
  /**
   * Fetches neighborhoods (level 2 locations) for a given parent borough.
   * @param {number|string} boroughId - The ID of the parent borough
   * @returns {Promise<Array>} - List of neighborhoods
   */
  getNeighborhoods: async (boroughId) => {
    if (!boroughId) {
      logError('[NeighborhoodService] getNeighborhoods called without boroughId');
      return [];
    }
    
    const safeId = parseInt(boroughId, 10);
    const context = `Neighborhoods for borough ${safeId}`;
    
    logDebug(`[NeighborhoodService] Fetching neighborhoods for borough ID: ${safeId}`);
    
    try {
      const response = await apiClient.get(`/api/locations/neighborhoods?parent_id=${safeId}`);
      const data = extractDataFromResponse(response, context);
      
      if (!data || data.length === 0) {
        logWarn(`[NeighborhoodService] No neighborhoods found for borough ID: ${safeId}`);
        
        // Return mock neighborhoods filtered by parent ID
        return MOCK_NEIGHBORHOODS.filter(n => n.parent_id === safeId)
          .map(formatNeighborhood)
          .filter(Boolean);
      }
      
      return data.map(formatNeighborhood).filter(Boolean);
    } catch (error) {
      logError(`[NeighborhoodService] Error fetching neighborhoods for borough ${safeId}:`, error);
      
      // Return mock neighborhoods filtered by parent ID
      return MOCK_NEIGHBORHOODS.filter(n => n.parent_id === safeId)
        .map(formatNeighborhood)
        .filter(Boolean);
    }
  },
  
  /**
   * Fetches a neighborhood by ID
   * @param {number|string} neighborhoodId - The ID of the neighborhood
   * @returns {Promise<Object|null>} - Neighborhood object or null if not found
   */
  getNeighborhoodById: async (neighborhoodId) => {
    if (!neighborhoodId) {
      logError('[NeighborhoodService] getNeighborhoodById called without neighborhoodId');
      return null;
    }
    
    const safeId = parseInt(neighborhoodId, 10);
    
    logDebug(`[NeighborhoodService] Fetching neighborhood with ID: ${safeId}`);
    
    try {
      const response = await apiClient.get(`/api/locations/neighborhood/${safeId}`);
      const data = extractDataFromResponse(response, 'Neighborhood by ID');
      
      let neighborhood = null;
      if (data && data.length > 0) {
        neighborhood = data[0];
      }
      
      if (!neighborhood) {
        logWarn(`[NeighborhoodService] No neighborhood found with ID: ${safeId}`);
        
        // Check mock data
        const mockNeighborhood = MOCK_NEIGHBORHOODS.find(n => n.id === safeId);
        return mockNeighborhood || null;
      }
      
      return formatNeighborhood(neighborhood);
    } catch (error) {
      logError(`[NeighborhoodService] Error fetching neighborhood with ID ${neighborhoodId}:`, error);
      
      // Check mock data
      const safeId = parseInt(neighborhoodId, 10);
      const mockNeighborhood = MOCK_NEIGHBORHOODS.find(n => n.id === safeId);
      return mockNeighborhood || null;
    }
  },
  
  /**
   * Fetches a neighborhood by zipcode
   * @param {string} zipcode - The zipcode to look up
   * @returns {Promise<Object|null>} - Neighborhood object or null if not found
   */
  getNeighborhoodByZipcode: async (zipcode) => {
    if (!zipcode) {
      logError('[NeighborhoodService] getNeighborhoodByZipcode called without zipcode');
      return null;
    }

    logDebug(`[NeighborhoodService] Looking up neighborhood for zipcode: ${zipcode}`);
    
    try {
      // First check our local mapping
      if (ZIPCODE_TO_NEIGHBORHOOD_MAP[zipcode]) {
        const neighborhood = ZIPCODE_TO_NEIGHBORHOOD_MAP[zipcode];
        return formatNeighborhood(neighborhood);
      }
      
      // If not in our local mapping, try to fetch from API
      const response = await apiClient.get(`/api/locations/zipcode/${zipcode}`);
      const data = extractDataFromResponse(response, 'Neighborhood by zipcode');
      
      if (data && data.length > 0) {
        return formatNeighborhood(data[0]);
      }
      
      // If we couldn't find a match, log a warning and return null
      logWarn(`[NeighborhoodService] No neighborhood found for zipcode: ${zipcode}`);
      return null;
    } catch (error) {
      logError(`[NeighborhoodService] Error fetching neighborhood for zipcode ${zipcode}:`, error);
      
      // Fallback to Manhattan as a default neighborhood if API call fails
      return formatNeighborhood(MOCK_NEIGHBORHOODS[2]); // Midtown
    }
  }
};

// Export mock data for testing and fallbacks
export { MOCK_NEIGHBORHOODS, ZIPCODE_TO_NEIGHBORHOOD_MAP };

// Maintain backwards compatibility with both export styles
export default neighborhoodService;
