// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import { API_BASE_URL } from '@/config'; // Need API_BASE_URL for neighborhood fetch

// Define the store logic
const uiStore = (set, get) => ({
  // --- User Selections (Persisted) ---
  cityId: null,
  searchQuery: '',

  // --- App Initialization State (Transient) ---
  isInitializing: false,

  // --- Fetched Config Data (Transient) ---
  cities: [],
  cuisines: [],
  neighborhoods: [], // Added neighborhoods state
  isLoadingCities: false,
  isLoadingCuisines: false,
  isLoadingNeighborhoods: false, // Added neighborhoods loading state

  // --- Unified Error State (Transient) ---
  error: null, // Used for general/initialization errors, fetch errors handled below

  // Specific fetch errors (optional, can help distinguish sources)
  errorCities: null,
  errorCuisines: null,
  errorNeighborhoods: null, // Added neighborhoods error state


  // --- Actions ---
  clearError: (type = 'general') => {
      if (type === 'cities') set({ errorCities: null });
      else if (type === 'cuisines') set({ errorCuisines: null });
      else if (type === 'neighborhoods') set({ errorNeighborhoods: null });
      else set({ error: null }); // Clear general error
  },

  setCityId: (cityId) => {
    set({ cityId: cityId, neighborhoods: [], errorNeighborhoods: null }); // Clear neighborhoods when city changes
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  setIsInitializing: (loading) => set({ isInitializing: loading, error: null }),
  setError: (errorMessage) => set({ error: errorMessage }), // Keep for general errors

  // --- Fetching Actions ---
  fetchCities: async () => {
    if (get().isLoadingCities) return;
    set({ isLoadingCities: true, errorCities: null }); // Use specific error state
    try {
      const fetchedData = await apiClient('/api/cities', 'UIStateStore Cities') || [];
      const sortedCities = Array.isArray(fetchedData)
         ? fetchedData.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
         : [];
      set({ cities: sortedCities, isLoadingCities: false });
      return sortedCities;
    } catch (error) {
      console.error('[UIStateStore] Error fetching cities:', error);
      const errorMsg = error.message || 'Failed to fetch cities.';
      set({ errorCities: errorMsg, isLoadingCities: false, cities: [] });
       // Do not automatically logout here, apiClient handles 401 which triggers logout in authStore
    }
  },

  fetchCuisines: async () => {
    if (get().isLoadingCuisines) return;
    set({ isLoadingCuisines: true, errorCuisines: null }); // Use specific error state
    try {
      const fetchedData = await apiClient('/api/cuisines', 'UIStateStore Cuisines') || [];
      const validCuisines = Array.isArray(fetchedData)
        ? fetchedData.filter(item => typeof item === 'object' && item !== null && 'id' in item && 'name' in item)
        : [];
      if (validCuisines.length !== (Array.isArray(fetchedData) ? fetchedData.length : 0)) {
        console.warn("[UIStateStore] Some fetched cuisine items had invalid structure.");
      }
       const sortedCuisines = validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      set({ cuisines: sortedCuisines, isLoadingCuisines: false });
      return sortedCuisines;
    } catch (error) {
      console.error('[UIStateStore] Error fetching cuisines:', error);
       const errorMsg = error.message || 'Failed to fetch cuisines.';
       set({ errorCuisines: errorMsg, isLoadingCuisines: false, cuisines: [] });
    }
  },

  // Added action to fetch neighborhoods
  fetchNeighborhoodsByCity: async (cityId) => {
      if (!cityId) {
          set({ neighborhoods: [], errorNeighborhoods: null }); // Clear if no cityId
          return [];
      }
      if (get().isLoadingNeighborhoods) return;
      set({ isLoadingNeighborhoods: true, errorNeighborhoods: null }); // Use specific states
      try {
          // Use apiClient for consistency if desired, or keep fetch
          // Using fetch here as example since neighborhood fetcher used it before
          const response = await fetch(`${API_BASE_URL}/api/neighborhoods?cityId=${cityId}`);
           if (!response.ok) {
               let errorMsg = `Failed to fetch neighborhoods (${response.status})`;
               try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
               throw new Error(errorMsg);
           }
           const data = await response.json();
           if (!Array.isArray(data)) throw new Error("Invalid data format for neighborhoods.");
           const sortedNeighborhoods = data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
           set({ neighborhoods: sortedNeighborhoods, isLoadingNeighborhoods: false });
           return sortedNeighborhoods;
      } catch(error) {
          console.error(`[UIStateStore] Error fetching neighborhoods for city ${cityId}:`, error);
          const errorMsg = error.message || 'Could not load neighborhoods.';
          set({ errorNeighborhoods: errorMsg, isLoadingNeighborhoods: false, neighborhoods: [] });
          // Do not re-throw usually for store actions unless needed upstream
      }
  }

});

// Create the store (persist config remains the same)
const useUIStateStore = create(
  devtools(
    persist(
      uiStore,
      {
        name: 'ui-state-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          cityId: state.cityId,
          searchQuery: state.searchQuery,
        }),
      }
    ),
    { name: 'UIStateStore (Consolidated)' }
  )
);

export default useUIStateStore;