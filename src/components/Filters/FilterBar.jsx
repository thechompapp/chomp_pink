import React from 'react';
import { X, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilter, FILTER_TYPES } from '@/contexts/FilterContext';
import Button from '@/components/UI/Button';
import FilterChip from './FilterChip';
import { logDebug } from '@/utils/logger';

/**
 * Helper to get a readable label for filter display
 * @param {string} type - Filter type
 * @param {any} value - Filter value
 * @param {Object} lookupData - Data to look up display values (cities, neighborhoods, etc.)
 * @returns {string} - Human-readable label
 */
const getFilterDisplayLabel = (type, value, lookupData = {}) => {
  if (value === null || value === undefined) return '';
  
  const { cities = [], boroughs = [], neighborhoods = [] } = lookupData;
  
  // Look up labels for entity types
  if (type === FILTER_TYPES.CITY) {
    const city = cities.find(c => c.id === value);
    return city ? city.name : `City ID: ${value}`;
  }
  
  if (type === FILTER_TYPES.BOROUGH) {
    const borough = boroughs.find(b => b.id === value);
    return borough ? borough.name : `Borough ID: ${value}`;
  }
  
  if (type === FILTER_TYPES.NEIGHBORHOOD) {
    const neighborhood = neighborhoods.find(n => n.id === value);
    return neighborhood ? neighborhood.name : `Neighborhood ID: ${value}`;
  }
  
  // For array values, just return the value itself
  return String(value);
};

/**
 * Get icon for filter chip based on filter type
 * @param {string} type - Filter type 
 * @returns {React.ReactNode} - Icon component
 */
const getFilterIcon = (type) => {
  if ([FILTER_TYPES.CITY, FILTER_TYPES.BOROUGH, FILTER_TYPES.NEIGHBORHOOD].includes(type)) {
    return <MapPin size={12} />;
  }
  
  if ([FILTER_TYPES.CUISINE, FILTER_TYPES.HASHTAG].includes(type)) {
    return <Tag size={12} />;
  }
  
  return null;
};

/**
 * FilterBar component - displays active filters and provides clear functionality
 * 
 * @param {Object} props - Component props 
 * @param {React.ReactNode} props.children - Additional filter controls to display
 * @param {boolean} props.showClearButton - Whether to show the clear filters button
 * @param {Object} props.lookupData - Data for displaying readable labels (cities, neighborhoods, etc.)
 */
const FilterBar = ({ 
  children, 
  showClearButton = true,
  lookupData = {}
}) => {
  const { filters, clearFilters, toggleArrayFilter, setFilter, hasActiveFilters } = useFilter();
  
  // Handle removing a single filter
  const handleRemoveFilter = (type, value) => {
    logDebug(`[FilterBar] Removing filter ${type}:`, value);
    
    if (Array.isArray(filters[type])) {
      toggleArrayFilter(type, value);
    } else {
      setFilter(type, null);
    }
  };
  
  // Handle clearing all filters
  const handleClearAll = () => {
    logDebug('[FilterBar] Clearing all filters');
    clearFilters();
  };
  
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Components (passed as children) */}
        {children}
        
        {/* Clear Filters Button */}
        {showClearButton && hasActiveFilters && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleClearAll}
            className="text-xs ml-2"
          >
            <X size={14} className="mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      {/* Active Filter Chips */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex flex-wrap gap-2"
          >
            {/* Loop through all filter types */}
            {Object.entries(filters).map(([type, value]) => {
              // For array filters (like cuisines)
              if (Array.isArray(value) && value.length > 0) {
                return value.map((item, index) => (
                  <FilterChip
                    key={`${type}-${index}-${item}`}
                    label={getFilterDisplayLabel(type, item, lookupData)}
                    icon={getFilterIcon(type)}
                    onRemove={() => handleRemoveFilter(type, item)}
                  />
                ));
              } 
              // For single value filters that are set
              else if (value !== null && value !== undefined) {
                return (
                  <FilterChip
                    key={`${type}-${value}`}
                    label={getFilterDisplayLabel(type, value, lookupData)}
                    icon={getFilterIcon(type)}
                    onRemove={() => handleRemoveFilter(type, value)}
                  />
                );
              }
              
              return null;
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar; 