// src/stores/useTrendingStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config';

// Re-use or import the helper function
const simpleFetchAndParse = async (url, errorContext) => {
    console.log(`[${errorContext} Store] Fetching from ${url}`); // Keep this log
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${errorBody}`);
        // Try to parse JSON error, fallback to text
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorBody);
            errorMsg = errorJson.error || errorJson.message || errorMsg;
        } catch(e) { /* ignore parsing error */ }
        throw new Error(errorMsg);
      }
      const text = await response.text();
      if (!text) return [];
      const rawData = JSON.parse(text);
      return Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
    } catch (error) {
      console.error(`[${errorContext} Store] Network or parsing error (${url}):`, error);
      // Rethrow with a more specific message if possible
      throw new Error(`Error processing ${errorContext}: ${error.message}`);
    }
};


const useTrendingStore = create(
  devtools(
    (set, get) => ({
      trendingItems: [], // Restaurants
      trendingDishes: [],
      popularLists: [],
      isLoading: false,
      error: null,

      fetchTrendingData: async () => {
        // *** ADDED LOG ***
        console.log('[TrendingStore] fetchTrendingData action CALLED.');

        if (get().isLoading) {
           // *** ADDED LOG ***
           console.log('[TrendingStore] fetchTrendingData already loading, returning.');
           return;
        }
        // *** ADDED LOG ***
        console.log('[TrendingStore] fetchTrendingData setting isLoading = true.');
        set({ isLoading: true, error: null });
        try {
          // *** ADDED LOG ***
          console.log('[TrendingStore] Fetching all trending data via Promise.all...');
          const [items, dishes, lists] = await Promise.all([
            // Use the helper function which already has logs
            simpleFetchAndParse(`${API_BASE_URL}/api/trending/restaurants`, 'Trending Restaurants'),
            simpleFetchAndParse(`${API_BASE_URL}/api/trending/dishes`, 'Trending Dishes'),
            simpleFetchAndParse(`${API_BASE_URL}/api/trending/lists`, 'Trending Popular Lists')
          ]);
          // *** ADDED LOG ***
          console.log(`[TrendingStore] Fetched Data - Restaurants: ${items?.length}, Dishes: ${dishes?.length}, Lists: ${lists?.length}`);
          set({
              // Ensure we set arrays even if the fetch somehow returned non-arrays (though simpleFetchAndParse should handle this)
              trendingItems: Array.isArray(items) ? items : [],
              trendingDishes: Array.isArray(dishes) ? dishes : [],
              popularLists: Array.isArray(lists) ? lists : [],
              isLoading: false
          });
          console.log('[TrendingStore] Trending data state updated successfully.');
        } catch (error) {
          // Log the error caught within the action
          console.error('[TrendingStore] fetchTrendingData action caught error:', error);
          set({ error: error.message || 'Failed to fetch trending data', isLoading: false });
          // Re-throw might not be necessary if components just read the error state
          // throw error;
        }
      },

    }),
    { name: 'TrendingStore' }
  )
);

export default useTrendingStore;