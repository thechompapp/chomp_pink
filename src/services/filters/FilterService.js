/**
 * FilterService.js - Unified Filter Service
 * 
 * Phase 2: Service Layer Consolidation
 * - Single entry point for all filter operations
 * - Parallel data fetching with intelligent batching
 * - Unified transformation layer
 * - Smart caching with dependency management
 * - Error handling and retry logic
 * - Performance monitoring and optimization
 */

import { create } from 'zustand';
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger';
import { apiClient } from '@/services/apiClient';
import { handleApiResponse, validateId } from '@/utils/serviceHelpers';

// Import existing specialized services for backward compatibility
import { FilterDataService } from './FilterDataService';
import { FilterCacheService } from './FilterCacheService';

/**
 * Filter type constants
 */
export const FILTER_TYPES = {
  CITY: 'city',
  BOROUGH: 'borough',
  NEIGHBORHOOD: 'neighborhood',
  CUISINE: 'cuisine',
  HASHTAG: 'hashtag',
  PRICE: 'price',
};

/**
 * Service configuration
 */
const DEFAULT_CONFIG = {
  // Data fetching
  parallelFetching: true,
  maxConcurrentRequests: 3,
  requestTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Caching  
  enableCaching: true,
  defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  
  // Transformations
  apiFieldMapping: {
    city: 'cityId',
    borough: 'boroughId',
    neighborhood: 'neighborhoodId',
    cuisine: 'hashtags',
    hashtag: 'hashtags'
  },
  
  // Performance
  enableProfiling: process.env.NODE_ENV === 'development',
  batchSize: 50,
  prefetchRelated: true
};

/**
 * Unified FilterService Class
 * Consolidates all filter-related operations into a single, efficient service
 */
