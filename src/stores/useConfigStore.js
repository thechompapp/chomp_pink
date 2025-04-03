import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config'; // Named export

const simpleFetchAndParse = async (url, errorContext) => {
  console.log(`[${errorContext} Store] Fetching from ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${errorBody}`);
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch (e) { /* ignore parsing error */ }
      throw new Error(errorMsg);
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
        if (get().isLoadingCities) return;
        set({ isLoadingCities: true, errorCities: null });
        try {
          const fetchedData = await simpleFetchAndParse(`${API_BASE_URL}/api/cities`, 'ConfigStore Cities');
          set({ cities: fetchedData, isLoadingCities: false });
        } catch (error) {
          console.error('[ConfigStore] Error fetching cities:', error);
          set({ errorCities: error.message, isLoadingCities: false });
          throw error;
        }
      },

      fetchCuisines: async () => {
        if (get().isLoadingCuisines) return;
        set({ isLoadingCuisines: true, errorCuisines: null });
        try {
          console.log(`[ConfigStore] Attempting to fetch: ${API_BASE_URL}/api/cuisines`);
          const fetchedData = await simpleFetchAndParse(`${API_BASE_URL}/api/cuisines`, 'ConfigStore Cuisines');
          console.log("[ConfigStore] Successfully fetched raw data for /api/cuisines:", fetchedData);
          const validCuisines = Array.isArray(fetchedData)
            ? fetchedData.filter(item => typeof item === 'object' && item !== null && 'id' in item && 'name' in item)
            : [];
          if (validCuisines.length !== fetchedData.length) {
            console.warn("[ConfigStore] Some fetched cuisine items had invalid structure.");
          }
          console.log(`[ConfigStore] Setting cuisines state with ${validCuisines.length} valid items.`);
          set({ cuisines: validCuisines, isLoadingCuisines: false });
          return validCuisines;
        } catch (error) {
          console.error('[ConfigStore] Error fetching cuisines:', error);
          set({ errorCuisines: error.message, isLoadingCuisines: false, cuisines: [] });
          throw error;
        }
      },
    }),
    { name: 'ConfigStore' }
  )
);

export default useConfigStore;