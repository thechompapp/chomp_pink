/* src/stores/useUIStateStore.ts */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { filterService } from '@/services/filterService'; // Assuming alias setup
import type { City, Neighborhood, Cuisine } from '@/types/Filters'; // Use Filter types

interface UIState {
  // Removed deprecated string-based state
  // city: string | null;
  // neighborhood: string | null;
  // selectedHashtags: string[]; // Replaced by hashtags
  searchQuery: string;
  isSearchOpen: boolean;
  showFilterBar: boolean;
  isLoading: boolean; // General purpose loading? Keep if needed.
  triggerRefresh: boolean;

  cities: City[];
  neighborhoods: Neighborhood[];
  cuisines: Cuisine[];

  cityId: number | null;
  neighborhoodId: number | null;
  hashtags: string[]; // Use this for selected tags

  isLoadingCities: boolean;
  isLoadingNeighborhoods: boolean;
  isLoadingCuisines: boolean;

  errorCities: string | null;
  errorNeighborhoods: string | null;
  errorCuisines: string | null;

  loadedNeighborhoodsForCityId: number | null; // Track which city's neighborhoods are loaded

  // Actions
  fetchCities: () => Promise<void>;
  fetchNeighborhoods: (cityId: number) => Promise<void>;
  fetchCuisines: () => Promise<void>;

  // setCity: (city: string | null) => void; // Deprecated
  // setNeighborhood: (neighborhood: string | null) => void; // Deprecated
  setCityId: (cityId: number | null) => void;
  setNeighborhoodId: (neighborhoodId: number | null) => void;
  setHashtags: (hashtags: string[]) => void; // Implementation completed
  setSearchQuery: (query: string) => void; // Implementation completed
  setIsSearchOpen: (isOpen: boolean) => void;
  setShowFilterBar: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  toggleRefresh: () => void;
  clearAllFilters: () => void; // Implementation completed
}

