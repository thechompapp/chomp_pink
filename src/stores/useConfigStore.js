// src/stores/useConfigStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient'; // Import the new client

const useConfigStore = create(
  devtools(
    (set, get) => ({
      cities: [],
      cuisines: [],
      isLoadingCities: false,
      isLoadingCuisines: false,
      errorCities: null,
      errorCuisines: null,

      fetchCities: async () => {
        if (get().isLoadingCities) return;
        set({ isLoadingCities: true, errorCities: null });
        try {
          // Use apiClient, expect array back
          const fetchedData = await apiClient('/api/cities', 'ConfigStore Cities') || [];
          set({ cities: fetchedData, isLoadingCities: false });
          return fetchedData;
        } catch (error) {
          console.error('[ConfigStore] Error fetching cities:', error);
          // Logout is handled by apiClient on 401
          if (error.message !== 'Session expired or invalid. Please log in again.') {
             set({ errorCities: error.message, isLoadingCities: false, cities: [] });
          } else {
             set({ isLoadingCities: false }); // Just stop loading
          }
          // We might not need to re-throw here unless a component needs to specifically react
        }
      },

      fetchCuisines: async () => {
        if (get().isLoadingCuisines) return;
        set({ isLoadingCuisines: true, errorCuisines: null });
        try {
          // Use apiClient, expect array back
          const fetchedData = await apiClient('/api/cuisines', 'ConfigStore Cuisines') || [];
          console.log("[ConfigStore] Successfully fetched raw data for /api/cuisines:", fetchedData);
          const validCuisines = Array.isArray(fetchedData)
            ? fetchedData.filter(item => typeof item === 'object' && item !== null && 'id' in item && 'name' in item)
            : [];
          if (validCuisines.length !== fetchedData.length) {
            console.warn("[ConfigStore] Some fetched cuisine items had invalid structure.");
          }
          set({ cuisines: validCuisines, isLoadingCuisines: false });
          return validCuisines;
        } catch (error) {
          console.error('[ConfigStore] Error fetching cuisines:', error);
           if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ errorCuisines: error.message, isLoadingCuisines: false, cuisines: [] });
           } else {
              set({ isLoadingCuisines: false });
           }
           // Optional re-throw
        }
      },
    }),
    { name: 'ConfigStore' }
  )
);

export default useConfigStore;