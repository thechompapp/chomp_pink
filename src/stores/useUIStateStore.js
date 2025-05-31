/* src/stores/useUIStateStore.js */
/* REFACTORED: Removed filter data/fetching logic. Kept only global UI state. */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; // Removed persist/createJSONStorage if not needed for remaining state

// --- Initial State ---
const initialState = {
  // Global Loading/Error/Success Feedback
  isLoading: false, // Generic global loading indicator state
  globalError: null, // Global error message for banners/toasts
  globalSuccess: null, // Global success message for banners/toasts
  
  // Search State (needed by SearchBar component)
  searchQuery: '', // Current search query
  
  // Example: Submission Modal State (if truly global)
  // isSubmissionModalOpen: false,
};

// --- Store Definition ---
export const useUIStateStore = create(
  devtools(
    // Persist middleware might not be needed anymore unless you specifically want to persist isLoading/error/success states?
    // persist( // Optional: Wrap with persist if needed for remaining state
      (set, get) => ({
        ...initialState,

        // --- Actions ---

        // Search Actions
        setSearchQuery: (query) => set({ searchQuery: query || '' }),
        clearSearchQuery: () => set({ searchQuery: '' }),

        // Global Feedback Actions
        setIsLoading: (isLoading) => set({ isLoading }), // Set global loading state

        // Set global error, clear success
        setGlobalError: (message) => set({ globalError: message || 'An error occurred.', globalSuccess: null }),
        clearGlobalError: () => set({ globalError: null }),

        // Set global success, clear error
        setGlobalSuccess: (message) => set({ globalSuccess: message || 'Operation successful.', globalError: null }),
        clearGlobalSuccess: () => set({ globalSuccess: null }),

        // Convenience methods for showing temporary messages
        showError: (message, duration = 5000) => {
          set({ globalError: message || 'An error occurred.', globalSuccess: null });
          setTimeout(() => {
            // Only clear if the message hasn't changed in the meantime
            if (get().globalError === message) {
              set({ globalError: null });
            }
          }, duration);
        },
        showSuccess: (message, duration = 3000) => {
          set({ globalSuccess: message || 'Success!', globalError: null });
          setTimeout(() => {
            // Only clear if the message hasn't changed
            if (get().globalSuccess === message) {
              set({ globalSuccess: null });
            }
          }, duration);
        },

        // Example: Submission Modal Actions (if kept global)
        // openSubmissionModal: () => set({ isSubmissionModalOpen: true }),
        // closeSubmissionModal: () => set({ isSubmissionModalOpen: false }),

        // --- REMOVED ---
        // - activeFilters, cities, neighborhoods, hashtags, cuisines state
        // - isLoadingFilters, isLoadingCities, isLoadingNeighborhoods, isLoadingCuisines state
        // - filterError, errorCities, errorNeighborhoods, errorCuisines state
        // - cityId, neighborhoodId state
        // - isInitialDataFetched state
        // - setActiveFilters, resetFilters actions
        // - fetchFilters, fetchCities, fetchNeighborhoods, fetchCuisines actions
        // - setCityId, setNeighborhoodId, setHashtags, clearAllFilters actions

      }),
      // { // Options for persist middleware if used
      //   name: 'ui-state-storage-minimal', // New name if persisting
      //   // Only persist relevant global state if needed
      //   // partialize: (state) => ({ isLoading: state.isLoading }),
      // }
    // ) // End persist middleware if used
  ),
  { name: 'UIStateStore' } // Name for devtools
);