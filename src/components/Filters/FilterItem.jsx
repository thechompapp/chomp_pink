import React from 'react';
import { useFilterContext } from '@/hooks/filters/FilterContext';
import PillButton from '@/components/UI/PillButton';
import { logDebug } from '@/utils/logger';

/**
 * FilterItem component - a wrapper around PillButton that integrates with FilterContext
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - The filter type (city, borough, neighborhood, cuisine, hashtag)
 * @param {any} props.value - The filter value (string, number, etc.)
 * @param {string} props.label - Display text for the button
 * @param {boolean} props.isLoading - Whether the item is in loading state
 * @param {boolean} props.disabled - Whether the item is disabled
 * @param {Function} props.onClick - Custom onClick handler (optional)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.prefix - Optional prefix character to display before label
 */
const FilterItem = ({ 
  type,
  value,
  label,
  isLoading = false,
  disabled = false,
  onClick,
  className = "",
  prefix
}) => {
  const context = useFilterContext();
  
  // Add safety checks for context destructuring
  if (!context) {
    return null;
  }
  
  const { filters = {}, setFilter, data } = context;
  
  // Additional safety check for filters object
  if (!filters) {
    return null;
  }
  
  // Debug: Log context values
  React.useEffect(() => {
    logDebug(`[FilterItem:${type}:${value}] Context data:`, {
      filterContextAvailable: !!context,
      dataAvailable: !!data,
      dataCities: data?.cities?.length || 0,
      dataCuisines: data?.cuisines?.length || 0,
      cityIds: data?.cities?.map(c => c.id) || [],
      cuisineNames: data?.cuisines?.map(c => c.name) || []
    });
  }, [context, data, type, value]);
  
  // Determine if this item is currently active
  const isActive = React.useMemo(() => {
    // Safety check for filters existence
    if (!filters || !filters.hasOwnProperty(type)) {
      return false;
    }
    
    if (Array.isArray(filters[type])) {
      return filters[type].includes(value);
    }
    return filters[type] === value;
  }, [filters, type, value]);
  
  // Helper function to toggle array filter values
  const toggleArrayFilter = (filterType, filterValue) => {
    // Safety check for filters
    if (!filters) return;
    
    const currentValues = filters[filterType] || [];
    const newValues = currentValues.includes(filterValue)
      ? currentValues.filter(v => v !== filterValue)
      : [...currentValues, filterValue];
    logDebug(`[FilterItem] Toggling array filter ${filterType}:`, {
      current: currentValues,
      new: newValues,
      value: filterValue
    });
    setFilter(filterType, newValues);
  };
  
  // Default handler for clicking on a filter item
  const handleClick = () => {
    if (disabled || isLoading || !filters || !setFilter) return;
    
    if (onClick) {
      // Custom click handler
      logDebug(`[FilterItem] Using custom click handler for ${type}:${value}`);
      onClick(value, type);
    } else {
      // Default behavior based on filter type
      const currentFilterValue = filters[type];
      if (Array.isArray(currentFilterValue)) {
        logDebug(`[FilterItem] Toggling array filter ${type}:`, value);
        toggleArrayFilter(type, value);
      } else {
        // Toggle selection for single-select filters
        logDebug(`[FilterItem] Setting filter ${type}:`, isActive ? null : value);
        setFilter(type, isActive ? null : value);
      }
    }
  };
  
  return (
    <PillButton
      label={label || String(value)}
      isActive={isActive}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      prefix={prefix}
    />
  );
};

export default FilterItem; 