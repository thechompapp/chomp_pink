/**
 * FilterContainer.jsx - Simplified Filter UI Orchestration
 * 
 * Single Responsibility: Coordinate filter UI components
 * - Uses simplified FilterContext for state
 * - Direct data fetching via useFilterData
 * - No complex business logic
 * - Clean prop passing
 */

import React from 'react';
import { useFilterContext } from '@/hooks/filters/FilterContext';
import { useFilterData } from '@/hooks/filters/useFilterData';
import NeighborhoodFilter from './NeighborhoodFilter';
import CuisineFilter from './CuisineFilter';
import FilterControls from './FilterControls';
import CollapsibleFilterGroup from './CollapsibleFilterGroup';
import ActiveFilters from './ActiveFilters';

const FilterContainer = ({ onFilterChange, onReset, showControls = true }) => {
  const { state, actions } = useFilterContext();
  const { data, loading, errors } = useFilterData(state.filters);

  // Simple guard clause
  if (!state?.filters) {
    return <div className="flex justify-center items-center h-24">Loading filters...</div>;
  }

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md space-y-4">
      <ActiveFilters
        filters={state.filters}
        data={data}
        onClearFilter={actions.setFilter}
      />

      <CollapsibleFilterGroup title="Location" defaultOpen={true}>
        <NeighborhoodFilter
          cities={data.cities || []}
          boroughs={data.boroughs || []}
          neighborhoods={data.neighborhoods || []}
          loading={loading}
          error={errors}
          filters={state.filters}
          onFilterChange={actions.setFilter}
        />
      </CollapsibleFilterGroup>

      <CollapsibleFilterGroup title="Cuisine">
        <CuisineFilter
          cuisines={data.cuisines || []}
          loading={loading.cuisines}
          error={errors.cuisines}
          filters={state.filters}
          onFilterChange={actions.setFilter}
        />
      </CollapsibleFilterGroup>

      {showControls && (
        <FilterControls 
          hasActiveFilters={state.meta.hasActiveFilters}
          onReset={actions.clearAllFilters}
        />
      )}
    </div>
  );
};

export default React.memo(FilterContainer); 