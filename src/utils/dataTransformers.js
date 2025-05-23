/* src/utils/dataTransformers.js */
/**
 * Data transformation utilities for standardized data handling across services.
 * This module provides consistent normalization and extraction functions for
 * different data types, reducing code duplication and improving maintainability.
 */
import { logWarn, logDebug } from '@/utils/logger.js';

/**
 * Normalizes hashtag data to ensure consistent format
 * @param {Object} item - Raw hashtag item from API
 * @returns {Object} - Normalized hashtag object
 */
export const normalizeHashtag = (item) => {
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
 * Normalizes filter data to ensure consistent format
 * @param {Object} filter - Raw filter item from API
 * @returns {Object} - Normalized filter object
 */
export const normalizeFilter = (filter) => {
  if (!filter || typeof filter !== 'object') {
    return { id: null, name: '', type: '', count: 0 };
  }
  return {
    id: filter.id || null,
    name: filter.name || filter.value || '',
    type: filter.type || filter.category || '',
    count: parseInt(filter.count, 10) || 0,
    // Preserve any additional properties that might be needed
    ...Object.entries(filter)
      .filter(([key]) => !['id', 'name', 'value', 'type', 'category', 'count'].includes(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  };
};

/**
 * Extracts and normalizes data from various API response formats
 * @param {Object|Array} response - API response
 * @param {string} dataType - Type of data to extract ('hashtags', 'filters', etc.)
 * @returns {Array} - Extracted and normalized data array
 */
export const extractData = (response, dataType) => {
  // Extract data array from response
  let rawData = [];
  
  if (Array.isArray(response)) {
    rawData = response;
  } else if (response && typeof response === 'object') {
    if (Array.isArray(response.data)) {
      rawData = response.data;
    } else if (response.data && Array.isArray(response.data[dataType])) {
      rawData = response.data[dataType];
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      // Handle paginated results format
      rawData = response.data.results;
    }
  }
  
  if (rawData.length === 0) {
    logWarn(`[DataTransformer] Could not extract ${dataType} from response:`, response);
  }
  
  // Apply appropriate normalizer based on data type
  switch (dataType) {
    case 'hashtags':
      return rawData.map(normalizeHashtag);
    case 'filters':
      return rawData.map(normalizeFilter);
    default:
      return rawData;
  }
};

/**
 * Transforms filter parameters for API requests
 * @param {Object} filters - Filter object from FilterContext
 * @returns {Object} - Transformed filter parameters for API
 */
export const transformFiltersForApi = (filters) => {
  if (!filters || typeof filters !== 'object') {
    return {};
  }

  const apiParams = {};
  
  // Process each filter type
  Object.entries(filters).forEach(([key, value]) => {
    // Skip empty filters
    if (value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      return;
    }
    
    // Handle array filters (like hashtags, cuisines)
    if (Array.isArray(value)) {
      // If only one value, send as string to avoid unnecessary array parameter
      if (value.length === 1) {
        apiParams[key] = value[0];
      } else {
        apiParams[key] = value.join(',');
      }
    } 
    // Handle range filters (like price)
    else if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
      if (value.min !== undefined) apiParams[`${key}_min`] = value.min;
      if (value.max !== undefined) apiParams[`${key}_max`] = value.max;
    }
    // Handle simple value filters
    else if (value !== '') {
      apiParams[key] = value;
    }
  });
  
  logDebug('[DataTransformer] Transformed filters for API:', apiParams);
  return apiParams;
};

/**
 * Compares two filter objects to determine if they are equivalent
 * @param {Object} filtersA - First filter object
 * @param {Object} filtersB - Second filter object
 * @returns {boolean} - True if filters are equivalent
 */
export const areFiltersEqual = (filtersA, filtersB) => {
  if (!filtersA || !filtersB) return filtersA === filtersB;
  
  const keysA = Object.keys(filtersA);
  const keysB = Object.keys(filtersB);
  
  // Different number of keys means different filters
  if (keysA.length !== keysB.length) return false;
  
  // Check each key
  return keysA.every(key => {
    const valueA = filtersA[key];
    const valueB = filtersB[key];
    
    // Different types means different values
    if (typeof valueA !== typeof valueB) return false;
    
    // Handle arrays (like hashtags)
    if (Array.isArray(valueA) && Array.isArray(valueB)) {
      if (valueA.length !== valueB.length) return false;
      return valueA.every((item, index) => item === valueB[index]);
    }
    
    // Handle range objects
    if (typeof valueA === 'object' && valueA !== null && 
        typeof valueB === 'object' && valueB !== null) {
      return JSON.stringify(valueA) === JSON.stringify(valueB);
    }
    
    // Simple value comparison
    return valueA === valueB;
  });
};
