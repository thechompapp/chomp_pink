/**
 * NeighborhoodFilter.jsx - Refactored for Phase 3
 * 
 * Single Responsibility: Location filter UI (City, Borough, Neighborhood)
 * - Uses Phase 2 hooks for simplified data and state management
 * - Clean component focused only on UI rendering
 * - Handles geographic filter hierarchy
 * - Provides loading and error states
 */

import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import FilterGroup from './FilterGroup';
import FilterItem from './FilterItem';
import { logDebug } from '@/utils/logger';

/**
 * NeighborhoodFilter component - Simplified location filters using Phase 2 hooks
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
const NeighborhoodFilter = ({
  filterSystem,
  cities = [],
  boroughs = [],
  neighborhoods = [],
  loading = {},
  errors = {},
  showBoroughs = true,
  showNeighborhoods = true,
  className = ''
}) => {
  const {
    filters,
    updateFilter,
    getFieldErrorMessage,
    hasFieldErrors
  } = filterSystem;

  const selectedCityId = filters.city;
  const selectedBoroughId = filters.borough;
  const selectedNeighborhoodId = filters.neighborhood;

  // Get selected city to determine if it has boroughs
  const selectedCity = cities.find(city => city.id === selectedCityId);
  const cityHasBoroughs = selectedCity?.has_boroughs || false;

  // Handle filter selection
  const handleCitySelect = (cityId) => {
    logDebug('[NeighborhoodFilter] City selected:', cityId);
    updateFilter('city', cityId);
    
    // Clear dependent filters when city changes
    if (selectedBoroughId) {
      updateFilter('borough', null);
    }
    if (selectedNeighborhoodId) {
      updateFilter('neighborhood', null);
    }
  };

  const handleBoroughSelect = (boroughId) => {
    logDebug('[NeighborhoodFilter] Borough selected:', boroughId);
    updateFilter('borough', boroughId);
    
    // Clear neighborhood when borough changes
    if (selectedNeighborhoodId) {
      updateFilter('neighborhood', null);
    }
  };

  const handleNeighborhoodSelect = (neighborhoodId) => {
    logDebug('[NeighborhoodFilter] Neighborhood selected:', neighborhoodId);
    updateFilter('neighborhood', neighborhoodId);
  };

  // Helper to render items with loading and error states
  const renderItems = (items, isLoading, error, type, emptyMessage, onSelect) => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-sm text-destructive">
          Error loading data: {error}
        </div>
      );
    }
    
    if (!items || items.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <FilterItem
            key={`${type}-${item.id}`}
            type={type}
            value={item.id}
            label={item.name}
            isSelected={
              type === 'city' ? item.id === selectedCityId :
              type === 'borough' ? item.id === selectedBoroughId :
              item.id === selectedNeighborhoodId
            }
            onClick={() => onSelect(item.id)}
            hasError={hasFieldErrors(type)}
            errorMessage={getFieldErrorMessage(type)}
            className="transition-all duration-200"
          />
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <FilterGroup
        title="Location"
        icon={<MapPin size={16} />}
        defaultExpanded={true}
        hasError={hasFieldErrors('city') || hasFieldErrors('borough') || hasFieldErrors('neighborhood')}
      >
        <div className="space-y-4">
          {/* Cities */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              City
              {hasFieldErrors('city') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            {renderItems(
              cities,
              loading.cities,
              errors.cities,
              'city',
              'No cities available',
              handleCitySelect
            )}
            {hasFieldErrors('city') && (
              <div className="text-xs text-red-500">
                {getFieldErrorMessage('city')}
              </div>
            )}
          </div>
          
          {/* Boroughs (if city has boroughs) */}
          {selectedCityId && cityHasBoroughs && showBoroughs && (
            <div className="space-y-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Borough
                {hasFieldErrors('borough') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {renderItems(
                boroughs,
                loading.boroughs,
                errors.boroughs,
                'borough',
                'No boroughs found for this city',
                handleBoroughSelect
              )}
              {hasFieldErrors('borough') && (
                <div className="text-xs text-red-500">
                  {getFieldErrorMessage('borough')}
                </div>
              )}
            </div>
          )}
          
          {/* Neighborhoods */}
          {selectedBoroughId && showNeighborhoods && (
            <div className="space-y-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4 ml-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Neighborhood
                {hasFieldErrors('neighborhood') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {renderItems(
                neighborhoods,
                loading.neighborhoods,
                errors.neighborhoods,
                'neighborhood',
                'No neighborhoods found for this borough',
                handleNeighborhoodSelect
              )}
              {hasFieldErrors('neighborhood') && (
                <div className="text-xs text-red-500">
                  {getFieldErrorMessage('neighborhood')}
                </div>
              )}
            </div>
          )}
        </div>
      </FilterGroup>
    </div>
  );
};

export default NeighborhoodFilter; 