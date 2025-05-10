/* src/services/filterService.js */
import apiClient from './apiClient';
import * as logger from '@/utils/logger'; // Correct logger import
import { handleApiResponse } from '@/utils/serviceHelpers.js';

const getCities = async () => {
  return handleApiResponse(
    () => apiClient.get('/filters/cities'),
    'FilterService Get Cities',
    (data) => {
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response structure for cities');
      }
      
      // Ensure boolean conversion for has_boroughs
      return data.map(city => ({
        ...city,
        has_boroughs: !!city.has_boroughs
      }));
    }
  );
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