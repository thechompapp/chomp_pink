/* src/services/hashtagService.js */
/**
 * Enhanced service for fetching hashtag-related data with improved error handling
 * and API client integration.
 */
import apiClient from '@/services/apiClient';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';

/**
 * Normalize hashtag data to ensure consistent format
 * @param {Object} item - Raw hashtag item from API
 * @returns {Object} - Normalized hashtag object
 */
const normalizeHashtag = (item) => {
  if (!item || typeof item !== 'object') {
    return { name: '', usage_count: 0, id: null };
  }
  return {
    name: item.name || '',
    usage_count: parseInt(item.usage_count, 10) || 0,
    id: parseInt(item.id, 10) || null
  };
};

// Note: This function is no longer needed since we're using handleApiResponse helper
// which standardizes the response format and error handling

/**
 * Simple in-memory cache for hashtag data
 * @type {Map<string, {data: Array, timestamp: number}>}
 */
const hashtagCache = new Map();

/**
 * Cache time-to-live in milliseconds (5 minutes)
 * @type {number}
 */
const CACHE_TTL = 5 * 60 * 1000;

const hashtagService = {
  /**
   * Fetches the top hashtags by usage count with improved error handling.
   * @param {number|Object} [limitOrOptions=15] - Number of hashtags to fetch or options object.
   * @param {boolean} [useCache=true] - Whether to use cached data if available.
   * @returns {Promise<Array<{name: string, usage_count: number, id: number}>>} Array of top hashtags.
   */
  getTopHashtags: async (limitOrOptions = 15, useCache = true) => {
    // Process parameters
    let safeLimit = 15;
    let additionalParams = {};
    let refresh = false;
    
    if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
      const { limit, refresh: shouldRefresh, ...otherParams } = limitOrOptions;
      safeLimit = Math.max(1, parseInt(limit, 10) || 15);
      additionalParams = otherParams;
      refresh = shouldRefresh === true;
    } else {
      safeLimit = Math.max(1, parseInt(limitOrOptions, 10) || 15);
    }
    
    // Generate cache key based on parameters
    const cacheKey = `top-hashtags-${safeLimit}-${JSON.stringify(additionalParams)}`;
    
    // Check cache first unless refresh is requested
    if (useCache && !refresh && hashtagCache.has(cacheKey)) {
      const { data, timestamp } = hashtagCache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        logDebug('[HashtagService] Returning cached top hashtags');
        return data;
      }
    }
    
    // Prepare API request
    const endpoint = `/hashtags/top`;
    logDebug(`[HashtagService] Fetching top ${safeLimit} hashtags with params:`, additionalParams);
    
    // Create params using helper function
    const params = createQueryParams({
      limit: String(safeLimit),
      ...additionalParams
    });
    
    // Make API request using handleApiResponse helper
    const result = await handleApiResponse(
      () => apiClient.get(endpoint, { params }),
      'HashtagService.getTopHashtags'
    );
    
    // Process and normalize response data
    const hashtags = Array.isArray(result.data) ? result.data : [];
    
    if (hashtags.length > 0) {
      const normalizedHashtags = hashtags.map(normalizeHashtag);
      
      // Update cache
      if (useCache) {
        hashtagCache.set(cacheKey, {
          data: normalizedHashtags,
          timestamp: Date.now()
        });
      }
      
      return normalizedHashtags;
    }
    
    // Return empty array instead of mock data per user preference
    logWarn('[HashtagService] API returned invalid hashtag data, returning empty array');
    return [];
  },

  /**
   * Searches for hashtags by partial name with improved error handling
   * @param {string} query - Search query
   * @param {number} [limit=10] - Maximum number of results
   * @returns {Promise<Array>} - Matching hashtags
   */
  searchHashtags: async (query, limit = 10) => {
    if (!query || query.trim().length < 2) return [];
    
    const safeQuery = query.trim();
    const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
    
    // Generate cache key
    const cacheKey = `search-hashtags-${safeQuery}-${safeLimit}`;
    
    // Check cache first
    if (hashtagCache.has(cacheKey)) {
      const { data, timestamp } = hashtagCache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        logDebug('[HashtagService] Returning cached hashtag search results');
        return data;
      }
    }
    
    logDebug(`[HashtagService] Searching hashtags with query: ${safeQuery}`);
    
    // Make API request using handleApiResponse helper
    const result = await handleApiResponse(
      () => apiClient.get('/hashtags/search', {
        params: {
          query: safeQuery,
          limit: String(safeLimit)
        }
      }),
      'HashtagService.searchHashtags'
    );
    
    // Process and normalize response data
    const hashtags = Array.isArray(result.data) ? result.data : [];
    const normalizedHashtags = hashtags.map(normalizeHashtag);
    
    // Update cache
    hashtagCache.set(cacheKey, {
      data: normalizedHashtags,
      timestamp: Date.now()
    });
    
    return normalizedHashtags;
  },
  
  /**
   * Clears the hashtag cache
   * @param {string} [cacheKey] - Specific cache key to clear, or all if not provided
   */
  clearCache: (cacheKey = null) => {
    if (cacheKey) {
      hashtagCache.delete(cacheKey);
      logDebug(`[HashtagService] Cleared cache for key: ${cacheKey}`);
    } else {
      hashtagCache.clear();
      logDebug('[HashtagService] Cleared all hashtag cache');
    }
  }
};

export { hashtagService };