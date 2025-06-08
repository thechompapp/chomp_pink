/**
 * FilterControls.jsx - Simplified Filter Controls
 * 
 * Single Responsibility: Filter operation controls
 * - Clear all filters
 * - Simple active filter display
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/badge';

/**
 * FilterControls - Simplified filter operation controls
 */
const FilterControls = ({
  hasActiveFilters = false,
  onReset,
  showSummary = true,
  className = ''
}) => {
  if (!hasActiveFilters && !showSummary) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border ${className}`}
    >
      {/* Filter Summary */}
      {showSummary && hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Filters active
          </Badge>
        </div>
      )}

      {/* Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs"
          >
            <Trash2 size={14} />
            <span className="ml-1">Clear All</span>
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default FilterControls; 