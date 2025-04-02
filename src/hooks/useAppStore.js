// src/hooks/useAppStore.js
import { create } from "zustand";
import { API_BASE_URL } from "@/config";

const simpleFetchAndParse = async (url, resourceName) => {
  console.log(`[simpleFetchAndParse] Fetching ${resourceName} from ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Failed to fetch ${resourceName} (${response.status})`;
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorDetails;
      } catch (jsonError) {}
      console.error(`[simpleFetchAndParse] Fetch failed for ${resourceName}: ${errorDetails}`);
      throw new Error(errorDetails);
    }
    const data = await response.json();
    console.log(`[simpleFetchAndParse] Successfully fetched ${resourceName}. Raw data:`, data);
    if (
      (url.includes("/neighborhoods") ||
        url.includes("/lists") ||
        url.includes("/cities") ||
        url.includes("/cuisines") ||
        url.includes("/trending")) &&
      !Array.isArray(data)
    ) {
      console.warn(
        `[simpleFetchAndParse] Expected array but received ${typeof data} for ${resourceName}.`
      );
      return [];
    }
    console.log(`[simpleFetchAndParse] Parsed ${resourceName} as array:`, data);
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
  userLists: [],
  activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
  searchQuery: "",
  neighborhoods: [],
  isInitializing: false,
  initializationError: null,
  isLoadingUserLists: false,
  userListsError: null,
  hasFetchedUserLists: false,
  isLoadingNeighborhoods: false,
  neighborhoodsError: null,
  testValue: null,

  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  clearFilters: () =>
    set({
      activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
      searchQuery: "",
      neighborhoods: [],
    }),
  setFilter: (key, value) => {
    if (key === "cityId" && !value) {
      set((state) => ({
        activeFilters: { ...state.activeFilters, cityId: null, neighborhoodId: null, tags: [] },
        neighborhoods: [],
        neighborhoodsError: null,
      }));
    } else if (key === "cityId" && value) {
      set((state) => ({
        activeFilters: { ...state.activeFilters, cityId: value, neighborhoodId: null, tags: [] },
        neighborhoods: [],
        neighborhoodsError: null,
      }));
    } else if (key === "neighborhoodId" && value) {
      set((state) => ({
        activeFilters: { ...state.activeFilters, neighborhoodId: value, tags: [] },
      }));
    } else {
      set((state) => ({ activeFilters: { ...state.activeFilters, [key]: value } }));
    }
  },
  toggleFilterTag: (tag) =>
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        tags: state.activeFilters.tags.includes(tag)
          ? state.activeFilters.tags.filter((t) => t !== tag)
          : [...state.activeFilters.tags, tag],
      },
    })),
  clearUserListsError: () => set({ userListsError: null }),

  fetchNeighborhoods: async (cityId) => {
    if (!cityId) {
      set({ neighborhoods: [], isLoadingNeighborhoods: false, neighborhoodsError: null });
      return;
    }
    console.log(`[fetchNeighborhoods START] Fetching neighborhoods for cityId: ${cityId}`);
    set({ isLoadingNeighborhoods: true, neighborhoodsError: null });
    try {
      const fetchedNeighborhoods = await simpleFetchAndParse(
        `${API_BASE_URL}/api/neighborhoods?cityId=${cityId}`,
        `neighborhoods for city ${cityId}`
      );
      set({
        neighborhoods: Array.isArray(fetchedNeighborhoods) ? fetchedNeighborhoods : [],
        isLoadingNeighborhoods: false,
        neighborhoodsError: null,
      });
      console.log(`[fetchNeighborhoods SUCCESS] Updated neighborhoods for cityId: ${cityId}`);
    } catch (error) {
      console.error(`[fetchNeighborhoods ERROR] Failed for cityId: ${cityId}`, error);
      set({
        neighborhoods: [],
        isLoadingNeighborhoods: false,
        neighborhoodsError: error.message || "Failed to load neighborhoods.",
      });
    }
  },

  initializeApp: async () => {
    console.log("[initializeApp] Action started.");
    set({ isInitializing: true, initializationError: null });
    try {
      console.log("[initializeApp] Fetching cities...");
      const cities = await simpleFetchAndParse(`${API_BASE_URL}/api/cities`, "cities");

      console.log("[initializeApp] Fetching cuisines...");
      const cuisines = await simpleFetchAndParse(`${API_BASE_URL}/api/cuisines`, "cuisines");

      console.log("[initializeApp] Fetching trending restaurants...");
      const trendingItems = await simpleFetchAndParse(
        `${API_BASE_URL}/api/trending/restaurants`,
        "trending restaurants"
      );

      console.log("[initializeApp] Fetching trending dishes...");
      const trendingDishes = await simpleFetchAndParse(
        `${API_BASE_URL}/api/trending/dishes`,
        "trending dishes"
      );

      console.log("[initializeApp] Fetching popular lists...");
      const popularLists = await simpleFetchAndParse(
        `${API_BASE_URL}/api/trending/lists`,
        "popular lists"
      );

      set({
        cities: Array.isArray(cities) ? cities : [],
        cuisines: Array.isArray(cuisines) ? cuisines : [],
        trendingItems: Array.isArray(trendingItems) ? trendingItems : [],
        trendingDishes: Array.isArray(trendingDishes) ? trendingDishes : [],
        popularLists: Array.isArray(popularLists) ? popularLists : [],
        isInitializing: false,
        initializationError: null,
      });
      console.log("[initializeApp] Action completed successfully.");
    } catch (error) {
      console.error("[initializeApp] Error during initialization:", error);
      set({
        isInitializing: false,
        initializationError: error.message || "Failed to initialize application.",
      });
    }
  },

  fetchUserLists: async () => {
    console.log("[fetchUserLists] Action started.");
    set({ isLoadingUserLists: true, userListsError: null });
    try {
      const lists = await simpleFetchAndParse(`${API_BASE_URL}/api/lists`, "user lists");
      set({
        userLists: Array.isArray(lists) ? lists : [],
        isLoadingUserLists: false,
        userListsError: null,
        hasFetchedUserLists: true,
      });
      console.log("[fetchUserLists] Action completed successfully.");
    } catch (error) {
      console.error("[fetchUserLists] Error fetching user lists:", error);
      set({
        isLoadingUserLists: false,
        userListsError: error.message || "Failed to fetch user lists.",
      });
    }
  },

  testSyncAction: () => {
    console.log("[testSyncAction] Synchronous action started.");
    set({ testValue: "Test successful", isInitializing: false });
    console.log("[testSyncAction] Synchronous action completed.");
  },

  updateListVisibility: async (listId, isPublic) => {},
  removeFromList: async (listId, listItemId) => {},
}));

export default useAppStore;