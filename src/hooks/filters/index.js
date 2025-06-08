/**
 * Filter Hooks - Central Export Module
 * 
 * This module provides centralized access to all filter-related React hooks
 * following the Single Responsibility Principle.
 * 
 * Hooks:
 * - useFilterState: Core filter state management
 * - useFilterData: Data fetching & caching coordination
 * - useFilterValidation: Filter validation logic
 * - useFilterTransformation: Data transformation hooks
 * - useFilterPersistence: Persistence handling
 */

// Import all hooks
export { useFilterState } from './useFilterState';
export { useFilterData } from './useFilterData';
export { useFilterValidation } from './useFilterValidation';
export { useFilterTransformation } from './useFilterTransformation';
export { useFilterPersistence } from './useFilterPersistence';

// Combined hook for convenience (follows composition pattern)
import { useFilterState } from './useFilterState';
import { useFilterData } from './useFilterData';
import { useFilterValidation } from './useFilterValidation';
import { useFilterTransformation } from './useFilterTransformation';
import { useFilterPersistence } from './useFilterPersistence';

/**
 * useFilters - Comprehensive filter management hook
 * 
 * Combines all filter hooks into a single, convenient interface while
 * maintaining separation of concerns. Each hook can still be used independently.
 * 
 * @param {Object} initialFilters - Initial filter values
 * @param {Object} options - Configuration options for all hooks
 * @returns {Object} Combined filter state and functions
 */
export function useFilters(initialFilters = {}, options = {}) {
  const {
    state: stateOptions = {},
    data: dataOptions = {},
    validation: validationOptions = {},
    transformation: transformationOptions = {},
    persistence: persistenceOptions = {}
  } = options;

  // Core filter state management
  const filterState = useFilterState(initialFilters, stateOptions);

  // Data fetching and caching
  const filterData = useFilterData(filterState.filters, dataOptions);

  // Validation logic
  const filterValidation = useFilterValidation(
    filterState.filters, 
    filterData.data, 
    validationOptions
  );

  // Data transformation
  const filterTransformation = useFilterTransformation(
    filterState.filters, 
    transformationOptions
  );

  // Persistence handling
  const filterPersistence = useFilterPersistence(
    filterState.filters,
    filterState.updateFilters, // Auto-restore callback
    persistenceOptions
  );

  return {
    // State management
    filters: filterState.filters,
    updateFilters: filterState.updateFilters,
    updateFilter: filterState.updateFilter,
    clearFilter: filterState.clearFilter,
    clearAllFilters: filterState.clearAllFilters,
    resetFilters: filterState.resetFilters,
    hasActiveFilters: filterState.hasActiveFilters,
    
    // Data fetching
    data: filterData.data,
    loading: filterData.loading,
    errors: filterData.errors,
    isLoading: filterData.isLoading,
    hasErrors: filterData.hasErrors,
    fetchCities: filterData.fetchCities,
    fetchBoroughs: filterData.fetchBoroughs,
    fetchNeighborhoods: filterData.fetchNeighborhoods,
    fetchCuisines: filterData.fetchCuisines,
    refreshAll: filterData.refreshAll,
    
    // Validation
    isValid: filterValidation.isValid,
    validationState: filterValidation.validationState,
    hasFieldErrors: filterValidation.hasFieldErrors,
    getFieldErrorMessage: filterValidation.getFieldErrorMessage,
    validateAllFilters: filterValidation.validateAllFilters,
    canSubmit: filterValidation.canSubmit,
    
    // Transformation
    apiFormat: filterTransformation.apiFormat,
    urlParams: filterTransformation.urlParams,
    urlString: filterTransformation.urlString,
    createShareableUrl: filterTransformation.createShareableUrl,
    
    // Persistence
    saveToStorage: filterPersistence.saveToStorage,
    loadFromStorage: filterPersistence.loadFromStorage,
    history: filterPersistence.history,
    goBack: filterPersistence.goBack,
    goForward: filterPersistence.goForward,
    canGoBack: filterPersistence.canGoBack,
    canGoForward: filterPersistence.canGoForward,
    isLoaded: filterPersistence.isLoaded,
    
    // Advanced utilities
    getChangesSummary: filterState.getChangesSummary,
    getCacheStats: filterData.getCacheStats,
    getTransformationMetadata: filterTransformation.getTransformationMetadata,
    getPersistenceStats: filterPersistence.getPersistenceStats
  };
}

// Export convenience object for destructured imports
export const filterHooks = {
  useFilterState,
  useFilterData,
  useFilterValidation,
  useFilterTransformation,
  useFilterPersistence,
  useFilters
}; 