/**
 * Filter Services - Focused Service Exports
 * 
 * Refactored services following Single Responsibility Principle:
 * - ApiTransformer: API format conversion only
 * - UrlTransformer: URL parameter handling only  
 * - FilterDataService: Data fetching only
 * - FilterCacheService: Caching only
 */

// Import services first
import { filterDataService } from './FilterDataService';
import { filterCacheService } from './FilterCacheService';
import { filterTransformService } from './FilterTransformService';
import { apiTransformer } from './ApiTransformer';
import { urlTransformer } from './UrlTransformer';
import { FilterTransformService } from './FilterTransformService';

// Core services exports
export { filterDataService } from './FilterDataService';
export { filterCacheService } from './FilterCacheService';
export { filterTransformService } from './FilterTransformService';

// New focused transformation services
export { apiTransformer } from './ApiTransformer';
export { urlTransformer } from './UrlTransformer';

// Backward compatibility - legacy FilterTransformService still available
export { FilterTransformService } from './FilterTransformService';

// Convenience exports
export const filterServices = {
  data: filterDataService,
  cache: filterCacheService,
  transform: filterTransformService,
  api: apiTransformer,
  url: urlTransformer
};

// Backward compatibility - maintain existing API
export const filterService = {
  // Legacy API methods that delegate to new services
  getCities: (options) => filterDataService.getCities(options),
  getBoroughs: (cityId) => filterDataService.getBoroughs(cityId),
  getNeighborhoods: (boroughId) => filterDataService.getNeighborhoods(boroughId),
  getCuisines: (searchTerm, limit) => filterDataService.getCuisines(searchTerm, limit),
  
  // Enhanced methods from transform service
  transformFiltersForApi: (filters) => FilterTransformService.toApiFormat(filters),
  validateFilters: (filters) => FilterTransformService.validate(filters),
  
  // Cache control methods
  clearCache: () => {
    filterDataService.clearCache();
    filterCacheService.clear();
    FilterTransformService.clearCache();
  },
  
  // Statistics and monitoring
  getStats: () => ({
    cache: filterCacheService.getStats(),
    data: filterDataService.getCacheStats()
  })
}; 