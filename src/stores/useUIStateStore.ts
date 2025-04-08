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
  searchQuery: string; // Added based on SearchBar usage
  isLoadingCities: boolean;
  isLoadingNeighborhoods: boolean;
  isLoadingCuisines: boolean;
  errorCities: string | null;
  errorNeighborhoods: string | null;
  errorCuisines: string | null;
}

interface UIActions {
  fetchCities: () => Promise<void>;
  fetchNeighborhoods: (cityId: number) => Promise<void>; // Expect number
  fetchCuisines: () => Promise<void>;
  setCityId: (cityId: number | null) => void; // Accept number or null
  setNeighborhoodId: (neighborhoodId: number | null) => void; // Accept number or null
  setHashtags: (hashtags: string[]) => void; // Expect string array
  setSearchQuery: (query: string) => void; // Added
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
      searchQuery: '', // Added initial state
      isLoadingCities: false,
      isLoadingNeighborhoods: false,
      isLoadingCuisines: false,
      errorCities: null,
      errorNeighborhoods: null,
      errorCuisines: null,

      // Actions
      fetchCities: async () => {
        if (get().isLoadingCities) return;
        set({ isLoadingCities: true, errorCities: null });
        try {
          // filterService returns typed City[]
          const cities = await filterService.getCities();
          set({ cities: cities, isLoadingCities: false });
        } catch (error: any) {
          console.error('[UIStateStore] Error fetching cities:', error);
          set({ cities: [], isLoadingCities: false, errorCities: error?.message || 'Failed' });
        }
      },

      fetchNeighborhoods: async (cityId) => {
        // Basic check, route handler should also validate
        if (!cityId || cityId <= 0) {
          set({ neighborhoods: [], errorNeighborhoods: null }); // Clear if cityId invalid
          return;
        }
        // Avoid refetch if already loading *for the same city* might be needed
        // For simplicity, basic loading check here
        if (get().isLoadingNeighborhoods) return;
        set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
        try {
           // filterService returns typed Neighborhood[]
          const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
          set({ neighborhoods, isLoadingNeighborhoods: false });
        } catch (error: any) {
          console.error('[UIStateStore] Error fetching neighborhoods:', error);
          set({ neighborhoods: [], isLoadingNeighborhoods: false, errorNeighborhoods: error?.message || 'Failed' });
        }
      },

      fetchCuisines: async () => {
        if (get().isLoadingCuisines) return;
        set({ isLoadingCuisines: true, errorCuisines: null });
        try {
          // filterService returns typed Cuisine[]
          const cuisines = await filterService.getCuisines();
          set({ cuisines, isLoadingCuisines: false });
        } catch (error: any) {
          console.error('[UIStateStore] Error fetching cuisines:', error);
          set({ cuisines: [], isLoadingCuisines: false, errorCuisines: error?.message || 'Failed' });
        }
      },

      setCityId: (newCityId) => {
        // Only update if the ID has actually changed
        if (get().cityId !== newCityId) {
          console.log(`[UIStateStore] Setting cityId to: ${newCityId}`);
          set({
            cityId: newCityId,
            neighborhoodId: null, // Reset neighborhood when city changes
            // Decide if hashtags should be reset when city changes - currently not resetting
            // hashtags: [],
          });
        }
      },

      setNeighborhoodId: (newNeighborhoodId) => {
         if (get().neighborhoodId !== newNeighborhoodId) {
             console.log(`[UIStateStore] Setting neighborhoodId to: ${newNeighborhoodId}`);
             set({
                neighborhoodId: newNeighborhoodId,
                 // Decide if hashtags should be reset when neighborhood changes - currently not resetting
                 // hashtags: [],
             });
         }
      },

      setHashtags: (newHashtags) => {
        // Ensure it's always an array
        const currentHashtags = get().hashtags;
        const nextHashtags = Array.isArray(newHashtags) ? newHashtags : [];
        // Basic check to avoid unnecessary updates if array content is identical
        if (currentHashtags.length !== nextHashtags.length || !currentHashtags.every((tag, i) => tag === nextHashtags[i])) {
            console.log(`[UIStateStore] Setting hashtags to:`, nextHashtags);
            set({ hashtags: nextHashtags });
        }
      },

       setSearchQuery: (query: string) => {
           if (get().searchQuery !== query) {
                set({ searchQuery: query });
           }
       },

      clearAllFilters: () => {
        console.log('[UIStateStore] Clearing all filters.');
        set({
          cityId: null,
          neighborhoodId: null,
          hashtags: [],
          // Don't clear errors here unless intended
          // errorCities: null, errorNeighborhoods: null, errorCuisines: null,
        });
      },
    }),
    { name: 'UIStateStore' } // Devtools name
  )
);

export default useUIStateStore;