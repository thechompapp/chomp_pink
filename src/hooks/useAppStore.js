import { create } from 'zustand';

const initialTrendingItems = [
  { name: "Joe's Pizza", neighborhood: 'Greenwich Village', city: 'New York', tags: ['pizza', 'italian'] },
  { name: "Shake Shack", neighborhood: 'Midtown', city: 'New York', tags: ['burgers', 'fast-food'] },
  { name: "Katz's Delicatessen", neighborhood: 'Lower East Side', city: 'New York', tags: ['deli', 'sandwiches'] },
  { name: "Blue Ribbon Sushi", neighborhood: 'SoHo', city: 'New York', tags: ['sushi', 'japanese'] },
  { name: "The Halal Guys", neighborhood: 'Upper West Side', city: 'New York', tags: ['middle-eastern', 'street-food'] },
  { name: "In-N-Out Burger", neighborhood: 'Hollywood', city: 'Los Angeles', tags: ['burgers', 'fast-food'] },
  { name: "Pizzeria Mozza", neighborhood: 'Hollywood', city: 'Los Angeles', tags: ['pizza', 'italian'] },
  { name: "Gjelina", neighborhood: 'Venice', city: 'Los Angeles', tags: ['american', 'vegetarian'] },
  { name: "Grand Central Market", neighborhood: 'Downtown', city: 'Los Angeles', tags: ['food-hall', 'variety'] },
  { name: "Au Cheval", neighborhood: 'Loop', city: 'Chicago', tags: ['burgers', 'american'] },
  { name: "Lou Malnati's", neighborhood: 'River North', city: 'Chicago', tags: ['pizza', 'deep-dish'] },
  { name: "Joe's Stone Crab", neighborhood: 'South Beach', city: 'Miami', tags: ['seafood', 'upscale'] }
];

const initialTrendingDishes = [
  { name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ['pizza', 'vegetarian'], city: 'New York', neighborhood: 'Greenwich Village' },
  { name: "ShackBurger", restaurant: "Shake Shack", tags: ['burger', 'beef'], city: 'New York', neighborhood: 'Midtown' },
  { name: "Pastrami Sandwich", restaurant: "Katz's Delicatessen", tags: ['sandwich', 'meat'], city: 'New York', neighborhood: 'Lower East Side' },
  { name: "Dragon Roll", restaurant: "Blue Ribbon Sushi", tags: ['sushi', 'spicy'], city: 'New York', neighborhood: 'SoHo' },
  { name: "Chicken Over Rice", restaurant: "The Halal Guys", tags: ['halal', 'chicken'], city: 'New York', neighborhood: 'Upper West Side' },
  { name: "Double-Double", restaurant: "In-N-Out Burger", tags: ['burger', 'beef'], city: 'Los Angeles', neighborhood: 'Hollywood' },
  { name: "Butterscotch Budino", restaurant: "Pizzeria Mozza", tags: ['dessert', 'italian'], city: 'Los Angeles', neighborhood: 'Hollywood' },
  { name: "Braised Short Ribs", restaurant: "Gjelina", tags: ['meat', 'dinner'], city: 'Los Angeles', neighborhood: 'Venice' },
  { name: "Chicago-style Hot Dog", restaurant: "Portillo's", tags: ['hot-dog', 'beef'], city: 'Chicago', neighborhood: 'River North' },
  { name: "Deep Dish Pizza", restaurant: "Lou Malnati's", tags: ['pizza', 'cheese'], city: 'Chicago', neighborhood: 'River North' },
  { name: "Stone Crab Claws", restaurant: "Joe's Stone Crab", tags: ['seafood', 'signature'], city: 'Miami', neighborhood: 'South Beach' }
];

const initialPopularLists = [
  { id: 101, name: "NYC Pizza Tour", itemCount: 8, savedCount: 245, isPublic: true, city: 'New York', tags: ['pizza', 'italian'], items: [] },
  { id: 102, name: "Best Burgers in Manhattan", itemCount: 12, savedCount: 187, isPublic: true, city: 'New York', tags: ['burgers', 'beef'], items: [] },
  { id: 103, name: "Late Night Eats", itemCount: 5, savedCount: 92, isPublic: true, city: 'Los Angeles', tags: ['late-night', 'casual'], items: [] },
  { id: 104, name: "Michelin Star Experience", itemCount: 7, savedCount: 156, isPublic: true, city: 'Chicago', tags: ['fine-dining', 'upscale'], items: [] },
  { id: 105, name: "Budget-Friendly Bites", itemCount: 15, savedCount: 201, isPublic: true, city: 'New York', tags: ['cheap-eats', 'casual'], items: [] },
  { id: 106, name: "Date Night Spots", itemCount: 10, savedCount: 172, isPublic: true, city: 'Miami', tags: ['romantic', 'dinner'], items: [] }
];

const useAppStore = create((set) => ({
  userLists: [],
  trendingItems: initialTrendingItems,
  trendingDishes: initialTrendingDishes,
  popularLists: initialPopularLists,
  activeFilters: { city: null, neighborhood: null, tags: [] },
  initializeListsMetadata: () => {
    set({ userLists: [] });
  },
  setPendingSubmissions: (submissions) => set({ pendingSubmissions: submissions }),
  addTrendingItem: (item) => set(state => ({
    trendingItems: [...state.trendingItems, item]
  })),
  setTrendingItems: (items) => set({ trendingItems: items }),
  setTrendingDishes: (dishes) => set({ trendingDishes: dishes }),
  setPopularLists: (lists) => set({ popularLists: lists }),
  addToUserList: (listId, item) => set(state => ({
    userLists: state.userLists.map(list =>
      list.id === listId ? { ...list, items: [...list.items, item] } : list
    )
  })),
  createList: (name, isPublic) => set(state => ({
    userLists: [...state.userLists, { id: Date.now(), name, isPublic, items: [], dateCreated: new Date().toISOString() }]
  })),
  toggleFollowList: (listId) => set(state => ({
    userLists: state.userLists.map(list =>
      list.id === listId ? { ...list, followedDate: list.followedDate ? null : new Date().toISOString() } : list
    )
  })),
}));

export default useAppStore;