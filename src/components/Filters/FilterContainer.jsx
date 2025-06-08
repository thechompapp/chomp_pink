/**
 * FilterContainer.jsx - Refactored for Phase 3
 * 
 * Single Responsibility: Filter UI orchestration and coordination
 * - Uses Phase 2 hooks for simplified state management
 * - Orchestrates child filter components
 * - Handles filter change propagation
 * - Maintains clean separation of concerns
 */

import React from 'react';
import { useFilters } from '@/hooks/filters';
import FilterBar from './FilterBar';
import NeighborhoodFilter from './NeighborhoodFilter';
import CuisineFilter from './CuisineFilter';
import FilterControls from './FilterControls';
import FilterValidationDisplay from './FilterValidationDisplay';
import { logDebug } from '@/utils/logger';

/**
 * FilterContainer component - Simplified orchestration using Phase 2 hooks
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onChange - Callback when filters change (API format)
 * @param {Object} props.initialFilters - Initial filter values
 * @param {boolean} props.showNeighborhoodFilter - Whether to show the neighborhood filter
 * @param {boolean} props.showCuisineFilter - Whether to show the cuisine filter
 * @param {boolean} props.showFilterControls - Whether to show filter controls (clear, reset, etc.)
 * @param {boolean} props.showValidation - Whether to show validation messages
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.options - Configuration options for filter hooks
 */
const FilterContainer = ({ 
  onChange,
  initialFilters = {},
  showNeighborhoodFilter = true,
  showCuisineFilter = true,
  showFilterControls = true,
  showValidation = true,
  className = "",
  options = {}
}) => {
  // Use the composite filter hook for complete functionality
  const filterSystem = useFilters(initialFilters, {
    state: {
      validateOnUpdate: true,
      debounceMs: 300,
      onStateChange: (filters, validation) => {
        logDebug('[FilterContainer] Filter state changed:', { filters, validation });
        
        // Call parent callback with API-formatted filters
        if (onChange && validation.isValid) {
          const apiFilters = filterSystem.apiFormat;
          onChange(apiFilters);
        }
      }
    },
    data: {
      enableCaching: true,
      autoFetch: true,
      retryOnError: true
    },
    validation: {
      validateOnChange: true,
      businessRules: true,
      crossFieldValidation: true
    },
    transformation: {
      memoizeResults: true,
      enableUrlSync: true
    },
    persistence: {
      storageType: 'localStorage',
      enableHistory: true,
      enableUrlSync: true,
      autoRestore: true
    },
    ...options
  });

  const {
    filters,
    isValid,
    hasActiveFilters,
    data,
    loading,
    errors,
    validationState
  } = filterSystem;

  // Debug logging to track what's being passed to components
  React.useEffect(() => {
    console.log('[FilterContainer] Debug - Loading states:', JSON.stringify(loading, null, 2));
    console.log('[FilterContainer] Debug - Data:', {
      cities: data.cities?.length || 0,
      cuisines: data.cuisines?.length || 0,
      boroughs: data.boroughs?.length || 0,
      neighborhoods: data.neighborhoods?.length || 0
    });
    console.log('[FilterContainer] Debug - Errors:', JSON.stringify(errors, null, 2));
    console.log('[FilterContainer] Debug - Loading object reference changed:', {
      cities: loading.cities,
      cuisines: loading.cuisines,
      timestamp: new Date().toISOString()
    });
  }, [loading, data, errors]);

  return (
    <div className={`bg-white border border-black rounded-lg p-4 space-y-4 ${className}`}>
      {/* Validation Display */}
      {showValidation && (
        <FilterValidationDisplay 
          validationState={validationState}
          isValid={isValid}
        />
      )}

      {/* Main Filter Bar */}
      <FilterBar filterSystem={filterSystem}>
        {/* Location Filters */}
        {showNeighborhoodFilter && (
          <NeighborhoodFilter 
            filterSystem={filterSystem}
            cities={data.cities}
            boroughs={data.boroughs}
            neighborhoods={data.neighborhoods}
            loading={loading}
            errors={errors}
          />
        )}
        
        {/* Cuisine Filters */}
        {showCuisineFilter && (
          <CuisineFilter 
            filterSystem={filterSystem}
            cuisines={data.cuisines}
            loading={loading.cuisines}
            error={errors.cuisines}
          />
        )}
      </FilterBar>

      {/* Filter Controls */}
      {showFilterControls && (
        <FilterControls 
          filterSystem={filterSystem}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </div>
  );
};

export default FilterContainer; 