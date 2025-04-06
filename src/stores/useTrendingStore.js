// src/stores/useTrendingStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '@/services/apiClient.js'; // Corrected import path

// Note: Data fetching logic was moved to Trending.jsx using useQuery.
// This store might be redundant unless it handles other trending-related state.
// Keeping it for now but adding the consistent error handling pattern.
const useTrendingStore = create(
  devtools(
    (set, get) => ({
      trendingItems: [],
      trendingDishes: [],
      popularLists: [],
      isLoading: false,
      error: null, // Unified error state

      // Action to clear error
      clearError: () => set({ error: null }),

      // Fetch action remains, uses unified error state
      fetchTrendingData: async () => {
        // Removed console.log
        if (get().isLoading) {
          return;
        }
        set({ isLoading: true, error: null }); // Clear error on new fetch
        try {
          // Removed console.log
          const [items, dishes, lists] = await Promise.all([
            apiClient('/api/trending/restaurants', 'Trending Restaurants Store'),
            apiClient('/api/trending/dishes', 'Trending Dishes Store'),
            apiClient('/api/trending/lists', 'Trending Popular Lists Store'),
          ]);
          // Removed console.log
          set({
            trendingItems: Array.isArray(items) ? items : [],
            trendingDishes: Array.isArray(dishes) ? dishes : [],
            popularLists: Array.isArray(lists) ? lists : [],
            isLoading: false,
          });
          // Removed console.log
        } catch (error) {
          console.error('[TrendingStore] fetchTrendingData action caught error:', error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ error: error.message || 'Failed to fetch trending data', isLoading: false }); // Set unified error
          } else {
              set({ isLoading: false, error: error.message });
          }
        }
      },
    }),
    { name: 'TrendingStore' }
  )
);

export default useTrendingStore;