/* src/services/hashtagService.js */
/**
 * Service for fetching hashtag-related data.
 */
import apiClient from '@/services/apiClient';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import { createQueryParams } from '@/utils/serviceHelpers.js';

/**
 * Mock data for development fallback when API returns unexpected format
 */
const MOCK_HASHTAGS = [
  { id: 1, name: 'pizza', usage_count: 120 },
  { id: 2, name: 'burger', usage_count: 95 },
  { id: 3, name: 'sushi', usage_count: 87 },
  { id: 4, name: 'italian', usage_count: 76 },
  { id: 5, name: 'mexican', usage_count: 68 },
  { id: 6, name: 'vegan', usage_count: 62 },
  { id: 7, name: 'dessert', usage_count: 55 },
  { id: 8, name: 'healthy', usage_count: 49 },
  { id: 9, name: 'breakfast', usage_count: 43 },
  { id: 10, name: 'dinner', usage_count: 38 },
  { id: 11, name: 'lunch', usage_count: 35 },
  { id: 12, name: 'spicy', usage_count: 32 },
  { id: 13, name: 'seafood', usage_count: 29 },
  { id: 14, name: 'vegetarian', usage_count: 25 },
  { id: 15, name: 'fastfood', usage_count: 22 }
];

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

/**
 * Extract hashtags from various response formats
 * @param {Object|Array} response - API response
 * @returns {Array} - Extracted hashtag array
 */
const extractHashtagsFromResponse = (response) => {
  // Case 1: Direct array response
  if (Array.isArray(response)) {
    return response;
  }
  
  // Case 2: { data: [...] } format
  if (response && typeof response === 'object') {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Case 3: { success: true, data: [...] } format
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
  }
  
  // No valid data found
  logWarn('[HashtagService] Could not extract hashtag array from response:', response);
  return [];
};

const hashtagService = {
  /**
   * Fetches the top hashtags by usage count.
   * @param {number|Object} [limitOrOptions=15] - Number of hashtags to fetch or options object.
   * @returns {Promise<Array<{name: string, usage_count: number, id: number}>>} Array of top hashtags.
   */
  getTopHashtags: async (limitOrOptions = 15) => {
    try {
      // Handle both number and object parameters
      let safeLimit = 15;
      let additionalParams = {};
      
      if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
        // It's an options object
        const { limit, ...otherParams } = limitOrOptions;
        safeLimit = Math.max(1, parseInt(limit, 10) || 15);
        additionalParams = otherParams;
      } else {
        // It's a direct limit number
        safeLimit = Math.max(1, parseInt(limitOrOptions, 10) || 15);
      }
      
      const endpoint = `/hashtags/top`;
      
      logDebug(`[HashtagService] Fetching top ${safeLimit} hashtags with params:`, additionalParams);
      
      // Create a direct config object to ensure method is properly set
      const config = {
        url: endpoint,
        method: 'get',
        params: {
          limit: String(safeLimit),
          ...Object.entries(additionalParams).reduce((acc, [key, value]) => {
            // Ensure all parameters are strings
            acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return acc;
          }, {})
        }
      };
      
      // Make the API request using the direct config approach
      logDebug('[HashtagService] Making request with config:', config);
      const response = await apiClient(config);
      
      // Extract hashtags from the response
      const hashtags = extractHashtagsFromResponse(response);
      
      // If we got a valid array with items, normalize and return it
      if (Array.isArray(hashtags) && hashtags.length > 0) {
        return hashtags.map(normalizeHashtag);
      }
      
      // If we got an empty array or invalid response, log a warning and use mock data
      logWarn('[HashtagService] API returned invalid hashtag data, using mock data');
      return MOCK_HASHTAGS;
    } catch (error) {
      // Log the error but return mock data instead of throwing
      // This provides a more resilient UI experience
      logError('[HashtagService] Error fetching top hashtags:', error);
      return MOCK_HASHTAGS;
    }
  },
  
  /**
   * Searches for hashtags by partial name
   * @param {string} query - Search query
   * @param {number} [limit=10] - Maximum number of results
   * @returns {Promise<Array>} - Matching hashtags
   */
  searchHashtags: async (query, limit = 10) => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      const safeQuery = query.trim();
      const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
      
      logDebug(`[HashtagService] Searching hashtags with query: ${safeQuery}`);
      
      const response = await apiClient.get('/hashtags/search', {
        query: safeQuery,
        limit: safeLimit
      });
      
      const hashtags = extractHashtagsFromResponse(response);
      return hashtags.map(normalizeHashtag);
    } catch (error) {
      logError('[HashtagService] Error searching hashtags:', error);
      return [];
    }
  }
};

// Export the service object directly
export { hashtagService };
// Export mock data for testing
export { MOCK_HASHTAGS };