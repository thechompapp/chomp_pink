// src/hooks/useAppStore.js
// REMOVED /api/lists fetch from initializeApp
// Kept sequential fetching for other initial data
// Kept simplified fetch helper

import { create } from 'zustand';
import { API_BASE_URL } from '@/config';

// Simplified fetch helper (keep from previous step)
const simpleFetchAndParse = async (url, resourceName) => {
  console.log(`[simpleFetchAndParse] Fetching ${resourceName} from ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Failed to fetch ${resourceName} (${response.status})`;
      try { const errorData = await response.json(); errorDetails = errorData.error || errorDetails; } catch (jsonError) { /* Ignore */ }
      console.error(`[simpleFetchAndParse] Fetch failed for ${resourceName}: ${errorDetails}`);
      throw new Error(errorDetails);
    }
    const data = await response.json();
    console.log(`[simpleFetchAndParse] Successfully fetched and parsed ${resourceName}.`);
    if ((url.includes('/lists') || url.includes('/cities') || url.includes('/cuisines') || url.includes('/trending')) && !Array.isArray(data)) {
        console.warn(`[simpleFetchAndParse] Expected array but received ${typeof data} for ${resourceName}. Returning empty array.`);
        return [];
    }
    return data;
  } catch (error) {
    console.error(`[simpleFetchAndParse] Error for ${resourceName} (${url}):`, error);
    throw new Error(`Error processing ${resourceName}: ${error.message}`);
  }
};

const useAppStore = create((set, get) => ({
  // State
  trendingItems: [],
  trendingDishes: [],
  popularLists: [],
  cities: [],
  cuisines: [],
  userLists: [], // User lists state
  activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
  searchQuery: '',
  neighborhoods: [],
  isInitializing: false, // Main app init state
  initializationError: null,
  isLoadingUserLists: false, // Separate loading state for user lists
  userListsError: null,
  hasFetchedUserLists: false, // Track if user lists have been fetched

  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  clearFilters: () => set({ activeFilters: { cityId: null, neighborhoodId: null, tags: [] }, searchQuery: '' }),
  setFilter: (key, value) => set(state => ({ activeFilters: { ...state.activeFilters, [key]: value } })),
  toggleFilterTag: (tag) => set(state => ({ /* ... */ })),
  fetchNeighborhoods: async (cityId) => { /* ... */ },
  clearUserListsError: () => set({ userListsError: null }),

  // initializeApp - Fetches CORE data needed for homepage (NO USER LISTS)
  initializeApp: async () => {
    const { isInitializing } = get();
    if (isInitializing) return; // Already running

    console.log("[initializeApp START] Fetching core data sequentially...");
    set({ isInitializing: true, initializationError: null });

    let coreData = {
        trendingItems: [], trendingDishes: [], popularLists: [],
        cities: [], cuisines: []
        // No userLists here
    };
    let errorMsg = null;

    try {
        // Fetch only core data needed for immediate display
        coreData.trendingItems = await simpleFetchAndParse(`${API_BASE_URL}/api/trending/restaurants`, 'trending restaurants');
        coreData.trendingDishes = await simpleFetchAndParse(`${API_BASE_URL}/api/trending/dishes`, 'trending dishes');
        coreData.popularLists = await simpleFetchAndParse(`${API_BASE_URL}/api/trending/lists`, 'popular lists');
        coreData.cities = await simpleFetchAndParse(`${API_BASE_URL}/api/cities`, 'cities');
        coreData.cuisines = await simpleFetchAndParse(`${API_BASE_URL}/api/cuisines`, 'cuisines');

        console.log("[initializeApp] Core sequential fetches attempted.");

    } catch (error) {
        console.error("[initializeApp] Error during core sequential fetch:", error);
        errorMsg = error.message || "An error occurred during core data fetching.";
    } finally {
        console.log(`[initializeApp finally] Updating state. ErrorMsg: ${errorMsg}`);
        set({
            isInitializing: false, // Core init finished
            initializationError: errorMsg,
            trendingItems: Array.isArray(coreData.trendingItems) ? coreData.trendingItems : [],
            trendingDishes: Array.isArray(coreData.trendingDishes) ? coreData.trendingDishes : [],
            popularLists: Array.isArray(coreData.popularLists) ? coreData.popularLists : [],
            cities: Array.isArray(coreData.cities) ? coreData.cities : [],
            cuisines: Array.isArray(coreData.cuisines) ? coreData.cuisines : [],
            // userLists is NOT set here
        });
        if (!errorMsg) console.log("[initializeApp SUCCESS] Core state updated.");
        else console.log("[initializeApp FINISHED WITH ERROR] Core state updated.");
    }
  },

  // fetchUserLists - Separate action to fetch user lists
  fetchUserLists: async () => {
      // Prevent re-fetching if already loading or fetched (optional, depends on desired behavior)
      // if (get().isLoadingUserLists || get().hasFetchedUserLists) return;
      if (get().isLoadingUserLists) {
          console.log("[fetchUserLists SKIP] Already fetching user lists.");
          return;
      }

      console.log("[fetchUserLists START] Fetching user lists separately...");
      set({ isLoadingUserLists: true, userListsError: null });
      try {
          // Use the same fetch helper
          const userListsData = await simpleFetchAndParse(`${API_BASE_URL}/api/lists`, 'user lists');
          set({
              userLists: Array.isArray(userListsData) ? userListsData : [],
              isLoadingUserLists: false,
              hasFetchedUserLists: true, // Mark as fetched
              userListsError: null,
          });
          console.log("[fetchUserLists SUCCESS] User lists state updated.");
      } catch (error) {
          console.error("[fetchUserLists ERROR]:", error);
          set({
              userListsError: error.message || "Failed to fetch user lists",
              isLoadingUserLists: false,
              hasFetchedUserLists: false, // Mark as not successfully fetched
              // userLists: [] // Optionally clear on error
          });
          console.log("[fetchUserLists FINISHED WITH ERROR] State updated.");
      }
  },

  // Keep other actions
  updateListVisibility: async (listId, isPublic) => { /* ... */ },
  removeFromList: async (listId, listItemId) => { /* ... */ },
  // ... other actions ...
}));

export default useAppStore;