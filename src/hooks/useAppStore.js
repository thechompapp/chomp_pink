// src/hooks/useAppStore.js
import { create } from "zustand";
import { API_BASE_URL } from "@/config.js";

const useAppStore = create((set, get) => ({
  // State (keep as is)
  trendingItems: [],
  trendingDishes: [],
  popularLists: [],
  userLists: [],
  activeFilters: { city: null, neighborhood: null, tags: [] },
  searchQuery: "",
  plans: [],
  pendingSubmissions: [],
  isLoadingTrending: false,
  trendingError: null,
  isLoadingUserLists: false,
  userListsError: null,
  isLoadingPending: false,
  pendingError: null,
  hasFetchedUserLists: false,
  isInitializing: false,
  initializationError: null,

  // Actions
  setTrendingItems: (items) => set({ trendingItems: items }),
  setTrendingDishes: (dishes) => set({ trendingDishes: dishes }),
  setPopularLists: (lists) => set({ popularLists: lists }),
  setUserLists: (lists) => set({
      userLists: Array.isArray(lists)
        ? lists.map(list => ({ ...list, is_following: list.is_following ?? false })) // Ensure is_following has a default
        : [],
      hasFetchedUserLists: true
    }),
  updateFilters: (newFilters) => set((state) => ({ activeFilters: { ...state.activeFilters, ...newFilters } })),
  setFilter: (key, value) => set((state) => ({ activeFilters: { ...state.activeFilters, [key]: value } })),
  clearFilters: () => set({ activeFilters: { city: null, neighborhood: null, tags: [] } }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addToList: async (listId, item, isNewList = false) => {
    // Keep addToList as is
    set({ isLoadingUserLists: true });
    try {
      const url = isNewList ? `${API_BASE_URL}/api/lists` : `${API_BASE_URL}/api/lists/${listId}/items`;
      const method = isNewList ? 'POST' : 'PUT';
      const body = isNewList ? { name: item.name, is_public: item.isPublic, created_by_user: true } : { item }; // Assume new lists are user created
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!response.ok) {
           const errorData = await response.text(); // Get more error details
           console.error("AddToList Error Response:", errorData);
           throw new Error(`Failed to add to list: ${response.statusText}`);
       }
      const updatedListOrItem = await response.json();

      // If it was a new list, ensure it's added correctly with default is_following
      if (isNewList) {
          set((state) => ({
              userLists: [...state.userLists, { ...updatedListOrItem, is_following: false, items: [] }], // Add new list with defaults
              isLoadingUserLists: false,
              userListsError: null,
          }));
          return updatedListOrItem; // Return the newly created list
      } else {
          // If adding item to existing list (assuming backend returns updated list)
          set((state) => ({
            userLists: state.userLists.map((list) =>
              String(list.id) === String(listId) ? { ...list, ...updatedListOrItem, is_following: list.is_following ?? false } : list // Merge updates, keep existing follow state
            ),
            isLoadingUserLists: false,
            userListsError: null,
          }));
          // Find and return the specific updated list from the state
           return get().userLists.find(list => String(list.id) === String(listId));
      }

    } catch (error) {
      console.error("AddToList Catch Error:", error);
      set({ userListsError: error.message, isLoadingUserLists: false });
      return null;
    }
  },

  toggleFollowList: async (listId) => {
    console.log(`[toggleFollowList] Action started for ID: ${listId}`);
    const currentState = get();
    const listToToggle = currentState.userLists.find((list) => String(list.id) === String(listId));

    if (!listToToggle) {
      console.error(`[toggleFollowList] List ${listId} not found.`);
      set({ userListsError: `List ${listId} not found.` });
      return;
    }

    // *** FIX: Default is_following to false if undefined before toggling ***
    const originalIsFollowing = listToToggle.is_following ?? false;
    const newIsFollowing = !originalIsFollowing;
    console.log(`[toggleFollowList] Toggling from ${originalIsFollowing} to ${newIsFollowing}`);

    // Optimistic Update
    set((state) => ({
      userLists: state.userLists.map((list) =>
        String(list.id) === String(listId) ? { ...list, is_following: newIsFollowing } : list
      ),
      userListsError: null, // Clear previous errors on new attempt
    }));

    // API Call
    try {
      const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/follow`, {
        method: newIsFollowing ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
          // Attempt to get more detailed error from backend response
          let errorDetails = `HTTP error ${response.status} (${response.statusText})`;
          try {
              const errorData = await response.json();
              errorDetails = errorData.details || errorData.error || errorDetails;
          } catch (e) { /* Ignore if response is not JSON */ }
          throw new Error(`Failed to ${newIsFollowing ? 'follow' : 'unfollow'} list. ${errorDetails}`);
      }
      const data = await response.json(); // Get updated status from backend
      console.log(`[toggleFollowList] API call successful for list ${listId}. Backend confirms is_following: ${data.is_following}`);
      // Optional: Verify backend state matches optimistic update - usually not needed if API is reliable
      if (data.is_following !== newIsFollowing) {
          console.warn(`[toggleFollowList] Mismatch between optimistic (${newIsFollowing}) and backend (${data.is_following}) state! Reverting.`);
          throw new Error("State mismatch after API call."); // Trigger rollback
      }

    } catch (error) {
      console.error('[toggleFollowList] Error during API call or state mismatch:', error);
      // Rollback optimistic update on error
      set((state) => ({
        userLists: state.userLists.map((list) =>
          String(list.id) === String(listId) ? { ...list, is_following: originalIsFollowing } : list
        ),
        userListsError: error.message, // Set the specific error message
      }));
    }
  },

  fetchUserLists: async () => {
    // Prevent fetching if already loading
    if (get().isLoadingUserLists) return;

    set({ isLoadingUserLists: true, userListsError: null }); // Reset error on fetch
    try {
      const response = await fetch(`${API_BASE_URL}/api/lists`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user lists');
      const lists = await response.json();
      // Use the setter which ensures is_following default
      get().setUserLists(lists); // Call the existing setter
      set({ isLoadingUserLists: false }); // Turn off loading explicitly
    } catch (error) {
      console.error("[fetchUserLists] Error:", error);
      set({ userListsError: error.message, isLoadingUserLists: false });
    }
  },


  initializeApp: async () => {
    console.log("[useAppStore initializeApp] Starting initialization...");
    if (get().isInitializing) {
      console.warn("[useAppStore initializeApp] Initialization already in progress. Skipping.");
      return;
    }

    set({
      isInitializing: true,
      isLoadingTrending: true,
      initializationError: null,
      trendingError: null,
      userListsError: null,
      isLoadingUserLists: true, // Also set user list loading during init
    });

    try {
      console.log("[useAppStore initializeApp] Fetching data in parallel...");
      const [restaurantsRes, dishesRes, listsRes, userListsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trending/restaurants`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/trending/dishes`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/popular/lists`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/lists`, { credentials: 'include' }),
      ]);

      const errors = [];
      if (!restaurantsRes.ok) errors.push(`Restaurants: ${restaurantsRes.statusText} (${restaurantsRes.status})`);
      if (!dishesRes.ok) errors.push(`Dishes: ${dishesRes.statusText} (${dishesRes.status})`);
      if (!listsRes.ok) errors.push(`Popular Lists: ${listsRes.statusText} (${listsRes.status})`);
      if (!userListsRes.ok) errors.push(`User Lists: ${userListsRes.statusText} (${userListsRes.status})`);

      if (errors.length > 0) {
        throw new Error(`Failed to fetch data: ${errors.join(', ')}`);
      }

      console.log("[useAppStore initializeApp] Parsing JSON responses...");
      const [restaurants, dishes, lists, userLists] = await Promise.all([
        restaurantsRes.json(),
        dishesRes.json(),
        listsRes.json(),
        userListsRes.json(),
      ]);
      console.log("[useAppStore initializeApp] Fetched data:", { restaurants: restaurants?.length, dishes: dishes?.length, lists: lists?.length, userLists: userLists?.length });

      // Use setters to ensure defaults are applied
      get().setTrendingItems(restaurants);
      get().setTrendingDishes(dishes);
      get().setPopularLists(lists);
      get().setUserLists(userLists); // This setter now handles the default for is_following

      set({
        isLoadingTrending: false, // Turn off specific loading states
        isLoadingUserLists: false,
        trendingError: null,
        initializationError: null,
        isInitializing: false, // Mark initialization complete
      });
      console.log('[useAppStore initializeApp] Initialization successful.');

    } catch (error) {
      console.error('[useAppStore initializeApp] Initialization Error:', error);
      set({
        initializationError: error.message,
        trendingError: error.message,
        userListsError: error.message, // Also set user list error on init failure
        isLoadingTrending: false,
        isLoadingUserLists: false,
        isInitializing: false,
      });
    }
  },


  // Keep remaining functions as is
  checkDuplicateRestaurant: (newItem) => {
    const { trendingItems } = get();
    return trendingItems.some(
      (item) =>
        item.name.toLowerCase() === newItem.name.toLowerCase() &&
        item.city === newItem.city &&
        item.neighborhood === newItem.neighborhood
    );
  },

  addPendingSubmission: async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to add pending submission');
      const newSubmission = await response.json();
      set((state) => ({ pendingSubmissions: [...state.pendingSubmissions, newSubmission] }));
    } catch (error) {
      console.error('[addPendingSubmission] Error:', error);
      set({ pendingError: error.message });
    }
  },

  fetchPendingSubmissions: async () => {
    if (get().isLoadingPending) return;
    set({ isLoadingPending: true });
    try {
      console.log("[fetchPendingSubmissions] Fetching from /api/submissions...");
      const response = await fetch(`${API_BASE_URL}/api/submissions`, { credentials: 'include' });
      if (!response.ok) {
          const errorText = await response.text();
          console.error(`[fetchPendingSubmissions] Error response: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to fetch pending submissions: ${response.status} ${response.statusText}`);
      }
      const submissions = await response.json();
      console.log("[fetchPendingSubmissions] Success. Received submissions:", submissions.length);
      set({ pendingSubmissions: submissions, isLoadingPending: false, pendingError: null });
    } catch (error) {
      console.error('[fetchPendingSubmissions] Fetch Error:', error);
      set({ pendingError: error.message, isLoadingPending: false });
    }
  },

  approveSubmission: async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${itemId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve submission');
      const approvedItem = await response.json();
      set((state) => ({
        pendingSubmissions: state.pendingSubmissions.filter((item) => item.id !== itemId),
        trendingItems: approvedItem.type === 'restaurant' ? [...state.trendingItems, approvedItem] : state.trendingItems,
        trendingDishes: approvedItem.type === 'dish' ? [...state.trendingDishes, approvedItem] : state.trendingDishes,
      }));
    } catch (error) {
      console.error('[approveSubmission] Error:', error);
      set({ pendingError: error.message });
    }
  },

  rejectSubmission: async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${itemId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reject submission');
      set((state) => ({
        pendingSubmissions: state.pendingSubmissions.filter((item) => item.id !== itemId),
      }));
    } catch (error) {
      console.error('[rejectSubmission] Error:', error);
      set({ pendingError: error.message });
    }
  },

  updateListVisibility: (listId, isPublic) =>
    set((state) => ({
      userLists: state.userLists.map((list) =>
        String(list.id) === String(listId) ? { ...list, is_public: !!isPublic } : list
      ),
    })),

  initializeListsMetadata: () =>
    set((state) => ({
      userLists: state.userLists.map((list) => ({
        ...list,
        items: list.items || [],
        is_public: list.is_public !== undefined ? list.is_public : true,
      })),
    })),

  addPlan: (plan) =>
    set((state) => ({
      plans: [...state.plans, { ...plan, id: plan.id || Date.now() }],
    })),

  updatePlan: (planId, updatedPlan) =>
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === planId ? updatedPlan : plan)),
    })),
}));

export default useAppStore;