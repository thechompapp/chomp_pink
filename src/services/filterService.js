/* src/services/filterService.js */
import apiClient from './apiClient';
import * as logger from '@/utils/logger'; // Correct logger import

const getCities = async () => {
  try {
    // Assuming endpoint '/filters/cities' is correct now with apiClient fix
    const response = await apiClient('/filters/cities', 'FilterService Get Cities');
    logger.logDebug('[FilterService Get Cities] Response:', response);

    // Expecting response.data = { success: true, data: [{id, name, has_boroughs}, ...] }
    if (response.success && response.data?.success && Array.isArray(response.data?.data)) {
      // Ensure boolean conversion for has_boroughs
      return response.data.data.map(city => ({
          ...city,
          has_boroughs: !!city.has_boroughs
      }));
    } else {
      throw new Error('Unexpected response structure for cities');
    }
  } catch (error) {
    logger.logError('[FilterService Get Cities] Error:', error);
    throw new Error(error.message || 'Failed to fetch cities.');
  }
};

// Keep getCuisines if used elsewhere, otherwise remove
// const getCuisines = async () => { /* ... */ };

// Removed getNeighborhoods as neighborhoodService should handle this now

// Export only the used functions
const filterService = {
  getCities,
  // getCuisines, // Uncomment if needed
};
export default filterService;