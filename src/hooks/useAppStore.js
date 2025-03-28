import { create } from 'zustand';

const useAppStore = create((set) => ({
  // User lists with initial sample data
  userLists: [
    { id: 201, name: "My Favorites", items: [] },
    { id: 202, name: "Want to Try", items: [] },
    { id: 203, name: "Weekend Plans", items: [] },
    { id: 204, name: "Special Occasions", items: [] }
  ],
  
  // Trending items (restaurants)
  trendingItems: [],
  
  // Search and Filter state
  searchQuery: '',
  activeFilters: {
    city: null,
    neighborhood: null,
    tags: []
  },
  
  // Set trending items
  setTrendingItems: (items) => set({ trendingItems: items }),
  
  // Update search query
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Update a specific filter
  setFilter: (filterType, value) => 
    set(state => ({
      activeFilters: {
        ...state.activeFilters,
        [filterType]: value
      }
    })),
  
  // Clear all filters
  clearFilters: () => set({ 
    activeFilters: { city: null, neighborhood: null, tags: [] },
    searchQuery: ''
  }),
  
  // Add item to user list
  addToUserList: (listId, item) => {
    set(state => {
      const updatedLists = state.userLists.map(list => {
        if (list.id === listId) {
          // Check if item already exists in the list
          const itemExists = list.items.some(
            existingItem => existingItem.name === item.name
          );
          
          if (!itemExists) {
            return {
              ...list,
              items: [...list.items, item]
            };
          }
        }
        return list;
      });
      
      return { userLists: updatedLists };
    });
  },
  
  // Remove item from user list
  removeFromUserList: (listId, itemName) => {
    set(state => {
      const updatedLists = state.userLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.filter(item => item.name !== itemName)
          };
        }
        return list;
      });
      
      return { userLists: updatedLists };
    });
  }
}));

export default useAppStore;