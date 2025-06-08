/**
 * useFilterState.js
 * 
 * Single Responsibility: Core filter state management
 * - Centralized filter state coordination
 * - State transitions and updates
 * - Initial state handling
 * - State validation and normalization
 * - Optimized re-rendering prevention
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { filterTransformService } from '@/services/filters';
import { logDebug, logWarn } from '@/utils/logger';

/**
 * Default filter state structure
 */
const DEFAULT_FILTERS = {
  city: null,
  borough: null,
  neighborhood: null,
  cuisine: [],
  hashtag: []
};

/**
 * useFilterState - Core filter state management hook
 * 
 * @param {Object} initialFilters - Initial filter values
 * @param {Object} options - Configuration options
 * @returns {Object} Filter state and management functions
 */
export function useFilterState(initialFilters = {}, options = {}) {
  const {
    validateOnUpdate = true,
    debounceMs = 300,
    onStateChange = null,
    enablePersistence = false,
    persistenceKey = 'filterState'
  } = options;

  // Initialize state with merged defaults and initial filters
  const [filters, setFilters] = useState(() => {
    const merged = { ...DEFAULT_FILTERS, ...initialFilters };
    logDebug('[useFilterState] Initialized state:', merged);
    return merged;
  });

  // Track validation state
  const [validationState, setValidationState] = useState({
    isValid: true,
    errors: [],
    warnings: []
  });

  // Debounce timer ref
  const debounceTimer = useRef(null);
  const lastValidState = useRef(filters);

  /**
   * Validate current filter state
   */
  const validateFilters = useCallback((filtersToValidate = filters) => {
    if (!validateOnUpdate) return { isValid: true, errors: [], warnings: [] };

    try {
      const validation = filterTransformService.validate(filtersToValidate);
      const normalizedValidation = {
        isValid: validation.valid !== undefined ? validation.valid : validation.isValid,
        errors: validation.errors || [],
        warnings: validation.warnings || []
      };
      setValidationState(normalizedValidation);
      return normalizedValidation;
    } catch (error) {
      logWarn('[useFilterState] Validation error:', error);
      const fallbackValidation = { isValid: false, errors: ['Validation failed'], warnings: [] };
      setValidationState(fallbackValidation);
      return fallbackValidation;
    }
  }, [filters, validateOnUpdate]);

  /**
   * Update filters with validation and debouncing
   */
  const updateFilters = useCallback((updates, immediate = false) => {
    const updatedFilters = { ...filters, ...updates };
    
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Update state immediately for UI responsiveness
    setFilters(updatedFilters);

    const performUpdate = () => {
      const validation = validateFilters(updatedFilters);
      
      if (validation.isValid) {
        lastValidState.current = updatedFilters;
      }

      // Call state change callback if provided
      if (onStateChange) {
        onStateChange(updatedFilters, validation);
      }

      logDebug('[useFilterState] Filters updated:', {
        filters: updatedFilters,
        validation
      });
    };

    if (immediate || debounceMs === 0) {
      performUpdate();
    } else {
      // Debounce the update
      debounceTimer.current = setTimeout(performUpdate, debounceMs);
    }
  }, [filters, onStateChange, debounceMs]);

  /**
   * Update a specific filter
   */
  const updateFilter = useCallback((key, value) => {
    if (!DEFAULT_FILTERS.hasOwnProperty(key)) {
      logWarn(`[useFilterState] Unknown filter key: ${key}`);
      return;
    }

    updateFilters({ [key]: value });
  }, [updateFilters]);

  /**
   * Clear a specific filter
   */
  const clearFilter = useCallback((key) => {
    if (!DEFAULT_FILTERS.hasOwnProperty(key)) {
      logWarn(`[useFilterState] Unknown filter key: ${key}`);
      return;
    }

    const defaultValue = DEFAULT_FILTERS[key];
    updateFilters({ [key]: defaultValue }, true);
  }, [updateFilters]);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setValidationState({ isValid: true, errors: [], warnings: [] });
    lastValidState.current = DEFAULT_FILTERS;
    
    if (onStateChange) {
      onStateChange(DEFAULT_FILTERS, { isValid: true, errors: [], warnings: [] });
    }
    
    logDebug('[useFilterState] All filters cleared');
  }, [onStateChange]);

  /**
   * Reset to initial state
   */
  const resetFilters = useCallback(() => {
    const resetState = { ...DEFAULT_FILTERS, ...initialFilters };
    setFilters(resetState);
    
    const validation = validateFilters(resetState);
    if (validation.isValid) {
      lastValidState.current = resetState;
    }
    
    logDebug('[useFilterState] Filters reset to initial state');
  }, [initialFilters]);

  /**
   * Get current API-formatted filters
   */
  const getApiFilters = useCallback(() => {
    return filterTransformService.toApiFormat(filters);
  }, [filters]);

  /**
   * Get URL parameters for current filters
   */
  const getUrlParams = useCallback(() => {
    return filterTransformService.toUrlParams(filters);
  }, [filters]);

  /**
   * Check if filters have any active values
   */
  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      const defaultValue = DEFAULT_FILTERS[key];
      
      if (Array.isArray(value)) {
        return value.length > 0;
      } else if (typeof value === 'object' && value !== null) {
        return value.min !== null || value.max !== null;
      } else {
        return value !== defaultValue;
      }
    });
  }, [filters]);

  /**
   * Get filter change summary
   */
  const getChangesSummary = useCallback(() => {
    const changes = {};
    
    Object.keys(filters).forEach(key => {
      const current = filters[key];
      const initial = initialFilters[key] || DEFAULT_FILTERS[key];
      
      if (JSON.stringify(current) !== JSON.stringify(initial)) {
        changes[key] = { from: initial, to: current };
      }
    });
    
    return changes;
  }, [filters, initialFilters]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Initial validation
  useEffect(() => {
    if (validateOnUpdate) {
      validateFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    // State
    filters,
    validationState,
    isValid: validationState.isValid,
    
    // Update functions
    updateFilters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    resetFilters,
    
    // Derived data
    getApiFilters,
    getUrlParams,
    hasActiveFilters,
    getChangesSummary,
    
    // Validation
    validateFilters,
    lastValidState: lastValidState.current,
    
    // Utils
    DEFAULT_FILTERS
  };
} 