/* src/services/searchService.js */
/**
 * Enhanced search service with improved API client integration, error handling,
 * and data transformation.
 */
import { apiClient } from './apiClient';
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

  // For debugging, clear cache if we're searching for specific types
  if (type === 'restaurants' || type === 'dishes') {
    searchCache.clear();
    logDebug(`[searchService] Cache cleared for ${type} search debugging`);
  }

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
  
  logDebug(`[searchService] Query params constructed:`, queryParams.toString());
  
  // Use direct axios config object approach to prevent toUpperCase error
  const axiosConfig = {
    url: `/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    method: 'get'
  };
  
  logDebug(`[searchService] Making API request to:`, axiosConfig.url);
  logDebug(`[searchService] Full request URL will be: http://localhost:5173${axiosConfig.url}`);
  
  console.log(`[searchService] Making API request:`, axiosConfig);
  console.log(`[searchService] Request URL:`, axiosConfig.url);
  
  // Make API request directly without handleApiResponse for search endpoint
  // because search returns a nested object structure, not a simple array
  try {
    const response = await apiClient.request(axiosConfig);
    
    console.log(`[searchService] API call completed:`, response.data);
    console.log(`[searchService] Result type:`, typeof response.data);
    console.log(`[searchService] Result keys:`, response.data ? Object.keys(response.data) : 'no result');
    
    logDebug(`[searchService] Raw API result:`, response.data);
    logDebug(`[searchService] Raw API result type:`, typeof response.data);
    logDebug(`[searchService] Raw API result success:`, response.data?.success);
    logDebug(`[searchService] Raw API result data keys:`, response.data?.data ? Object.keys(response.data.data) : 'no data');
    
    // Check if API request failed
    if (!response.data?.success) {
      logDebug(`[searchService] API request failed, returning empty results`);
      return { 
        restaurants: [], 
        dishes: [], 
        lists: [], 
        totalRestaurants: 0, 
        totalDishes: 0, 
        totalLists: 0,
        error: response.data?.message || 'An error occurred during search'
      };
    }
    
    // Process and normalize the response data
    // The API returns: { success: true, data: { restaurants: [...], dishes: [...], totalRestaurants: N, totalDishes: N } }
    const data = response.data.data || {};
    logDebug(`[searchService] Extracted data:`, data);
    logDebug(`[searchService] Data keys:`, Object.keys(data));
    logDebug(`[searchService] Restaurants array length:`, data.restaurants?.length);
    logDebug(`[searchService] Dishes array length:`, data.dishes?.length);
    logDebug(`[searchService] Lists array length:`, data.lists?.length);
    
    // Process and normalize the response
    logDebug('[searchService] Processing search result.data:', data);
    
    const searchResults = data || { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0 
    };
    
    // Ensure we have the expected structure - the data should already be the correct nested object
    const normalizedResults = {
      restaurants: Array.isArray(searchResults.restaurants) ? searchResults.restaurants : [],
      dishes: Array.isArray(searchResults.dishes) ? searchResults.dishes : [],
      lists: Array.isArray(searchResults.lists) ? searchResults.lists : [],
      totalRestaurants: typeof searchResults.totalRestaurants === 'number' ? searchResults.totalRestaurants : 0,
      totalDishes: typeof searchResults.totalDishes === 'number' ? searchResults.totalDishes : 0,
      totalLists: typeof searchResults.totalLists === 'number' ? searchResults.totalLists : 0,
      success: true, // Add success field for consistency
      data: searchResults // Also include the raw data for backward compatibility
    };
    
    logDebug('[searchService] Normalized search results:', {
      hasRestaurants: normalizedResults.restaurants.length > 0,
      hasDishes: normalizedResults.dishes.length > 0,
      hasLists: normalizedResults.lists.length > 0,
      totals: {
        restaurants: normalizedResults.totalRestaurants,
        dishes: normalizedResults.totalDishes,
        lists: normalizedResults.totalLists
      }
    });
    
    // Update cache
    if (useCache) {
      searchCache.set(cacheKey, {
        data: normalizedResults,
        timestamp: Date.now()
      });
    }
    
    return normalizedResults;
  } catch (error) {
    logError('[searchService] API Error:', error);
    
    // Return empty results on error
    return { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0,
      error: error.message || 'An error occurred during search'
    };
  }
};

export const searchService = {
  search,
  clearCache: clearSearchCache
};