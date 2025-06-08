/**
 * FilterControls.jsx - Phase 3 New Component
 * 
 * Single Responsibility: Filter operation controls
 * - Clear all filters
 * - Filter summary display
 * - Simple click-to-filter behavior
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/badge';
import { logDebug } from '@/utils/logger';

/**
 * FilterControls - Simplified filter operation controls
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filterSystem - Complete filter system from useFilters hook
 * @param {boolean} props.hasActiveFilters - Whether there are active filters
 * @param {boolean} props.showSummary - Whether to show filter summary
 * @param {string} props.className - Additional CSS classes
 */
const FilterControls = ({
  filterSystem,
  hasActiveFilters = false,
  showSummary = true,
  className = ''
}) => {
  const {
    clearAllFilters,
    getChangesSummary
  } = filterSystem;

  // Handle clear all filters
  const handleClearAll = () => {
    clearAllFilters();
    logDebug('[FilterControls] All filters cleared');
  };

  // Get active filter count for summary
  const changes = getChangesSummary();
  const activeFilterCount = Object.keys(changes).length;

  if (!hasActiveFilters && !showSummary) {
    return null; // Don't show controls if no active filters
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
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </Badge>
        </div>
      )}

      {/* Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
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