// src/hooks/useAppStore.js (Logging around final set in initializeApp)
import { create } from "zustand";
import { API_BASE_URL } from "@/config.js";

const fetchFilterOptions = async (endpoint) => { /* ... */ };

const useAppStore = create((set, get) => ({
  // --- State --- (Keep all state properties as they were) ---
  trendingItems: [], /* ... */ cities: [], /* ... */ initCounter: 0,

  // --- Actions ---
  // ... (Other actions remain the same) ...

  // Combined Initialization Action (Logging around final set)
  initializeApp: async () => {
    if (get().isInitializing) return;
    set({ isInitializing: true, initializationError: null, /* ... loading flags ... */ });
    try {
      console.log("[initializeApp] Starting parallel API calls...");
      const [ restaurantsRes, dishesRes, trendingListsRes, userListsRes, citiesRes, cuisinesRes ] = await Promise.all([ /* ... fetches ... */ ]);
      console.log("[initializeApp] API calls finished. Checking responses...");
      // ... (Error checking remains the same) ...
      if (errors.length > 0) throw new Error(`Failed initial data fetch: ${errors.join(', ')}`);

      console.log("[initializeApp] Parsing JSON responses...");
      const [ restaurants, dishes, trendingLists, userLists, cities, cuisines ] = await Promise.all([ /* ... parsing ... */ ]);
      const parsedDataLengths = { restaurants: restaurants?.length, dishes: dishes?.length, lists: trendingLists?.length, userLists: userLists?.length, cities: cities?.length, cuisines: cuisines?.length };
      console.log("[initializeApp] Parsed data lengths:", parsedDataLengths);

      // Process userLists safely beforehand
      let processedUserLists = [];
      try {
          if (Array.isArray(userLists)) {
               processedUserLists = userLists.map(list => list ? { ...list, is_following: list.is_following ?? false } : null).filter(Boolean);
          } else { console.warn("[initializeApp] userLists from API was not an array:", userLists); }
      } catch (listError) { console.error("[initializeApp] Error processing userLists before set:", listError); }

      // *** LOG BEFORE FINAL SET ***
      const stateBeforeSet = get(); // Get current state right before setting
      console.log(`%c[initializeApp PRE-SET] About to call final set. Current cities length: ${stateBeforeSet.cities?.length}, Current counter: ${stateBeforeSet.initCounter}`, 'color: red; font-weight: bold;');
      console.log(`%c[initializeApp PRE-SET] Data to be set: cities: ${cities?.length}, cuisines: ${cuisines?.length}, restaurants: ${restaurants?.length}, dishes: ${dishes?.length}, popularLists: ${trendingLists?.length}, userLists: ${processedUserLists?.length}`, 'color: red;');

      // *** Final SINGLE set call ***
      set((state) => {
          // Log inside the setter function (optional, less common)
          // console.log(`[initializeApp SETTER FN] Running. Current counter: ${state.initCounter}`);
          return { // Return the new state object
              trendingItems: restaurants || [],
              trendingDishes: dishes || [],
              popularLists: trendingLists || [],
              userLists: processedUserLists, // Use pre-processed list
              hasFetchedUserLists: true,
              cities: cities || [],
              cuisines: cuisines || [],
              isLoadingTrending: false, isLoadingUserLists: false, isLoadingFilterOptions: false,
              trendingError: null, userListsError: null, initializationError: null,
              isInitializing: false,
              initCounter: state.initCounter + 1
          };
      });

      // *** LOG AFTER FINAL SET ***
      const stateAfterSet = get(); // Get state immediately after setting
      console.log(`%c[initializeApp POST-SET] Final set call completed. New cities length: ${stateAfterSet.cities?.length}, New counter: ${stateAfterSet.initCounter}`, 'color: green; font-weight: bold;');
      console.log('[initializeApp] Initialization successful log line reached.');

    } catch (error) { // This catches errors in fetch, parse, or the set() function call
      console.error('[initializeApp] Initialization Error Caught:', error);
      set((state) => ({ initializationError: error.message, /* ... reset flags ... */ isInitializing: false, initCounter: state.initCounter + 1 }));
    }
  },

  // --- Other Actions --- (Keep as they were) ---
  addToList: async (listId, item, isNewList = false) => { /* ... */ },
  // ... etc ...

}));

export default useAppStore;