/* src/services/neighborhoodService.js */
import apiClient from '@/services/apiClient.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';
import { handleApiResponse, validateId } from '@/utils/serviceHelpers.js';
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

// Note: This function is no longer needed since we're using handleApiResponse helper
// which standardizes the response format and error handling

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
    const safeId = validateId(cityId, 'cityId') || 1;
    
    logDebug(`[NeighborhoodService] Fetching boroughs for city ID: ${safeId}`);
    
    const result = await handleApiResponse(
      () => apiClient.get('/locations/boroughs', {
        params: { city_id: safeId }
      }),
      'NeighborhoodService.getBoroughs'
    );
    
    const data = Array.isArray(result.data) ? result.data : [];
    
    if (data.length === 0) {
      logWarn(`[NeighborhoodService] No boroughs found for city ID: ${safeId}`);
      return MOCK_BOROUGHS;
    }
    
    return data.map(borough => ({
      id: borough.id,
      name: borough.name,
      cityId: borough.city_id || safeId
    }));
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
    
    const safeId = validateId(boroughId, 'boroughId');
    
    logDebug(`[NeighborhoodService] Fetching neighborhoods for borough ID: ${safeId}`);
    
    const result = await handleApiResponse(
      () => apiClient.get('/locations/neighborhoods', {
        params: { parent_id: safeId }
      }),
      'NeighborhoodService.getNeighborhoods'
    );
    
    const data = Array.isArray(result.data) ? result.data : [];
    
    if (data.length === 0) {
      logWarn(`[NeighborhoodService] No neighborhoods found for borough ID: ${safeId}`);
      
      // Return mock neighborhoods filtered by parent ID
      return MOCK_NEIGHBORHOODS.filter(n => n.parent_id === safeId)
        .map(formatNeighborhood)
        .filter(Boolean);
    }
    
    return data.map(formatNeighborhood).filter(Boolean);
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
    
    const safeId = validateId(neighborhoodId, 'neighborhoodId');
    
    logDebug(`[NeighborhoodService] Fetching neighborhood with ID: ${safeId}`);
    
    const result = await handleApiResponse(
      () => apiClient.get(`/locations/neighborhood/${safeId}`),
      'NeighborhoodService.getNeighborhoodById'
    );
    
    const data = Array.isArray(result.data) ? result.data : [];
    
    let neighborhood = null;
    if (data.length > 0) {
      neighborhood = data[0];
    }
    
    if (!neighborhood) {
      logWarn(`[NeighborhoodService] No neighborhood found with ID: ${safeId}`);
      
      // Check mock data
      const mockNeighborhood = MOCK_NEIGHBORHOODS.find(n => n.id === safeId);
      return mockNeighborhood ? formatNeighborhood(mockNeighborhood) : null;
    }
    
    return formatNeighborhood(neighborhood);
  },
  
  /**
   * Fetches a neighborhood by zipcode
   * @param {string} zipcode - The zipcode to look up
   * @returns {Promise<Object|null>} - Neighborhood object or null if not found
   */
  getNeighborhoodByZipcode: async (zipcode) => {
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
      logWarn(`[NeighborhoodService] Invalid zipcode format: ${zipcode}`);
      return null;
    }
    
    logDebug(`[NeighborhoodService] Looking up neighborhood for zipcode: ${zipcode}`);
    
    // Check mock data first for quick response
    if (ZIPCODE_TO_NEIGHBORHOOD_MAP[zipcode]) {
      const mockNeighborhood = ZIPCODE_TO_NEIGHBORHOOD_MAP[zipcode];
      logDebug(`[NeighborhoodService] Found mock neighborhood for zipcode ${zipcode}:`, mockNeighborhood.name);
      return formatNeighborhood(mockNeighborhood);
    }
    
    const result = await handleApiResponse(
      () => apiClient.get(`/locations/zipcode/${zipcode}`),
      'NeighborhoodService.getNeighborhoodByZipcode'
    );
    
    const data = Array.isArray(result.data) ? result.data : [];
    
    if (data.length === 0) {
      logWarn(`[NeighborhoodService] No neighborhood found for zipcode: ${zipcode}`);
      return null;
    }
    
    const neighborhood = data[0];
    return formatNeighborhood(neighborhood);
  }
};

// Export mock data for testing and fallbacks
export { MOCK_NEIGHBORHOODS, ZIPCODE_TO_NEIGHBORHOOD_MAP };

// Maintain backwards compatibility with both export styles
export default neighborhoodService;
