/**
 * Filter Services - Central Export Module
 * 
 * This module provides centralized access to all filter-related services
 * following the Single Responsibility Principle.
 * 
 * Services:
 * - FilterDataService: Centralized API data fetching
 * - FilterCacheService: Optimized data caching
 * - FilterTransformService: Data transformation logic
 */

// Import all services
import { filterDataService, FilterDataService } from './FilterDataService';
import { filterCacheService, FilterCacheService } from './FilterCacheService';
import { filterTransformService, FilterTransformService, FILTER_TYPES } from './FilterTransformService';

// Export service instances (for common usage)
export {
  filterDataService,
  filterCacheService,
  filterTransformService
};

// Export service classes (for testing and custom instances)
export {
  FilterDataService,
  FilterCacheService,
  FilterTransformService
};

// Export constants
export { FILTER_TYPES };

// Export combined service interface for convenience
export const filterServices = {
  data: filterDataService,
  cache: filterCacheService,
  transform: filterTransformService
};

// Backward compatibility - maintain existing API
export const filterService = {
  // Legacy API methods that delegate to new services
  getCities: (options) => filterDataService.getCities(options),
  getBoroughs: (cityId) => filterDataService.getBoroughs(cityId),
  getNeighborhoods: (boroughId) => filterDataService.getNeighborhoods(boroughId),
  getCuisines: (searchTerm, limit) => filterDataService.getCuisines(searchTerm, limit),
  
  // Enhanced methods from transform service
  transformFiltersForApi: (filters) => filterTransformService.toApiFormat(filters),
  validateFilters: (filters) => filterTransformService.validate(filters),
  
  // Cache control methods
  clearCache: () => {
    filterDataService.clearCache();
    filterCacheService.clear();
    filterTransformService.clearCache();
  },
  
  // Statistics and monitoring
  getStats: () => ({
    cache: filterCacheService.getStats(),
    data: filterDataService.getCacheStats()
  })
}; 