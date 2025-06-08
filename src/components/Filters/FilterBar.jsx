/**
 * FilterBar.jsx - Simple Active Filter Display
 * 
 * Single Responsibility: Display active filters as removable chips
 * - Clean chip display
 * - Simple remove functionality
 * - No complex business logic
 */

import React from 'react';
import { X, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterChip from './FilterChip';

/**
 * Get icon for filter type
 */
const getFilterIcon = (type) => {
  if (['city', 'borough', 'neighborhood'].includes(type)) {
    return <MapPin size={12} />;
  }
  if (['cuisine', 'hashtag'].includes(type)) {
    return <Tag size={12} />;
  }
  return null;
};

/**
 * Get display label for filter value
 */
const getDisplayLabel = (type, value, data = {}) => {
  if (!value) return '';

  // Try to find display name in data
  const items = data[`${type}s`] || data[type] || [];
  const item = items.find(i => i.id === value || i.value === value);
  
  return item?.name || item?.label || String(value);
};

/**
 * FilterBar - Simple active filter display
 */
const FilterBar = ({ 
  filters = {}, 
  data = {},
  onRemoveFilter,
  onClearAll,
  showClearButton = true,
  children 
}) => {
  // Generate filter chips
  const filterChips = [];

  Object.entries(filters).forEach(([type, value]) => {
    if (!value) return;

    if (Array.isArray(value)) {
      // Handle array filters
      value.forEach((item, index) => {
        if (item) {
          filterChips.push(
            <FilterChip
              key={`${type}-${item}-${index}`}
              label={getDisplayLabel(type, item, data)}
              icon={getFilterIcon(type)}
              onRemove={() => onRemoveFilter(type, item)}
            />
          );
        }
      });
    } else {
      // Handle single value filters
      filterChips.push(
        <FilterChip
          key={type}
          label={getDisplayLabel(type, value, data)}
          icon={getFilterIcon(type)}
          onRemove={() => onRemoveFilter(type, value)}
        />
      );
    }
  });

  const hasActiveFilters = filterChips.length > 0;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {children}
        
        {showClearButton && hasActiveFilters && (
          <button 
            onClick={onClearAll}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <X size={14} />
            Clear All
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex flex-wrap gap-2"
          >
            {filterChips}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar; 