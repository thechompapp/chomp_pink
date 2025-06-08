/**
 * NeighborhoodFilter.jsx - Optimized location filter component
 * 
 * Single Responsibility: Location filter UI (City, Borough, Neighborhood)
 * - Uses Phase 2 hooks for simplified data and state management
 * - Clean component focused only on UI rendering
 * - Handles geographic filter hierarchy
 * - Provides loading and error states
 * 
 * OPTIMIZATIONS:
 * - Removed redundant debug logging for performance
 * - Memoized expensive computations and callbacks
 * - Optimized component re-renders with React.memo
 * - Reduced unnecessary effect dependencies
 */

import React, { useMemo, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import FilterGroup from './FilterGroup';
import FilterItem from './FilterItem';
import LoadingSpinner from '../UI/LoadingSpinner';
import { logDebug } from '@/utils/logger';

/**
 * NeighborhoodFilter component - Optimized location filters using Phase 2 hooks
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filterSystem - Complete filter system from useFilters hook
 * @param {Array} props.cities - Available cities data
 * @param {Array} props.boroughs - Available boroughs data
 * @param {Array} props.neighborhoods - Available neighborhoods data
 * @param {Object} props.loading - Loading states for each data type
 * @param {Object} props.errors - Error states for each data type
 * @param {boolean} props.showBoroughs - Whether to show borough selection
 * @param {boolean} props.showNeighborhoods - Whether to show neighborhood selection
 * @param {string} props.className - Additional CSS classes
 */
const NeighborhoodFilter = React.memo(({
  cities,
  boroughs,
  neighborhoods,
  loading,
  error,
  filters,
  onFilterChange,
}) => {
  logDebug('[NeighborhoodFilter] Props received:', {
    cities: cities.length,
    boroughs: boroughs.length,
    neighborhoods: neighborhoods.length,
    loading,
    filters,
  });

  if (loading.cities || loading.boroughs || loading.neighborhoods) {
    return <div className="flex justify-center items-center h-24"><LoadingSpinner /></div>;
  }

  if (error.cities || error.boroughs || error.neighborhoods) {
    return <div className="text-red-500">Error loading location data.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Cities */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-700">City</h4>
        <div className="flex flex-wrap gap-2">
          {cities.map(city => (
            <FilterItem
              key={city.id}
              type="city"
              value={city.id}
              label={city.name}
            />
          ))}
        </div>
      </div>

      {/* Boroughs */}
      {filters.city && boroughs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Borough</h4>
          <div className="flex flex-wrap gap-2">
            {boroughs.map(borough => (
              <FilterItem
                key={borough.id}
                type="borough"
                value={borough.id}
                label={borough.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Neighborhoods */}
      {filters.borough && neighborhoods.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Neighborhood</h4>
          <div className="flex flex-wrap gap-2">
            {neighborhoods.map(neighborhood => (
              <FilterItem
                key={neighborhood.id}
                type="neighborhood"
                value={neighborhood.id}
                label={neighborhood.name}
              />
            ))}
          </div>
        </div>
      )}
      {filters.borough && neighborhoods.length === 0 && !loading.neighborhoods && (
        <p className="text-gray-500">No neighborhoods available for this borough.</p>
      )}
    </div>
  );
});

NeighborhoodFilter.displayName = 'NeighborhoodFilter';

export default NeighborhoodFilter; 