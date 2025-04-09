/* src/stores/useUIStateStore.ts */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { filterService } from '@/services/filterService.js';
import type { City, Neighborhood, Cuisine } from '@/types/Filters';

interface UIState {
  searchQuery: string;
  isSearchOpen: boolean;
  showFilterBar: boolean;
  isLoading: boolean;
  triggerRefresh: boolean;

  cities: City[];
  neighborhoods: Neighborhood[];
  cuisines: Cuisine[];

  cityId: number | null;
  neighborhoodId: number | null;
  hashtags: string[];

  isLoadingCities: boolean;
  isLoadingNeighborhoods: boolean;
  isLoadingCuisines: boolean;

  errorCities: string | null;
  errorNeighborhoods: string | null;
  errorCuisines: string | null;

  loadedNeighborhoodsForCityId: number | null;

  // Actions
  fetchCities: () => Promise<void>;
  fetchNeighborhoods: (cityId: number) => Promise<void>;
  fetchCuisines: () => Promise<void>;
  setCityId: (cityId: number | null) => void;
  setNeighborhoodId: (neighborhoodId: number | null) => void;
  setHashtags: (hashtags: string[]) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  setShowFilterBar: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  toggleRefresh: () => void;
  clearAllFilters: () => void;
}

export const useUIStateStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial UI State
        searchQuery: '',
        isSearchOpen: false,
        showFilterBar: true,
        isLoading: false,
        triggerRefresh: false,

        // Filter Data
        cities: [],
        neighborhoods: [],
        cuisines: [],

        // IDs
        cityId: null,
        neighborhoodId: null,
        hashtags: [],

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
          if (typeof cityId !== 'number' || cityId <= 0) {
            console.warn('[UIStateStore] Invalid cityId for fetching neighborhoods:', cityId);
            set({
              neighborhoods: [],
              loadedNeighborhoodsForCityId: null,
              errorNeighborhoods: null,
              isLoadingNeighborhoods: false,
            });
            return;
          }
          if (get().isLoadingNeighborhoods || get().loadedNeighborhoodsForCityId === cityId) {
            return;
          }
          set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
          try {
            const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
            set({
              neighborhoods: Array.isArray(neighborhoods) ? neighborhoods : [],
              isLoadingNeighborhoods: false,
              loadedNeighborhoodsForCityId: cityId,
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch neighborhoods';
            console.error('[UIStateStore] Error fetching neighborhoods for city', cityId, ':', error);
            set({
              neighborhoods: [],
              isLoadingNeighborhoods: false,
              errorNeighborhoods: message,
            });
          }
        },

        fetchCuisines: async () => {
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

        setCityId: (cityId) => {
          if (get().cityId !== cityId) {
            console.log(`[UIStateStore] Setting cityId to: ${cityId}`);
            const nextCityId = typeof cityId === 'number' && cityId > 0 ? cityId : null;
            set({
              cityId: nextCityId,
              neighborhoodId: null,
              neighborhoods: [],
              loadedNeighborhoodsForCityId: null,
              errorNeighborhoods: null,
            });
            if (nextCityId !== null) {
              get().fetchNeighborhoods(nextCityId); // Use get() to call another action
            }
          }
        },

        setNeighborhoodId: (neighborhoodId) => {
          if (get().neighborhoodId !== neighborhoodId) {
            const nextNeighborhoodId = typeof neighborhoodId === 'number' && neighborhoodId > 0 ? neighborhoodId : null;
            console.log(`[UIStateStore] Setting neighborhoodId to: ${nextNeighborhoodId}`);
            set({ neighborhoodId: nextNeighborhoodId });
          }
        },

        setHashtags: (hashtags) => {
          if (Array.isArray(hashtags) && hashtags.every((tag) => typeof tag === 'string')) {
            const currentHashtags = get().hashtags;
            if (JSON.stringify(hashtags) !== JSON.stringify(currentHashtags)) {
              console.log(`[UIStateStore] Setting hashtags:`, hashtags);
              set({ hashtags });
            }
          } else {
            console.warn('[UIStateStore] Attempted to set invalid hashtags:', hashtags);
          }
        },

        setSearchQuery: (query) => {
          if (typeof query === 'string') {
            if (get().searchQuery !== query) {
              console.log(`[UIStateStore] Setting searchQuery to: ${query}`);
              set({ searchQuery: query });
            }
          } else {
            console.warn('[UIStateStore] Attempted to set invalid search query:', query);
          }
        },

        clearAllFilters: () => {
          const { cityId, neighborhoodId, hashtags } = get();
          if (cityId !== null || neighborhoodId !== null || hashtags.length > 0) {
            console.log('[UIStateStore] Clearing all filters');
            set({
              cityId: null,
              neighborhoodId: null,
              hashtags: [],
              neighborhoods: [],
              loadedNeighborhoodsForCityId: null,
              errorNeighborhoods: null,
            });
          }
        },

        setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
        setShowFilterBar: (show) => set({ showFilterBar: show }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        toggleRefresh: () => set((state) => ({ triggerRefresh: !state.triggerRefresh })),
      }),
      {
        name: 'ui-state-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          cityId: state.cityId,
          neighborhoodId: state.neighborhoodId,
          hashtags: state.hashtags,
          searchQuery: state.searchQuery,
          showFilterBar: state.showFilterBar,
        }),
        onRehydrateStorage: () => {
          console.log('[UIStateStore] Rehydration complete.');
          setTimeout(() => {
            // Corrected: Use useUIStateStore.getState() to access the current state
            const state = useUIStateStore.getState();
            if (state.cityId && !state.isLoadingNeighborhoods && state.loadedNeighborhoodsForCityId !== state.cityId) {
              console.log('[UIStateStore onRehydrate] Fetching neighborhoods for rehydrated cityId:', state.cityId);
              state.fetchNeighborhoods(state.cityId);
            }
            if (!state.isLoadingCities && (!state.cities || state.cities.length === 0)) {
              console.log('[UIStateStore onRehydrate] Fetching initial cities.');
              state.fetchCities();
            }
            if (!state.isLoadingCuisines && (!state.cuisines || state.cuisines.length === 0)) {
               console.log('[UIStateStore onRehydrate] Fetching initial cuisines.');
              state.fetchCuisines();
            }
          }, 1);
        },
      }
    ),
    { name: 'UIStateStore' }
  )
);