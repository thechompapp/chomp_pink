/**
 * FilterTransformService.js
 * 
 * Single Responsibility: Filter data transformation
 * - API format transformation
 * - URL parameter conversion  
 * - Filter serialization/deserialization
 * - Backward compatibility handling
 * - Validation during transformation
 */

import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * Filter type constants for validation
 */
const FILTER_TYPES = {
  CITY: 'city',
  BOROUGH: 'borough', 
  NEIGHBORHOOD: 'neighborhood',
  CUISINE: 'cuisine',
  HASHTAG: 'hashtag'
};

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
 * URL parameter mapping for clean URLs
 */
const URL_PARAM_MAPPING = {
  cityId: 'city',
  boroughId: 'borough',
  neighborhoodId: 'neighborhood',
  hashtags: 'cuisine'
};

/**
 * FilterTransformService class - Data transformation operations
 */
class FilterTransformService {
  constructor() {
    this.transformationCache = new Map();
  }

  /**
   * Transform internal filter state to API format
   * @param {Object} filters - Internal filter object
   * @returns {Object} API-formatted parameters
   */
  toApiFormat(filters) {
    if (!filters || typeof filters !== 'object') {
      logWarn('[FilterTransformService] Invalid filters provided to toApiFormat');
      return {};
    }

    const cacheKey = JSON.stringify(filters);
    if (this.transformationCache.has(cacheKey)) {
      return this.transformationCache.get(cacheKey);
    }

    try {
      const apiParams = {};
      
      // Process each filter type
      Object.entries(filters).forEach(([key, value]) => {
        // Skip empty filters
        if (this._isEmpty(value)) {
          return;
        }
        
        // Map internal keys to API keys
        const apiKey = API_PARAM_MAPPING[key] || key;
        
        // Handle different value types
        if (Array.isArray(value)) {
          apiParams[apiKey] = this._transformArrayValue(value);
        } else if (this._isRangeFilter(value)) {
          this._transformRangeValue(value, apiKey, apiParams);
        } else {
          apiParams[apiKey] = this._transformSimpleValue(value);
        }
      });
      
      // Cache the result for reuse
      this.transformationCache.set(cacheKey, apiParams);
      
      logDebug('[FilterTransformService] Transformed filters to API format:', {
        input: filters,
        output: apiParams
      });
      
      return apiParams;
    } catch (error) {
      logError('[FilterTransformService] Error transforming filters to API format:', error);
      return {};
    }
  }

  /**
   * Transform API response data to internal filter format
   * @param {Object} apiData - API response data
   * @returns {Object} Internal filter format
   */
  fromApiFormat(apiData) {
    if (!apiData || typeof apiData !== 'object') {
      logWarn('[FilterTransformService] Invalid API data provided to fromApiFormat');
      return {};
    }

    try {
      const internalFilters = {};
      
      // Reverse map API keys to internal keys
      Object.entries(apiData).forEach(([apiKey, value]) => {
        const internalKey = this._getInternalKey(apiKey);
        
        if (internalKey) {
          internalFilters[internalKey] = this._normalizeValue(value, internalKey);
        }
      });
      
      logDebug('[FilterTransformService] Transformed API data to internal format:', {
        input: apiData,
        output: internalFilters
      });
      
      return internalFilters;
    } catch (error) {
      logError('[FilterTransformService] Error transforming API data to internal format:', error);
      return {};
    }
  }