class FilterService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize sub-services
    this.dataService = new FilterDataService({
      timeout: this.config.requestTimeout,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay
    });
    
    this.cacheService = new FilterCacheService({
      defaultTTL: this.config.defaultCacheTTL,
      maxCacheSize: this.config.maxCacheSize
    });
    
    // Request batching and deduplication
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.batchTimer = null;
    
    // Performance monitoring
    this.performanceMetrics = {
      totalRequests: 0,
      parallelRequests: 0,
      cacheHits: 0,
      errors: 0,
      averageResponseTime: 0
    };
    
    logInfo('[FilterService] Initialized unified filter service');
  }

  // ================================
  // PUBLIC API - Main Entry Points
  // ================================

  /**
   * Get all filter data in parallel
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Complete filter data set
   */
  async getAllFilterData(options = {}) {
    const startTime = Date.now();
    
    try {
      logDebug('[FilterService] Fetching all filter data in parallel');
      
      const requests = [];
      
      // Always fetch cities and cuisines
      requests.push(
        { key: 'cities', fetcher: () => this.getCities() },
        { key: 'cuisines', fetcher: () => this.getCuisines('', options.cuisineLimit || 50) }
      );
      
      // Conditionally fetch related data if dependencies are provided
      if (options.cityId) {
        requests.push({
          key: 'boroughs',
          fetcher: () => this.getBoroughs(options.cityId)
        });
      }
      
      if (options.boroughId) {
        requests.push({
          key: 'neighborhoods', 
          fetcher: () => this.getNeighborhoods(options.boroughId)
        });
      }
      
      // Execute all requests in parallel
      const results = await this._executeParallelRequests(requests);
      
      // Track performance
      const responseTime = Date.now() - startTime;
      this._updatePerformanceMetrics('getAllFilterData', responseTime, results);
      
      logInfo(`[FilterService] Retrieved all filter data in ${responseTime}ms`);
      return results;
      
    } catch (error) {
      this.performanceMetrics.errors++;
      logError('[FilterService] Error fetching all filter data:', error);
      throw error;
    }
  }

  /**
   * Get cities with caching and error handling
   * @param {Object} options - Filtering and sorting options
   * @returns {Promise<Array>} List of cities
   */
  async getCities(options = {}) {
    const cacheKey = `cities_${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return cached;
    }
    
    try {
      const cities = await this.dataService.getCities(options);
      this.cacheService.set(cacheKey, cities);
      return cities;
    } catch (error) {
      logError('[FilterService] Error fetching cities:', error);
      // Return cached stale data if available
      const staleData = this.cacheService.get(cacheKey, true);
      return staleData || [];
    }
  }

  /**
   * Get boroughs for a city with smart caching
   * @param {number} cityId - City ID
   * @returns {Promise<Array>} List of boroughs
   */
  async getBoroughs(cityId) {
    if (!validateId(cityId)) {
      logWarn(`[FilterService] Invalid cityId: ${cityId}`);
      return [];
    }
    
    const cacheKey = `boroughs_${cityId}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return cached;
    }
    
    try {
      const boroughs = await this.dataService.getBoroughs(cityId);
      this.cacheService.set(cacheKey, boroughs);
      
      // Prefetch neighborhoods for first few boroughs if enabled
      if (this.config.prefetchRelated && boroughs.length > 0) {
        this._prefetchNeighborhoods(boroughs.slice(0, 3));
      }
      
      return boroughs;
    } catch (error) {
      logError('[FilterService] Error fetching boroughs:', error);
      const staleData = this.cacheService.get(cacheKey, true);
      return staleData || [];
    }
  }

  /**
   * Get neighborhoods for a borough with smart caching
   * @param {number} boroughId - Borough ID
   * @returns {Promise<Array>} List of neighborhoods
   */
  async getNeighborhoods(boroughId) {
    if (!validateId(boroughId)) {
      logWarn(`[FilterService] Invalid boroughId: ${boroughId}`);
      return [];
    }
    
    const cacheKey = `neighborhoods_${boroughId}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return cached;
    }
    
    try {
      const neighborhoods = await this.dataService.getNeighborhoods(boroughId);
      this.cacheService.set(cacheKey, neighborhoods);
      return neighborhoods;
    } catch (error) {
      logError('[FilterService] Error fetching neighborhoods:', error);
      const staleData = this.cacheService.get(cacheKey, true);
      return staleData || [];
    }
  }

  /**
   * Get cuisines with search and caching
   * @param {string} searchTerm - Search term for filtering
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} List of cuisines
   */
  async getCuisines(searchTerm = '', limit = 50) {
    const cacheKey = `cuisines_${searchTerm}_${limit}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return cached;
    }
    
    try {
      const cuisines = await this.dataService.getCuisines(searchTerm, limit);
      // Cache with shorter TTL for search results
      const ttl = searchTerm ? 2 * 60 * 1000 : this.config.defaultCacheTTL;
      this.cacheService.set(cacheKey, cuisines, ttl);
      return cuisines;
    } catch (error) {
      logError('[FilterService] Error fetching cuisines:', error);
      const staleData = this.cacheService.get(cacheKey, true);
      return staleData || [];
    }
  }

  // ================================
  // TRANSFORMATION METHODS
  // ================================

  /**
   * Transform filters to API format
   * @param {Object} filters - Internal filter object
   * @returns {Object} API-formatted parameters
   */
  transformToApi(filters) {
    if (!filters || typeof filters !== 'object') {
      return {};
    }
    
    const apiParams = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (this._isEmpty(value)) return;
      
      const apiKey = this.config.apiFieldMapping[key] || key;
      
      if (Array.isArray(value)) {
        apiParams[apiKey] = value.length === 1 ? value[0] : value.join(',');
      } else if (typeof value === 'object' && value !== null) {
        // Handle range filters
        if (value.min !== undefined) apiParams[`${apiKey}_min`] = value.min;
        if (value.max !== undefined) apiParams[`${apiKey}_max`] = value.max;
      } else {
        apiParams[apiKey] = value;
      }
    });
    
    return apiParams;
  }

  /**
   * Transform API data to internal filter format
   * @param {Object} apiData - API response data
   * @returns {Object} Internal filter format
   */
  transformFromApi(apiData) {
    if (!apiData || typeof apiData !== 'object') {
      return {};
    }
    
    const filters = {};
    const reverseMapping = this._getReverseApiMapping();
    
    Object.entries(apiData).forEach(([apiKey, value]) => {
      const internalKey = reverseMapping[apiKey] || apiKey;
      if (!this._isEmpty(value)) {
        filters[internalKey] = value;
      }
    });
    
    return filters;
  }

  /**
   * Transform filters to URL parameters
   * @param {Object} filters - Internal filter object
   * @returns {URLSearchParams} URL search parameters
   */
  transformToUrl(filters) {
    const params = new URLSearchParams();
    const apiFormatted = this.transformToApi(filters);
    
    Object.entries(apiFormatted).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });
    
    return params;
  }

  /**
   * Transform URL parameters to internal filter format
   * @param {URLSearchParams|string} urlParams - URL parameters
   * @returns {Object} Internal filter format
   */
  transformFromUrl(urlParams) {
    try {
      const params = typeof urlParams === 'string' 
        ? new URLSearchParams(urlParams) 
        : urlParams;
      
      const apiData = {};
      
      for (const [key, value] of params.entries()) {
        if (value.includes(',')) {
          apiData[key] = value.split(',').filter(Boolean);
        } else {
          apiData[key] = this._parseValue(value);
        }
      }
      
      return this.transformFromApi(apiData);
    } catch (error) {
      logError('[FilterService] Error transforming URL params:', error);
      return {};
    }
  }

  // ================================
  // CACHE MANAGEMENT
  // ================================

  /**
   * Clear cache for specific filter types or all
   * @param {string|Array} types - Filter types to clear or 'all'
   */
  clearCache(types = 'all') {
    if (types === 'all') {
      this.cacheService.clear();
      logInfo('[FilterService] Cleared all filter cache');
    } else {
      const typesToClear = Array.isArray(types) ? types : [types];
      typesToClear.forEach(type => {
        this.cacheService.invalidate(new RegExp(`^${type}_`));
      });
      logInfo(`[FilterService] Cleared cache for types: ${typesToClear.join(', ')}`);
    }
  }

  /**
   * Warm cache with important data
   * @param {Object} options - Warming options
   */
  async warmCache(options = {}) {
    const entries = [
      { key: 'cities', fetcher: () => this.dataService.getCities() },
      { key: 'cuisines', fetcher: () => this.dataService.getCuisines('', 50) }
    ];
    
    if (options.cityId) {
      entries.push({
        key: `boroughs_${options.cityId}`,
        fetcher: () => this.dataService.getBoroughs(options.cityId)
      });
    }
    
    await this.cacheService.warm(entries);
  }

  // ================================
  // PERFORMANCE & MONITORING
  // ================================

  /**
   * Get service performance metrics
   * @returns {Object} Performance statistics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheStats: this.cacheService.getStats(),
      cacheHitRate: this.performanceMetrics.totalRequests > 0 
        ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests 
        : 0
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      totalRequests: 0,
      parallelRequests: 0,
      cacheHits: 0,
      errors: 0,
      averageResponseTime: 0
    };
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  /**
   * Execute multiple requests in parallel with intelligent batching
   * @private
   */
  async _executeParallelRequests(requests) {
    if (!this.config.parallelFetching) {
      // Fallback to sequential execution
      const results = {};
      for (const { key, fetcher } of requests) {
        results[key] = await fetcher();
      }
      return results;
    }
    
    this.performanceMetrics.parallelRequests++;
    
    // Execute in batches to avoid overwhelming the server
    const results = {};
    const batches = this._createBatches(requests, this.config.maxConcurrentRequests);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async ({ key, fetcher }) => {
        try {
          const data = await fetcher();
          return { key, data, error: null };
        } catch (error) {
          return { key, data: null, error };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ key, data, error }) => {
        if (error) {
          logError(`[FilterService] Error in parallel request for ${key}:`, error);
          results[key] = [];
        } else {
          results[key] = data;
        }
      });
    }
    
    return results;
  }

  /**
   * Create batches for parallel execution
   * @private
   */
  _createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Prefetch neighborhoods for boroughs in background
   * @private
   */
  async _prefetchNeighborhoods(boroughs) {
    const prefetchPromises = boroughs.map(async (borough) => {
      try {
        await this.getNeighborhoods(borough.id);
      } catch (error) {
        // Ignore prefetch errors
        logDebug(`[FilterService] Prefetch failed for borough ${borough.id}`);
      }
    });
    
    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Update performance metrics
   * @private
   */
  _updatePerformanceMetrics(operation, responseTime, result) {
    this.performanceMetrics.totalRequests++;
    
    // Update average response time
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const totalRequests = this.performanceMetrics.totalRequests;
    this.performanceMetrics.averageResponseTime = 
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    
    if (this.config.enableProfiling) {
      logDebug(`[FilterService] ${operation} completed in ${responseTime}ms`);
    }
  }

  /**
   * Get reverse API field mapping
   * @private
   */
  _getReverseApiMapping() {
    const reverse = {};
    Object.entries(this.config.apiFieldMapping).forEach(([internal, api]) => {
      reverse[api] = internal;
    });
    return reverse;
  }

  /**
   * Check if value is empty
   * @private
   */
  _isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Parse string value to appropriate type
   * @private
   */
  _parseValue(value) {
    if (typeof value !== 'string') return value;
    
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num)) return num;
    
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    return value;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.cacheService.destroy();
    this.pendingRequests.clear();
    
    logInfo('[FilterService] Service destroyed and resources cleaned up');
  }
}

// Create and export singleton instance
export const filterService = new FilterService();

// Export class for testing and custom configurations
export { FilterService };

// Backward compatibility exports
export default filterService; 