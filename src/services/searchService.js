/* src/services/searchService.js */
// Corrected: Using the apiClient function correctly
import apiClient from './apiClient';
import * as logger from '@/utils/logger.js';

const search = async (params = {}) => {
  const {
    q = '',
    type = 'all',
    limit = 10,
    offset = 0,
    cityId,
    neighborhoodId,
    hashtags = [],
  } = params;

  try {
    const queryParams = new URLSearchParams();
    queryParams.append('q', q);
    queryParams.append('type', type);
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    if (cityId) queryParams.append('cityId', cityId.toString());
    if (neighborhoodId) queryParams.append('neighborhoodId', neighborhoodId.toString());
    if (Array.isArray(hashtags) && hashtags.length > 0) {
      hashtags.forEach(tag => {
        if (tag) queryParams.append('hashtags', tag);
      });
    }

    logger.logDebug(`[searchService] Performing search with params: ${queryParams.toString()}`);

    // Corrected: Call apiClient function
    const response = await apiClient(
        '/search', // endpoint
        'Perform Search', // context
        { method: 'GET', params: queryParams } // config
     );

    logger.logDebug('[searchService] Response from apiClient:', response);

    // Expecting response.data like { success: true, data: { restaurants: [], dishes: [], lists: [], totalRestaurants: X, ... } }
    if (response.success && response.data?.success) {
        // Return the nested data object containing results and totals
        return response.data.data || { restaurants: [], dishes: [], lists: [], totalRestaurants: 0, totalDishes: 0, totalLists: 0 };
    } else {
        throw new Error(response.data?.message || 'Search request failed');
    }
  } catch (error) {
    // apiClient wrapper throws ApiError
    logger.logError('[searchService] Search Error:', error);
    throw new Error(error.message || 'Failed to perform search'); // Re-throw simplified error
  }
};

export const searchService = {
  search,
};