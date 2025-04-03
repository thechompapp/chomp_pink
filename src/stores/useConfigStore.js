// src/stores/useConfigStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config'; // Assuming config holds the base URL

// Helper function (can be shared or duplicated)
const simpleFetchAndParse = async (url, errorContext) => {
    console.log(`[${errorContext} Store] Fetching from ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${errorBody}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      if (!text) return [];
      const rawData = JSON.parse(text);
      return Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
    } catch (error) {
      console.error(`[${errorContext} Store] Network or parsing error (${url}):`, error);
      throw new Error(`Error processing ${errorContext}: ${error.message}`);
    }
};

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
        if (get().isLoadingCities) return; // Prevent concurrent fetches
        set({ isLoadingCities: true, errorCities: null });
        try {
          const cities = await simpleFetchAndParse(`${API_BASE_URL}/api/cities`, 'ConfigStore Cities');
          set({ cities: cities, isLoadingCities: false });
          console.log('[ConfigStore] Cities fetched successfully.');
          return cities; // Return data for potential chaining
        } catch (error) {
          console.error('[ConfigStore] Error fetching cities:', error);
          set({ errorCities: error.message, isLoadingCities: false });
          throw error; // Re-throw for components to catch if needed
        }
      },

      fetchCuisines: async () => {
        if (get().isLoadingCuisines) return; // Prevent concurrent fetches
         set({ isLoadingCuisines: true, errorCuisines: null });
         try {
           const cuisines = await simpleFetchAndParse(`${API_BASE_URL}/api/cuisines`, 'ConfigStore Cuisines');
           set({ cuisines: cuisines, isLoadingCuisines: false });
           console.log('[ConfigStore] Cuisines fetched successfully.');
           return cuisines;
         } catch (error) {
           console.error('[ConfigStore] Error fetching cuisines:', error);
           set({ errorCuisines: error.message, isLoadingCuisines: false });
           throw error;
         }
       },

    }),
    { name: 'ConfigStore' } // Name for DevTools
  )
);

export default useConfigStore;