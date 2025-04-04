// src/stores/useUIStateStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware'; // Import persist middleware

const useUIStateStore = create(
  devtools(
    persist( // Wrap with persist middleware
      (set) => ({
        cityId: null,
        searchQuery: '',
        // isInitializing and initializationError are typically transient, so we don't persist them
        isInitializing: false,
        initializationError: null,

        setCityId: (cityId) => {
          console.log(`[UIStateStore] Setting cityId to: ${cityId}`);
          set({ cityId: cityId });
        },
        setSearchQuery: (query) => {
          console.log(`[UIStateStore] Setting searchQuery to: ${query}`);
          set({ searchQuery: query });
        },
        // Actions for transient state remain the same
        setIsInitializing: (loading) => set({ isInitializing: loading }),
        setInitializationError: (error) => set({ initializationError: error }),
      }),
      {
        name: 'ui-state-storage', // unique name
        storage: createJSONStorage(() => localStorage), // use localStorage
        partialize: (state) => ({
          // Only persist specific UI state fields
          cityId: state.cityId,
          searchQuery: state.searchQuery,
        }),
        // onRehydrateStorage can be added here if needed, but likely not necessary for simple UI state
      }
    ),
    { name: 'UIStateStore' }
  )
);

export default useUIStateStore;