import React from 'react';
import { X } from 'lucide-react';

/**
 * FilterChip component - displays an active filter with an option to remove it
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Text to display in the chip
 * @param {Function} props.onRemove - Callback when the remove button is clicked
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.icon - Optional icon to display before the label
 */
const FilterChip = ({ 
  label, 
  onRemove, 
  className = "",
  icon
}) => {
  return (
    <div className={`inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200 ${className}`}>
      {icon && <span className="mr-1 text-gray-500 dark:text-gray-400">{icon}</span>}
      <span className="mr-1 max-w-32 truncate">{label}</span>
      {onRemove && (
        <button 
          onClick={onRemove}
          className="ml-1 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
          aria-label={`Remove ${label} filter`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default FilterChip; 