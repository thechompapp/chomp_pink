import { create } from "zustand";
import { API_BASE_URL } from "@/config";

const useAppStore = create((set, get) => ({
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
  isLoadingTrending: false,
  trendingError: null,

  updateFilters: (newFilters) => set((state) => ({
    activeFilters: { ...state.activeFilters, ...newFilters }
  })),

  setFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value }
  })),

  clearFilters: () => set({
    activeFilters: { city: null, neighborhood: null, tags: [] }
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addToList: (listId, item, isNewList = false) => set((state) => {
    const updatedLists = isNewList
      ? [...state.userLists, { ...item, id: listId, createdByUser: true, isFollowing: false }]
      : state.userLists.map((list) =>
          list.id === listId ? { ...list, items: [...(list.items || []), item] } : list
        );
    return { userLists: updatedLists };
  }),

  toggleFollowList: (listId) => set((state) => {
    const updatedLists = state.userLists.map((list) => {
      if (list.id === listId) {
        const newIsFollowing = !list.isFollowing;
        const newSavedCount = (list.savedCount || 0) + (newIsFollowing ? 1 : -1);
        return { ...list, isFollowing: newIsFollowing, savedCount: newSavedCount };
      }
      return list;
    });
    const updatedPopularLists = state.popularLists.map((list) => {
      if (list.id === listId) {
        const newIsFollowing = !list.isFollowing;
        const newSavedCount = (list.savedCount || 0) + (newIsFollowing ? 1 : -1);
        return { ...list, isFollowing: newIsFollowing, savedCount: newSavedCount };
      }
      return list;
    });
    return { userLists: updatedLists, popularLists: updatedPopularLists };
  }),

  checkDuplicateRestaurant: (newItem) => {
    const { name, city, neighborhood } = newItem;
    const state = get();
    return state.trendingItems.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.city === city &&
        item.neighborhood === neighborhood
    );
  },

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
      } else {
        throw new Error('Failed to add submission');
      }
    } catch (error) {
      console.error('Error adding submission:', error);
    }
  },

  fetchPendingSubmissions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`);
      if (response.ok) {
        const data = await response.json();
        set({ pendingSubmissions: data });
      } else {
        throw new Error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  },

  approveSubmission: async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${itemId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        set((state) => ({
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== itemId),
        }));
      } else {
        throw new Error('Failed to approve submission');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
    }
  },

  rejectSubmission: async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${itemId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        set((state) => ({
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== itemId),
        }));
      } else {
        throw new Error('Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  },

  fetchUserLists: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lists`);
      if (response.ok) {
        const data = await response.json();
        set({ userLists: data });
      } else {
        throw new Error('Failed to fetch user lists');
      }
    } catch (error) {
      console.error('Error fetching user lists:', error);
      set({ userLists: [] });
    }
  },

  initializeTrendingData: async (retryCount = 0, maxRetries = 3) => {
    if (retryCount >= maxRetries) {
      set({
        isLoadingTrending: false,
        trendingError: 'Max retries reached. Using mock data.',
        trendingItems: [
          { id: 1, name: "Joe's Pizza", neighborhood: "Greenwich Village", city: "New York", tags: ["pizza", "italian"], adds: 78 },
          { id: 2, name: "Shake Shack", neighborhood: "Midtown", city: "New York", tags: ["burger", "american"], adds: 52 },
        ],
        trendingDishes: [
          { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 78 },
          { id: 2, name: "ShackBurger", restaurant: "Shake Shack", tags: ["burger", "beef"], price: "$$ • ", adds: 52 },
        ],
        popularLists: [
          { id: 1, name: "NYC Pizza Tour", items: [], itemCount: 5, savedCount: 120, city: "New York", tags: ["pizza", "nyc"], isFollowing: false, createdByUser: false, creatorHandle: "@foodie1" },
          { id: 2, name: "Best Burgers NYC", items: [], itemCount: 8, savedCount: 150, city: "New York", tags: ["burgers", "nyc"], isFollowing: false, createdByUser: false, creatorHandle: "@burgerlover" },
        ],
      });
      return;
    }

    set({ isLoadingTrending: true, trendingError: null });
    try {
      const [itemsRes, dishesRes, listsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trending/restaurants`),
        fetch(`${API_BASE_URL}/api/trending/dishes`),
        fetch(`${API_BASE_URL}/api/trending/lists`),
      ]);

      if (!itemsRes.ok || !dishesRes.ok || !listsRes.ok) {
        throw new Error('Failed to fetch trending data');
      }

      const trendingItems = await itemsRes.json();
      const trendingDishes = await dishesRes.json();
      const popularLists = await listsRes.json();

      set({ 
        trendingItems, 
        trendingDishes, 
        popularLists, 
        isLoadingTrending: false, 
        trendingError: null 
      });
    } catch (error) {
      console.error('Error initializing trending data:', error);
      setTimeout(() => {
        get().initializeTrendingData(retryCount + 1, maxRetries);
      }, 1000);
    }
  },

  updateListVisibility: (listId, isPublic) => set((state) => ({
    userLists: state.userLists.map((list) =>
      list.id === listId ? { ...list, isPublic } : list
    ),
  })),

  initializeListsMetadata: () => set((state) => ({
    userLists: state.userLists.map((list) => ({
      ...list,
      items: list.items || [],
      dateCreated: list.dateCreated || new Date().toISOString(),
      isPublic: list.isPublic !== undefined ? list.isPublic : true,
    })),
  })),

  addPlan: (plan) => set((state) => ({
    plans: [...state.plans, plan],
  })),

  updatePlan: (planId, updatedPlan) => set((state) => ({
    plans: state.plans.map((plan) =>
      plan.id === planId ? updatedPlan : plan
    ),
  })),
}));

export default useAppStore;