  /**
   * Transform filters to URL parameters
   * @param {Object} filters - Internal filter object
   * @returns {URLSearchParams} URL search parameters
   */
  toUrlParams(filters) {
    const params = new URLSearchParams();
    
    try {
      const apiFormatted = this.toApiFormat(filters);
      
      Object.entries(apiFormatted).forEach(([key, value]) => {
        const urlKey = URL_PARAM_MAPPING[key] || key;
        
        if (Array.isArray(value)) {
          // Join array values with commas
          params.set(urlKey, value.join(','));
        } else if (typeof value === 'object' && value !== null) {
          // Handle range objects
          if (value.min !== undefined) params.set(`${urlKey}_min`, String(value.min));
          if (value.max !== undefined) params.set(`${urlKey}_max`, String(value.max));
        } else {
          params.set(urlKey, String(value));
        }
      });
      
      logDebug('[FilterTransformService] Transformed filters to URL params:', params.toString());
      return params;
    } catch (error) {
      logError('[FilterTransformService] Error transforming filters to URL params:', error);
      return new URLSearchParams();
    }
  }

  /**
   * Transform URL parameters back to internal filter format
   * @param {URLSearchParams|string} urlParams - URL search parameters
   * @returns {Object} Internal filter format
   */
  fromUrlParams(urlParams) {
    try {
      const params = typeof urlParams === 'string' 
        ? new URLSearchParams(urlParams) 
        : urlParams;
      
      const filters = {};
      
      // Process each URL parameter
      for (const [urlKey, value] of params.entries()) {
        const { key, type } = this._parseUrlKey(urlKey);
        const internalKey = this._getInternalKeyFromUrl(key);
        
        if (internalKey) {
          if (type === 'min' || type === 'max') {
            // Handle range parameters
            if (!filters[internalKey]) {
              filters[internalKey] = {};
            }
            filters[internalKey][type] = this._parseValue(value);
          } else if (value.includes(',')) {
            // Handle comma-separated arrays
            filters[internalKey] = value.split(',').map(v => this._parseValue(v.trim()));
          } else {
            // Handle simple values
            filters[internalKey] = this._parseValue(value);
          }
        }
      }
      
      logDebug('[FilterTransformService] Transformed URL params to internal format:', {
        input: params.toString(),
        output: filters
      });
      
      return filters;
    } catch (error) {
      logError('[FilterTransformService] Error transforming URL params to internal format:', error);
      return {};
    }
  }

  /**
   * Serialize filters for storage
   * @param {Object} filters - Filter object to serialize
   * @returns {string} Serialized filter string
   */
  serialize(filters) {
    try {
      const serializable = {
        version: '1.0',
        timestamp: Date.now(),
        filters: this.toApiFormat(filters)
      };
      
      return JSON.stringify(serializable);
    } catch (error) {
      logError('[FilterTransformService] Error serializing filters:', error);
      return '';
    }
  }

  /**
   * Deserialize filters from storage
   * @param {string} serializedFilters - Serialized filter string
   * @returns {Object} Deserialized filter object
   */
  deserialize(serializedFilters) {
    try {
      if (!serializedFilters || typeof serializedFilters !== 'string') {
        return {};
      }
      
      const parsed = JSON.parse(serializedFilters);
      
      // Handle version compatibility
      if (parsed.version && parsed.filters) {
        return this.fromApiFormat(parsed.filters);
      }
      
      // Legacy format fallback
      return this.fromApiFormat(parsed);
    } catch (error) {
      logError('[FilterTransformService] Error deserializing filters:', error);
      return {};
    }
  }

