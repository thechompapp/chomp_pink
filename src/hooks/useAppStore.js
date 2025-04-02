// src/hooks/useAppStore.js
import { create } from 'zustand'; // Changed to named import
import { API_BASE_URL } from '@/config';

const useAppStore = create((set, get) => ({
  // Data stores
  trendingItems: [],
  trendingDishes: [],
  popularLists: [],
  cities: [],
  neighborhoods: [],
  cuisines: [],
  userLists: [],
  pendingSubmissions: [],

  // Filter state
  searchQuery: '',
  activeFilters: { cityId: null, neighborhoodId: null, tags: [] },

  // Status flags
  isInitializing: false,
  isLoadingTrending: false,
  isLoadingFilterOptions: false,
  initializationError: null,
  trendingError: null,

  // QuickAdd state
  isQuickAddOpen: false,
  quickAddData: null,

  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  clearFilters: () => set({
    activeFilters: { cityId: null, neighborhoodId: null, tags: [] },
    searchQuery: '',
    neighborhoods: [],
  }),

  setFilter: (key, value) => set(state => ({
    activeFilters: { ...state.activeFilters, [key]: value },
  })),

  toggleFilterTag: (tag) => set(state => {
    const tags = state.activeFilters.tags.includes(tag)
      ? state.activeFilters.tags.filter(t => t !== tag)
      : [...state.activeFilters.tags, tag];
    return { activeFilters: { ...state.activeFilters, tags } };
  }),

  initializeApp: async () => {
    console.log('[initializeApp START]');
    set({ isInitializing: true, initializationError: null });
    try {
      console.log('[initializeApp] Starting parallel API calls...');
      const [
        trendingRestaurantsRes,
        trendingDishesRes,
        popularListsRes,
        citiesRes,
        cuisinesRes,
        userListsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trending/restaurants`),
        fetch(`${API_BASE_URL}/api/trending/dishes`),
        fetch(`${API_BASE_URL}/api/trending/lists`),
        fetch(`${API_BASE_URL}/api/cities`),
        fetch(`${API_BASE_URL}/api/cuisines`),
        fetch(`${API_BASE_URL}/api/lists`),
      ]);

      const [
        trendingRestaurants,
        trendingDishes,
        popularLists,
        cities,
        cuisines,
        userLists,
      ] = await Promise.all([
        trendingRestaurantsRes.json(),
        trendingDishesRes.json(),
        popularListsRes.json(),
        citiesRes.json(),
        cuisinesRes.json(),
        userListsRes.json(),
      ]);

      set({
        trendingItems: trendingRestaurants || [],
        trendingDishes: trendingDishes || [],
        popularLists: popularLists || [],
        cities: cities || [],
        cuisines: cuisines || [],
        userLists: userLists || [],
        isInitializing: false,
      });
      console.log('[initializeApp SUCCESS] Initialization complete.');
    } catch (err) {
      console.error('[initializeApp ERROR]', err);
      set({ initializationError: err.message, isInitializing: false });
    }
  },

  fetchNeighborhoods: async (cityId) => {
    set({ isLoadingFilterOptions: true });
    try {
      const res = await fetch(`${API_BASE_URL}/api/neighborhoods?cityId=${cityId}`);
      const neighborhoods = await res.json();
      set({ neighborhoods: neighborhoods || [], isLoadingFilterOptions: false });
    } catch (err) {
      console.error('[fetchNeighborhoods ERROR]', err);
      set({ isLoadingFilterOptions: false });
    }
  },

  openQuickAdd: (data) => set({ isQuickAddOpen: true, quickAddData: data }),
  closeQuickAdd: () => set({ isQuickAddOpen: false, quickAddData: null }),

  // Dashboard actions
  fetchPendingSubmissions: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/pending`);
      const submissions = await res.json();
      set({ pendingSubmissions: submissions || [] });
    } catch (err) {
      console.error('[fetchPendingSubmissions ERROR]', err);
    }
  },

  approveSubmission: async (submissionId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve submission');
      const updatedItem = await res.json();
      set(state => ({
        pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
      }));
      return true;
    } catch (err) {
      console.error('[approveSubmission ERROR]', err);
      return false;
    }
  },

  rejectSubmission: async (submissionId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reject submission');
      set(state => ({
        pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
      }));
    } catch (err) {
      console.error('[rejectSubmission ERROR]', err);
      throw err;
    }
  },

  fetchTrendingData: async () => {
    set({ isLoadingTrending: true, trendingError: null });
    try {
      const [
        restaurantsRes,
        dishesRes,
        listsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trending/restaurants`),
        fetch(`${API_BASE_URL}/api/trending/dishes`),
        fetch(`${API_BASE_URL}/api/trending/lists`),
      ]);

      const [
        trendingRestaurants,
        trendingDishes,
        popularLists,
      ] = await Promise.all([
        restaurantsRes.json(),
        dishesRes.json(),
        listsRes.json(),
      ]);

      set({
        trendingItems: trendingRestaurants || [],
        trendingDishes: trendingDishes || [],
        popularLists: popularLists || [],
        isLoadingTrending: false,
      });
    } catch (err) {
      console.error('[fetchTrendingData ERROR]', err);
      set({ trendingError: err.message, isLoadingTrending: false });
    }
  },

  // List management actions (from QuickAddPopup.jsx)
  addToList: async (listId, itemPayload, isNewList = false) => {
    try {
      if (isNewList) {
        const res = await fetch(`${API_BASE_URL}/api/lists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: itemPayload.name, is_public: itemPayload.isPublic }),
        });
        if (!res.ok) throw new Error('Failed to create list');
        const newList = await res.json();
        return newList;
      } else {
        const res = await fetch(`${API_BASE_URL}/api/lists/${listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemPayload),
        });
        if (!res.ok) throw new Error('Failed to add to list');
        const addedItem = await res.json();
        set(state => ({
          userLists: state.userLists.map(list =>
            list.id === listId ? { ...list, item_count: (list.item_count || 0) + 1 } : list
          ),
        }));
        return addedItem;
      }
    } catch (err) {
      console.error('[addToList ERROR]', err);
      throw err;
    }
  },

  addPendingSubmission: async (submission) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      if (!res.ok) throw new Error('Failed to submit');
      const newSubmission = await res.json();
      set(state => ({
        pendingSubmissions: [...state.pendingSubmissions, newSubmission],
      }));
      return newSubmission;
    } catch (err) {
      console.error('[addPendingSubmission ERROR]', err);
      throw err;
    }
  },

  checkDuplicateRestaurant: async (placeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`);
      const restaurants = await res.json();
      return restaurants.find(r => r.google_place_id === placeId);
    } catch (err) {
      console.error('[checkDuplicateRestaurant ERROR]', err);
      return null;
    }
  },

  fetchUserLists: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists`);
      const lists = await res.json();
      set({ userLists: lists || [] });
    } catch (err) {
      console.error('[fetchUserLists ERROR]', err);
    }
  },
}));

export default useAppStore;