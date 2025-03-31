// src/hooks/useAppStore.js
import { create } from "zustand";
import { API_BASE_URL } from "@/config.js";

const useAppStore = create((set, get) => ({
  // State
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
  setUserLists: (lists) => set({ userLists: lists, hasFetchedUserLists: true }),
  updateFilters: (newFilters) => set((state) => ({ activeFilters: { ...state.activeFilters, ...newFilters } })),
  setFilter: (key, value) => set((state) => ({ activeFilters: { ...state.activeFilters, [key]: value } })),
  clearFilters: () => set({ activeFilters: { city: null, neighborhood: null, tags: [] } }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addToList: async (listId, item, isNewList = false) => {
    set({ isLoadingUserLists: true });
    try {
      const url = isNewList ? `${API_BASE_URL}/api/lists` : `${API_BASE_URL}/api/lists/${listId}/items`;
      const method = isNewList ? 'POST' : 'PUT';
      const body = isNewList ? { name: item.name, is_public: item.isPublic } : { item };
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to add to list');
      const updatedList = await response.json();
      set((state) => ({
        userLists: isNewList
          ? [...state.userLists, updatedList]
          : state.userLists.map((list) => (String(list.id) === String(listId) ? updatedList : list)),
        isLoadingUserLists: false,
      }));
      return updatedList;
    } catch (error) {
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

    const originalIsFollowing = listToToggle.is_following;
    const newIsFollowing = !originalIsFollowing;
    console.log(`[toggleFollowList] Toggling from ${originalIsFollowing} to ${newIsFollowing}`);

    set((state) => ({
      userLists: state.userLists.map((list) =>
        String(list.id) === String(listId) ? { ...list, is_following: newIsFollowing } : list
      ),
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/follow`, {
        method: newIsFollowing ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to ${newIsFollowing ? 'follow' : 'unfollow'} list`);
      console.log(`[toggleFollowList] Successfully ${newIsFollowing ? 'followed' : 'unfollowed'} list ${listId}`);
    } catch (error) {
      console.error('[toggleFollowList] Error:', error);
      set((state) => ({
        userLists: state.userLists.map((list) =>
          String(list.id) === String(listId) ? { ...list, is_following: originalIsFollowing } : list
        ),
        userListsError: error.message,
      }));
    }
  },

  fetchUserLists: async () => {
    set({ isLoadingUserLists: true });
    try {
      const response = await fetch(`${API_BASE_URL}/api/lists`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user lists');
      const lists = await response.json();
      set({ userLists: lists, hasFetchedUserLists: true, isLoadingUserLists: false, userListsError: null });
    } catch (error) {
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
      console.log("[useAppStore initializeApp] Fetched data:", { restaurants: restaurants.length, dishes: dishes.length, lists: lists.length, userLists: userLists.length });

      set({
        trendingItems: Array.isArray(restaurants) ? restaurants : [],
        trendingDishes: Array.isArray(dishes) ? dishes : [],
        popularLists: Array.isArray(lists) ? lists : [],
        userLists: Array.isArray(userLists) ? userLists : [],
        hasFetchedUserLists: true,
        isLoadingTrending: false,
        trendingError: null,
        initializationError: null,
        isInitializing: false,
      });
      console.log('[useAppStore initializeApp] Initialization successful.');

    } catch (error) {
      console.error('[useAppStore initializeApp] Initialization Error:', error);
      set({
        initializationError: error.message,
        trendingError: error.message,
        isLoadingTrending: false,
        isInitializing: false,
      });
    }
  },

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
      const response = await fetch(`${API_BASE_URL}/api/submissions`, { // Corrected endpoint here as well for consistency
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
    // Prevent fetching if already loading
    if (get().isLoadingPending) return;

    set({ isLoadingPending: true });
    try {
      // *** FIX: Use the correct endpoint /api/submissions ***
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
       // *** FIX: Use the correct endpoint /api/submissions/:id/approve ***
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
       // *** FIX: Use the correct endpoint /api/submissions/:id/reject ***
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