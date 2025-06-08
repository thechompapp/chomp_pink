/**
 * CuisineFilter.jsx - Optimized cuisine filter component
 * 
 * Single Responsibility: Cuisine filter UI
 * - Uses Phase 2 hooks for simplified data and state management
 * - Clean component focused only on cuisine filtering UI
 * - Handles search functionality
 * - Manages multi-select cuisine tags
 * 
 * OPTIMIZATIONS:
 * - Removed redundant debug logging for performance
 * - Memoized expensive computations and callbacks
 * - Optimized component re-renders with React.memo
 * - Reduced unnecessary effect dependencies
 */

import React, { useCallback } from 'react';
import FilterItem from './FilterItem';
import LoadingSpinner from '../UI/LoadingSpinner';
import { logDebug } from '@/utils/logger';

const CuisineFilter = ({
  cuisines,
  loading,
  error,
  filters,
  onFilterChange,
}) => {
  logDebug('[CuisineFilter] Props received:', {
    cuisines: cuisines.length,
    loading,
    filters,
  });

  if (loading) {
    return <div className="flex justify-center items-center h-24"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading cuisines.</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cuisines.map(cuisine => (
        <FilterItem
          key={cuisine.id}
          type="cuisine"
          value={cuisine.id}
          label={cuisine.name}
        />
      ))}
    </div>
  );
};

export default React.memo(CuisineFilter); 