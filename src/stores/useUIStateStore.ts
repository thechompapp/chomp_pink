/* src/stores/useUIStateStore.ts */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { filterService } from '@/services/filterService'; // Use typed service
import type { City, Neighborhood, Cuisine } from '@/types/Filters'; // Import types

// Define State and Actions Interfaces
interface UIState {
  cities: City[];
  neighborhoods: Neighborhood[];
  cuisines: Cuisine[];
  cityId: number | null; // Store ID as number or null
  neighborhoodId: number | null; // Store ID as number or null
  hashtags: string[]; // Keep as string array for selected tags
  searchQuery: string;
  isLoadingCities: boolean;
  isLoadingNeighborhoods: boolean;
  isLoadingCuisines: boolean;
  errorCities: string | null;
  errorNeighborhoods: string | null;
  errorCuisines: string | null;
  // Track which city's neighborhoods are loaded to avoid refetch
  loadedNeighborhoodsForCityId: number | null;
}

interface UIActions {
  fetchCities: () => Promise<void>;
  fetchNeighborhoods: (cityId: number) => Promise<void>; // Expect number
  fetchCuisines: () => Promise<void>;
  setCityId: (cityId: number | null) => void; // Accept number or null
  setNeighborhoodId: (neighborhoodId: number | null) => void; // Accept number or null
  setHashtags: (hashtags: string[]) => void; // Expect string array
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

type UIStateStore = UIState & UIActions;

// Create the store with types
const useUIStateStore = create<UIStateStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      cities: [],
      neighborhoods: [],
      cuisines: [],
      cityId: null,
      neighborhoodId: null,
      hashtags: [],
      searchQuery: '',
      isLoadingCities: false,
      isLoadingNeighborhoods: false,
      isLoadingCuisines: false,
      errorCities: null,
      errorNeighborhoods: null,
      errorCuisines: null,
      loadedNeighborhoodsForCityId: null, // Track loaded city

      // Actions
      fetchCities: async () => {
        if (get().isLoadingCities || get().cities.length > 0) return;
        set({ isLoadingCities: true, errorCities: null });
        try {
          const cities = await filterService.getCities();
          set({ cities: cities, isLoadingCities: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch cities';
          console.error('[UIStateStore] Error fetching cities:', error);
          set({ cities: [], isLoadingCities: false, errorCities: message });
        }
      },

      fetchNeighborhoods: async (cityId: number) => {
        if (typeof cityId !== 'number' || cityId <= 0) {
          console.warn('[UIStateStore fetchNeighborhoods] Invalid cityId provided:', cityId);
          if (get().neighborhoods.length > 0 || get().loadedNeighborhoodsForCityId !== null) {
            set({ neighborhoods: [], loadedNeighborhoodsForCityId: null, errorNeighborhoods: null });
          }
          return;
        }
        if (get().isLoadingNeighborhoods || get().loadedNeighborhoodsForCityId === cityId) {
          return;
        }
        set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
        try {
          const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
          set({
            neighborhoods,
            isLoadingNeighborhoods: false,
            loadedNeighborhoodsForCityId: cityId,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch neighborhoods';
          console.error('[UIStateStore] Error fetching neighborhoods:', error);
          set({
            neighborhoods: [],
            isLoadingNeighborhoods: false,
            errorNeighborhoods: message,
            loadedNeighborhoodsForCityId: cityId,
          });
        }
      },

      fetchCuisines: async () => {
        if (get().isLoadingCuisines || get().cuisines.length > 0) return;
        set({ isLoadingCuisines: true, errorCuisines: null });
        try {
          const cuisines = await filterService.getCuisines();
          set({ cuisines, isLoadingCuisines: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch cuisines';
          console.error('[UIStateStore] Error fetching cuisines:', error);
          set({ cuisines: [], isLoadingCuisines: false, errorCuisines: message });
        }
      },

      setCityId: (newCityId) => {
        if (get().cityId !== newCityId) {
          console.log(`[UIStateStore] Setting cityId to: ${newCityId}`);
          set({
            cityId: newCityId,
            neighborhoodId: null,
            neighborhoods: [],
            loadedNeighborhoodsForCityId: null,
            errorNeighborhoods: null,
          });
          if (newCityId !== null && newCityId > 0) {
            get().fetchNeighborhoods(newCityId);
          }
        }
      },

      setNeighborhoodId: (newNeighborhoodId) => {
        if (get().neighborhoodId !== newNeighborhoodId) {
          console.log(`[UIStateStore] Setting neighborhoodId to: ${newNeighborhoodId}`);
          set({ neighborhoodId: newNeighborhoodId });
        }
      },

      setHashtags: (hashtags) => {
        if (Array.isArray(hashtags) && hashtags.every(tag => typeof tag === 'string')) {
          console.log(`[UIStateStore] Setting hashtags to:`, hashtags);
          set({ hashtags });
        } else {
          console.warn('[UIStateStore] Invalid hashtags provided:', hashtags);
        }
      },

      setSearchQuery: (query) => {
        if (typeof query === 'string') {
          console.log(`[UIStateStore] Setting searchQuery to: "${query}"`);
          set({ searchQuery: query });
        } else {
          console.warn('[UIStateStore] Invalid searchQuery provided:', query);
        }
      },

      clearAllFilters: () => {
        console.log('[UIStateStore] Clearing all filters');
        set({
          cityId: null,
          neighborhoodId: null,
          hashtags: [],
          searchQuery: '',
          neighborhoods: [],
          loadedNeighborhoodsForCityId: null,
          errorNeighborhoods: null,
        });
      },
    }),
    { name: 'UIStateStore' } // Devtools name
  )
);

export default useUIStateStore;