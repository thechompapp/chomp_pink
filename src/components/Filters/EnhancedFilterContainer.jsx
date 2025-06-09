/**
 * EnhancedFilterContainer.jsx - Phase 3 Advanced Filter Container
 * 
 * Integrates all Phase 3 optimizations:
 * - React Query powered data fetching
 * - Virtual scrolling for large lists
 * - Progressive loading with skeleton states
 * - Real-time filter suggestions
 * - Optimistic updates and caching
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, RefreshCw, Settings, Zap } from 'lucide-react';
import { useFiltersQuery } from '@/hooks/useFiltersQuery';
import { useProgressiveLoading } from './ProgressiveFilterLoader';
import ProgressiveFilterLoader from './ProgressiveFilterLoader';
import VirtualFilterList from './VirtualFilterList';
import FilterSuggestions from './FilterSuggestions';
import FilterErrorBoundary from './FilterErrorBoundary';
import { FILTER_TYPES } from '@/stores/useFilterStore';
import { logDebug } from '@/utils/logger';

/**
 * Enhanced Filter Container with Phase 3 optimizations
 */
const EnhancedFilterContainer = ({
  initialFilters = {},
  onChange,
  onError,
  className = "",
  enableSuggestions = true,
  enableVirtualScrolling = true,
  enableProgressiveLoading = true,
  enableOptimisticUpdates = true,
  maxSuggestionsShown = 4
}) => {
  // State for UI management
  const [expandedSections, setExpandedSections] = useState(new Set(['location', 'cuisine']));
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Progressive loading configuration
  const { createStage, LOADING_PRIORITIES } = useProgressiveLoading([]);

  const loadingStages = useMemo(() => [
    createStage('Cities', LOADING_PRIORITIES.CRITICAL, null, { expectedItemCount: 8 }),
    createStage('Cuisines', LOADING_PRIORITIES.HIGH, null, { expectedItemCount: 12 }),
    createStage('Boroughs', LOADING_PRIORITIES.MEDIUM, null, { expectedItemCount: 6 }),
    createStage('Neighborhoods', LOADING_PRIORITIES.LOW, null, { expectedItemCount: 15 })
  ], [createStage, LOADING_PRIORITIES]);

  // Enhanced filter query with all Phase 3 features
  const {
    filters,
    data,
    isLoading,
    hasErrors,
    suggestions,
    isOptimisticUpdate,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    refreshAll,
    queries,
    transformToApi
  } = useFiltersQuery(initialFilters, {
    onChange: (apiFormat) => {
      if (onChange) {
        onChange(apiFormat);
      }
    },
    enableRealTimeSync: true,
    enablePrefetching: true,
    enableOptimisticUpdates,
    enableSuggestions,
    debounceMs: 300
  });

  // ================================
  // EVENT HANDLERS
  // ================================

  const handleStageLoad = useCallback(async (stage, stageIndex) => {
    // This would be called by the progressive loader for each stage
    logDebug(`[EnhancedFilterContainer] Loading stage: ${stage.name}`);
    
    // In a real implementation, you might trigger specific data loads here
    // For now, the useFiltersQuery hook handles the data loading
    return Promise.resolve();
  }, []);

  const handleSectionToggle = useCallback((sectionName) => {
    setExpandedSections(prev => {
      const updated = new Set(prev);
      if (updated.has(sectionName)) {
        updated.delete(sectionName);
      } else {
        updated.add(sectionName);
      }
      return updated;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } catch (error) {
      if (onError) {
        onError(error);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAll, onError]);

  const handleApplySuggestion = useCallback((suggestionFilters) => {
    Object.entries(suggestionFilters).forEach(([filterType, value]) => {
      if (Object.values(FILTER_TYPES).includes(filterType)) {
        if (Array.isArray(value)) {
          // For array filters, merge with existing values
          const currentValues = filters[filterType] || [];
          const newValues = [...new Set([...currentValues, ...value])];
          setFilter(filterType, newValues);
        } else {
          setFilter(filterType, value);
        }
      }
    });
  }, [filters, setFilter]);

  // ================================
  // FILTER SECTIONS
  // ================================

  const renderLocationSection = () => {
    const isExpanded = expandedSections.has('location');
    
    return (
      <div className="filter-section">
        <button
          onClick={() => handleSectionToggle('location')}
          className="flex items-center justify-between w-full p-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter size={16} />
            <span>Location</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▶
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Cities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  {enableVirtualScrolling && data.cities.length > 50 ? (
                    <VirtualFilterList
                      items={data.cities}
                      selectedItems={filters.city ? [filters.city] : []}
                      onToggleItem={(cityId) => setFilter(FILTER_TYPES.CITY, cityId)}
                      searchPlaceholder="Search cities..."
                      maxHeight={200}
                      isLoading={queries.cities.isLoading}
                    />
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {data.cities.map(city => (
                        <button
                          key={city.id}
                          onClick={() => setFilter(FILTER_TYPES.CITY, city.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                            ${filters.city === city.id 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'hover:bg-gray-100'
                            }`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Boroughs */}
                {filters.city && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Borough
                    </label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {data.boroughs.map(borough => (
                        <button
                          key={borough.id}
                          onClick={() => setFilter(FILTER_TYPES.BOROUGH, borough.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                            ${filters.borough === borough.id 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'hover:bg-gray-100'
                            }`}
                        >
                          {borough.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Neighborhoods */}
                {filters.borough && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neighborhood
                    </label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {data.neighborhoods.map(neighborhood => (
                        <button
                          key={neighborhood.id}
                          onClick={() => setFilter(FILTER_TYPES.NEIGHBORHOOD, neighborhood.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                            ${filters.neighborhood === neighborhood.id 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'hover:bg-gray-100'
                            }`}
                        >
                          {neighborhood.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderCuisineSection = () => {
    const isExpanded = expandedSections.has('cuisine');
    
    return (
      <div className="filter-section">
        <button
          onClick={() => handleSectionToggle('cuisine')}
          className="flex items-center justify-between w-full p-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter size={16} />
            <span>Cuisine</span>
            {filters.cuisine?.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {filters.cuisine.length}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▶
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                {enableVirtualScrolling && data.cuisines.length > 50 ? (
                  <VirtualFilterList
                    items={data.cuisines}
                    selectedItems={filters.cuisine || []}
                    onToggleItem={(cuisine) => toggleArrayFilter(FILTER_TYPES.CUISINE, cuisine)}
                    searchPlaceholder="Search cuisines..."
                    maxHeight={300}
                    isLoading={queries.cuisines.isLoading}
                    enableBulkActions={true}
                  />
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {data.cuisines.map(cuisine => (
                      <button
                        key={cuisine}
                        onClick={() => toggleArrayFilter(FILTER_TYPES.CUISINE, cuisine)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                          ${filters.cuisine?.includes(cuisine) 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'hover:bg-gray-100'
                          }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ================================
  // MAIN RENDER
  // ================================

  const content = (
    <div className={`enhanced-filter-container bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Filters
          </h2>
          {isOptimisticUpdate && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Zap size={14} />
              <span className="text-xs">Updating</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Advanced Options"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Suggestions */}
      {enableSuggestions && suggestions.length > 0 && (
        <div className="p-4 bg-blue-50 border-b">
          <FilterSuggestions
            currentFilters={filters}
            onApplyFilters={handleApplySuggestion}
            maxSuggestions={maxSuggestionsShown}
            enableRealTime={true}
            enableGrouping={true}
          />
        </div>
      )}

      {/* Filter Sections */}
      <div className="divide-y">
        {renderLocationSection()}
        {renderCuisineSection()}
      </div>

      {/* Clear All Button */}
      {Object.values(filters).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== null
      ) && (
        <div className="p-4 border-t">
          <button
            onClick={() => clearFilters()}
            className="w-full py-2 px-4 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Advanced Options Panel */}
      <AnimatePresence>
        {showAdvancedOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-gray-50 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Advanced Options
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>Virtual Scrolling: {enableVirtualScrolling ? 'On' : 'Off'}</div>
                <div>Optimistic Updates: {enableOptimisticUpdates ? 'On' : 'Off'}</div>
                <div>Real-time Sync: On</div>
                <div>Smart Suggestions: {enableSuggestions ? 'On' : 'Off'}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Wrap with progressive loading if enabled
  if (enableProgressiveLoading) {
    return (
      <ProgressiveFilterLoader
        loadingStages={loadingStages}
        onLoadStage={handleStageLoad}
        enableIntersectionLoading={true}
        enableSkeletonAnimations={true}
        skeletonVariant="detailed"
        className={className}
      >
        {content}
      </ProgressiveFilterLoader>
    );
  }

  return content;
};

// Wrap with error boundary
const EnhancedFilterContainerWithErrorBoundary = (props) => (
  <FilterErrorBoundary>
    <EnhancedFilterContainer {...props} />
  </FilterErrorBoundary>
);

export default EnhancedFilterContainerWithErrorBoundary; 