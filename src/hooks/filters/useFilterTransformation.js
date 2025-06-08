/**
 * useFilterTransformation.js
 * 
 * Single Responsibility: Data transformation hooks
 * - React-optimized data transformation
 * - Memoized transformation results
 * - URL synchronization
 * - API format conversion
 * - Performance optimization
 */

import { useMemo, useCallback } from 'react';
import { filterTransformService } from '@/services/filters';
import { logDebug } from '@/utils/logger';

/**
 * Default transformation options
 */
const DEFAULT_OPTIONS = {
  memoizeResults: true,
  enableUrlSync: true,
  validateTransforms: false,
  cacheTransformations: true
};

/**
 * useFilterTransformation - Data transformation management hook
 * 
 * @param {Object} filters - Current filter state
 * @param {Object} options - Transformation configuration
 * @returns {Object} Transformation functions and memoized results
 */
export function useFilterTransformation(filters = {}, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  /**
   * Memoized API format transformation
   */
  const apiFormat = useMemo(() => {
    if (!config.memoizeResults) {
      return filterTransformService.toApiFormat(filters);
    }

    try {
      const result = filterTransformService.toApiFormat(filters);
      logDebug('[useFilterTransformation] API format transformed:', result);
      return result;
    } catch (error) {
      logDebug('[useFilterTransformation] API format transformation error:', error);
      return {};
    }
  }, [filters, config.memoizeResults]);

  /**
   * Memoized URL parameters transformation
   */
  const urlParams = useMemo(() => {
    if (!config.enableUrlSync) return new URLSearchParams();

    try {
      const result = filterTransformService.toUrlParams(filters);
      logDebug('[useFilterTransformation] URL params transformed:', result.toString());
      return result;
    } catch (error) {
      logDebug('[useFilterTransformation] URL params transformation error:', error);
      return new URLSearchParams();
    }
  }, [filters, config.enableUrlSync]);

  /**
   * Memoized URL string for easy usage
   */
  const urlString = useMemo(() => {
    return urlParams.toString();
  }, [urlParams]);

  /**
   * Memoized serialized filters for storage
   */
  const serializedFilters = useMemo(() => {
    try {
      const result = filterTransformService.serialize(filters);
      logDebug('[useFilterTransformation] Filters serialized, length:', result.length);
      return result;
    } catch (error) {
      logDebug('[useFilterTransformation] Serialization error:', error);
      return '';
    }
  }, [filters]);

  /**
   * Transform filters to API format (callback version)
   */
  const transformToApi = useCallback((filtersToTransform = filters) => {
    return filterTransformService.toApiFormat(filtersToTransform);
  }, [filters]);

  /**
   * Transform filters to URL parameters (callback version)
   */
  const transformToUrl = useCallback((filtersToTransform = filters) => {
    return filterTransformService.toUrlParams(filtersToTransform);
  }, [filters]);

  /**
   * Transform URL parameters back to filters
   */
  const transformFromUrl = useCallback((urlParams) => {
    try {
      const result = filterTransformService.fromUrlParams(urlParams);
      logDebug('[useFilterTransformation] Transformed from URL:', result);
      return result;
    } catch (error) {
      logDebug('[useFilterTransformation] URL parsing error:', error);
      return {};
    }
  }, []);

  /**
   * Transform API response to internal format
   */
  const transformFromApi = useCallback((apiData) => {
    try {
      const result = filterTransformService.fromApiFormat(apiData);
      logDebug('[useFilterTransformation] Transformed from API:', result);
      return result;
    } catch (error) {
      logDebug('[useFilterTransformation] API parsing error:', error);
      return {};
    }
  }, []);

  /**
   * Deserialize filters from storage
   */
  const deserializeFilters = useCallback((serializedData) => {
    try {
      const result = filterTransformService.deserialize(serializedData);
      logDebug('[useFilterTransformation] Filters deserialized:', result);
      return result;
    } catch (error) {
      logDebug('[useFilterTransformation] Deserialization error:', error);
      return {};
    }
  }, []);

  /**
   * Validate transformation result
   */
  const validateTransform = useCallback((transformedData) => {
    if (!config.validateTransforms) {
      return { valid: true, errors: [], warnings: [] };
    }

    return filterTransformService.validate(transformedData);
  }, [config.validateTransforms]);

  /**
   * Get transformation metadata
   */
  const getTransformationMetadata = useCallback(() => {
    const apiKeys = Object.keys(apiFormat);
    const urlKeys = Array.from(urlParams.keys());
    const hasActiveFilters = apiKeys.length > 0;
    
    return {
      apiFieldCount: apiKeys.length,
      urlParamCount: urlKeys.length,
      hasActiveFilters,
      serializedSize: serializedFilters.length,
      apiKeys,
      urlKeys
    };
  }, [apiFormat, urlParams, serializedFilters]);

  /**
   * Create URL-safe filter object for sharing
   */
  const createShareableUrl = useCallback((baseUrl = '') => {
    const params = urlString;
    if (!params) return baseUrl;
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${params}`;
  }, [urlString]);

  /**
   * Create deep clone of current filters
   */
  const cloneFilters = useCallback(() => {
    try {
      // Use serialization/deserialization for deep clone
      const serialized = filterTransformService.serialize(filters);
      return filterTransformService.deserialize(serialized);
    } catch (error) {
      logDebug('[useFilterTransformation] Clone error, using JSON fallback:', error);
      return JSON.parse(JSON.stringify(filters));
    }
  }, [filters]);

  /**
   * Compare two filter objects for equality
   */
  const compareFilters = useCallback((filters1, filters2) => {
    try {
      const api1 = filterTransformService.toApiFormat(filters1);
      const api2 = filterTransformService.toApiFormat(filters2);
      
      return JSON.stringify(api1) === JSON.stringify(api2);
    } catch (error) {
      logDebug('[useFilterTransformation] Compare error:', error);
      return false;
    }
  }, []);

  /**
   * Get filter diff between two states
   */
  const getFilterDiff = useCallback((oldFilters, newFilters) => {
    const oldApi = filterTransformService.toApiFormat(oldFilters);
    const newApi = filterTransformService.toApiFormat(newFilters);
    
    const added = {};
    const changed = {};
    const removed = {};
    
    // Find added and changed
    Object.entries(newApi).forEach(([key, value]) => {
      if (!(key in oldApi)) {
        added[key] = value;
      } else if (JSON.stringify(oldApi[key]) !== JSON.stringify(value)) {
        changed[key] = { from: oldApi[key], to: value };
      }
    });
    
    // Find removed
    Object.entries(oldApi).forEach(([key, value]) => {
      if (!(key in newApi)) {
        removed[key] = value;
      }
    });
    
    return { added, changed, removed };
  }, []);

  /**
   * Performance metrics for transformations
   */
  const getPerformanceMetrics = useCallback(() => {
    const start = performance.now();
    
    // Test transformation performance
    filterTransformService.toApiFormat(filters);
    const apiTime = performance.now() - start;
    
    const urlStart = performance.now();
    filterTransformService.toUrlParams(filters);
    const urlTime = performance.now() - urlStart;
    
    const serializeStart = performance.now();
    filterTransformService.serialize(filters);
    const serializeTime = performance.now() - serializeStart;
    
    return {
      apiTransformTime: apiTime,
      urlTransformTime: urlTime,
      serializationTime: serializeTime,
      totalTime: apiTime + urlTime + serializeTime
    };
  }, [filters]);

  return {
    // Memoized transformations
    apiFormat,
    urlParams,
    urlString,
    serializedFilters,
    
    // Transformation functions
    transformToApi,
    transformToUrl,
    transformFromUrl,
    transformFromApi,
    deserializeFilters,
    
    // Utility functions
    validateTransform,
    getTransformationMetadata,
    createShareableUrl,
    cloneFilters,
    compareFilters,
    getFilterDiff,
    getPerformanceMetrics,
    
    // Convenience properties
    hasActiveFilters: Object.keys(apiFormat).length > 0,
    isEmpty: Object.keys(apiFormat).length === 0
  };
} 