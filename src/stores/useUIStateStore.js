// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { filterService } from '@/services/filterService';

const useUIStateStore = create((set, get) => ({
  cities: [],
  neighborhoods: [],
  cuisines: [],
  cityId: null,
  neighborhoodId: null,
  hashtags: [],
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
      // Ensure id is an integer
      const parsedCities = cities.map(city => ({ ...city, id: parseInt(city.id, 10) }));
      console.log('[UIStateStore] Fetched cities:', parsedCities);
      set({ cities: parsedCities, isLoadingCities: false });
    } catch (error) {
      console.error('[UIStateStore] Error fetching cities:', error);
      set({ cities: [], isLoadingCities: false, errorCities: error.message || 'Failed to fetch cities' });
    }
  },

  fetchNeighborhoods: async (cityId) => {
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
    console.log(`[UIStateStore] Setting cityId to: ${cityId} (type: ${typeof cityId})`);
    set((state) => {
      if (state.cityId !== cityId) {
        return { cityId: cityId, neighborhoodId: null, hashtags: [] };
      }
      return { cityId: cityId };
    });
  },

  setNeighborhoodId: (neighborhoodId) => {
    console.log(`[UIStateStore] Setting neighborhoodId to: ${neighborhoodId}`);
    set({ neighborhoodId: neighborhoodId, hashtags: [] });
  },

  setHashtags: (hashtags) => {
    console.log(`[UIStateStore] Setting hashtags to:`, hashtags);
    set({ hashtags: Array.isArray(hashtags) ? hashtags : [] });
  },

  clearAllFilters: () => {
    console.log('[UIStateStore] Clearing all filters.');
    set({
      cityId: null,
      neighborhoodId: null,
      hashtags: [],
      errorCities: null,
      errorNeighborhoods: null,
      errorCuisines: null,
    });
  },
}));

export default useUIStateStore;