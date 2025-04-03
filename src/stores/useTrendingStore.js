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

const useTrendingStore = create(
  devtools(
    (set, get) => ({
      trendingItems: [],
      trendingDishes: [],
      popularLists: [],
      isLoading: false,
      error: null,

      fetchTrendingData: async () => {
        console.log('[TrendingStore] fetchTrendingData action CALLED.');
        if (get().isLoading) {
          console.log('[TrendingStore] fetchTrendingData already loading, returning.');
          return;
        }
        console.log('[TrendingStore] fetchTrendingData setting isLoading = true.');
        set({ isLoading: true, error: null });
        try {
          console.log('[TrendingStore] Fetching all trending data via Promise.all...');
          const [items, dishes, lists] = await Promise.all([
            simpleFetchAndParse(`${API_BASE_URL}/api/trending/restaurants`, 'Trending Restaurants'),
            simpleFetchAndParse(`${API_BASE_URL}/api/trending/dishes`, 'Trending Dishes'),
            simpleFetchAndParse(`${API_BASE_URL}/api/trending/lists`, 'Trending Popular Lists'),
          ]);
          console.log(`[TrendingStore] Fetched Data - Restaurants: ${items?.length}, Dishes: ${dishes?.length}, Lists: ${lists?.length}`);
          set({
            trendingItems: Array.isArray(items) ? items : [],
            trendingDishes: Array.isArray(dishes) ? dishes : [],
            popularLists: Array.isArray(lists) ? lists : [],
            isLoading: false,
          });
          console.log('[TrendingStore] Trending data state updated successfully.');
        } catch (error) {
          console.error('[TrendingStore] fetchTrendingData action caught error:', error);
          set({ error: error.message || 'Failed to fetch trending data', isLoading: false });
        }
      },
    }),
    { name: 'TrendingStore' }
  )
);

export default useTrendingStore;