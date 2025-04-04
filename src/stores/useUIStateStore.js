// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../utils/apiClient';

// Define the store logic, including config fetching
const uiStore = (set, get) => ({
  // --- User Selections (Persisted) ---
  cityId: null,
  searchQuery: '',

  // --- App Initialization State (Transient) ---
  isInitializing: false,

  // --- Fetched Config Data (Transient) ---
  cities: [],
  cuisines: [],
  isLoadingCities: false,
  isLoadingCuisines: false,

  // --- Unified Error State (Transient) ---
  error: null, // Replaces initializationError, errorCities, errorCuisines

  // --- Actions ---
  clearError: () => set({ error: null }), // Action to clear the error

  setCityId: (cityId) => {
    // Removed console.log
    set({ cityId: cityId });
  },
  setSearchQuery: (query) => {
    // Removed console.log
    set({ searchQuery: query });
  },
  setIsInitializing: (loading) => set({ isInitializing: loading, error: null }), // Clear error when starting init
  // Replaced setInitializationError with a generic setError
  setError: (errorMessage) => set({ error: errorMessage }),

  // --- Fetching Actions ---
  fetchCities: async () => {
    if (get().isLoadingCities) return;
    set({ isLoadingCities: true, error: null }); // Clear error on new fetch
    try {
      const fetchedData = await apiClient('/api/cities', 'UIStateStore Cities') || [];
      const sortedCities = Array.isArray(fetchedData)
         ? fetchedData.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
         : [];
      set({ cities: sortedCities, isLoadingCities: false });
      return sortedCities;
    } catch (error) {
      console.error('[UIStateStore] Error fetching cities:', error);
      // Set unified error state
      if (error.message !== 'Session expired or invalid. Please log in again.') {
         set({ error: error.message, isLoadingCities: false, cities: [] });
      } else {
         set({ isLoadingCities: false, error: error.message });
      }
    }
  },

  fetchCuisines: async () => {
    if (get().isLoadingCuisines) return;
    set({ isLoadingCuisines: true, error: null }); // Clear error on new fetch
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
      // Set unified error state
       if (error.message !== 'Session expired or invalid. Please log in again.') {
          set({ error: error.message, isLoadingCuisines: false, cuisines: [] });
       } else {
          set({ isLoadingCuisines: false, error: error.message });
       }
    }
  },
});

// Create the store with persist middleware
const useUIStateStore = create(
  devtools(
    persist(
      uiStore,
      {
        name: 'ui-state-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist user selections
          cityId: state.cityId,
          searchQuery: state.searchQuery,
          // DO NOT persist: isInitializing, cities, cuisines, loading states, error state
        }),
      }
    ),
    { name: 'UIStateStore (Consolidated)' }
  )
);

export default useUIStateStore;