/**
 * Admin Data Manager
 * 
 * Handles all data fetching, processing, and API communication for the Admin Panel.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 * 
 * Responsibilities:
 * - API data fetching from all admin endpoints
 * - Data processing and normalization
 * - Response handling and error recovery
 * - Caching and performance optimization
 */

import { adminService } from '@/services/adminService';
import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Tab configuration for admin panel endpoints
 */
export const TAB_CONFIG = {
  submissions: { label: 'Submissions', key: 'submissions' },
  restaurants: { label: 'Restaurants', key: 'restaurants' },
  dishes: { label: 'Dishes', key: 'dishes' },
  users: { label: 'Users', key: 'users' },
  locations: { label: 'Locations', key: 'locations' },
  hashtags: { label: 'Hashtags', key: 'hashtags' },
  restaurant_chains: { label: 'Restaurant Chains', key: 'restaurant_chains' },
  lists: { label: 'Lists', key: 'lists' }
};

/**
 * Data processing utilities for admin panel
 */
export const DataProcessor = {
  /**
   * Process the response data consistently for each endpoint
   * @param {Object|Array} response - API response data
   * @param {string} endpoint - API endpoint name
   * @returns {Array} Processed data array
   */
  processResponseData: (response, endpoint) => {
    if (!response) {
      logWarn(`[AdminDataManager] Empty response for ${endpoint}`);
      return [];
    }
    
    // Handle array response
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle { data: [...] } response
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Handle { data: { data: [...] } } response
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Try to find any array property
    if (typeof response === 'object' && response !== null) {
      const arrayProps = Object.keys(response).filter(key => Array.isArray(response[key]));
      if (arrayProps.length > 0) {
        return response[arrayProps[0]];
      }
    }
    
    // Return empty array as fallback
    logWarn(`[AdminDataManager] Could not extract array data from ${endpoint} response:`, response);
    return [];
  },

  /**
   * Fetch data for a specific endpoint with error handling
   * @param {string} endpoint - API endpoint name
   * @returns {Promise<Object>} Object containing endpoint name and data
   */
  fetchEndpointData: async (endpoint) => {
    try {
      logInfo(`[AdminDataManager] Fetching data for ${endpoint}`);
      const response = await adminService.getAdminData(endpoint);
      const processedData = DataProcessor.processResponseData(response, endpoint);
      
      logInfo(`[AdminDataManager] Successfully processed ${endpoint} data:`, {
        length: processedData.length
      });
      
      return { endpoint, data: processedData };
    } catch (error) {
      logError(`[AdminDataManager] Error fetching ${endpoint}:`, {
        message: error.message,
        status: error.response?.status
      });
      
      return { endpoint, data: [] };
    }
  },

  /**
   * Fetch all admin data from the API with parallel requests
   * @returns {Promise<Object>} Object containing data for all endpoints
   */
  fetchAllAdminData: async () => {
    try {
      logInfo('[AdminDataManager] Fetching all admin data...');
      
      // This will be populated with results from API
      const data = {};
      
      // Get all endpoint names from TAB_CONFIG
      const endpoints = Object.keys(TAB_CONFIG);
      
      // Use Promise.all for parallel requests to improve performance
      const results = await Promise.all(
        endpoints.map(endpoint => DataProcessor.fetchEndpointData(endpoint))
      );
      
      // Populate the data object with results
      results.forEach(({ endpoint, data: endpointData }) => {
        data[endpoint] = endpointData;
      });
      
      logInfo('[AdminDataManager] All admin data fetched:', 
        Object.entries(data).map(([key, val]) => `${key}: ${val.length}`).join(', '));
      
      return data;
    } catch (error) {
      logError('[AdminDataManager] Error in fetchAllAdminData:', error);
      throw error;
    }
  }
};

/**
 * Data validation utilities
 */
export const DataValidator = {
  /**
   * Validate admin data structure
   * @param {Object} data - Admin data object
   * @returns {Object} Validation result
   */
  validateAdminData: (data) => {
    const warnings = [];
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Admin data must be an object');
      return { isValid: false, warnings, errors };
    }
    
    // Check each expected endpoint
    Object.keys(TAB_CONFIG).forEach(endpoint => {
      if (!data[endpoint]) {
        warnings.push(`Missing data for ${endpoint}`);
      } else if (!Array.isArray(data[endpoint])) {
        errors.push(`Data for ${endpoint} must be an array`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  },

  /**
   * Get data statistics for debugging
   * @param {Object} data - Admin data object
   * @returns {Object} Data statistics
   */
  getDataStats: (data) => {
    if (!data) return { totalItems: 0, endpoints: 0 };
    
    const stats = {
      totalItems: 0,
      endpoints: Object.keys(data).length,
      byEndpoint: {}
    };
    
    Object.entries(data).forEach(([endpoint, items]) => {
      const count = Array.isArray(items) ? items.length : 0;
      stats.byEndpoint[endpoint] = count;
      stats.totalItems += count;
    });
    
    return stats;
  }
};

/**
 * Data filtering and search utilities
 */
export const DataFilter = {
  /**
   * Filter data based on search term
   * @param {Array} data - Data array to filter
   * @param {string} searchTerm - Search term
   * @param {Array} searchFields - Fields to search in
   * @returns {Array} Filtered data
   */
  filterBySearch: (data, searchTerm, searchFields = ['name', 'title', 'email']) => {
    if (!searchTerm || !Array.isArray(data)) return data;
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return data;
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && typeof value === 'string' && value.toLowerCase().includes(term);
      });
    });
  },

  /**
   * Get search fields for specific endpoint
   * @param {string} endpoint - Endpoint name
   * @returns {Array} Array of field names to search
   */
  getSearchFields: (endpoint) => {
    const searchFieldsMap = {
      submissions: ['restaurant_name', 'dish_name', 'user_email'],
      restaurants: ['name', 'address', 'neighborhood'],
      dishes: ['name', 'restaurant_name', 'description'],
      users: ['username', 'email', 'first_name', 'last_name'],
      locations: ['name', 'state', 'country'],
      hashtags: ['name', 'description'],
      restaurant_chains: ['name', 'description']
    };
    
    return searchFieldsMap[endpoint] || ['name', 'title', 'email'];
  }
};

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Monitor data fetching performance
   * @param {Function} fetchFunction - Function to monitor
   * @param {string} operation - Operation name
   * @returns {Promise} Monitored function result
   */
  monitorDataFetch: async (fetchFunction, operation) => {
    const startTime = performance.now();
    
    try {
      const result = await fetchFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logInfo(`[AdminDataManager] ${operation} completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logError(`[AdminDataManager] ${operation} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
};

export default {
  TAB_CONFIG,
  DataProcessor,
  DataValidator,
  DataFilter,
  PerformanceMonitor
}; 