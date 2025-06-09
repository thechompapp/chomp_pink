/**
 * Filter Services - Phase 2: Service Layer Consolidation
 * 
 * Primary Export: Unified FilterService for all new implementations
 * Legacy Support: Individual services for backward compatibility
 * Migration Path: Gradual transition to unified service
 */

// === PHASE 2: UNIFIED SERVICE (Primary) ===
export { filterService as unifiedFilterService, FilterService } from './FilterService';

// === LEGACY SERVICES (Backward Compatibility) ===
import { filterDataService } from './FilterDataService';
import { filterCacheService } from './FilterCacheService';
import { filterTransformService } from './FilterTransformService';
import { apiTransformer } from './ApiTransformer';
import { urlTransformer } from './UrlTransformer';
import { FilterTransformService } from './FilterTransformService';

// Get the unified service instance
import { filterService as unifiedInstance } from './FilterService';

// Individual service exports
export { filterDataService } from './FilterDataService';
export { filterCacheService } from './FilterCacheService';
export { filterTransformService } from './FilterTransformService';
export { apiTransformer } from './ApiTransformer';
export { urlTransformer } from './UrlTransformer';
export { FilterTransformService } from './FilterTransformService';

// === CONVENIENCE EXPORTS ===

// New recommended approach - use unified service
export const filterServices = {
  unified: unifiedInstance, // Phase 2: Primary service
  
  // Legacy services for backward compatibility
  data: filterDataService,
  cache: filterCacheService,
  transform: filterTransformService,
  api: apiTransformer,
  url: urlTransformer
};

// === MIGRATION HELPER ===

/**
 * Legacy filterService object for backward compatibility
 * @deprecated Use unifiedFilterService instead
 */
export const filterService = {
  // Data fetching - now delegated to unified service
  getCities: (options) => unifiedInstance.getCities(options),
  getBoroughs: (cityId) => unifiedInstance.getBoroughs(cityId),
  getNeighborhoods: (boroughId) => unifiedInstance.getNeighborhoods(boroughId),
  getCuisines: (searchTerm, limit) => unifiedInstance.getCuisines(searchTerm, limit),
  
  // New parallel data fetching
  getAllFilterData: (options) => unifiedInstance.getAllFilterData(options),
  
  // Transformations - now delegated to unified service
  transformFiltersForApi: (filters) => unifiedInstance.transformToApi(filters),
  transformFromApi: (apiData) => unifiedInstance.transformFromApi(apiData),
  transformToUrl: (filters) => unifiedInstance.transformToUrl(filters),
  transformFromUrl: (urlParams) => unifiedInstance.transformFromUrl(urlParams),
  
  // Enhanced validation (delegated to legacy service for now)
  validateFilters: (filters) => FilterTransformService.validate(filters),
  
  // Cache control - now via unified service
  clearCache: (types = 'all') => unifiedInstance.clearCache(types),
  warmCache: (options) => unifiedInstance.warmCache(options),
  
  // Statistics and monitoring - enhanced with unified service
  getStats: () => ({
    // Legacy cache stats
    cache: filterCacheService.getStats(),
    data: filterDataService.getCacheStats(),
    
    // New unified service performance metrics
    unified: unifiedInstance.getPerformanceMetrics()
  }),
  
  // New performance features
  getPerformanceMetrics: () => unifiedInstance.getPerformanceMetrics(),
  resetMetrics: () => unifiedInstance.resetMetrics()
};

// === DEFAULT EXPORTS ===

// For new implementations: use unified service
export default unifiedInstance; 