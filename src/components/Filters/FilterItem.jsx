import React from 'react';
import { useFilter, FILTER_TYPES } from '@/contexts/FilterContext';
import PillButton from '@/components/UI/PillButton';
import { logDebug } from '@/utils/logger';

/**
 * FilterItem component - a wrapper around PillButton that integrates with FilterContext
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - The filter type from FILTER_TYPES
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
  const { filters, setFilter, toggleArrayFilter } = useFilter();
  
  // Determine if this item is currently active
  const isActive = React.useMemo(() => {
    if (Array.isArray(filters[type])) {
      return filters[type].includes(value);
    }
    return filters[type] === value;
  }, [filters, type, value]);
  
  // Default handler for clicking on a filter item
  const handleClick = () => {
    if (disabled || isLoading) return;
    
    if (onClick) {
      // Custom click handler
      onClick(value, type);
    } else {
      // Default behavior based on filter type
      if (Array.isArray(filters[type])) {
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