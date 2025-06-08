/**
 * CuisineFilter.jsx - Refactored for Phase 3
 * 
 * Single Responsibility: Cuisine filter UI
 * - Uses Phase 2 hooks for simplified data and state management
 * - Clean component focused only on cuisine filtering UI
 * - Handles search functionality
 * - Manages multi-select cuisine tags
 */

import React, { useState, useMemo } from 'react';
import { Tag, Loader2, Search, X } from 'lucide-react';
import FilterGroup from './FilterGroup';
import FilterItem from './FilterItem';
import Input from '@/components/UI/Input';
import { Badge } from '@/components/UI/badge';
import { logDebug } from '@/utils/logger';

/**
 * CuisineFilter component - Simplified cuisine filtering using Phase 2 hooks
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filterSystem - Complete filter system from useFilters hook
 * @param {Array} props.cuisines - Available cuisines data
 * @param {boolean} props.loading - Loading state for cuisines
 * @param {string} props.error - Error state for cuisines
 * @param {number} props.limit - Maximum number of cuisines to display (before search)
 * @param {boolean} props.enableSearch - Whether to show search functionality
 * @param {boolean} props.showSelected - Whether to show selected cuisines separately
 * @param {string} props.className - Additional CSS classes
 */
const CuisineFilter = ({
  filterSystem,
  cuisines = [],
  loading = false,
  error = null,
  limit = 15,
  enableSearch = true,
  showSelected = true,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    filters,
    updateFilter,
    getFieldErrorMessage,
    hasFieldErrors,
    fetchCuisines
  } = filterSystem;

  const selectedCuisines = filters.cuisine || [];

  // Filtered cuisines based on search
  const filteredCuisines = useMemo(() => {
    if (!searchQuery.trim()) {
      return cuisines.slice(0, limit);
    }
    
    const query = searchQuery.trim().toLowerCase();
    return cuisines.filter(cuisine => 
      cuisine.name.toLowerCase().includes(query)
    );
  }, [cuisines, searchQuery, limit]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    // Trigger real-time search if query has changed significantly
    if (newQuery.length > 2 && newQuery !== searchQuery) {
      fetchCuisines(newQuery, 20); // Fetch more results for search
    }
  };

  // Handle cuisine selection/deselection
  const handleCuisineSelect = (cuisineName) => {
    const isSelected = selectedCuisines.includes(cuisineName);
    let newSelection;
    
    if (isSelected) {
      // Remove from selection
      newSelection = selectedCuisines.filter(c => c !== cuisineName);
      logDebug('[CuisineFilter] Cuisine deselected:', cuisineName);
    } else {
      // Add to selection
      newSelection = [...selectedCuisines, cuisineName];
      logDebug('[CuisineFilter] Cuisine selected:', cuisineName);
    }
    
    updateFilter('cuisine', newSelection);
  };

  // Handle removing selected cuisine
  const handleRemoveSelected = (cuisineName) => {
    const newSelection = selectedCuisines.filter(c => c !== cuisineName);
    updateFilter('cuisine', newSelection);
    logDebug('[CuisineFilter] Removed selected cuisine:', cuisineName);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={className}>
      <FilterGroup
        title="Cuisines"
        icon={<Tag size={16} />}
        defaultExpanded={true}
        hasError={hasFieldErrors('cuisine')}
      >
        <div className="space-y-4">
          {/* Selected Cuisines */}
          {showSelected && selectedCuisines.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected ({selectedCuisines.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCuisines.map(cuisine => (
                  <Badge
                    key={`selected-${cuisine}`}
                    variant="default"
                    className="flex items-center gap-1 text-xs"
                  >
                    #{cuisine}
                    <button
                      onClick={() => handleRemoveSelected(cuisine)}
                      className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${cuisine}`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          {enableSearch && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Cuisines
              </label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search cuisines..."
                  className="pl-8 pr-8 text-sm"
                />
                <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Available Cuisines */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Cuisines
              {hasFieldErrors('cuisine') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            
            {/* Loading State */}
            {loading && (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading cuisines...</span>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="text-sm text-destructive">
                Error loading cuisines: {error}
              </div>
            )}
            
            {/* Cuisine Items */}
            {!loading && !error && (
              <div className="flex flex-wrap gap-2">
                {filteredCuisines.length > 0 ? (
                  filteredCuisines.map(cuisine => {
                    const isSelected = selectedCuisines.includes(cuisine.name);
                    return (
                      <FilterItem
                        key={`cuisine-${cuisine.id || cuisine.name}`}
                        type="cuisine"
                        value={cuisine.name}
                        label={cuisine.name}
                        prefix="#"
                        isSelected={isSelected}
                        onClick={() => handleCuisineSelect(cuisine.name)}
                        hasError={hasFieldErrors('cuisine')}
                        className={`transition-all duration-200 ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'hover:bg-primary/10'
                        }`}
                      />
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? `No cuisines found matching "${searchQuery}"` 
                      : 'No cuisines available'
                    }
                  </div>
                )}
              </div>
            )}
            
            {/* Field Error */}
            {hasFieldErrors('cuisine') && (
              <div className="text-xs text-red-500">
                {getFieldErrorMessage('cuisine')}
              </div>
            )}
          </div>
        </div>
      </FilterGroup>
    </div>
  );
};

export default CuisineFilter; 