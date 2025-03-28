import { create } from 'zustand';

const useAppStore = create((set) => ({
  // User lists with initial sample data
  userLists: [
    { id: 201, name: "My Favorites", items: [], dateCreated: new Date().toISOString(), isPublic: false },
    { id: 202, name: "Want to Try", items: [], dateCreated: new Date().toISOString(), isPublic: true },
    { id: 203, name: "Weekend Plans", items: [], dateCreated: new Date().toISOString(), isPublic: false },
    { id: 204, name: "Special Occasions", items: [], dateCreated: new Date().toISOString(), isPublic: true }
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
  },
  
  // Update list visibility
  updateListVisibility: (listId, isPublic) => {
    set(state => {
      const updatedLists = state.userLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            isPublic
          };
        }
        return list;
      });
      
      return { userLists: updatedLists };
    });
  },
  
  // Create a new list
  createList: (name, isPublic = false) => {
    set(state => {
      const newId = Math.max(...state.userLists.map(list => list.id), 0) + 1;
      const newList = {
        id: newId,
        name,
        items: [],
        dateCreated: new Date().toISOString(),
        isPublic
      };
      
      return { userLists: [...state.userLists, newList] };
    });
  },
  
  // Initialize lists metadata (for existing lists that don't have metadata)
  initializeListsMetadata: () => {
    set(state => {
      // Add creation dates and determine list types
      const listsWithMetadata = state.userLists.map(list => {
        // If list doesn't have a creation date, add one
        if (!list.dateCreated) {
          const randomDays = Math.floor(Math.random() * 30); // Random date within last month
          const date = new Date();
          date.setDate(date.getDate() - randomDays);
          
          return {
            ...list,
            dateCreated: date.toISOString(),
            isPublic: list.isPublic || false
          };
        }
        return list;
      });
      
      return { userLists: listsWithMetadata };
    });
  }
}));

export default useAppStore;