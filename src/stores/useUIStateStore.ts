/* src/stores/useUIStateStore.ts */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { filterService } from '@/services/filterService.js';
import type { City, Neighborhood, Cuisine } from '@/types/Filters';

interface UIState {
    searchQuery: string;
    isSearchOpen: boolean;
    showFilterBar: boolean;
    isLoading: boolean;
    triggerRefresh: boolean;

    cities: City[];
    neighborhoods: Neighborhood[];
    cuisines: Cuisine[];

    cityId: number | null;
    neighborhoodId: number | null;
    hashtags: string[];

    isLoadingCities: boolean;
    isLoadingNeighborhoods: boolean;
    isLoadingCuisines: boolean;

    errorCities: string | null;
    errorNeighborhoods: string | null;
    errorCuisines: string | null;

    loadedNeighborhoodsForCityId: number | null;

    fetchCities: () => Promise<void>;
    fetchNeighborhoods: (cityId: number) => Promise<void>;
    fetchCuisines: () => Promise<void>;
    setCityId: (cityId: number | null) => void;
    setNeighborhoodId: (neighborhoodId: number | null) => void;
    setHashtags: (hashtags: string[]) => void;
    setSearchQuery: (query: string) => void;
    setIsSearchOpen: (isOpen: boolean) => void;
    setShowFilterBar: (show: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    toggleRefresh: () => void;
    clearAllFilters: () => void;
}

export const useUIStateStore = create<UIState>()(
    devtools(
        persist(
            (set, get) => ({
                searchQuery: '',
                isSearchOpen: false,
                showFilterBar: true,
                isLoading: false,
                triggerRefresh: false,

                cities: [],
                neighborhoods: [],
                cuisines: [],

                cityId: null,
                neighborhoodId: null,
                hashtags: [],

                isLoadingCities: false,
                isLoadingNeighborhoods: false,
                isLoadingCuisines: false,

                errorCities: null,
                errorNeighborhoods: null,
                errorCuisines: null,

                loadedNeighborhoodsForCityId: null,

                fetchCities: async () => {
                    const { isLoadingCities, cities } = get();
                    if (isLoadingCities || cities.length > 0) return;
                    set({ isLoadingCities: true, errorCities: null });
                    try {
                        const fetchedCities = await filterService.getCities();
                        set({ cities: Array.isArray(fetchedCities) ? fetchedCities : [], isLoadingCities: false });
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : 'Failed to fetch cities';
                        console.error('[UIStateStore] Error fetching cities:', error);
                        set({ cities: [], isLoadingCities: false, errorCities: message });
                    }
                },

                fetchNeighborhoods: async (cityId: number) => {
                    if (typeof cityId !== 'number' || cityId <= 0) {
                        console.warn('[UIStateStore] Invalid cityId:', cityId);
                        set({ neighborhoods: [], loadedNeighborhoodsForCityId: null, errorNeighborhoods: null, isLoadingNeighborhoods: false });
                        return;
                    }
                    const { isLoadingNeighborhoods, loadedNeighborhoodsForCityId } = get();
                    if (isLoadingNeighborhoods || loadedNeighborhoodsForCityId === cityId) return;
                    set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
                    try {
                        const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
                        set({
                            neighborhoods: Array.isArray(neighborhoods) ? neighborhoods : [],
                            isLoadingNeighborhoods: false,
                            loadedNeighborhoodsForCityId: cityId,
                        });
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : 'Failed to fetch neighborhoods';
                        console.error('[UIStateStore] Error fetching neighborhoods for city', cityId, ':', error);
                        set({ neighborhoods: [], isLoadingNeighborhoods: false, errorNeighborhoods: message });
                    }
                },

                fetchCuisines: async () => {
                    const { isLoadingCuisines, cuisines } = get();
                    if (isLoadingCuisines || cuisines.length > 0) return;
                    set({ isLoadingCuisines: true, errorCuisines: null });
                    try {
                        const fetchedCuisines = await filterService.getCuisines();
                        set({ cuisines: Array.isArray(fetchedCuisines) ? fetchedCuisines : [], isLoadingCuisines: false });
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : 'Failed to fetch cuisines';
                        console.error('[UIStateStore] Error fetching cuisines:', error);
                        set({ cuisines: [], isLoadingCuisines: false, errorCuisines: message });
                    }
                },

                setCityId: (cityId) => {
                    const currentCityId = get().cityId;
                    const nextCityId = typeof cityId === 'number' && cityId > 0 ? cityId : null;
                    if (currentCityId !== nextCityId) {
                        console.log(`[UIStateStore] Setting cityId to: ${nextCityId}`);
                        set({
                            cityId: nextCityId,
                            neighborhoodId: null,
                            neighborhoods: [],
                            loadedNeighborhoodsForCityId: null,
                            errorNeighborhoods: null,
                        });
                        if (nextCityId !== null) {
                            get().fetchNeighborhoods(nextCityId);
                        }
                    }
                },

                setNeighborhoodId: (neighborhoodId) => {
                    const nextNeighborhoodId = typeof neighborhoodId === 'number' && neighborhoodId > 0 ? neighborhoodId : null;
                    if (get().neighborhoodId !== nextNeighborhoodId) {
                        console.log(`[UIStateStore] Setting neighborhoodId to: ${nextNeighborhoodId}`);
                        set({ neighborhoodId: nextNeighborhoodId });
                    }
                },

                setHashtags: (hashtags) => {
                    if (!Array.isArray(hashtags) || !hashtags.every((tag) => typeof tag === 'string')) {
                        console.warn('[UIStateStore] Invalid hashtags:', hashtags);
                        return;
                    }
                    const currentHashtags = get().hashtags;
                    if (JSON.stringify(currentHashtags) !== JSON.stringify(hashtags)) {
                        console.log(`[UIStateStore] Setting hashtags:`, hashtags);
                        set({ hashtags });
                    }
                },

                setSearchQuery: (query) => {
                    if (typeof query !== 'string') {
                        console.warn('[UIStateStore] Invalid search query:', query);
                        return;
                    }
                    if (get().searchQuery !== query) {
                        console.log(`[UIStateStore] Setting searchQuery to: ${query}`);
                        set({ searchQuery: query });
                    }
                },

                setIsSearchOpen: (isOpen) => {
                    if (get().isSearchOpen !== isOpen) {
                        set({ isSearchOpen: isOpen });
                    }
                },

                setShowFilterBar: (show) => {
                    if (get().showFilterBar !== show) {
                        set({ showFilterBar: show });
                    }
                },

                setIsLoading: (loading) => {
                    if (get().isLoading !== loading) {
                        set({ isLoading: loading });
                    }
                },

                toggleRefresh: () => {
                    set((state) => ({ triggerRefresh: !state.triggerRefresh }));
                },

                clearAllFilters: () => {
                    const { cityId, neighborhoodId, hashtags } = get();
                    if (cityId !== null || neighborhoodId !== null || hashtags.length > 0) {
                        console.log('[UIStateStore] Clearing all filters');
                        set({
                            cityId: null,
                            neighborhoodId: null,
                            hashtags: [],
                            neighborhoods: [],
                            loadedNeighborhoodsForCityId: null,
                            errorNeighborhoods: null,
                        });
                    }
                },
            }),
            {
                name: 'ui-state-storage',
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    cityId: state.cityId,
                    neighborhoodId: state.neighborhoodId,
                    hashtags: state.hashtags,
                    searchQuery: state.searchQuery,
                    showFilterBar: state.showFilterBar,
                }),
                onRehydrateStorage: () => {
                    return () => {
                        console.log('[UIStateStore] Rehydration complete.');
                        const state = get();
                        if (state.cityId && !state.isLoadingNeighborhoods && state.loadedNeighborhoodsForCityId !== state.cityId) {
                            console.log('[UIStateStore onRehydrate] Fetching neighborhoods for cityId:', state.cityId);
                            state.fetchNeighborhoods(state.cityId);
                        }
                        if (!state.isLoadingCities && state.cities.length === 0) {
                            console.log('[UIStateStore onRehydrate] Fetching initial cities.');
                            state.fetchCities();
                        }
                        if (!state.isLoadingCuisines && state.cuisines.length === 0) {
                            console.log('[UIStateStore onRehydrate] Fetching initial cuisines.');
                            state.fetchCuisines();
                        }
                    };
                },
            }
        ),
        { name: 'UIStateStore' }
    )
);