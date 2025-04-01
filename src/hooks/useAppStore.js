// src/hooks/useAppStore.js (Removed fetch trigger from setFilter)
import { create } from "zustand";
import { API_BASE_URL } from "@/config.js";

// Helper to fetch filter options
const fetchFilterOptions = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return []; // Return empty array on error
  }
};


const useAppStore = create((set, get) => ({
  // --- State ---
  trendingItems: [],
  trendingDishes: [],
  popularLists: [],
  userLists: [],
  activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
  searchQuery: "",
  plans: [],
  pendingSubmissions: [],
  // Filter Options State
  cities: [],
  neighborhoods: [], // Will be populated based on selected city
  cuisines: [],     // Holds tags/cuisines options
  // Loading & Error States
  isLoadingTrending: false,
  trendingError: null,
  isLoadingUserLists: false,
  userListsError: null,
  isLoadingPending: false,
  pendingError: null,
  hasFetchedUserLists: false,
  isInitializing: false,
  initializationError: null,
  isLoadingFilterOptions: false,

  // --- Actions ---

  // Data Setters
  setTrendingItems: (items) => set({ trendingItems: items }),
  setTrendingDishes: (dishes) => set({ trendingDishes: dishes }),
  setPopularLists: (lists) => set({ popularLists: lists }),
  setUserLists: (lists) => set({
      userLists: Array.isArray(lists) ? lists.map(list => ({ ...list, is_following: list.is_following ?? false })) : [],
      hasFetchedUserLists: true
    }),
  setCities: (cities) => set({ cities }),
  setNeighborhoods: (neighborhoods) => set({ neighborhoods }),
  setCuisines: (cuisines) => set({ cuisines }),

  // Filter Actions
  setFilter: (key, value) => set((state) => {
      let resetTags = {};
      let resetNeighborhoodState = { neighborhoods: key === 'cityId' && value === null ? [] : state.neighborhoods };
      let resetNeighborhoodId = {};

      // If clearing city, also clear neighborhoodId and tags
      if (key === 'cityId' && value === null) {
          resetNeighborhoodId = { neighborhoodId: null };
          resetTags = { tags: [] };
      }
      // If setting a new city, clear neighborhoodId and tags
      else if (key === 'cityId' && value !== null && value !== state.activeFilters.cityId) {
          resetNeighborhoodId = { neighborhoodId: null };
          resetTags = { tags: [] };
          // ** REMOVED fetchNeighborhoods call from here **
      }
      // If clearing neighborhood, also clear tags
      else if (key === 'neighborhoodId' && value === null) {
          resetTags = { tags: [] };
      }

      return ({
          activeFilters: {
              ...state.activeFilters,
              ...resetNeighborhoodId, // Apply neighborhood ID reset first
              ...resetTags,           // Then tag reset
              [key]: value,           // Apply the actual filter change last
          },
          ...resetNeighborhoodState // Also update top-level neighborhoods array if city cleared
      });
  }),
  toggleFilterTag: (tag) => set((state) => {
      const currentTags = state.activeFilters.tags || [];
      const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
      return ({ activeFilters: { ...state.activeFilters, tags: newTags } });
  }),
  clearFilters: () => set({
      activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
      neighborhoods: []
  }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Fetch Actions
  fetchCities: async () => { /* ... remains same ... */
      set({ isLoadingFilterOptions: true });
      const citiesData = await fetchFilterOptions('cities');
      set({ cities: citiesData, isLoadingFilterOptions: false });
  },
  fetchNeighborhoods: async (cityId) => {
     if (!cityId) {
        set({ neighborhoods: [] });
        return;
     };
     set({ isLoadingFilterOptions: true }); // Reuse loading state
     const neighborhoodsData = await fetchFilterOptions(`neighborhoods?cityId=${cityId}`);
     // Only update if the city hasn't changed again while fetching
     if (get().activeFilters.cityId === cityId) {
        set({ neighborhoods: neighborhoodsData, isLoadingFilterOptions: false });
     } else {
         console.log("Stale neighborhood fetch ignored for cityId:", cityId);
         set({ isLoadingFilterOptions: false }); // Still turn off loading
     }
   },
  fetchCuisines: async () => { /* ... remains same ... */
      set({ isLoadingFilterOptions: true });
      const cuisinesData = await fetchFilterOptions('cuisines');
      set({ cuisines: cuisinesData, isLoadingFilterOptions: false });
  },

  // Combined Initialization Action
  initializeApp: async () => { /* ... remains same from previous correct version ... */
    if (get().isInitializing) return;
    set({ isInitializing: true, initializationError: null });
    set({ isLoadingTrending: true, trendingError: null, isLoadingUserLists: true, userListsError: null, isLoadingFilterOptions: true });
    try {
      console.log("[useAppStore initializeApp] Fetching all data in parallel...");
      const [ restaurantsRes, dishesRes, trendingListsRes, userListsRes, citiesRes, cuisinesRes ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trending/restaurants`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/trending/dishes`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/trending/lists`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/lists`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/cities`),
        fetch(`${API_BASE_URL}/api/cuisines`)
      ]);
      const errors = [];
      if (!restaurantsRes.ok) errors.push(`Trending Restaurants: ${restaurantsRes.statusText} (${restaurantsRes.status})`);
      if (!dishesRes.ok) errors.push(`Trending Dishes: ${dishesRes.statusText} (${dishesRes.status})`);
      if (!trendingListsRes.ok) errors.push(`Trending Lists: ${trendingListsRes.statusText} (${trendingListsRes.status})`);
      if (!userListsRes.ok) errors.push(`User Lists: ${userListsRes.statusText} (${userListsRes.status})`);
      if (!citiesRes.ok) errors.push(`Cities: ${citiesRes.statusText} (${citiesRes.status})`);
      if (!cuisinesRes.ok) errors.push(`Cuisines: ${cuisinesRes.statusText} (${cuisinesRes.status})`);
      if (errors.length > 0) throw new Error(`Failed initial data fetch: ${errors.join(', ')}`);
      console.log("[useAppStore initializeApp] Parsing JSON responses...");
      const [ restaurants, dishes, trendingLists, userLists, cities, cuisines ] = await Promise.all([
        restaurantsRes.json(), dishesRes.json(), trendingListsRes.json(), userListsRes.json(), citiesRes.json(), cuisinesRes.json()
      ]);
      console.log("[useAppStore initializeApp] Fetched data:", { restaurants: restaurants?.length, dishes: dishes?.length, lists: trendingLists?.length, userLists: userLists?.length, cities: cities?.length, cuisines: cuisines?.length });
      get().setTrendingItems(restaurants); get().setTrendingDishes(dishes); get().setPopularLists(trendingLists); get().setUserLists(userLists); get().setCities(cities); get().setCuisines(cuisines);
      set({ isLoadingTrending: false, isLoadingUserLists: false, isLoadingFilterOptions: false, trendingError: null, userListsError: null, initializationError: null, isInitializing: false });
      console.log('[useAppStore initializeApp] Initialization successful.');
    } catch (error) {
      console.error('[useAppStore initializeApp] Initialization Error:', error);
      set({ initializationError: error.message, trendingError: error.message, userListsError: error.message, isLoadingTrending: false, isLoadingUserLists: false, isLoadingFilterOptions: false, isInitializing: false });
    }
  },

  // --- Other Actions (List, Submission, Admin, etc.) ---
  // (Keep implementations from previous steps)
  addToList: async (listId, item, isNewList = false) => { /* ... */ },
  toggleFollowList: async (listId) => { /* ... */ },
  fetchUserLists: async () => { /* ... */ },
  checkDuplicateRestaurant: (newItem) => { /* ... */ },
  addPendingSubmission: async (item) => { /* ... */ },
  fetchPendingSubmissions: async () => { /* ... */ },
  approveSubmission: async (itemId) => { /* ... */ },
  rejectSubmission: async (itemId) => { /* ... */ },
  updateListVisibility: (listId, isPublic) => { /* ... */ },
  addPlan: (plan) => { /* ... */ },
  updatePlan: (planId, updatedPlan) => { /* ... */ },

}));

export default useAppStore;