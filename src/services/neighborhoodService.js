/* src/services/neighborhoodService.js */
import apiClient from '@/services/apiClient';
import * as logger from '@/utils/logger'; // Correct logger import

// Assuming formatNeighborhood is still needed and adapts to new model if necessary
const formatNeighborhood = (n) => n ? ({ id: n.id, name: n.name, city_id: n.city_id, parent_id: n.parent_id, location_level: n.location_level }) : null;

const neighborhoodService = {
  /**
   * Fetches boroughs (level 1 locations) for a given city.
   */
  getBoroughs: async (cityId) => {
    if (!cityId || isNaN(parseInt(cityId, 10))) {
        logger.logWarn('[NeighborhoodService GetBoroughs] Invalid cityId:', cityId);
        return []; // Return empty array for invalid input
    }
    // Assuming backend route is now GET /neighborhoods/city/:cityId/boroughs
    // OR GET /neighborhoods?cityId=X&level=1
    // Adjust endpoint based on your actual backend route definition
    const endpoint = `/neighborhoods`; // Example: Using query params
    const queryParams = new URLSearchParams({ cityId: String(cityId), level: '1' });
    const context = `NeighborhoodService GetBoroughs (cityId: ${cityId})`;

    try {
      const response = await apiClient(endpoint, context, { params: queryParams });
      logger.logDebug(`[${context}] Response:`, response);
      // Assuming response.data.data contains the array of boroughs
      if (response.success && response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data.map(formatNeighborhood).filter(Boolean);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch boroughs.');
      }
    } catch (error) {
      logger.logError(`[${context}] Error:`, error);
      throw new Error(error.message || 'Failed to fetch boroughs.');
    }
  },

  /**
   * Fetches neighborhoods (level 2 locations) for a given parent borough.
   */
  getNeighborhoods: async (boroughId) => { // Only needs boroughId (parent_id)
    if (!boroughId || isNaN(parseInt(boroughId, 10))) {
        logger.logWarn('[NeighborhoodService GetNeighborhoods] Invalid boroughId:', boroughId);
        return []; // Return empty array for invalid input
    }
    // Assuming backend route is now GET /neighborhoods/parent/:boroughId
    // OR GET /neighborhoods?parentId=Y&level=2
    // Adjust endpoint based on your actual backend route definition
    const endpoint = `/neighborhoods`; // Example: Using query params
    const queryParams = new URLSearchParams({ parentId: String(boroughId), level: '2' });
    const context = `NeighborhoodService GetNeighborhoods (boroughId: ${boroughId})`;

    try {
      const response = await apiClient(endpoint, context, { params: queryParams });
       logger.logDebug(`[${context}] Response:`, response);
      // Assuming response.data.data contains the array of neighborhoods
      if (response.success && response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data.map(formatNeighborhood).filter(Boolean);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch neighborhoods.');
      }
    } catch (error) {
      logger.logError(`[${context}] Error:`, error);
      throw new Error(error.message || 'Failed to fetch neighborhoods.');
    }
  },
};

export default neighborhoodService;