/**
 * useFilters.js - Unified Filter Hook
 * 
 * Single hook that provides all filtering functionality:
 * - State management via enhanced Zustand store
 * - Data fetching with automatic dependencies and parallel loading
 * - API format transformation
 * - Debounced change callbacks
 * - Error handling and loading states
 */

import { useEffect, useCallback, useRef } from 'react';
import { useFilterStore, FILTER_TYPES } from '@/stores/useFilterStore';
import { logDebug } from '@/utils/logger';

/**
 * Unified filters hook
 * @param {Object} initialFilters - Initial filter values
 * @param {Object} options - Configuration options
 * @param {Function} options.onChange - Callback when filters change (debounced)
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {boolean} options.autoFetch - Whether to automatically fetch initial data
 * @param {boolean} options.useParallelFetching - Whether to use parallel data fetching
 * @returns {Object} Filter state and actions
 */
export const useFilters = (initialFilters = {}, options = {}) => {
  const {
    onChange,
    debounceMs = 300,
    autoFetch = true,
    useParallelFetching = true
  } = options;

  // Get all state and actions from the enhanced store
  const {
    filters,
    data,
    loading,
    errors,
    hasActiveFilters,
    getActiveFilterCount,
    getApiFormat,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    fetchCities,
    fetchBoroughs,
    fetchNeighborhoods,
    fetchCuisines,
    fetchAllFilterData,
    initializeData
  } = useFilterStore();

  // Refs for managing debounced callbacks and initialization
  const debounceTimerRef = useRef(null);
  const initializedRef = useRef(false);
  const prevApiFormatRef = useRef(null);

  // Initialize filters if provided
  useEffect(() => {
    if (!initializedRef.current && Object.keys(initialFilters).length > 0) {
      logDebug('[useFilters] Initializing with filters:', initialFilters);
      
      Object.entries(initialFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          setFilter(key, value);
        }
      });
      
      initializedRef.current = true;
    }
  }, [initialFilters, setFilter]);

  // Auto-fetch initial data with parallel fetching option
  useEffect(() => {
    if (autoFetch && !initializedRef.current) {
      if (useParallelFetching) {
        // Use the new parallel fetching capability
        const fetchOptions = {};
        
        // Include dependencies if we have them in initial filters
        if (initialFilters.city) {
          fetchOptions.cityId = initialFilters.city;
        }
        if (initialFilters.borough) {
          fetchOptions.boroughId = initialFilters.borough;
        }
        
        fetchAllFilterData(fetchOptions);
      } else {
        // Fallback to sequential initialization
        initializeData();
      }
      
      initializedRef.current = true;
    }
  }, [autoFetch, useParallelFetching, initialFilters, fetchAllFilterData, initializeData]);

  // Auto-fetch dependent data when parent filters change (if not using parallel fetching)
  useEffect(() => {
    if (!useParallelFetching && filters.city) {
      fetchBoroughs(filters.city);
    }
  }, [filters.city, fetchBoroughs, useParallelFetching]);

  useEffect(() => {
    if (!useParallelFetching && filters.borough) {
      fetchNeighborhoods(filters.borough);
    }
  }, [filters.borough, fetchNeighborhoods, useParallelFetching]);

  // Debounced change handler
  const handleFiltersChange = useCallback(() => {
    if (!onChange) return;

    const currentApiFormat = getApiFormat();
    
    // Skip if API format hasn't changed
    const currentApiString = JSON.stringify(currentApiFormat);
    const prevApiString = JSON.stringify(prevApiFormatRef.current);
    
    if (currentApiString === prevApiString) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      logDebug('[useFilters] Filters changed, calling onChange:', currentApiFormat);
      onChange(currentApiFormat);
      prevApiFormatRef.current = currentApiFormat;
      debounceTimerRef.current = null;
    }, debounceMs);
  }, [onChange, getApiFormat, debounceMs]);

  // Trigger change handler when filters change
  useEffect(() => {
    if (initializedRef.current) {
      handleFiltersChange();
    }

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, handleFiltersChange]);

  // Enhanced action creators with validation and smart dependency fetching
  const enhancedSetFilter = useCallback((type, value) => {
    if (!Object.values(FILTER_TYPES).includes(type)) {
      logDebug(`[useFilters] Warning: Unknown filter type "${type}"`);
    }
    
    setFilter(type, value);
    
    // Trigger parallel fetching of dependent data if enabled
    if (useParallelFetching) {
      if (type === FILTER_TYPES.CITY && value) {
        fetchBoroughs(value);
      } else if (type === FILTER_TYPES.BOROUGH && value) {
        fetchNeighborhoods(value);
      }
    }
  }, [setFilter, useParallelFetching, fetchBoroughs, fetchNeighborhoods]);

  const enhancedToggleArrayFilter = useCallback((type, item) => {
    if (!Object.values(FILTER_TYPES).includes(type)) {
      logDebug(`[useFilters] Warning: Unknown filter type "${type}"`);
    }
    toggleArrayFilter(type, item);
  }, [toggleArrayFilter]);

  // Utility functions
  const isLoading = Object.values(loading).some(Boolean);
  const hasErrors = Object.values(errors).some(Boolean);
  const apiFormat = getApiFormat();

  // Enhanced refetch with parallel option
  const refetchData = useCallback(async (options = {}) => {
    if (useParallelFetching) {
      return await fetchAllFilterData({
        cityId: filters.city,
        boroughId: filters.borough,
        ...options
      });
    } else {
      return await initializeData();
    }
  }, [useParallelFetching, fetchAllFilterData, initializeData, filters.city, filters.borough]);

  return {
    // === CORE STATE ===
    filters,
    data,
    loading,
    errors,
    
    // === COMPUTED STATE ===
    hasActiveFilters: hasActiveFilters(),
    activeFilterCount: getActiveFilterCount(),
    apiFormat,
    isLoading,
    hasErrors,
    
    // === ACTIONS ===
    setFilter: enhancedSetFilter,
    toggleFilter: enhancedToggleArrayFilter,
    clearFilter: (type) => clearFilters(type),
    clearAllFilters: () => clearFilters(),
    
    // === DATA FETCHING ===
    fetchCities,
    fetchBoroughs,
    fetchNeighborhoods,
    fetchCuisines,
    fetchAllFilterData,
    refetchData,
    
    // === UTILITIES ===
    reset: () => {
      clearFilters();
      refetchData();
    }
  };
};

export default useFilters; 