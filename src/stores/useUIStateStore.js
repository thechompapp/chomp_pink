import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useUIStateStore = create(
  devtools(
    (set) => ({
      cityId: null,
      searchQuery: '',
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
      setIsInitializing: (loading) => set({ isInitializing: loading }),
      setInitializationError: (error) => set({ initializationError: error }),
    }),
    { name: 'UIStateStore' }
  )
);

export default useUIStateStore;