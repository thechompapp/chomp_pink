import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logDebug } from '@/utils/logger';

// Filter types
export const FILTER_TYPES = {
  CITY: 'city',
  BOROUGH: 'borough',
  NEIGHBORHOOD: 'neighborhood',
  CUISINE: 'cuisine',
  HASHTAG: 'hashtag',
  PRICE: 'price',
};

// Initialize with an empty filter state
const initialFilterState = {
  [FILTER_TYPES.CITY]: null,
  [FILTER_TYPES.BOROUGH]: null,
  [FILTER_TYPES.NEIGHBORHOOD]: null,
  [FILTER_TYPES.CUISINE]: [],
  [FILTER_TYPES.HASHTAG]: [],
  [FILTER_TYPES.PRICE]: null,
};

// Create the filter store with persistence
export const useFilterStore = create(
  persist(
    (set, get) => ({
      // Current filter values
      filters: { ...initialFilterState },
      
      // Update a single filter
      setFilter: (type, value) => {
        logDebug(`[FilterStore] Setting ${type} filter to:`, value);
        set((state) => ({
          filters: {
            ...state.filters,
            [type]: value,
          },
        }));
      },
      
      // Toggle item in array filter (for multi-select filters like cuisines)
      toggleArrayFilter: (type, item) => {
        if (!Array.isArray(get().filters[type])) {
          logDebug(`[FilterStore] Cannot toggle - ${type} is not an array filter`);
          return;
        }
        
        set((state) => {
          const currentValues = state.filters[type];
          const newValues = currentValues.includes(item) 
            ? currentValues.filter(i => i !== item)
            : [...currentValues, item];
          
          logDebug(`[FilterStore] Toggled ${item} in ${type} filter:`, newValues);
          
          return {
            filters: {
              ...state.filters,
              [type]: newValues,
            }
          };
        });
      },
      
      // Clear all filters or specific filter type
      clearFilters: (type = null) => {
        if (type) {
          // Clear specific filter type
          logDebug(`[FilterStore] Clearing ${type} filter`);
          set((state) => ({
            filters: {
              ...state.filters,
              [type]: Array.isArray(initialFilterState[type]) ? [] : null,
            },
          }));
        } else {
          // Clear all filters
          logDebug('[FilterStore] Clearing all filters');
          set({ filters: { ...initialFilterState } });
        }
      },
      
      // Check if any filters are active
      hasActiveFilters: () => {
        const { filters } = get();
        return Object.entries(filters).some(([key, value]) => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== null && value !== undefined;
        });
      },
      
      // Get active filter count
      getActiveFilterCount: () => {
        const { filters } = get();
        return Object.entries(filters).reduce((count, [key, value]) => {
          if (Array.isArray(value)) {
            return count + value.length;
          }
          return count + (value !== null && value !== undefined ? 1 : 0);
        }, 0);
      }
    }),
    {
      name: 'doof-filter-storage',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
); 