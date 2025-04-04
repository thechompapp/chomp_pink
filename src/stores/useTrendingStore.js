// src/stores/useTrendingStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient'; // Import the new client

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
          // Use apiClient for each parallel request
          const [items, dishes, lists] = await Promise.all([
            apiClient('/api/trending/restaurants', 'Trending Restaurants'),
            apiClient('/api/trending/dishes', 'Trending Dishes'),
            apiClient('/api/trending/lists', 'Trending Popular Lists'),
          ]);
          console.log(`[TrendingStore] Fetched Data - Restaurants: ${items?.length}, Dishes: ${dishes?.length}, Lists: ${lists?.length}`);
          set({
            // Ensure results are arrays even if API returns null/undefined on success
            trendingItems: Array.isArray(items) ? items : [],
            trendingDishes: Array.isArray(dishes) ? dishes : [],
            popularLists: Array.isArray(lists) ? lists : [],
            isLoading: false,
          });
          console.log('[TrendingStore] Trending data state updated successfully.');
        } catch (error) {
          console.error('[TrendingStore] fetchTrendingData action caught error:', error);
          // apiClient handles logout on 401
          if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ error: error.message || 'Failed to fetch trending data', isLoading: false });
          } else {
              set({ isLoading: false }); // Stop loading on 401
          }
          // Optional re-throw
        }
      },
    }),
    { name: 'TrendingStore' }
  )
);

export default useTrendingStore;