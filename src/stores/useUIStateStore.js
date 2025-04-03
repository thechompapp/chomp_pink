// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useUIStateStore = create(
  devtools(
    (set) => ({
      // Filters
      cityId: null,
      searchQuery: '',
      // Add other filters like neighborhoodId, selectedTags if needed

      // Global loading/error flags (can be moved to specific stores later)
      isInitializing: false,
      initializationError: null,

      // Actions to update UI state
      setCityId: (cityId) => {
          console.log(`[UIStateStore] Setting cityId to: ${cityId}`);
          set({ cityId: cityId });
      },
      setSearchQuery: (query) => {
          console.log(`[UIStateStore] Setting searchQuery to: ${query}`);
          set({ searchQuery: query });
      },
      setIsInitializing: (loading) => set({ isInitializing: loading }),
      setInitializationError: (error) => set({ initializationError: error }),

    }),
    { name: 'UIStateStore' }
  )
);

export default useUIStateStore;