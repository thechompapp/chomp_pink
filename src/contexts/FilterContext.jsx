import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useFilterStore, FILTER_TYPES } from '@/stores/useFilterStore';
import { logDebug, logWarn } from '@/utils/logger';

// Inline the transformer functions until we fully integrate the utility
// This prevents import errors if the dataTransformers.js file is not yet available
const transformFiltersForApi = (filters) => {
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
  
  logDebug('[FilterContext] Transformed filters for API:', apiParams);
  return apiParams;
};

const areFiltersEqual = (filtersA, filtersB) => {
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

// Create context
const FilterContext = createContext({});

/**
 * Enhanced FilterProvider component with improved performance and data handling
 * - Uses memoization to prevent unnecessary re-renders
 * - Implements debouncing for filter changes to reduce API calls
 * - Properly handles filter initialization and updates
 */
export const FilterProvider = ({ children, onChange, initialFilters = {}, debounceMs = 300 }) => {
  const { 
    filters, 
    setFilter, 
    toggleArrayFilter, 
    clearFilters, 
    hasActiveFilters,
    getActiveFilterCount 
  } = useFilterStore();
  
  // Track if initial filters have been applied
  const [initialFiltersApplied, setInitialFiltersApplied] = React.useState(false);
  
  // Store previous filters for comparison to avoid unnecessary updates
  const [prevTransformedFilters, setPrevTransformedFilters] = React.useState(null);
  
  // Debounce timer reference
  const debounceTimerRef = React.useRef(null);
  
  // Initialize filters with provided initial values if available
  useEffect(() => {
    if (!initialFiltersApplied && Object.keys(initialFilters).length > 0) {
      logDebug('[FilterContext] Initializing filters:', initialFilters);
      
      // Set each filter that has a non-null/undefined value
      Object.entries(initialFilters).forEach(([type, value]) => {
        if (value !== null && value !== undefined) {
          try {
            if (type === 'hashtags' && Array.isArray(value)) {
              // Special handling for hashtags -> cuisines mapping
              value.forEach(tag => {
                toggleArrayFilter(FILTER_TYPES.CUISINE, tag);
              });
            } else if (type === 'cityId') {
              setFilter(FILTER_TYPES.CITY, value);
            } else if (type === 'neighborhoodId') {
              setFilter(FILTER_TYPES.NEIGHBORHOOD, value);
            } else if (type === 'boroughId') {
              setFilter(FILTER_TYPES.BOROUGH, value);
            }
          } catch (error) {
            logWarn(`[FilterContext] Error setting initial filter ${type}:`, error);
          }
        }
      });
      
      setInitialFiltersApplied(true);
    }
  }, [initialFilters, initialFiltersApplied, setFilter, toggleArrayFilter]);
  
  // Transform current filters to the format expected by API
  const transformedFilters = useMemo(() => {
    // Map internal filter structure to API-expected format
    const apiFilters = {
      cityId: filters[FILTER_TYPES.CITY],
      boroughId: filters[FILTER_TYPES.BOROUGH],
      neighborhoodId: filters[FILTER_TYPES.NEIGHBORHOOD],
      hashtags: filters[FILTER_TYPES.CUISINE] || [],
    };
    
    // Apply additional transformations if needed
    return transformFiltersForApi(apiFilters);
  }, [filters]);
  
  // Callback for when filters change that can be passed to parent components
  const handleFiltersChange = useCallback((transformedFilters) => {
    if (!onChange) return;
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Skip if filters haven't changed
    if (prevTransformedFilters && areFiltersEqual(transformedFilters, prevTransformedFilters)) {
      return;
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      logDebug('[FilterContext] Filters changed:', transformedFilters);
      onChange(transformedFilters);
      setPrevTransformedFilters(transformedFilters);
      debounceTimerRef.current = null;
    }, debounceMs);
  }, [onChange, prevTransformedFilters, debounceMs]);
  
  // Effect to call onChange when filters change
  useEffect(() => {
    if (initialFiltersApplied) { // Only trigger changes after initial filters are applied
      handleFiltersChange(transformedFilters);
    }
    
    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transformedFilters, handleFiltersChange, initialFiltersApplied]);
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    filters,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    activeFilterCount: getActiveFilterCount(),
    transformedFilters, // Expose transformed filters for direct API use
  }), [filters, setFilter, toggleArrayFilter, clearFilters, hasActiveFilters, getActiveFilterCount, transformedFilters]);
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to use filter context
export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

// Export filter types for convenience
export { FILTER_TYPES };