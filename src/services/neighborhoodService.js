/* src/services/neighborhoodService.js */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';

// Format neighborhood data consistently
const formatNeighborhood = (n) => n ? ({ id: n.id, name: n.name, city_id: n.city_id, parent_id: n.parent_id, location_level: n.location_level }) : null;

export const neighborhoodService = {
  /**
   * Fetches boroughs (level 1 locations) for a given city.
   */
  getBoroughs: async (cityId) => {
    try {
      if (!cityId || isNaN(parseInt(cityId, 10))) {
        logWarn('[NeighborhoodService] Invalid cityId:', cityId);
        return []; // Return empty array for invalid input
      }
      
      const safeId = parseInt(cityId, 10);
      const params = { cityId: String(safeId), level: '1' };
      const context = `NeighborhoodService GetBoroughs (cityId: ${safeId})`;
      
      const data = await handleApiResponse(
        () => apiClient.get('/neighborhoods', { params }),
        context
      );
      
      // Transform the data using our formatter
      return Array.isArray(data) ? data.map(formatNeighborhood).filter(Boolean) : [];
    } catch (error) {
      // Log but return empty array for better resilience
      logError(`[NeighborhoodService] Error fetching boroughs:`, error);
      return [];
    }
  },

  /**
   * Fetches neighborhoods (level 2 locations) for a given parent borough.
   */
  getNeighborhoods: async (boroughId) => {
    if (!boroughId || isNaN(parseInt(boroughId, 10))) {
        logWarn('[NeighborhoodService] Invalid boroughId:', boroughId);
        return []; // Return empty array for invalid input
    }
    
    const params = { parentId: String(boroughId), level: '2' };
    const context = `NeighborhoodService GetNeighborhoods (boroughId: ${boroughId})`;
    
    return handleApiResponse(
      () => apiClient.get('/neighborhoods', { params }),
      context
    ).then(data => {
      // Transform the data using our formatter
      return Array.isArray(data) ? data.map(formatNeighborhood).filter(Boolean) : [];
    }).catch(error => {
      logError(`[NeighborhoodService] Error fetching neighborhoods for boroughId ${boroughId}:`, error);
      throw error;
    });
  },
};

// Maintain backwards compatibility with both export styles
export default neighborhoodService;