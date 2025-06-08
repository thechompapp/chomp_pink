/**
 * FilterContext.jsx - Simplified State Management Only
 * 
 * Single Responsibility: Pure filter state management
 * - No business logic
 * - No data fetching
 * - No caching
 * - No validation
 * - Clean state updates only
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as FILTER_ACTIONS from './filterConstants';

// Simplified initial state
const initialState = {
  filters: {
    city: null,
    borough: null,
    neighborhood: null,
    cuisine: [],
    hashtag: []
  },
  meta: {
    hasActiveFilters: false,
    lastUpdated: null
  }
};

/**
 * Simplified reducer - pure state updates only
 */
function filterReducer(state, action) {
  switch (action.type) {
    case FILTER_ACTIONS.SET_FILTER: {
      const { key, value } = action.payload;
      const newFilters = { ...state.filters, [key]: value };
      return {
        ...state,
        filters: newFilters,
        meta: {
          ...state.meta,
          hasActiveFilters: Object.values(newFilters).some(v => 
            v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
          ),
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    case FILTER_ACTIONS.CLEAR_FILTER: {
      const key = action.payload;
      const newFilters = { ...state.filters };
      newFilters[key] = Array.isArray(newFilters[key]) ? [] : null;
      return {
        ...state,
        filters: newFilters,
        meta: {
          ...state.meta,
          hasActiveFilters: Object.values(newFilters).some(v => 
            v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
          ),
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    case FILTER_ACTIONS.CLEAR_ALL_FILTERS: {
      return {
        ...state,
        filters: { ...initialState.filters },
        meta: {
          ...state.meta,
          hasActiveFilters: false,
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    default:
      return state;
  }
}

// Create context
const FilterContext = createContext(null);

/**
 * Simplified FilterProvider - state management only
 */
export function FilterProvider({ children, initialFilters = {} }) {
  const [state, dispatch] = useReducer(filterReducer, {
    ...initialState,
    filters: { ...initialState.filters, ...initialFilters }
  });

  // Action creators
  const setFilter = useCallback((key, value) => {
    dispatch({ type: FILTER_ACTIONS.SET_FILTER, payload: { key, value } });
  }, []);

  const clearFilter = useCallback((key) => {
    dispatch({ type: FILTER_ACTIONS.CLEAR_FILTER, payload: key });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: FILTER_ACTIONS.CLEAR_ALL_FILTERS });
  }, []);

  const value = {
    state,
    actions: {
      setFilter,
      clearFilter,
      clearAllFilters
    }
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * Hook to use filter context
 */
export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
} 