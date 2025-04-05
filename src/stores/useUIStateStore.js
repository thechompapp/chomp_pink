// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/utils/apiClient'; // Corrected import path

// Helper function to handle potential API errors during state initialization/fetch
const handleFetchError = (error, type, set) => {
  console.error(`[UIStateStore] Error fetching ${type}:`, error);
  // Don't set generic error state if it's an auth error handled by apiClient
  if (error.message !== 'Session expired or invalid. Please log in again.') {
    const errorState = type === 'cities' ? { errorCities: error.message || `Failed to fetch ${type}` } :
                      type === 'cuisines' ? { errorCuisines: error.message || `Failed to fetch ${type}` } :
                      { errorNeighborhoods: error.message || `Failed to fetch ${type}` };
    const loadingState = type === 'cities' ? { isLoadingCities: false } :
                        type === 'cuisines' ? { isLoadingCuisines: false } :
                        { isLoadingNeighborhoods: false };
    const dataState = type === 'cities' ? { cities: [] } :
                      type === 'cuisines' ? { cuisines: [] } :
                      { neighborhoods: [] };
    set({ ...errorState, ...loadingState, ...dataState });
  } else {
      // Just stop loading on auth error
      const loadingState = type === 'cities' ? { isLoadingCities: false } :
                          type === 'cuisines' ? { isLoadingCuisines: false } :
                          { isLoadingNeighborhoods: false };
      set({ ...loadingState });
  }
  // Re-throw the error so calling components/hooks know the fetch failed
  throw error;
};

// Migration function for persisted state (if needed in the future)
const migrateState = (persistedState, version) => {
    if (!persistedState) return {};
    console.log(`[UIStateStore Persist] Migrating from version ${version || 'unknown'}`);
    // Add migration logic here if state shape changes between versions
    return persistedState;
};

