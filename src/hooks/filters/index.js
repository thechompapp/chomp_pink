/**
 * Filter Hooks - Simplified Architecture
 * 
 * Focused hooks following Single Responsibility Principle:
 * - useFilterData: Simple data fetching
 * - useFilterValidation: Essential validation only
 * - useFilterPersistence: Basic localStorage
 * - useFilterTransformation: Simple transformations
 */

// Core simplified hooks
export { useFilterData } from './useFilterData';
export { useFilterValidation } from './useFilterValidation';
export { useFilterPersistence } from './useFilterPersistence';
export { useFilterTransformation } from './useFilterTransformation';

// Context
export { FilterProvider, useFilterContext } from './FilterContext';

// Legacy hooks for backward compatibility
export { useFilterState } from './useFilterState';

/**
 * useFilters - Simplified combined hook
 * 
 * Combines essential hooks only - no over-engineering
 */
export function useFilters(initialFilters = {}) {
  // Note: This is now much simpler and can be implemented as needed
  // Most functionality should use individual hooks directly
  throw new Error('useFilters has been simplified - use individual hooks directly: useFilterContext, useFilterData, etc.');
}

// Simplified convenience exports
export const filterHooks = {
  useFilterData,
  useFilterValidation,
  useFilterPersistence,
  useFilterTransformation,
  useFilterContext
}; 