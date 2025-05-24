/* src/services/searchService.js */
/**
 * Enhanced search service with improved API client integration, error handling,
 * and data transformation.
 */
import apiClient from './apiClient';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';
import { transformFiltersForApi } from '@/utils/dataTransformers.js';

/**
 * Simple in-memory cache for search results
 * @type {Map<string, {data: Object, timestamp: number}>}
 */
const searchCache = new Map();

/**
 * Cache time-to-live in milliseconds (2 minutes)
 * @type {number}
 */
const CACHE_TTL = 2 * 60 * 1000;

/**
 * Clear the search cache
 * @param {string} [cacheKey] - Specific cache key to clear, or all if not provided
 */
const clearSearchCache = (cacheKey = null) => {
  if (cacheKey) {
    searchCache.delete(cacheKey);
    logDebug(`[searchService] Cleared cache for key: ${cacheKey}`);
  } else {
    searchCache.clear();
    logDebug('[searchService] Cleared all search cache');
  }
};

/**
 * Perform a search with the given parameters
 * @param {Object} params - Search parameters
 * @param {boolean} [useCache=true] - Whether to use cached results if available
 * @returns {Promise<Object>} - Search results
 */
const search = async (params = {}, useCache = true) => {
  const {
    q = '',
    type = 'all',
    limit = 10,
    offset = 0,
    cityId,
    boroughId,
    neighborhoodId,
    hashtags = [],
    refresh = false,
  } = params;

  // Generate cache key based on search parameters
  const cacheKey = JSON.stringify({
    q, type, limit, offset, cityId, boroughId, neighborhoodId, hashtags
  });
  
  // Check cache first unless refresh is requested
  if (useCache && !refresh && searchCache.has(cacheKey)) {
    const { data, timestamp } = searchCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      logDebug('[searchService] Returning cached search results');
      return data;
    }
  }
  
  logDebug(`[searchService] Performing search with params:`, params);
  
  // Transform filters for API using the utility function
  const apiFilters = transformFiltersForApi({
    cityId,
    boroughId,
    neighborhoodId,
    hashtags
  });
  
  // Create query parameters
  const queryParams = createQueryParams({
    q,
    type,
    limit: String(limit),
    offset: String(offset),
    ...apiFilters
  });
  
  // Use direct axios config object approach to prevent toUpperCase error
  const axiosConfig = {
    url: `/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    method: 'get'
  };
  
  // Make API request with standardized error handling
  const result = await handleApiResponse(
    () => apiClient(axiosConfig),
    'searchService.search'
  );
  
  // If the API request failed, return empty results
  if (!result.success) {
    return { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0,
      error: result.error || 'An error occurred during search'
    };
  }
  
  // Process and normalize the response
  const searchResults = result.data || { 
    restaurants: [], 
    dishes: [], 
    lists: [], 
    totalRestaurants: 0, 
    totalDishes: 0, 
    totalLists: 0 
  };
  
  // Update cache
  if (useCache) {
    searchCache.set(cacheKey, {
      data: searchResults,
      timestamp: Date.now()
    });
  }
  
  return searchResults;
};

export const searchService = {
  search,
  clearCache: clearSearchCache
};