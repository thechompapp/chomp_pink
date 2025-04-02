// src/hooks/useAppStore.js
// MODIFIED: initializeApp fetches sequentially with logging for debugging hangs
import { create } from 'zustand';
import { API_BASE_URL } from '@/config';

// Helper function to check response status and parse JSON
const checkOk = async (res, name) => {
    if (!res.ok) {
        const errorBody = await res.text().catch(() => 'Failed to read error body');
        console.error(`Workspace failed for ${name}: ${res.status} ${res.statusText}`, errorBody);
        throw new Error(`Failed to fetch ${name}: ${res.status}`);
    }
    // console.log(`Workspace successful for ${name}, parsing JSON...`); // Optional success log
    try {
        return await res.json();
    } catch (jsonError) {
         console.error(`Failed to parse JSON for ${name}:`, jsonError);
         throw new Error(`Failed to parse response for ${name}`);
    }
};


const useAppStore = create((set, get) => ({
  // State slices...
  trendingItems: [],
  trendingDishes: [],
  popularLists: [],
  cities: [],
  neighborhoods: [],
  cuisines: [],
  userLists: [],
  pendingSubmissions: [],
  searchQuery: '',
  activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
  isInitializing: false,
  isLoadingTrending: false,
  isLoadingFilterOptions: false,
  initializationError: null,
  trendingError: null,
  isLoadingUserLists: false,
  hasFetchedUserLists: false,
  userListsError: null,

  // Actions...
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearFilters: () => set({ /* ... */ }),
  setFilter: (key, value) => set(state => ({ /* ... */ })),
  toggleFilterTag: (tag) => set(state => { /* ... */ }),
  fetchNeighborhoods: async (cityId) => { /* ... */ },
  fetchPendingSubmissions: async () => { /* ... */ },
  approveSubmission: async (submissionId) => { /* ... */ },
  rejectSubmission: async (submissionId) => { /* ... */ },
  fetchTrendingData: async () => { /* ... */ },
  addToList: async (listId, payload, isNewList = false) => { /* Correct version from response #37 */ },
  addPendingSubmission: async (submission) => { /* ... */ },
  checkDuplicateRestaurant: async (placeId) => { /* ... */ },
  fetchUserLists: async (force = false) => { /* ... */ },
  toggleFollowList: async (listId) => { /* ... */ },
  removeFromList: async (listId, listItemId) => { /* ... */ },
  updateListVisibility: async (listId, is_public) => { /* Correct version from response #37 */ },


  // --- Modified initializeApp (Sequential Fetching) ---
  initializeApp: async () => {
    if (get().isInitializing) {
      console.log('[initializeApp SKIP] Already initializing.');
      return;
    }
    console.log('[initializeApp START]');
    // Ensure flags indicate loading
    set({ isInitializing: true, initializationError: null, hasFetchedUserLists: false, isLoadingUserLists: true, userListsError: null });

    try {
        let trendingRestaurants, trendingDishes, popularLists, cities, cuisines, userLists;

        console.log('[initializeApp] Fetching trending restaurants...');
        const trendingRestaurantsRes = await fetch(`${API_BASE_URL}/api/trending/restaurants`);
        trendingRestaurants = await checkOk(trendingRestaurantsRes, 'trending restaurants');
        console.log('[initializeApp] Fetched trending restaurants OK.');

        console.log('[initializeApp] Fetching trending dishes...');
        const trendingDishesRes = await fetch(`${API_BASE_URL}/api/trending/dishes`);
        trendingDishes = await checkOk(trendingDishesRes, 'trending dishes');
        console.log('[initializeApp] Fetched trending dishes OK.');

        console.log('[initializeApp] Fetching popular lists...');
        const popularListsRes = await fetch(`${API_BASE_URL}/api/trending/lists`);
        popularLists = await checkOk(popularListsRes, 'popular lists');
        console.log('[initializeApp] Fetched popular lists OK.');

        console.log('[initializeApp] Fetching cities...');
        const citiesRes = await fetch(`${API_BASE_URL}/api/cities`);
        cities = await checkOk(citiesRes, 'cities');
        console.log('[initializeApp] Fetched cities OK.');

        console.log('[initializeApp] Fetching cuisines...');
        const cuisinesRes = await fetch(`${API_BASE_URL}/api/cuisines`);
        cuisines = await checkOk(cuisinesRes, 'cuisines');
        console.log('[initializeApp] Fetched cuisines OK.');

        // Fetch user lists as part of initialization
        console.log('[initializeApp] Fetching user lists...');
        const userListsRes = await fetch(`${API_BASE_URL}/api/lists`);
        userLists = await checkOk(userListsRes, 'user lists');
        console.log('[initializeApp] Fetched user lists OK.');

        // If all fetches succeeded:
        set({
            trendingItems: trendingRestaurants || [],
            trendingDishes: trendingDishes || [],
            popularLists: popularLists || [],
            cities: cities || [],
            cuisines: cuisines || [],
            userLists: userLists || [],
            isInitializing: false, // Finish initialization
            isLoadingUserLists: false, // Finish user lists loading
            hasFetchedUserLists: true, // Mark lists as fetched
            userListsError: null,
            initializationError: null, // Clear any previous init error
        });
        console.log('[initializeApp SUCCESS] Initialization complete.');

    } catch (err) {
        // This will catch the first error thrown by checkOk
        console.error('[initializeApp ERROR] Failure during initialization fetch sequence:', err);
        set({
            initializationError: err.message || 'Initialization failed', // Store specific error
            isInitializing: false, // Stop initializing on error
            isLoadingUserLists: false, // Also stop user list loading if it failed there
            userListsError: get().userListsError || err.message, // Keep existing list error or set new one
         });
         // Keep partially fetched data, don't clear everything
    }
  }, // End initializeApp

})); // End create

export default useAppStore;