import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { logDebug, logError } from '@/utils/logger';

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

const initialDataState = {
  cities: [],
  boroughs: [],
  neighborhoods: [],
  cuisines: []
};

const initialLoadingState = {
  cities: false,
  boroughs: false,
  neighborhoods: false,
  cuisines: false
};

const initialErrorState = {
  cities: null,
  boroughs: null,
  neighborhoods: null,
  cuisines: null
};

// Utility functions
const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== '';
};

// Create the enhanced filter store with persistence and data management
export const useFilterStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // === STATE ===
        filters: { ...initialFilterState },
        data: { ...initialDataState },
        loading: { ...initialLoadingState },
        errors: { ...initialErrorState },
        
        // === COMPUTED PROPERTIES ===
        hasActiveFilters: () => {
          const { filters } = get();
          return Object.values(filters).some(hasValue);
        },
        
        getActiveFilterCount: () => {
          const { filters } = get();
          return Object.entries(filters).reduce((count, [key, value]) => {
            if (Array.isArray(value)) {
              return count + value.length;
            }
            return count + (hasValue(value) ? 1 : 0);
          }, 0);
        },
        
        getApiFormat: () => {
          const { filters } = get();
          
          // Do the transformation inline to avoid async issues
          const apiParams = {};
          const apiFieldMapping = {
            city: 'cityId',
            borough: 'boroughId',
            neighborhood: 'neighborhoodId',
            cuisine: 'hashtags',
            hashtag: 'hashtags'
          };
          
          Object.entries(filters).forEach(([key, value]) => {
            if (!hasValue(value)) return;
            
            const apiKey = apiFieldMapping[key] || key;
            
            if (Array.isArray(value)) {
              apiParams[apiKey] = value.length === 1 ? value[0] : value.join(',');
            } else if (typeof value === 'object' && value !== null && (value.min !== undefined || value.max !== undefined)) {
              if (value.min !== undefined) apiParams[`${apiKey}_min`] = value.min;
              if (value.max !== undefined) apiParams[`${apiKey}_max`] = value.max;
            } else {
              apiParams[apiKey] = value;
            }
          });
          
          return apiParams;
        },
        
        // === FILTER ACTIONS ===
        setFilter: (type, value) => {
          logDebug(`[FilterStore] Setting ${type} filter to:`, value);
          set((state) => ({
            filters: {
              ...state.filters,
              [type]: value,
            },
          }));
          
          // Clear dependent filters when parent changes
          if (type === FILTER_TYPES.CITY) {
            set((state) => ({
              filters: {
                ...state.filters,
                [FILTER_TYPES.BOROUGH]: null,
                [FILTER_TYPES.NEIGHBORHOOD]: null,
              },
              data: {
                ...state.data,
                boroughs: [],
                neighborhoods: []
              }
            }));
          } else if (type === FILTER_TYPES.BOROUGH) {
            set((state) => ({
              filters: {
                ...state.filters,
                [FILTER_TYPES.NEIGHBORHOOD]: null,
              },
              data: {
                ...state.data,
                neighborhoods: []
              }
            }));
          }
        },
        
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
        
        clearFilters: (type = null) => {
          if (type) {
            logDebug(`[FilterStore] Clearing ${type} filter`);
            set((state) => ({
              filters: {
                ...state.filters,
                [type]: Array.isArray(initialFilterState[type]) ? [] : null,
              },
            }));
          } else {
            logDebug('[FilterStore] Clearing all filters');
            set({ filters: { ...initialFilterState } });
          }
        },
        
        // === DATA FETCHING ACTIONS (Updated to use unified FilterService) ===
        fetchCities: async () => {
          if (get().loading.cities) return get().data.cities;
          
          try {
            set((state) => ({ loading: { ...state.loading, cities: true }, errors: { ...state.errors, cities: null } }));
            
            // Import the unified filter service dynamically to avoid circular dependencies
            const { filterService } = await import('@/services/filters/FilterService');
            const cities = await filterService.getCities();
            
            set((state) => ({ 
              data: { ...state.data, cities },
              loading: { ...state.loading, cities: false }
            }));
            
            logDebug('[FilterStore] Fetched cities:', cities.length);
            return cities;
          } catch (error) {
            logError('[FilterStore] Error fetching cities:', error);
            set((state) => ({ 
              loading: { ...state.loading, cities: false },
              errors: { ...state.errors, cities: error.message }
            }));
            return [];
          }
        },
        
        fetchBoroughs: async (cityId) => {
          if (!cityId) {
            set((state) => ({ data: { ...state.data, boroughs: [] } }));
            return [];
          }
          
          if (get().loading.boroughs) return get().data.boroughs;
          
          try {
            set((state) => ({ loading: { ...state.loading, boroughs: true }, errors: { ...state.errors, boroughs: null } }));
            
            const { filterService } = await import('@/services/filters/FilterService');
            const boroughs = await filterService.getBoroughs(cityId);
            
            set((state) => ({ 
              data: { ...state.data, boroughs },
              loading: { ...state.loading, boroughs: false }
            }));
            
            logDebug('[FilterStore] Fetched boroughs:', boroughs.length);
            return boroughs;
          } catch (error) {
            logError('[FilterStore] Error fetching boroughs:', error);
            set((state) => ({ 
              loading: { ...state.loading, boroughs: false },
              errors: { ...state.errors, boroughs: error.message }
            }));
            return [];
          }
        },
        
        fetchNeighborhoods: async (boroughId) => {
          if (!boroughId) {
            set((state) => ({ data: { ...state.data, neighborhoods: [] } }));
            return [];
          }
          
          if (get().loading.neighborhoods) return get().data.neighborhoods;
          
          try {
            set((state) => ({ loading: { ...state.loading, neighborhoods: true }, errors: { ...state.errors, neighborhoods: null } }));
            
            const { filterService } = await import('@/services/filters/FilterService');
            const neighborhoods = await filterService.getNeighborhoods(boroughId);
            
            set((state) => ({ 
              data: { ...state.data, neighborhoods },
              loading: { ...state.loading, neighborhoods: false }
            }));
            
            logDebug('[FilterStore] Fetched neighborhoods:', neighborhoods.length);
            return neighborhoods;
          } catch (error) {
            logError('[FilterStore] Error fetching neighborhoods:', error);
            set((state) => ({ 
              loading: { ...state.loading, neighborhoods: false },
              errors: { ...state.errors, neighborhoods: error.message }
            }));
            return [];
          }
        },
        
        fetchCuisines: async (searchTerm = '', limit = 50) => {
          if (get().loading.cuisines) return get().data.cuisines;
          
          try {
            set((state) => ({ loading: { ...state.loading, cuisines: true }, errors: { ...state.errors, cuisines: null } }));
            
            const { filterService } = await import('@/services/filters/FilterService');
            const cuisines = await filterService.getCuisines(searchTerm, limit);
            
            set((state) => ({ 
              data: { ...state.data, cuisines },
              loading: { ...state.loading, cuisines: false }
            }));
            
            logDebug('[FilterStore] Fetched cuisines:', cuisines.length);
            return cuisines;
          } catch (error) {
            logError('[FilterStore] Error fetching cuisines:', error);
            set((state) => ({ 
              loading: { ...state.loading, cuisines: false },
              errors: { ...state.errors, cuisines: error.message }
            }));
            return [];
          }
        },
        
        // === ENHANCED BATCH FETCHING ===
        fetchAllFilterData: async (options = {}) => {
          try {
            logDebug('[FilterStore] Fetching all filter data in parallel');
            
            const { filterService } = await import('@/services/filters/FilterService');
            const results = await filterService.getAllFilterData(options);
            
            set((state) => ({
              data: {
                ...state.data,
                ...results
              },
              loading: { ...initialLoadingState }
            }));
            
            logDebug('[FilterStore] Successfully fetched all filter data');
            return results;
          } catch (error) {
            logError('[FilterStore] Error fetching all filter data:', error);
            set((state) => ({
              loading: { ...initialLoadingState },
              errors: {
                cities: error.message,
                boroughs: error.message,
                neighborhoods: error.message,
                cuisines: error.message
              }
            }));
            return {};
          }
        },
        
        // === INITIALIZATION ===
        initializeData: async () => {
          const { fetchAllFilterData } = get();
          await fetchAllFilterData();
        },
        
        // === UTILITIES ===
        resetToInitialState: () => {
          set({
            filters: { ...initialFilterState },
            data: { ...initialDataState },
            loading: { ...initialLoadingState },
            errors: { ...initialErrorState }
          });
        }
      }),
      {
        name: 'doof-filter-storage',
        partialize: (state) => ({ 
          filters: state.filters 
        }),
        version: 3, // Increment version for Phase 2 changes
      }
    ),
    { name: 'FilterStore' }
  )
); 