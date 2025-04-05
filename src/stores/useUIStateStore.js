import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/utils/apiClient';

const migrateState = (persistedState, version) => {
    if (!persistedState) return {};
    console.log(`[UIStateStore Persist] Migrating from version ${version || 'unknown'}`);
    return persistedState;
};

const uiStore = (set, get) => ({
    cityId: null,
    neighborhoodId: null,
    hashtags: [],
    searchQuery: '',
    isInitializing: false,
    cities: [],
    cuisines: [],
    neighborhoods: [],
    isLoadingCities: false,
    isLoadingCuisines: false,
    isLoadingNeighborhoods: false,
    errorCities: null,
    errorCuisines: null,
    errorNeighborhoods: null,

    clearError: (type = 'general') => {
        if (type === 'cities') set({ errorCities: null });
        else if (type === 'cuisines') set({ errorCuisines: null });
        else if (type === 'neighborhoods') set({ errorNeighborhoods: null });
        else set({ error: null });
    },

    setCityId: (cityId) => {
        if (get().cityId !== cityId) {
            console.log(`[UIStateStore] Setting cityId to: ${cityId}`);
            set({ cityId, neighborhoods: [], neighborhoodId: null, errorNeighborhoods: null });
        }
    },
    setNeighborhoodId: (neighborhoodId) => set({ neighborhoodId }),
    setHashtags: (hashtags) => set({ hashtags: Array.isArray(hashtags) ? hashtags : [] }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setIsInitializing: (loading) => set({ isInitializing: loading, error: null }),

    fetchCities: async () => {
        if (get().isLoadingCities) return get().cities;
        set({ isLoadingCities: true, errorCities: null });
        try {
            const fetchedData = await apiClient('/api/filters/cities', 'UIStateStore Cities') || [];
            const sortedCities = Array.isArray(fetchedData)
                ? fetchedData.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                : [];
            set({ cities: sortedCities, isLoadingCities: false });
            console.log("[UIStateStore] fetchCities completed successfully.");
            return sortedCities;
        } catch (error) {
            console.error('[UIStateStore] Error fetching cities:', error);
            set({ errorCities: error.message || 'Failed to fetch cities.', isLoadingCities: false, cities: [] });
            throw error;
        }
    },

    fetchCuisines: async () => {
        if (get().isLoadingCuisines) return get().cuisines;
        set({ isLoadingCuisines: true, errorCuisines: null });
        try {
            const fetchedData = await apiClient('/api/filters/cuisines', 'UIStateStore Cuisines') || [];
            const validCuisines = Array.isArray(fetchedData)
                ? fetchedData.filter(item => item && 'id' in item && 'name' in item)
                : [];
            const sortedCuisines = validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            set({ cuisines: sortedCuisines, isLoadingCuisines: false });
            console.log("[UIStateStore] fetchCuisines completed successfully.");
            return sortedCuisines;
        } catch (error) {
            console.error('[UIStateStore] Error fetching cuisines:', error);
            set({ errorCuisines: error.message || 'Failed to fetch cuisines.', isLoadingCuisines: false, cuisines: [] });
            throw error;
        }
    },

    fetchNeighborhoodsByCity: async (cityId) => {
        if (!cityId) {
            set({ neighborhoods: [], neighborhoodId: null, errorNeighborhoods: null });
            return [];
        }
        if (get().isLoadingNeighborhoods) return get().neighborhoods;
        set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
        try {
            const data = await apiClient(`/api/filters/neighborhoods?cityId=${cityId}`, `UIStateStore Neighborhoods for city ${cityId}`) || [];
            if (!Array.isArray(data)) throw new Error("Invalid data format for neighborhoods.");
            const sortedNeighborhoods = data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            set({ neighborhoods: sortedNeighborhoods, isLoadingNeighborhoods: false });
            console.log(`[UIStateStore] fetchNeighborhoodsByCity for ${cityId} completed successfully.`);
            return sortedNeighborhoods;
        } catch (error) {
            console.error(`[UIStateStore] Error fetching neighborhoods for city ${cityId}:`, error);
            set({ errorNeighborhoods: error.message || 'Could not load neighborhoods.', isLoadingNeighborhoods: false, neighborhoods: [] });
            throw error;
        }
    },
});

const useUIStateStore = create(
    devtools(
        persist(
            uiStore,
            {
                name: 'ui-state-storage',
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    cityId: state.cityId,
                    neighborhoodId: state.neighborhoodId,
                    hashtags: state.hashtags,
                    searchQuery: state.searchQuery,
                }),
                version: 0,
                migrate: migrateState,
            }
        ),
        { name: 'UIStateStore (Consolidated)' }
    )
);

export default useUIStateStore;