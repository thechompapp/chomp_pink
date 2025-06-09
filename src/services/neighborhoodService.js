/* src/services/neighborhoodService.js */
import { getDefaultApiClient } from './http';

/**
 * Neighborhood Service
 * Handles all neighborhood-related API calls for the Maps feature
 */
class NeighborhoodService {
  constructor() {
    this.apiClient = getDefaultApiClient();
  }

  /**
   * Get all NYC neighborhoods with aggregated restaurant counts.
   * The backend now handles city filtering and count aggregation.
   */
  async getNeighborhoods() {
    try {
      // The endpoint returns a direct array of neighborhoods.
      const response = await this.apiClient.get('/neighborhoods');
      return response.data; // For Axios, the body is in response.data
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      throw new Error('Failed to fetch neighborhoods');
    }
  }

  /**
   * Get neighborhood details by ID
   */
  async getNeighborhoodById(id) {
    try {
      const response = await this.apiClient.get(`/neighborhoods/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching neighborhood ${id}:`, error);
      throw new Error('Failed to fetch neighborhood details');
    }
  }

  /**
   * Get restaurants in a specific neighborhood, including its sub-neighborhoods.
   */
  async getNeighborhoodRestaurants(neighborhoodId, options = {}) {
    try {
      const { page = 1, limit = 50, ...filters } = options;
      const response = await this.apiClient.get(`/neighborhoods/${neighborhoodId}/restaurants`, {
        params: { page, limit, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching restaurants for neighborhood ${neighborhoodId}:`, error);
      throw new Error('Failed to fetch neighborhood restaurants');
    }
  }

  /**
   * Search neighborhoods by name
   */
  async searchNeighborhoods(query) {
    try {
      const response = await this.apiClient.get('/neighborhoods/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching neighborhoods with query "${query}":`, error);
      throw new Error('Failed to search neighborhoods');
    }
  }
}

// Create and export a singleton instance
const neighborhoodService = new NeighborhoodService();
export default neighborhoodService;
