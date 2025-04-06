// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { filterService } from '@/services/filterService';

const useUIStateStore = create((set, get) => ({
  cities: [],
  neighborhoods: [], // Keep for potential future use
  cuisines: [],
  cityId: null,
  neighborhoodId: null, // Keep for potential future use
  hashtags: [], // Array of selected hashtag strings

  // Loading and error states...
  isLoadingCities: false,
  isLoadingNeighborhoods: false,
  isLoadingCuisines: false,
  errorCities: null,
  errorNeighborhoods: null,
  errorCuisines: null,

  fetchCities: async () => {
    if (get().isLoadingCities) return;
    set({ isLoadingCities: true, errorCities: null });
    try {
      const cities = await filterService.getCities();
      set({ cities, isLoadingCities: false });
    } catch (error) {
      console.error('[UIStateStore] Error fetching cities:', error);
      set({ cities: [], isLoadingCities: false, errorCities: error.message || 'Failed to fetch cities' });
    }
  },

  fetchNeighborhoods: async (cityId) => {
    // Logic remains the same...
    if (!cityId) {
        set({ neighborhoods: [], errorNeighborhoods: null });
        return;
    }
    if (get().isLoadingNeighborhoods) return;
    set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
    try {
      const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
      set({ neighborhoods, isLoadingNeighborhoods: false });
    } catch (error) {
      console.error('[UIStateStore] Error fetching neighborhoods:', error);
      set({ neighborhoods: [], isLoadingNeighborhoods: false, errorNeighborhoods: error.message || 'Failed to fetch neighborhoods' });
    }
  },

  fetchCuisines: async () => {
    if (get().isLoadingCuisines) return;
    set({ isLoadingCuisines: true, errorCuisines: null });
    try {
      const cuisines = await filterService.getCuisines();
      set({ cuisines, isLoadingCuisines: false });
    } catch (error) {
      console.error('[UIStateStore] Error fetching cuisines:', error);
      set({ cuisines: [], isLoadingCuisines: false, errorCuisines: error.message || 'Failed to fetch cuisines' });
    }
  },

  setCityId: (cityId) => {
    console.log(`[UIStateStore] Setting cityId to: ${cityId}`);
    set((state) => {
        // When city changes, reset neighborhood and hashtags
        if (state.cityId !== cityId) {
             // No need to fetch neighborhoods here automatically, let component decide
            return { cityId: cityId, neighborhoodId: null, hashtags: [] }; // Reset neighborhood AND hashtags
        }
        return { cityId: cityId };
    });
  },

  setNeighborhoodId: (neighborhoodId) => {
      console.log(`[UIStateStore] Setting neighborhoodId to: ${neighborhoodId}`);
      // When neighborhood changes, reset hashtags
      set({ neighborhoodId: neighborhoodId, hashtags: [] });
  },

  // Setter for hashtags remains the same
  setHashtags: (hashtags) => {
      console.log(`[UIStateStore] Setting hashtags to:`, hashtags);
      set({ hashtags: Array.isArray(hashtags) ? hashtags : [] });
  },

  // Action to clear all filters - ensure this exists
  clearAllFilters: () => {
      console.log('[UIStateStore] Clearing all filters.');
      set({
          cityId: null,
          neighborhoodId: null,
          hashtags: [],
          // Don't clear fetched data like cities/cuisines unless needed
          // neighborhoods: [], // Optionally clear fetched neighborhoods
          errorCities: null,
          errorNeighborhoods: null,
          errorCuisines: null,
      });
  },
}));

export default useUIStateStore;