export const useUIStateStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial UI State
        // city: null, // Deprecated
        // neighborhood: null, // Deprecated
        // selectedHashtags: [], // Deprecated
        searchQuery: '',
        isSearchOpen: false,
        showFilterBar: true, // Default to showing filter bar
        isLoading: false,
        triggerRefresh: false,

        // Filter Data
        cities: [],
        neighborhoods: [],
        cuisines: [],

        // IDs
        cityId: null,
        neighborhoodId: null,
        hashtags: [], // Use this for selected hashtags

        // Loaders
        isLoadingCities: false,
        isLoadingNeighborhoods: false,
        isLoadingCuisines: false,

        // Errors
        errorCities: null,
        errorNeighborhoods: null,
        errorCuisines: null,

        // Fetched tracker
        loadedNeighborhoodsForCityId: null,

        // Actions
        fetchCities: async () => {
          // Prevent refetch if already loading or data exists
          if (get().isLoadingCities || get().cities.length > 0) return;
          set({ isLoadingCities: true, errorCities: null });
          try {
            const cities = await filterService.getCities();
            set({ cities: Array.isArray(cities) ? cities : [], isLoadingCities: false });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch cities';
            console.error('[UIStateStore] Error fetching cities:', error);
            set({ cities: [], isLoadingCities: false, errorCities: message });
          }
        },

        fetchNeighborhoods: async (cityId: number) => {
          // Validate cityId before fetching
          if (typeof cityId !== 'number' || cityId <= 0) {
            console.warn('[UIStateStore] Invalid cityId for fetching neighborhoods:', cityId);
            set({
              neighborhoods: [],
              loadedNeighborhoodsForCityId: null,
              errorNeighborhoods: null, // Clear any previous error
              isLoadingNeighborhoods: false // Ensure loading is false
            });
            return;
          }

          // Prevent refetch if already loading or neighborhoods for this city are loaded
          if (get().isLoadingNeighborhoods || get().loadedNeighborhoodsForCityId === cityId) {
            return;
          }

          set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });

          try {
            const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
            set({
              neighborhoods: Array.isArray(neighborhoods) ? neighborhoods : [],
              isLoadingNeighborhoods: false,
              loadedNeighborhoodsForCityId: cityId, // Track loaded city ID
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch neighborhoods';
            console.error('[UIStateStore] Error fetching neighborhoods for city', cityId, ':', error);
            set({
              neighborhoods: [], // Clear neighborhoods on error
              isLoadingNeighborhoods: false,
              errorNeighborhoods: message,
              loadedNeighborhoodsForCityId: cityId, // Still mark as attempted load for this city
            });
          }
        },

        fetchCuisines: async () => {
          // Prevent refetch if already loading or data exists
          if (get().isLoadingCuisines || get().cuisines.length > 0) return;
          set({ isLoadingCuisines: true, errorCuisines: null });

          try {
            const cuisines = await filterService.getCuisines();
            set({ cuisines: Array.isArray(cuisines) ? cuisines : [], isLoadingCuisines: false });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch cuisines';
            console.error('[UIStateStore] Error fetching cuisines:', error);
            set({ cuisines: [], isLoadingCuisines: false, errorCuisines: message });
          }
        },

        // --- State Setters ---
        // setCity: (city) => set({ city }), // Deprecated
        // setNeighborhood: (neighborhood) => set({ neighborhood }), // Deprecated

        setCityId: (cityId) => {
          // Only update and trigger neighborhood fetch if the ID actually changes
          if (get().cityId !== cityId) {
            console.log(`[UIStateStore] Setting cityId to: ${cityId}`);
            const nextCityId = (typeof cityId === 'number' && cityId > 0) ? cityId : null;
            set({
              cityId: nextCityId,
              neighborhoodId: null, // Always clear neighborhood ID when city changes
              neighborhoods: [], // Clear neighborhood data
              loadedNeighborhoodsForCityId: null, // Reset loaded tracker
              errorNeighborhoods: null, // Clear neighborhood errors
            });
            // Trigger fetch if a valid city ID is set
            if (nextCityId !== null) {
              get().fetchNeighborhoods(nextCityId);
            }
          }
        },

        setNeighborhoodId: (neighborhoodId) => {
          // Only update if the ID actually changes
          if (get().neighborhoodId !== neighborhoodId) {
            const nextNeighborhoodId = (typeof neighborhoodId === 'number' && neighborhoodId > 0) ? neighborhoodId : null;
            console.log(`[UIStateStore] Setting neighborhoodId to: ${nextNeighborhoodId}`);
            set({ neighborhoodId: nextNeighborhoodId });
          }
        },

        // --- Completed Implementations ---
        setHashtags: (hashtags) => {
          // Ensure input is an array of strings
          if (Array.isArray(hashtags) && hashtags.every(tag => typeof tag === 'string')) {
            // Only update if the array content has changed (simple length/content check)
            const currentHashtags = get().hashtags;
            if (hashtags.length !== currentHashtags.length || !hashtags.every(tag => currentHashtags.includes(tag))) {
              console.log(`[UIStateStore] Setting hashtags:`, hashtags);
              set({ hashtags });
            }
          } else {
            console.warn('[UIStateStore] Attempted to set invalid hashtags:', hashtags);
          }
        },

        setSearchQuery: (query) => {
          // Ensure input is a string
          if (typeof query === 'string') {
            // Only update if the query has changed
            if (get().searchQuery !== query) {
              set({ searchQuery: query });
            }
          } else {
            console.warn('[UIStateStore] Attempted to set invalid search query:', query);
          }
        },

        clearAllFilters: () => {
          // Check if there are actually filters to clear before updating state
          const { cityId, neighborhoodId, hashtags } = get();
          if (cityId !== null || neighborhoodId !== null || hashtags.length > 0) {
            console.log('[UIStateStore] Clearing all filters');
            set({
              cityId: null,
              neighborhoodId: null,
              hashtags: [],
              // Do NOT clear searchQuery here unless intended
              // searchQuery: '',
              neighborhoods: [], // Clear fetched neighborhood data
              loadedNeighborhoodsForCityId: null, // Reset loaded tracker
              errorNeighborhoods: null, // Clear neighborhood errors
            });
          }
        },
        // --- End Completed Implementations ---

        setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
        setShowFilterBar: (show) => set({ showFilterBar: show }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        toggleRefresh: () => set((state) => ({ triggerRefresh: !state.triggerRefresh })),
      }),
      {
        name: 'ui-state-storage', // Name for localStorage key
        storage: createJSONStorage(() => localStorage), // Use localStorage
        partialize: (state) => ({ // Only persist selected fields
          cityId: state.cityId,
          neighborhoodId: state.neighborhoodId,
          hashtags: state.hashtags,
          searchQuery: state.searchQuery,
          showFilterBar: state.showFilterBar,
          // Don't persist transient state like loaders, errors, fetched data
        }),
        onRehydrateStorage: (state) => { // Optional: Action after rehydration
          console.log('[UIStateStore] Rehydration complete.');
          // Maybe trigger fetches if needed based on rehydrated IDs?
          if (state?.cityId && !state.isLoadingNeighborhoods && state.loadedNeighborhoodsForCityId !== state.cityId) {
             state.fetchNeighborhoods(state.cityId);
          }
          // Check if cities/cuisines are needed based on persisted state/length
          if (!state?.isLoadingCities && (!state?.cities || state?.cities.length === 0)) {
             state.fetchCities();
          }
          if (!state?.isLoadingCuisines && (!state?.cuisines || state?.cuisines.length === 0)) {
             state.fetchCuisines();
          }
        },
      }
    ),
    { name: 'UIStateStore' } // Devtools name
  )
);