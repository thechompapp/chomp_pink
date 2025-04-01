// src/hooks/useAppStore.js
import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create the store with all state and actions
const useAppStore = create((set, get) => ({
  // Data
  trendingData: [],
  cityOptions: [],
  neighborhoodOptions: [],
  cuisineOptions: [],
  restaurants: [],
  dishes: [],
  lists: [],
  myLists: [],
  followedLists: [],
  
  // Filters
  filters: {
    city: null,
    neighborhood: null,
    cuisines: [],
  },
  
  // UI State
  isLoading: false,
  error: null,
  
  // Filter Actions
  setCity: (city) => {
    set((state) => ({
      filters: {
        ...state.filters,
        city,
        // Reset neighborhood when city changes
        neighborhood: null,
      }
    }));
  },
  
  setNeighborhood: (neighborhood) => {
    set((state) => ({
      filters: {
        ...state.filters,
        neighborhood,
      }
    }));
  },
  
  setCuisines: (cuisines) => {
    set((state) => ({
      filters: {
        ...state.filters,
        cuisines,
      }
    }));
  },
  
  resetFilters: () => {
    set({
      filters: {
        city: null,
        neighborhood: null,
        cuisines: [],
      }
    });
  },
  
  // Data Fetchers
  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try to fetch from API
      try {
        const [cityRes, cuisineRes] = await Promise.all([
          axios.get(`/api/filters/cities`),
          axios.get(`/api/filters/cuisines`),
        ]);
        
        set({
          cityOptions: cityRes.data,
          cuisineOptions: cuisineRes.data,
          isLoading: false,
        });
      } catch (apiError) {
        console.warn('API error, using mock data:', apiError);
        // Fallback to mock data if API fails
        set({
          cityOptions: [
            { id: 1, name: 'New York' },
            { id: 2, name: 'Los Angeles' },
            { id: 3, name: 'Chicago' }
          ],
          cuisineOptions: [
            { id: 1, name: 'Italian' },
            { id: 2, name: 'Japanese' },
            { id: 3, name: 'Mexican' },
            { id: 4, name: 'Indian' },
            { id: 5, name: 'Chinese' }
          ],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      set({ 
        error: 'Failed to load initial data. Please try again.',
        isLoading: false
      });
    }
  },
  
  fetchNeighborhoods: async (cityId) => {
    if (!cityId) {
      set({ neighborhoodOptions: [] });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      try {
        const res = await axios.get(`/api/filters/neighborhoods/${cityId}`);
        set({
          neighborhoodOptions: res.data,
          isLoading: false,
        });
      } catch (apiError) {
        console.warn(`API error fetching neighborhoods, using mock data:`, apiError);
        
        // Fallback mock data based on city ID
        let neighborhoods = [];
        if (cityId === 1) { // New York
          neighborhoods = [
            { id: 1, name: 'Manhattan', city_id: 1 },
            { id: 2, name: 'Brooklyn', city_id: 1 },
            { id: 3, name: 'Queens', city_id: 1 }
          ];
        } else if (cityId === 2) { // Los Angeles
          neighborhoods = [
            { id: 4, name: 'Downtown', city_id: 2 },
            { id: 5, name: 'Hollywood', city_id: 2 },
            { id: 6, name: 'Santa Monica', city_id: 2 }
          ];
        } else if (cityId === 3) { // Chicago
          neighborhoods = [
            { id: 7, name: 'Loop', city_id: 3 },
            { id: 8, name: 'River North', city_id: 3 },
            { id: 9, name: 'Wicker Park', city_id: 3 }
          ];
        }
        
        set({
          neighborhoodOptions: neighborhoods,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      set({ 
        error: 'Failed to load neighborhoods. Please try again.',
        isLoading: false
      });
    }
  },
  
  fetchTrendingData: async () => {
    set({ isLoading: true, error: null });
    try {
      try {
        const res = await axios.get(`/api/trending`);
        set({
          trendingData: res.data,
          isLoading: false,
        });
      } catch (apiError) {
        console.warn('API error fetching trending data, using mock data:', apiError);
        
        // Fallback to mock data if API fails
        set({
          trendingData: [
            {
              id: 1,
              type: 'dish',
              name: 'Spicy Ramen',
              restaurant_name: 'Ramen House',
              restaurant_id: 1,
              image_url: 'https://images.unsplash.com/photo-1614563637806-1d0e645e0940?w=800&auto=format&fit=crop',
              tags: ['Japanese', 'Noodles', 'Spicy'],
              votes_up: 124,
              city_id: 1,
              neighborhood_id: 1,
              trending_location: 'Manhattan'
            },
            {
              id: 2,
              type: 'dish',
              name: 'Truffle Pasta',
              restaurant_name: 'Pasta Palace',
              restaurant_id: 2,
              image_url: 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=800&auto=format&fit=crop',
              tags: ['Italian', 'Pasta', 'Truffle'],
              votes_up: 98,
              city_id: 1,
              neighborhood_id: 1,
              trending_location: 'Manhattan'
            },
            {
              id: 3,
              type: 'restaurant',
              name: 'Taco Temple',
              image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop',
              tags: ['Mexican', 'Tacos', 'Casual'],
              votes_up: 87,
              city_id: 2,
              neighborhood_id: 4,
              trending_location: 'Downtown LA'
            },
            {
              id: 4,
              type: 'list',
              name: 'Best Brunch Spots',
              image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop',
              tags: ['Brunch', 'Weekend', 'Breakfast'],
              votes_up: 65,
              city_id: 1,
              trending_location: 'New York'
            }
          ],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
      set({ 
        error: 'Failed to load trending data. Please try again.',
        isLoading: false
      });
    }
  },
  
  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/api/lists`);
      set({
        lists: res.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching lists:', error);
      set({ 
        error: 'Failed to load lists. Please try again.',
        isLoading: false
      });
    }
  },
  
  fetchMyLists: async () => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would be filtered by user ID
      const res = await axios.get(`/api/lists/my-lists`);
      set({
        myLists: res.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching my lists:', error);
      set({ 
        error: 'Failed to load your lists. Please try again.',
        isLoading: false
      });
    }
  },
  
  fetchFollowedLists: async () => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would be filtered by user ID
      const res = await axios.get(`/api/lists/followed`);
      set({
        followedLists: res.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching followed lists:', error);
      set({ 
        error: 'Failed to load followed lists. Please try again.',
        isLoading: false
      });
    }
  },
  
  // Restaurant and Dish Actions
  fetchRestaurants: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/api/restaurants`);
      set({
        restaurants: res.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      set({ 
        error: 'Failed to load restaurants. Please try again.',
        isLoading: false
      });
    }
  },
  
  fetchDishes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/api/dishes`);
      set({
        dishes: res.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching dishes:', error);
      set({ 
        error: 'Failed to load dishes. Please try again.',
        isLoading: false
      });
    }
  },
  
  // List Management Actions
  createList: async (listData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`/api/lists`, listData);
      
      // Add new list to myLists and update lists array
      set((state) => ({
        myLists: [...state.myLists, res.data],
        lists: [...state.lists, res.data],
        isLoading: false,
      }));
      
      return res.data;
    } catch (error) {
      console.error('Error creating list:', error);
      set({ 
        error: 'Failed to create list. Please try again.',
        isLoading: false
      });
      return null;
    }
  },
  
  addItemToList: async (listId, item) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`/api/lists/${listId}/items`, item);
      
      // Update the list in both myLists and lists arrays
      set((state) => {
        const updatedMyLists = state.myLists.map(list => 
          list.id === listId ? res.data : list
        );
        
        const updatedLists = state.lists.map(list => 
          list.id === listId ? res.data : list
        );
        
        return {
          myLists: updatedMyLists,
          lists: updatedLists,
          isLoading: false,
        };
      });
      
      return res.data;
    } catch (error) {
      console.error('Error adding item to list:', error);
      set({ 
        error: 'Failed to add item to list. Please try again.',
        isLoading: false
      });
      return null;
    }
  },
  
  followList: async (listId) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`/api/lists/${listId}/follow`);
      
      // Find the list in the lists array
      const listToFollow = get().lists.find(list => list.id === listId);
      if (listToFollow) {
        // Add to followedLists
        set((state) => ({
          followedLists: [...state.followedLists, listToFollow],
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error following list:', error);
      set({ 
        error: 'Failed to follow list. Please try again.',
        isLoading: false
      });
    }
  },
  
  unfollowList: async (listId) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`/api/lists/${listId}/unfollow`);
      
      // Remove from followedLists
      set((state) => ({
        followedLists: state.followedLists.filter(list => list.id !== listId),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error unfollowing list:', error);
      set({ 
        error: 'Failed to unfollow list. Please try again.',
        isLoading: false
      });
    }
  },
  
  voteDish: async (dishId, vote) => {
    try {
      await axios.post(`/api/dishes/${dishId}/vote`, { vote });
      
      // In a real app, you might want to update the local state based on the response
      return true;
    } catch (error) {
      console.error('Error voting on dish:', error);
      return false;
    }
  },
}));

export default useAppStore;