import { create } from "zustand";

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
    const updatedLists = state.userLists.map((list) =>
      list.id === listId ? { ...list, isFollowing: !list.isFollowing } : list
    );
    const updatedPopularLists = state.popularLists.map((list) =>
      list.id === listId ? { ...list, isFollowing: !list.isFollowing } : list
    );
    return { userLists: updatedLists, popularLists: updatedPopularLists };
  }),

  addPendingSubmission: (item) => set((state) => ({
    pendingSubmissions: [...state.pendingSubmissions, { ...item, id: Date.now() }],
  })),

  approveSubmission: (itemId) => set((state) => {
    const item = state.pendingSubmissions.find((s) => s.id === itemId);
    if (!item) return state;

    let updatedItems = [...state.trendingItems];
    let updatedDishes = [...state.trendingDishes];

    if (item.type === "restaurant") {
      updatedItems.push({ ...item, status: "approved" });
    } else if (item.type === "dish") {
      updatedDishes.push({ ...item, status: "approved" });
    }

    return {
      trendingItems: updatedItems,
      trendingDishes: updatedDishes,
      pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== itemId),
    };
  }),

  rejectSubmission: (itemId) => set((state) => ({
    pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== itemId),
  })),

  initializeTrendingData: () =>
    set({
      trendingItems: [
        { id: 1, name: "Joe's Pizza", neighborhood: "Greenwich Village", city: "New York", tags: ["pizza", "italian"], adds: 78 },
        { id: 2, name: "Shake Shack", neighborhood: "Midtown", city: "New York", tags: ["burger", "american"], adds: 52 },
        { id: 3, name: "Katz's Deli", neighborhood: "Lower East Side", city: "New York", tags: ["deli", "sandwiches"], adds: 95 },
        { id: 4, name: "In-N-Out", neighborhood: "Hollywood", city: "Los Angeles", tags: ["burger", "fast-food"], adds: 88 },
        { id: 5, name: "Pizzeria Mozza", neighborhood: "West Hollywood", city: "Los Angeles", tags: ["pizza", "italian"], adds: 65 },
        { id: 6, name: "Girl & The Goat", neighborhood: "West Loop", city: "Chicago", tags: ["american", "small-plates"], adds: 72 },
        { id: 7, name: "Lou Malnati's", neighborhood: "River North", city: "Chicago", tags: ["pizza", "deep-dish"], adds: 80 },
        { id: 8, name: "Joe's Stone Crab", neighborhood: "South Beach", city: "Miami", tags: ["seafood", "upscale"], adds: 90 },
        { id: 9, name: "The Halal Guys", neighborhood: "Midtown", city: "New York", tags: ["halal", "street-food"], adds: 60 },
        { id: 10, name: "Gjelina", neighborhood: "Venice", city: "Los Angeles", tags: ["american", "vegetarian"], adds: 70 },
        { id: 11, name: "Au Cheval", neighborhood: "West Loop", city: "Chicago", tags: ["burger", "diner"], adds: 85 },
        { id: 12, name: "Versailles", neighborhood: "Little Havana", city: "Miami", tags: ["cuban", "latin"], adds: 75 },
        { id: 13, name: "Blue Ribbon Sushi", neighborhood: "SoHo", city: "New York", tags: ["sushi", "japanese"], adds: 68 },
        { id: 14, name: "Rolf's", neighborhood: "Gramercy", city: "New York", tags: ["german", "festive"], adds: 55 },
        { id: 15, name: "Ci Siamo", neighborhood: "Hudson Yards", city: "New York", tags: ["italian", "modern"], adds: 62 },
      ],
      trendingDishes: [
        { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 78 },
        { id: 2, name: "ShackBurger", restaurant: "Shake Shack", tags: ["burger", "beef"], price: "$$ • ", adds: 52 },
        { id: 3, name: "Pastrami Sandwich", restaurant: "Katz's Deli", tags: ["sandwich", "meat"], price: "$$$ • ", adds: 95 },
        { id: 4, name: "Double-Double", restaurant: "In-N-Out", tags: ["burger", "fast-food"], price: "$ • ", adds: 88 },
        { id: 5, name: "Butterscotch Budino", restaurant: "Pizzeria Mozza", tags: ["dessert", "italian"], price: "$$ • ", adds: 65 },
        { id: 6, name: "Goat Empanadas", restaurant: "Girl & The Goat", tags: ["small-plates", "fusion"], price: "$$$ • ", adds: 72 },
        { id: 7, name: "Deep Dish Pizza", restaurant: "Lou Malnati's", tags: ["pizza", "cheese"], price: "$$ • ", adds: 80 },
        { id: 8, name: "Stone Crab Claws", restaurant: "Joe's Stone Crab", tags: ["seafood", "signature"], price: "$$$$ • ", adds: 90 },
        { id: 9, name: "Chicken Over Rice", restaurant: "The Halal Guys", tags: ["halal", "street-food"], price: "$ • ", adds: 60 },
        { id: 10, name: "Grilled Octopus", restaurant: "Gjelina", tags: ["seafood", "vegetarian-friendly"], price: "$$$ • ", adds: 70 },
        { id: 11, name: "Cheeseburger", restaurant: "Au Cheval", tags: ["burger", "classic"], price: "$$ • ", adds: 85 },
        { id: 12, name: "Cubano Sandwich", restaurant: "Versailles", tags: ["sandwich", "cuban"], price: "$$ • ", adds: 75 },
        { id: 13, name: "Spicy Tuna Roll", restaurant: "Blue Ribbon Sushi", tags: ["sushi", "spicy"], price: "$$$ • ", adds: 68 },
        { id: 14, name: "Schnitzel", restaurant: "Rolf's", tags: ["german", "traditional"], price: "$$ • ", adds: 55 },
        { id: 15, name: "Pasta al Forno", restaurant: "Ci Siamo", tags: ["pasta", "italian"], price: "$$$ • ", adds: 62 },
      ],
      popularLists: [
        { id: 1, name: "NYC Pizza Tour", items: [], itemCount: 5, savedCount: 120, city: "New York", tags: ["pizza", "nyc"], isFollowing: false, createdByUser: false },
        { id: 2, name: "Best Burgers NYC", items: [], itemCount: 8, savedCount: 150, city: "New York", tags: ["burgers", "nyc"], isFollowing: false, createdByUser: false },
        { id: 3, name: "LA Foodie Gems", items: [], itemCount: 6, savedCount: 90, city: "Los Angeles", tags: ["foodie", "la"], isFollowing: false, createdByUser: false },
        { id: 4, name: "Chicago Deep Dish", items: [], itemCount: 4, savedCount: 110, city: "Chicago", tags: ["pizza", "chicago"], isFollowing: false, createdByUser: false },
        { id: 5, name: "Miami Seafood Spots", items: [], itemCount: 7, savedCount: 130, city: "Miami", tags: ["seafood", "miami"], isFollowing: false, createdByUser: false },
        { id: 6, name: "NYC Street Food", items: [], itemCount: 5, savedCount: 85, city: "New York", tags: ["street-food", "nyc"], isFollowing: false, createdByUser: false },
        { id: 7, name: "LA Vegan Eats", items: [], itemCount: 6, savedCount: 95, city: "Los Angeles", tags: ["vegan", "la"], isFollowing: false, createdByUser: false },
        { id: 8, name: "Chicago Brunch", items: [], itemCount: 5, savedCount: 100, city: "Chicago", tags: ["brunch", "chicago"], isFollowing: false, createdByUser: false },
        { id: 9, name: "Miami Nightlife Bites", items: [], itemCount: 4, savedCount: 80, city: "Miami", tags: ["nightlife", "miami"], isFollowing: false, createdByUser: false },
        { id: 10, name: "NYC Italian Classics", items: [], itemCount: 7, savedCount: 140, city: "New York", tags: ["italian", "nyc"], isFollowing: false, createdByUser: false },
        { id: 11, name: "LA Taco Trail", items: [], itemCount: 6, savedCount: 115, city: "Los Angeles", tags: ["tacos", "la"], isFollowing: false, createdByUser: false },
        { id: 12, name: "Chicago BBQ", items: [], itemCount: 5, savedCount: 105, city: "Chicago", tags: ["bbq", "chicago"], isFollowing: false, createdByUser: false },
        { id: 13, name: "Miami Cuban Eats", items: [], itemCount: 6, savedCount: 125, city: "Miami", tags: ["cuban", "miami"], isFollowing: false, createdByUser: false },
        { id: 14, name: "NYC Sushi Stops", items: [], itemCount: 5, savedCount: 135, city: "New York", tags: ["sushi", "nyc"], isFollowing: false, createdByUser: false },
        { id: 15, name: "LA Dessert Dash", items: [], itemCount: 4, savedCount: 70, city: "Los Angeles", tags: ["dessert", "la"], isFollowing: false, createdByUser: false },
      ],
    }),

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