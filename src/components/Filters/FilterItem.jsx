/**
 * FilterItem.jsx - Reusable Filter Button Component
 * 
 * Single Responsibility: Display a clickable filter option
 * - Pure UI component with clear prop interface
 * - Active/inactive states
 * - Loading and disabled states
 * - Consistent styling and animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * FilterItem - Reusable filter button component
 */
const FilterItem = ({
  label,
  isActive = false,
  isLoading = false,
  disabled = false,
  onClick,
  className = "",
  prefix,
  icon: Icon
}) => {
  const handleClick = () => {
    if (!disabled && !isLoading && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 border-2
        ${isActive
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-400'
        }
        ${disabled || isLoading
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
        }
        ${className}
      `}
      aria-pressed={isActive}
      aria-label={`Filter by ${label}`}
    >
      {isLoading && (
        <Loader2 size={12} className="mr-1 animate-spin" />
      )}
      
      {Icon && !isLoading && (
        <Icon size={12} className="mr-1" />
      )}
      
      {prefix && !isLoading && (
        <span className="mr-1 text-gray-500">{prefix}</span>
      )}
      
      <span className="truncate max-w-32">{label}</span>
    </motion.button>
  );
};

export default React.memo(FilterItem); 