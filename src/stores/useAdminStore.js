import { create } from 'zustand';
import { adminService } from '@/services/adminService';

export const useAdminStore = create((set) => ({
  // Data state
  users: [],
  dishes: [],
  restaurants: [],
  cities: [],
  neighborhoods: [],
  hashtags: [],
  restaurantChains: [],
  submissions: [],
  
  // Status state
  loading: {
    users: false,
    dishes: false,
    restaurants: false,
    cities: false,
    neighborhoods: false,
    hashtags: false,
    restaurantChains: false,
    submissions: false,
    cleanup: false,
  },
  
  error: {
    users: null,
    dishes: null,
    restaurants: null,
    cities: null,
    neighborhoods: null,
    hashtags: null,
    restaurantChains: null,
    submissions: null,
    cleanup: null,
  },
  
  // Actions to set data for each resource type
  setAdminData: (type, data) => set((state) => {
    // Handle specific type mappings
    const storeKey = type === 'chains' ? 'restaurantChains' : 
                    type === 'cleanup' ? 'cleanup' : type;
    
    // Create a new state object that preserves all existing state
    return {
      ...state,
      [storeKey]: data || []
    };
  }),
  
  // Set loading state for a specific resource type
  setLoading: (type, isLoading) => set((state) => ({
    loading: {
      ...state.loading,
      [type]: isLoading,
    }
  })),
  
  // Set error state for a specific resource type
  setError: (type, errorMessage) => set((state) => ({
    error: {
      ...state.error,
      [type]: errorMessage,
    }
  })),
  
  // Fetch data for a specific resource type
  fetchData: async (type) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [type]: true,
      },
      error: {
        ...state.error,
        [type]: null,
      }
    }));
    
    try {
      const response = await adminService[`get${type.charAt(0).toUpperCase() + type.slice(1)}`]();
      if (response?.data?.data) {
        set((state) => ({
          [type]: response.data.data || [],
          loading: {
            ...state.loading,
            [type]: false,
          }
        }));
      }
    } catch (error) {
      console.error(`[AdminStore] Error fetching ${type}:`, error);
      set((state) => ({
        error: {
          ...state.error,
          [type]: error.message || `Failed to fetch ${type}`,
        },
        loading: {
          ...state.loading,
          [type]: false,
        }
      }));
    }
  },
  
  // Clear all admin data
  clearAdminData: () => set({
    users: [],
    dishes: [],
    restaurants: [],
    cities: [],
    neighborhoods: [],
    hashtags: [],
    restaurantChains: [],
    submissions: [],
    loading: {
      users: false,
      dishes: false,
      restaurants: false,
      cities: false,
      neighborhoods: false,
      hashtags: false,
      restaurantChains: false,
      submissions: false,
      cleanup: false,
    },
    error: {
      users: null,
      dishes: null,
      restaurants: null,
      cities: null,
      neighborhoods: null,
      hashtags: null,
      restaurantChains: null,
      submissions: null,
      cleanup: null,
    },
  }),
})); 