import { create } from "zustand";
import { API_BASE_URL } from "@/config";

const useAppStore = create((set) => ({
  trendingItems: [],
  setTrendingItems: (items) => set({ trendingItems: items }),
  trendingDishes: [],
  setTrendingDishes: (dishes) => set({ trendingDishes: dishes }),
  popularLists: [],
  setPopularLists: (lists) => set({ popularLists: lists }),
  userLists: [],
  setUserLists: (lists) => set({ userLists: lists }),
  activeFilters: { city: null, neighborhood: null, tags: [] },
  searchQuery: "",
  plans: [],
  pendingSubmissions: [],

  // Batch filter updates
  updateFilters: (newFilters) => set((state) => ({
    activeFilters: { ...state.activeFilters, ...newFilters }
  })),

  // Legacy single filter update (for compatibility)
  setFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value }
  })),

  clearFilters: () => set({
    activeFilters: { city: null, neighborhood: null, tags: [] }
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Add to list
  addToList: (listId, item, isNewList = false) => set((state) => {
    const updatedLists = isNewList
      ? [...state.userLists, { ...item, id: listId, createdByUser: true, isFollowing: false }]
      : state.userLists.map((list) =>
          list.id === listId ? { ...list, items: [...(list.items || []), item] } : list
        );
    return { userLists: updatedLists };
  }),

  // Toggle follow list
  toggleFollowList: (listId) => set((state) => {
    const updatedLists = state.userLists.map((list) =>
      list.id === listId ? { ...list, isFollowing: !list.isFollowing } : list
    );
    const updatedPopularLists = state.popularLists.map((list) =>
      list.id === listId ? { ...list, isFollowing: !list.isFollowing } : list
    );
    return { userLists: updatedLists, popularLists: updatedPopularLists };
  }),

  // Add pending submission
  addPendingSubmission: async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (response.ok) {
        const newSubmission = await response.json();
        set((state) => ({
          pendingSubmissions: [...state.pendingSubmissions, newSubmission],
        }));
      }
    } catch (error) {
      console.error('Error adding submission:', error);
    }
  },

  // Fetch pending submissions
  fetchPendingSubmissions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`);
      const data = await response.json();
      set({ pendingSubmissions: data });
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  },

  // Approve pending submission
  approveSubmission: async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${itemId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        set((state) => ({
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== itemId),
        }));
      }
    } catch (error) {
      console.error('Error approving submission:', error);
    }
  },

  // Reject pending submission
  rejectSubmission: async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${itemId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        set((state) => ({
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== itemId),
        }));
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  },

  // Initialize trending data from backend
  initializeTrendingData: async () => {
    try {
      const [itemsRes, dishesRes, listsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trending/restaurants`),
        fetch(`${API_BASE_URL}/api/trending/dishes`),
        fetch(`${API_BASE_URL}/api/trending/lists`),
      ]);
      const trendingItems = await itemsRes.json();
      const trendingDishes = await dishesRes.json();
      const popularLists = await listsRes.json();
      set({ trendingItems, trendingDishes, popularLists });
    } catch (error) {
      console.error('Error initializing trending data:', error);
    }
  },

  // Initialize list metadata
  initializeListsMetadata: () => set((state) => ({
    userLists: state.userLists.map((list) => ({
      ...list,
      items: list.items || [],
      dateCreated: list.dateCreated || new Date().toISOString(),
      isPublic: list.isPublic !== undefined ? list.isPublic : true,
    })),
  })),
}));

export default useAppStore;