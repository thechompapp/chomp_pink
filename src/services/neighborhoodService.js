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
  logWarn(`[NeighborhoodService] Could not extract data array from ${context} response:`, response);
  return [];
};

/**
 * Format neighborhood data consistently
 * @param {Object} neighborhood - Raw neighborhood object
 * @returns {Object|null} - Formatted neighborhood object or null if invalid
 */
const formatNeighborhood = (neighborhood) => {
  if (!neighborhood || typeof neighborhood !== 'object') {
    return null;
  }
  
  return {
    id: parseInt(neighborhood.id, 10) || 0,
    name: neighborhood.name || '',
    city_id: parseInt(neighborhood.city_id, 10) || 0,
    parent_id: parseInt(neighborhood.parent_id, 10) || 0,
    location_level: parseInt(neighborhood.location_level, 10) || 0,
    borough_id: parseInt(neighborhood.parent_id, 10) || 0, // Alias for parent_id for compatibility
    borough_name: neighborhood.parent_name || null
  };
};

export const neighborhoodService = {
  /**
   * Fetches boroughs (level 1 locations) for a given city.
   * @param {number|string} cityId - The ID of the city
   * @returns {Promise<Array>} - List of boroughs
   */
  async getBoroughs(cityId) {
    try {
      if (!cityId || isNaN(parseInt(cityId, 10))) {
        logWarn('[NeighborhoodService] Invalid cityId:', cityId);
        return []; // Return empty array for invalid input
      }
      
      const safeId = parseInt(cityId, 10);
      logDebug(`[NeighborhoodService] Fetching boroughs for city ID: ${safeId}`);
      
      const response = await apiClient.get('/neighborhoods', { 
        params: { cityId: String(safeId), level: '1' }
      });
      
      const boroughs = extractDataFromResponse(response, 'boroughs');
      
      if (boroughs.length === 0) {
        logWarn(`[NeighborhoodService] No boroughs found for city ID: ${safeId}, using mock data`);
        
        // For New York City (ID 1), return mock boroughs as fallback
        if (safeId === 1) {
          return MOCK_BOROUGHS;
        }
        return [];
      }
      
      // Transform the data using our formatter
      const formattedBoroughs = boroughs.map(formatNeighborhood).filter(Boolean);
      logDebug(`[NeighborhoodService] Found ${formattedBoroughs.length} boroughs for city ID: ${safeId}`);
      return formattedBoroughs;
    } catch (error) {
      // Log but return mock data for better resilience
      logError(`[NeighborhoodService] Error fetching boroughs:`, error);
      
      // For New York City (ID 1), return mock boroughs as fallback
      if (parseInt(cityId, 10) === 1) {
        return MOCK_BOROUGHS;
      }
      return [];
    }
  },

  /**
   * Fetches neighborhoods (level 2 locations) for a given parent borough.
   * @param {number|string} boroughId - The ID of the parent borough
   * @returns {Promise<Array>} - List of neighborhoods
   */
  async getNeighborhoods(boroughId) {
    try {
      if (!boroughId || isNaN(parseInt(boroughId, 10))) {
        logWarn('[NeighborhoodService] Invalid boroughId:', boroughId);
        return []; // Return empty array for invalid input
      }
      
      const safeId = parseInt(boroughId, 10);
      logDebug(`[NeighborhoodService] Fetching neighborhoods for borough ID: ${safeId}`);
      
      const response = await apiClient.get('/neighborhoods', { 
        params: { parentId: String(safeId), level: '2' }
      });
      
      const neighborhoods = extractDataFromResponse(response, 'neighborhoods');
      
      if (neighborhoods.length === 0) {
        logWarn(`[NeighborhoodService] No neighborhoods found for borough ID: ${safeId}, using mock data`);
        
        // Return mock neighborhoods for this borough if available
        const mockNeighborhoodsForBorough = MOCK_NEIGHBORHOODS.filter(n => n.parent_id === safeId);
        if (mockNeighborhoodsForBorough.length > 0) {
          return mockNeighborhoodsForBorough;
        }
        return [];
      }
      
      // Transform the data using our formatter
      const formattedNeighborhoods = neighborhoods.map(formatNeighborhood).filter(Boolean);
      logDebug(`[NeighborhoodService] Found ${formattedNeighborhoods.length} neighborhoods for borough ID: ${safeId}`);
      return formattedNeighborhoods;
    } catch (error) {
      logError(`[NeighborhoodService] Error fetching neighborhoods for boroughId ${boroughId}:`, error);
      
      // Return mock neighborhoods for this borough if available
      const safeId = parseInt(boroughId, 10);
      const mockNeighborhoodsForBorough = MOCK_NEIGHBORHOODS.filter(n => n.parent_id === safeId);
      if (mockNeighborhoodsForBorough.length > 0) {
        return mockNeighborhoodsForBorough;
      }
      return [];
    }
  },
  
  /**
   * Fetches a neighborhood by ID
   * @param {number|string} neighborhoodId - The ID of the neighborhood
   * @returns {Promise<Object|null>} - Neighborhood object or null if not found
   */
  async getNeighborhoodById(neighborhoodId) {
    try {
      if (!neighborhoodId || isNaN(parseInt(neighborhoodId, 10))) {
        logWarn('[NeighborhoodService] Invalid neighborhoodId:', neighborhoodId);
        return null;
      }
      
      const safeId = parseInt(neighborhoodId, 10);
      logDebug(`[NeighborhoodService] Fetching neighborhood with ID: ${safeId}`);
      
      const response = await apiClient.get(`/neighborhoods/${safeId}`);
      const neighborhood = response?.data;
      
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
  }
};

// Export mock data for testing and fallbacks
export { MOCK_NEIGHBORHOODS };

// Maintain backwards compatibility with both export styles
export default neighborhoodService;