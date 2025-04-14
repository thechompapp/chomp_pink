/* src/stores/useUIStateStore.js */
/* REMOVED: All TypeScript syntax */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { filterService } from '@/services/filterService.js';
// REMOVED: import type { City, Neighborhood, Cuisine } from '@/types/Filters';

// REMOVED: interface UIState { ... }

export const useUIStateStore = create/*REMOVED: <UIState>*/()(
    devtools(
        persist(
            (set, get) => ({
                searchQuery: '',
                isSearchOpen: false,
                showFilterBar: true,
                isLoading: false, // General loading state (maybe rename?)
                triggerRefresh: false,

                // Filter options
                cities: [],
                neighborhoods: [],
                cuisines: [],

                // Selected filters
                cityId: null,
                neighborhoodId: null,
                hashtags: [],

                // Loading states for filter options
                isLoadingCities: false,
                isLoadingNeighborhoods: false,
                isLoadingCuisines: false,

                // Error states for filter options
                errorCities: null,
                errorNeighborhoods: null,
                errorCuisines: null,

                // State to track which city's neighborhoods are loaded
                loadedNeighborhoodsForCityId: null,

                // --- Actions ---

                fetchCities: async () => {
                    const { isLoadingCities, cities } = get();
                    if (isLoadingCities || (cities && cities.length > 0)) return; // Basic check
                    set({ isLoadingCities: true, errorCities: null });
                    try {
                        const fetchedCities = await filterService.getCities();
                        set({ cities: Array.isArray(fetchedCities) ? fetchedCities : [], isLoadingCities: false });
                    } catch (error/*REMOVED: : unknown*/) {
                        const message = error instanceof Error ? error.message : 'Failed to fetch cities';
                        console.error('[UIStateStore] Error fetching cities:', error);
                        set({ cities: [], isLoadingCities: false, errorCities: message }); // Set empty on error
                    }
                },

                fetchNeighborhoods: async (cityId) => {
                     // Ensure cityId is a valid number before proceeding
                    const cityIdNum = Number(cityId);
                    if (isNaN(cityIdNum) || cityIdNum <= 0) {
                        console.warn('[UIStateStore] Invalid cityId for fetching neighborhoods:', cityId);
                        // Clear neighborhoods if cityId is invalid/cleared
                        set({ neighborhoods: [], loadedNeighborhoodsForCityId: null, errorNeighborhoods: null, isLoadingNeighborhoods: false });
                        return;
                    }

                    const { isLoadingNeighborhoods, loadedNeighborhoodsForCityId } = get();
                    // Prevent refetch if already loading or if data for this city is loaded
                    if (isLoadingNeighborhoods || loadedNeighborhoodsForCityId === cityIdNum) return;

                    set({ isLoadingNeighborhoods: true, errorNeighborhoods: null });
                    try {
                        const neighborhoods = await filterService.getNeighborhoodsByCity(cityIdNum);
                        set({
                            neighborhoods: Array.isArray(neighborhoods) ? neighborhoods : [],
                            isLoadingNeighborhoods: false,
                            loadedNeighborhoodsForCityId: cityIdNum, // Track which city's data is loaded
                        });
                    } catch (error/*REMOVED: : unknown*/) {
                        const message = error instanceof Error ? error.message : 'Failed to fetch neighborhoods';
                        console.error('[UIStateStore] Error fetching neighborhoods for city', cityIdNum, ':', error);
                        set({ neighborhoods: [], isLoadingNeighborhoods: false, errorNeighborhoods: message, loadedNeighborhoodsForCityId: cityIdNum }); // Still mark as attempted load for this city
                    }
                },


                fetchCuisines: async () => {
                    const { isLoadingCuisines, cuisines } = get();
                    if (isLoadingCuisines || (cuisines && cuisines.length > 0)) return;
                    set({ isLoadingCuisines: true, errorCuisines: null });
                    try {
                        const fetchedCuisines = await filterService.getCuisines();
                        set({ cuisines: Array.isArray(fetchedCuisines) ? fetchedCuisines : [], isLoadingCuisines: false });
                    } catch (error/*REMOVED: : unknown*/) {
                        const message = error instanceof Error ? error.message : 'Failed to fetch cuisines';
                        console.error('[UIStateStore] Error fetching cuisines:', error);
                        set({ cuisines: [], isLoadingCuisines: false, errorCuisines: message });
                    }
                },

                setCityId: (cityId) => {
                    const currentCityId = get().cityId;
                    // Ensure incoming cityId is a number or null
                    const nextCityId = (cityId != null && !isNaN(Number(cityId)) && Number(cityId) > 0) ? Number(cityId) : null;

                    if (currentCityId !== nextCityId) {
                        console.log(`[UIStateStore] Setting cityId to: ${nextCityId}`);
                        set({
                            cityId: nextCityId,
                            neighborhoodId: null, // Reset neighborhood when city changes
                            neighborhoods: [], // Clear loaded neighborhoods
                            loadedNeighborhoodsForCityId: null, // Reset tracker
                            errorNeighborhoods: null, // Clear neighborhood errors
                        });
                        // Fetch neighborhoods if a valid city is selected
                        if (nextCityId !== null) {
                            get().fetchNeighborhoods(nextCityId);
                        }
                    }
                },

                setNeighborhoodId: (neighborhoodId) => {
                    // Ensure incoming neighborhoodId is a number or null
                     const nextNeighborhoodId = (neighborhoodId != null && !isNaN(Number(neighborhoodId)) && Number(neighborhoodId) > 0) ? Number(neighborhoodId) : null;
                    if (get().neighborhoodId !== nextNeighborhoodId) {
                        console.log(`[UIStateStore] Setting neighborhoodId to: ${nextNeighborhoodId}`);
                        set({ neighborhoodId: nextNeighborhoodId });
                    }
                },

                setHashtags: (hashtags) => {
                    // Basic validation for JS
                    if (!Array.isArray(hashtags) || !hashtags.every((tag) => typeof tag === 'string')) {
                        console.warn('[UIStateStore] Invalid hashtags value:', hashtags);
                        return;
                    }
                    const currentHashtags = get().hashtags;
                     // Simple comparison, might not catch order changes but ok for this case
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
                    if (get().isSearchOpen !== !!isOpen) { // Ensure boolean
                        set({ isSearchOpen: !!isOpen });
                    }
                },

                setShowFilterBar: (show) => {
                    if (get().showFilterBar !== !!show) { // Ensure boolean
                        set({ showFilterBar: !!show });
                    }
                },

                setIsLoading: (loading) => {
                    if (get().isLoading !== !!loading) { // Ensure boolean
                        set({ isLoading: !!loading });
                    }
                },

                toggleRefresh: () => {
                    set((state) => ({ triggerRefresh: !state.triggerRefresh }));
                },

                clearAllFilters: () => {
                    const { cityId, neighborhoodId, hashtags } = get();
                    // Check if any filters are actually active
                    if (cityId !== null || neighborhoodId !== null || (hashtags && hashtags.length > 0)) {
                        console.log('[UIStateStore] Clearing all filters');
                        set({
                            cityId: null,
                            neighborhoodId: null,
                            hashtags: [],
                            neighborhoods: [], // Clear neighborhoods list
                            loadedNeighborhoodsForCityId: null, // Reset tracker
                            errorNeighborhoods: null, // Clear errors
                        });
                    }
                },
            }),
            {
                name: 'ui-state-storage',
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({ // Persist only selected filter states
                    cityId: state.cityId,
                    neighborhoodId: state.neighborhoodId,
                    hashtags: state.hashtags,
                    searchQuery: state.searchQuery,
                    showFilterBar: state.showFilterBar,
                }),
                onRehydrateStorage: () => {
                    return () => { // Use simple function if state arg not needed here
                        console.log('[UIStateStore] Rehydration complete.');
                        const state = get();
                        // Fetch essential data on rehydrate if missing
                        if (state.cityId && !state.isLoadingNeighborhoods && state.loadedNeighborhoodsForCityId !== state.cityId) {
                            console.log('[UIStateStore onRehydrate] Fetching neighborhoods for cityId:', state.cityId);
                            state.fetchNeighborhoods(state.cityId);
                        }
                        if (!state.isLoadingCities && (!state.cities || state.cities.length === 0)) {
                            console.log('[UIStateStore onRehydrate] Fetching initial cities.');
                            state.fetchCities();
                        }
                         if (!state.isLoadingCuisines && (!state.cuisines || state.cuisines.length === 0)) {
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