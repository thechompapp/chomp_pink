/**
 * ApiTransformer.js - API Format Conversion Only
 * 
 * Single Responsibility: Transform between internal and API formats
 * - Internal filter format ↔ API parameter format
 * - Clean, focused transformations
 * - No caching, validation, or other concerns
 */

import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * API parameter mapping for backward compatibility
 */
const API_PARAM_MAPPING = {
  city: 'cityId',
  borough: 'boroughId',
  neighborhood: 'neighborhoodId',
  cuisine: 'hashtags',
  hashtag: 'hashtags'
};

/**
 * Reverse mapping for API to internal conversion
 */
const INTERNAL_PARAM_MAPPING = {
  cityId: 'city',
  boroughId: 'borough',
  neighborhoodId: 'neighborhood',
  hashtags: 'cuisine'
};

/**
 * ApiTransformer - Clean API format conversion
 */
class ApiTransformer {
  /**
   * Transform internal filter state to API format
   */
  toApiFormat(filters) {
    if (!filters || typeof filters !== 'object') {
      logWarn('[ApiTransformer] Invalid filters provided');
      return {};
    }

    try {
      const apiParams = {};
      
      Object.entries(filters).forEach(([key, value]) => {
        // Skip empty filters
        if (this._isEmpty(value)) {
          return;
        }
        
        // Map internal keys to API keys
        const apiKey = API_PARAM_MAPPING[key] || key;
        
        // Handle different value types
        if (Array.isArray(value)) {
          apiParams[apiKey] = value.filter(Boolean); // Remove falsy values
        } else {
          apiParams[apiKey] = value;
        }
      });
      
      logDebug('[ApiTransformer] Transformed to API format:', apiParams);
      return apiParams;
    } catch (error) {
      logError('[ApiTransformer] Error transforming to API format:', error);
      return {};
    }
  }

  /**
   * Transform API response data to internal filter format
   */
  fromApiFormat(apiData) {
    if (!apiData || typeof apiData !== 'object') {
      logWarn('[ApiTransformer] Invalid API data provided');
      return {};
    }

    try {
      const internalFilters = {};
      
      Object.entries(apiData).forEach(([apiKey, value]) => {
        const internalKey = INTERNAL_PARAM_MAPPING[apiKey] || apiKey;
        
        if (internalKey && !this._isEmpty(value)) {
          internalFilters[internalKey] = value;
        }
      });
      
      logDebug('[ApiTransformer] Transformed from API format:', internalFilters);
      return internalFilters;
    } catch (error) {
      logError('[ApiTransformer] Error transforming from API format:', error);
      return {};
    }
  }

  /**
   * Check if value is empty/should be filtered out
   */
  _isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
}

// Export singleton instance
export const apiTransformer = new ApiTransformer();
export default apiTransformer; 