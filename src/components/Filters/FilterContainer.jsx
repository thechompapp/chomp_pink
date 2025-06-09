/**
 * FilterContainer.jsx - Simplified Filter UI Orchestration
 * 
 * Single Responsibility: Coordinate filter UI components
 * - Uses unified useFilters hook for all functionality
 * - Clean component orchestration
 * - Simplified prop passing
 * - Error boundaries for graceful error handling
 */

import React from 'react';
import { FILTER_TYPES } from '@/stores/useFilterStore';
import NeighborhoodFilter from './NeighborhoodFilter';
import CuisineFilter from './CuisineFilter';
import FilterControls from './FilterControls';
import CollapsibleFilterGroup from './CollapsibleFilterGroup';
import ActiveFilters from './ActiveFilters';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import FilterErrorBoundary from './FilterErrorBoundary';

// For now, let's use a simple version that works
import { useFilterStore } from '@/stores/useFilterStore';

const FilterContainer = ({ 
  onFilterChange, 
  initialFilters = {},
  showControls = true,
  showActiveFilters = true,
  className = ""
}) => {
  // Get direct access to the store
  const {
    filters,
    data,
    loading,
    errors,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    fetchCities,
    fetchBoroughs,
    fetchNeighborhoods,
    fetchCuisines
  } = useFilterStore();

  // Auto-fetch initial data
  React.useEffect(() => {
    fetchCities();
    fetchCuisines();
  }, [fetchCities, fetchCuisines]);

  // Fetch dependent data when parent changes
  React.useEffect(() => {
    if (filters[FILTER_TYPES.CITY]) {
      fetchBoroughs(filters[FILTER_TYPES.CITY]);
    }
  }, [filters[FILTER_TYPES.CITY], fetchBoroughs]);

  React.useEffect(() => {
    if (filters[FILTER_TYPES.BOROUGH]) {
      fetchNeighborhoods(filters[FILTER_TYPES.BOROUGH]);
    }
  }, [filters[FILTER_TYPES.BOROUGH], fetchNeighborhoods]);

  // Notify parent of filter changes
  React.useEffect(() => {
    if (onFilterChange) {
      const apiFormat = {
        cityId: filters[FILTER_TYPES.CITY],
        boroughId: filters[FILTER_TYPES.BOROUGH],
        neighborhoodId: filters[FILTER_TYPES.NEIGHBORHOOD],
        hashtags: filters[FILTER_TYPES.CUISINE] || []
      };
      onFilterChange(apiFormat);
    }
  }, [filters, onFilterChange]);

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== null
  );

  // Loading state for critical data
  if (loading.cities && data.cities.length === 0) {
    return (
      <div className={`flex justify-center items-center h-24 ${className}`}>
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading filters...</span>
      </div>
    );
  }

  // Error state for critical failures
  if (errors.cities && data.cities.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <ErrorMessage 
          message="Unable to load filter options. Please try again."
          onRetry={() => fetchCities()}
        />
      </div>
    );
  }

  return (
    <FilterErrorBoundary onReset={() => fetchCities()} onRetry={() => fetchCities()}>
      <div className={`w-full p-4 bg-white rounded-lg shadow-md space-y-4 ${className}`}>
        {/* Active Filters Display */}
        {showActiveFilters && (
          <ActiveFilters
            filters={filters}
            data={data}
            onClearFilter={(type, value) => {
              if (Array.isArray(filters[type])) {
                toggleArrayFilter(type, value);
              } else {
                clearFilters(type);
              }
            }}
            onClearAll={() => clearFilters()}
          />
        )}

        {/* Location Filters */}
        <CollapsibleFilterGroup title="Location" defaultOpen={true}>
          <NeighborhoodFilter
            cities={data.cities || []}
            boroughs={data.boroughs || []}
            neighborhoods={data.neighborhoods || []}
            selectedCity={filters[FILTER_TYPES.CITY]}
            selectedBorough={filters[FILTER_TYPES.BOROUGH]}
            selectedNeighborhood={filters[FILTER_TYPES.NEIGHBORHOOD]}
            loading={loading}
            errors={errors}
            onCityChange={(cityId) => setFilter(FILTER_TYPES.CITY, cityId)}
            onBoroughChange={(boroughId) => setFilter(FILTER_TYPES.BOROUGH, boroughId)}
            onNeighborhoodChange={(neighborhoodId) => setFilter(FILTER_TYPES.NEIGHBORHOOD, neighborhoodId)}
          />
        </CollapsibleFilterGroup>

        {/* Cuisine Filters */}
        <CollapsibleFilterGroup title="Cuisine">
          <CuisineFilter
            cuisines={data.cuisines || []}
            selectedCuisines={filters[FILTER_TYPES.CUISINE] || []}
            loading={loading.cuisines}
            error={errors.cuisines}
            onToggleCuisine={(cuisine) => toggleArrayFilter(FILTER_TYPES.CUISINE, cuisine)}
            onClearCuisines={() => clearFilters(FILTER_TYPES.CUISINE)}
          />
        </CollapsibleFilterGroup>

        {/* Filter Controls */}
        {showControls && (
          <FilterControls 
            hasActiveFilters={hasActiveFilters}
            onReset={() => clearFilters()}
            showSummary={true}
          />
        )}

        {/* Loading Indicator for Secondary Data */}
        {(loading.boroughs || loading.neighborhoods || loading.cuisines) && (
          <div className="flex items-center justify-center py-2">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-500">Updating options...</span>
          </div>
        )}
      </div>
    </FilterErrorBoundary>
  );
};

export default React.memo(FilterContainer); 