const uiStore = (set, get) => ({
    // Filter State
    cityId: null,
    neighborhoodId: null,
    hashtags: [],
    searchQuery: '',

    // App Initialization State (if needed elsewhere)
    isInitializing: false, // Might be managed by specific pages/components instead

    // Fetched Data for Filters
    cities: [],
    cuisines: [], // Used for hashtag filters primarily
    neighborhoods: [], // Neighborhoods for the currently selected cityId

    // Loading States for Fetched Data
    isLoadingCities: false,
    isLoadingCuisines: false,
    isLoadingNeighborhoods: false,

    // Error States for Fetched Data
    errorCities: null,
    errorCuisines: null,
    errorNeighborhoods: null,

    // --- Actions ---

    // Clear specific errors
    clearError: (type) => {
        console.log(`[UIStateStore] Clearing error for type: ${type}`);
        if (type === 'cities') set({ errorCities: null });
        else if (type === 'cuisines') set({ errorCuisines: null });
        else if (type === 'neighborhoods') set({ errorNeighborhoods: null });
        // else set({ error: null }); // Remove general error if not used
    },

    // Setters for Filter State
    setCityId: (cityId) => {
        const currentCityId = get().cityId;
        if (currentCityId !== cityId) {
            console.log(`[UIStateStore] Setting cityId from ${currentCityId} to: ${cityId}`);
            // Reset dependent filters when city changes
            set({
                cityId,
                neighborhoods: [], // Clear old neighborhoods
                neighborhoodId: null, // Reset selected neighborhood
                // hashtags: [], // Optionally reset hashtags too, or keep them? Decide based on UX.
                errorNeighborhoods: null, // Clear neighborhood errors
                isLoadingNeighborhoods: false, // Reset loading state if a fetch was in progress
            });
            // Trigger neighborhood fetch if a new city is selected
            if (cityId) {
                 get().fetchNeighborhoodsByCity(cityId);
            }
        }
    },
    setNeighborhoodId: (neighborhoodId) => {
         const currentNId = get().neighborhoodId;
         if (currentNId !== neighborhoodId) {
             console.log(`[UIStateStore] Setting neighborhoodId from ${currentNId} to: ${neighborhoodId}`);
             set({ neighborhoodId });
             // Optionally reset hashtags when neighborhood changes?
             // set({ hashtags: [] });
         }
    },
    setHashtags: (hashtags) => {
        console.log('[UIStateStore] Setting hashtags:', hashtags);
        set({ hashtags: Array.isArray(hashtags) ? hashtags : [] });
    },
    setSearchQuery: (query) => {
        console.log('[UIStateStore] Setting searchQuery:', query);
        set({ searchQuery: query });
    },
    setIsInitializing: (loading) => set({ isInitializing: loading }), // Keep if needed

    // --- Data Fetching Actions ---

    fetchCities: async () => {
        if (get().isLoadingCities || get().cities.length > 0) {
             console.log(`[UIStateStore fetchCities] Skipping fetch: isLoading=${get().isLoadingCities}, alreadyLoaded=${get().cities.length > 0}`);
            return get().cities; // Don't refetch if loading or already loaded
        }
        console.log('[UIStateStore] Fetching cities...');
        set({ isLoadingCities: true, errorCities: null });
        try {
            // Use apiClient, expect array back
            const fetchedData = await apiClient('/api/filters/cities', 'UIStateStore Cities') || [];
            const sortedCities = Array.isArray(fetchedData)
                ? fetchedData.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                : [];
            console.log(`[UIStateStore] Cities fetched successfully: ${sortedCities.length} items.`);
            set({ cities: sortedCities, isLoadingCities: false });
            return sortedCities;
        } catch (error) {
             handleFetchError(error, 'cities', set); // Use helper
             // No need to return here, error is re-thrown by helper
        }
    },

    // Fetch Cuisines (used as Hashtags)
    fetchCuisines: async () => {
        if (get().isLoadingCuisines || get().cuisines.length > 0) {
            console.log(`[UIStateStore fetchCuisines] Skipping fetch: isLoading=${get().isLoadingCuisines}, alreadyLoaded=${get().cuisines.length > 0}`);
            return get().cuisines;
        }
        console.log('[UIStateStore] Fetching cuisines (hashtags)...');
        set({ isLoadingCuisines: true, errorCuisines: null });
        try {
            // Use apiClient, expect array back
            const fetchedData = await apiClient('/api/filters/cuisines', 'UIStateStore Cuisines') || [];
            const validCuisines = Array.isArray(fetchedData)
              ? fetchedData.filter(item => item && typeof item.id !== 'undefined' && typeof item.name !== 'undefined')
              : [];
            const sortedCuisines = validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
             console.log(`[UIStateStore] Cuisines fetched successfully: ${sortedCuisines.length} items.`);
            set({ cuisines: sortedCuisines, isLoadingCuisines: false });
            return sortedCuisines;
        } catch (error) {
             handleFetchError(error, 'cuisines', set); // Use helper
        }
    },

    // Fetch Neighborhoods for a specific City
    fetchNeighborhoodsByCity: async (cityId) => {
        if (!cityId) {
             console.log('[UIStateStore fetchNeighborhoodsByCity] No cityId provided, clearing neighborhoods.');
            set({ neighborhoods: [], neighborhoodId: null, errorNeighborhoods: null }); // Clear if no cityId
            return [];
        }
        // Avoid fetching if already loading for this city or if data is present for this city
        // Note: This simple check assumes neighborhoods don't change often.
        // More robust: check if neighborhoods array corresponds to the current cityId.
         if (get().isLoadingNeighborhoods) {
             console.log(`[UIStateStore fetchNeighborhoodsByCity] Skipping fetch for city ${cityId}: isLoading=true`);
             return get().neighborhoods;
         }

        console.log(`[UIStateStore] Fetching neighborhoods for city ID: ${cityId}...`);
        set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
        try {
            const data = await apiClient(`/api/filters/neighborhoods?cityId=${cityId}`, `UIStateStore Neighborhoods city ${cityId}`) || [];
            if (!Array.isArray(data)) throw new Error("Invalid data format for neighborhoods."); // Basic validation
            const sortedNeighborhoods = data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
             console.log(`[UIStateStore] Neighborhoods for city ${cityId} fetched successfully: ${sortedNeighborhoods.length} items.`);
            set({ neighborhoods: sortedNeighborhoods, isLoadingNeighborhoods: false });
            return sortedNeighborhoods;
        } catch (error) {
            handleFetchError(error, 'neighborhoods', set); // Use helper
        }
    },
});

// Create the store with middleware
const useUIStateStore = create(
    devtools(
        persist(
            uiStore,
            {
                name: 'ui-state-storage', // storage name
                storage: createJSONStorage(() => localStorage), // storage type
                partialize: (state) => ({
                    // Only persist user filter selections, not fetched data/loading/errors
                    cityId: state.cityId,
                    neighborhoodId: state.neighborhoodId,
                    hashtags: state.hashtags,
                    searchQuery: state.searchQuery,
                }),
                version: 1, // Increment version if state shape changes significantly
                migrate: migrateState, // Use migration function
            }
        ),
        { name: 'UIStateStore' } // Name for Redux DevTools
    )
);

// Optional: Trigger initial fetches if needed, e.g., fetch cities on load
// Be cautious with this to avoid unnecessary calls on every app initialization.
// Consider fetching within components (like FilterSection) using useEffect.
// useUIStateStore.getState().fetchCities();
// useUIStateStore.getState().fetchCuisines();

export default useUIStateStore;