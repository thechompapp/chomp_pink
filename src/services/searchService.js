/* src/services/searchService.js */
import apiClient from './apiClient';
import { logDebug, logError } from '@/utils/logger.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';

const search = async (params = {}) => {
  const {
    q = '',
    type = 'all',
    limit = 10,
    offset = 0,
    cityId,
    boroughId,
    neighborhoodId,
    hashtags = [],
  } = params;

  logDebug(`[searchService] Performing search with params:`, params);
  
  // Use createQueryParams utility for consistent parameter handling
  const queryParams = createQueryParams({
    q,
    type,
    limit,
    offset,
    cityId,
    boroughId,
    neighborhoodId,
    hashtags
  });
  
  // Use handleApiResponse for standardized API handling
  return handleApiResponse(
    () => apiClient.get(`/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`),
    'searchService.search',
    (data) => data || { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0 
    }
  );
};

export const searchService = {
  search,
};