  /**
   * Validate filter structure and values
   * @param {Object} filters - Filters to validate
   * @returns {Object} Validation result with errors
   */
  validate(filters) {
    const errors = [];
    const warnings = [];
    
    try {
      if (!filters || typeof filters !== 'object') {
        errors.push('Filters must be an object');
        return { valid: false, errors, warnings };
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        // Check if filter type is valid
        if (!Object.values(FILTER_TYPES).includes(key)) {
          warnings.push(`Unknown filter type: ${key}`);
        }
        
        // Validate specific filter types
        switch (key) {
          case FILTER_TYPES.CITY:
          case FILTER_TYPES.BOROUGH:
          case FILTER_TYPES.NEIGHBORHOOD:
            if (value !== null && (!Number.isInteger(value) || value <= 0)) {
              errors.push(`${key} must be a positive integer or null`);
            }
            break;
            
          case FILTER_TYPES.CUISINE:
          case FILTER_TYPES.HASHTAG:
            if (!Array.isArray(value)) {
              errors.push(`${key} must be an array`);
            }
            break;
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logError('[FilterTransformService] Error validating filters:', error);
      return { valid: false, errors: ['Validation failed'], warnings: [] };
    }
  }

  /**
   * Clear transformation cache
   */
  clearCache() {
    this.transformationCache.clear();
    logDebug('[FilterTransformService] Transformation cache cleared');
  }

  // Private helper methods

  /**
   * Check if value is empty (null, undefined, empty array, empty string)
   * @private
   */
  _isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' ||
           (Array.isArray(value) && value.length === 0);
  }

  /**
   * Check if value is a range filter object
   * @private
   */
  _isRangeFilter(value) {
    return typeof value === 'object' && 
           value !== null && 
           (value.min !== undefined || value.max !== undefined);
  }

  /**
   * Transform array value for API
   * @private
   */
  _transformArrayValue(value) {
    if (value.length === 1) {
      return value[0]; // Send single value as string to avoid array parameter
    }
    return value.join(','); // Join multiple values with comma
  }

  /**
   * Transform range value for API
   * @private
   */
  _transformRangeValue(value, apiKey, apiParams) {
    if (value.min !== undefined) apiParams[`${apiKey}_min`] = value.min;
    if (value.max !== undefined) apiParams[`${apiKey}_max`] = value.max;
  }

  /**
   * Transform simple value for API
   * @private
   */
  _transformSimpleValue(value) {
    if (value === null || value === undefined) return null;
    return String(value);
  }

  /**
   * Get internal key from API key
   * @private
   */
  _getInternalKey(apiKey) {
    // Reverse lookup in API_PARAM_MAPPING
    for (const [internal, api] of Object.entries(API_PARAM_MAPPING)) {
      if (api === apiKey) return internal;
    }
    return apiKey; // Return as-is if no mapping found
  }

  /**
   * Get internal key from URL key  
   * @private
   */
  _getInternalKeyFromUrl(urlKey) {
    // Reverse lookup in URL_PARAM_MAPPING
    for (const [api, url] of Object.entries(URL_PARAM_MAPPING)) {
      if (url === urlKey) {
        return this._getInternalKey(api);
      }
    }
    return this._getInternalKey(urlKey);
  }

  /**
   * Parse URL key to extract base key and type (min/max)
   * @private
   */
  _parseUrlKey(urlKey) {
    if (urlKey.endsWith('_min')) {
      return { key: urlKey.slice(0, -4), type: 'min' };
    }
    if (urlKey.endsWith('_max')) {
      return { key: urlKey.slice(0, -4), type: 'max' };
    }
    return { key: urlKey, type: null };
  }

  /**
   * Parse string value to appropriate type
   * @private
   */
  _parseValue(value) {
    if (value === 'null' || value === 'undefined') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) return num;
    
    return value; // Return as string if no conversion possible
  }

  /**
   * Normalize value based on filter type
   * @private
   */
  _normalizeValue(value, filterType) {
    switch (filterType) {
      case FILTER_TYPES.CITY:
      case FILTER_TYPES.BOROUGH:
      case FILTER_TYPES.NEIGHBORHOOD:
        return value ? parseInt(value, 10) : null;
        
      case FILTER_TYPES.CUISINE:
      case FILTER_TYPES.HASHTAG:
        if (typeof value === 'string') {
          return value.split(',').map(v => v.trim()).filter(Boolean);
        }
        return Array.isArray(value) ? value : [];
        
      default:
        return value;
    }
  }
}

// Create and export singleton instance
export const filterTransformService = new FilterTransformService();

// Export class for testing and custom instances
export { FilterTransformService, FILTER_TYPES };

// Export default instance
export default filterTransformService; 