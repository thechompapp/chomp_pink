/* src/utils/mockData.js
 * This file provides fallback mock data for use when API endpoints return errors.
 * This ensures the UI can continue to function and display something meaningful to users
 * even when backend services are unavailable.
 */
import { logWarn } from './logger';

/**
 * Mock data for popular cuisine tags when the hashtags API fails
 */
export const mockTopHashtags = [
  { id: 1, name: 'Italian', usage_count: 156 },
  { id: 2, name: 'American', usage_count: 142 },
  { id: 3, name: 'Japanese', usage_count: 124 },
  { id: 4, name: 'Mexican', usage_count: 113 },
  { id: 5, name: 'Chinese', usage_count: 102 },
  { id: 6, name: 'Indian', usage_count: 99 },
  { id: 7, name: 'Thai', usage_count: 87 },
  { id: 8, name: 'Mediterranean', usage_count: 76 },
  { id: 9, name: 'French', usage_count: 68 },
  { id: 10, name: 'Korean', usage_count: 64 },
  { id: 11, name: 'Burger', usage_count: 59 },
  { id: 12, name: 'Pizza', usage_count: 54 },
  { id: 13, name: 'Dessert', usage_count: 51 },
  { id: 14, name: 'Vegan', usage_count: 48 },
  { id: 15, name: 'Vegetarian', usage_count: 46 }
];

/**
 * Mock data for cities when the cities API fails
 */
export const mockCities = [
  { id: 1, name: 'New York', has_boroughs: true },
  { id: 2, name: 'Los Angeles', has_boroughs: false },
  { id: 3, name: 'Chicago', has_boroughs: false },
  { id: 4, name: 'Miami', has_boroughs: false },
  { id: 5, name: 'San Francisco', has_boroughs: false }
];

/**
 * Mock data for New York boroughs when the boroughs API fails
 */
export const mockBoroughs = [
  { id: 101, name: 'Manhattan', city_id: 1, parent_id: null, location_level: 1 },
  { id: 102, name: 'Brooklyn', city_id: 1, parent_id: null, location_level: 1 },
  { id: 103, name: 'Queens', city_id: 1, parent_id: null, location_level: 1 },
  { id: 104, name: 'The Bronx', city_id: 1, parent_id: null, location_level: 1 },
  { id: 105, name: 'Staten Island', city_id: 1, parent_id: null, location_level: 1 }
];

/**
 * Mock data for Manhattan neighborhoods when the neighborhoods API fails
 */
export const mockNeighborhoods = {
  101: [ // Manhattan neighborhoods
    { id: 1001, name: 'Midtown', city_id: 1, parent_id: 101, location_level: 2 },
    { id: 1002, name: 'Upper East Side', city_id: 1, parent_id: 101, location_level: 2 },
    { id: 1003, name: 'Upper West Side', city_id: 1, parent_id: 101, location_level: 2 },
    { id: 1004, name: 'Chelsea', city_id: 1, parent_id: 101, location_level: 2 },
    { id: 1005, name: 'Greenwich Village', city_id: 1, parent_id: 101, location_level: 2 }
  ],
  102: [ // Brooklyn neighborhoods
    { id: 2001, name: 'Williamsburg', city_id: 1, parent_id: 102, location_level: 2 },
    { id: 2002, name: 'Park Slope', city_id: 1, parent_id: 102, location_level: 2 },
    { id: 2003, name: 'DUMBO', city_id: 1, parent_id: 102, location_level: 2 },
    { id: 2004, name: 'Brooklyn Heights', city_id: 1, parent_id: 102, location_level: 2 }
  ]
};

/**
 * Get mock neighborhoods for a given borough ID
 */
export const getMockNeighborhoods = (boroughId) => {
  const neighborhoods = mockNeighborhoods[boroughId];
  if (!neighborhoods) {
    logWarn(`[MockData] No mock neighborhoods found for borough ID ${boroughId}, returning empty array`);
    return [];
  }
  return neighborhoods;
};

/**
 * Mock data for user lists when the lists API fails
 * Includes is_following property to support follow functionality
 */
// Add guaranteed followed lists to ensure the following view works
const GUARANTEED_FOLLOWED_LISTS = [
  {
    id: 101,
    name: 'Popular Italian Spots',
    description: 'A collection of the best Italian restaurants in the city',
    image_url: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 7,
    owner_id: 2,
    user_id: 2,
    is_public: true,
    is_featured: true,
    follow_count: 289,
    is_following: true, // Important: This is ALWAYS followed
    created_at: '2025-01-10T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Italian', 'Pasta', 'Pizza']
  },
  {
    id: 102,
    name: 'Hidden Gems',
    description: 'Lesser-known places that are worth a visit',
    image_url: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 9,
    owner_id: 3,
    user_id: 3,
    is_public: true,
    is_featured: true,
    follow_count: 175,
    is_following: true, // Important: This is ALWAYS followed
    created_at: '2025-02-05T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Hidden', 'Secret', 'Local']
  }
];

export const mockUserLists = [
  {
    id: 1,
    name: 'My Favorite Restaurants',
    description: 'Personal collection of favorite dining spots',
    image_url: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 8,
    owner_id: 1, // Current user is the owner
    user_id: 1,
    is_public: true,
    is_featured: false,
    follow_count: 156,
    is_following: false,
    created_at: '2025-01-15T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Favorites', 'Personal', 'Must-Try']
  },
  {
    id: 2,
    name: 'Weekend Brunches',
    description: 'Best places for weekend brunch',
    image_url: 'https://images.unsplash.com/photo-1533920379810-6bedac9e31f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 6,
    owner_id: 1, // Current user is the owner
    user_id: 1,
    is_public: true,
    is_featured: false,
    follow_count: 89,
    is_following: false,
    created_at: '2025-02-20T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Brunch', 'Breakfast', 'Weekend']
  },
  {
    id: 3,
    name: 'Special Occasions',
    description: 'Restaurants for celebrations and special events',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 7,
    owner_id: 1, // Current user is the owner
    user_id: 1,
    is_public: true,
    is_following: false,
    is_featured: false,
    follow_count: 122,
    created_at: '2025-03-10T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Celebration', 'Special', 'Fine Dining']
  },
  {
    id: 4,
    name: 'Quick Lunch Spots',
    description: 'Places to grab a quick and delicious lunch',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 5,
    owner_id: 1, // Current user is the owner
    user_id: 1,
    is_public: true,
    is_featured: false,
    follow_count: 65,
    created_at: '2025-04-05T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Quick', 'Lunch', 'Casual']
  },
  {
    id: 5,
    name: 'Takeout Favorites',
    description: 'Best dishes to order for takeout',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    item_count: 9,
    owner_id: 1, // Current user is the owner
    user_id: 1,
    is_public: true,
    is_featured: false,
    follow_count: 72,
    created_at: '2025-04-15T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    list_type: 'custom',
    hashtags: ['Takeout', 'Delivery', 'Home Dining'],
    follow_count: 77,
    created_at: '2025-02-28T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
    hashtags: ['Vegan', 'Plant-Based', 'Healthy']
  }
];

/**
 * Mock data for list items when the list items API fails
 */
export const mockListItems = {
  1: [ // Items for list ID 1 (Italian)
    {
      id: 101,
      list_id: 1,
      name: 'Trattoria Milano',
      description: 'Authentic Northern Italian cuisine with homemade pasta',
      image_url: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      type: 'restaurant',
      external_id: '12345',
      rating: 4.8,
      position: 1,
      created_at: '2025-01-16T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z'
    },
    {
      id: 102,
      list_id: 1,
      name: 'Pasta Perfecto',
      description: 'Handmade pasta dishes with seasonal ingredients',
      image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      type: 'restaurant',
      external_id: '23456',
      rating: 4.6,
      position: 2,
      created_at: '2025-01-18T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z'
    },
    {
      id: 103,
      list_id: 1,
      name: 'Pizza Napoli',
      description: 'Authentic Neapolitan pizza with imported ingredients',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      type: 'restaurant',
      external_id: '34567',
      rating: 4.7,
      position: 3,
      created_at: '2025-01-20T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z'
    }
  ],
  2: [ // Items for list ID 2 (Brunch)
    {
      id: 201,
      list_id: 2,
      name: 'Sunday Social',
      description: 'Popular weekend brunch spot with great cocktails',
      image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      type: 'restaurant',
      external_id: '45678',
      rating: 4.5,
      position: 1,
      created_at: '2025-02-22T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z'
    },
    {
      id: 202,
      list_id: 2,
      name: 'Breakfast Club',
      description: 'All-day breakfast with creative twists on classics',
      image_url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      type: 'restaurant',
      external_id: '56789',
      rating: 4.4,
      position: 2,
      created_at: '2025-02-24T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z'
    }
  ]
};

/**
 * Get mock list items for a given list ID
 */
export const getMockListItems = (listId) => {
  const items = mockListItems[listId];
  if (!items) {
    logWarn(`[MockData] No mock list items found for list ID ${listId}, returning empty array`);
    return [];
  }
  return items;
};

/**
 * Returns filtered mock lists based on filter parameters
 * @param {Object} params - Filter parameters (cityId, hashtags, etc.)
 * @returns {Object} - Object with items array and pagination info
 */
export const getFilteredMockLists = (params = {}) => {
  // Check if there was a recent list operation
  const wasRecentListOp = () => {
    const recentListOp = localStorage.getItem('recent_list_operation');
    if (!recentListOp) return false;
    
    const timestamp = parseInt(recentListOp, 10);
    const now = Date.now();
    return (now - timestamp < 60000); // within last minute
  };
  
  // Start with all lists
  let filteredLists = [...mockUserLists];
  
  // If there was a recent list operation, ensure we're showing data
  // even if there would normally be zero results
  const forceShowData = wasRecentListOp();
  
  // Filter by view type
  if (params.view) {
    // For 'following' view, include lists that the user is following OR where follow flag exists
    if (params.view === 'following') {
      // First try to filter by is_following flag
      let followedLists = filteredLists.filter(list => list.is_following === true);
      
      // If no lists are marked as followed, use the guaranteed followed lists
      // (This is to fix the "offline" appearance after quick-add operations)
      if (followedLists.length === 0) {
        // Add our guaranteed followed lists
        followedLists = GUARANTEED_FOLLOWED_LISTS;
        console.log('[mockData] Using guaranteed followed lists', followedLists);
      }
      
      filteredLists = followedLists;
    }
    // For 'created' view, only include lists created by the current user (user_id 1)
    else if (params.view === 'created') {
      filteredLists = filteredLists.filter(list => list.user_id === 1); // Assuming current user is 1
    }
  }
  
  // Filter by hashtags if provided
  if (params.hashtags) {
    const hashtagFilters = Array.isArray(params.hashtags) 
      ? params.hashtags 
      : [params.hashtags];
      
    filteredLists = filteredLists.filter(list => {
      return list.hashtags && list.hashtags.some(tag => 
        hashtagFilters.includes(tag)
      );
    });
  }
  
  // Filter by search query if provided
  if (params.query) {
    const searchQuery = params.query.toLowerCase();
    filteredLists = filteredLists.filter(list => {
      return (
        (list.name && list.name.toLowerCase().includes(searchQuery)) ||
        (list.description && list.description.toLowerCase().includes(searchQuery))
      );
    });
  }
  
  // If we have zero results BUT there was a recent list operation,
  // return at least some data to prevent the "offline" appearance
  if (filteredLists.length === 0 && forceShowData) {
    // If this was a following view, add is_following flag to the first few mock lists
    if (params.view === 'following') {
      const followableLists = mockUserLists.filter(list => list.user_id !== 1)
        .map(list => ({
          ...list,
          is_following: true // Mark as followed
        }));
      
      filteredLists = followableLists.slice(0, 3); // Show at least 3 lists
    } else {
      // For other views, just show some default lists
      filteredLists = mockUserLists.slice(0, 5);
    }
  }
  
  return {
    data: filteredLists, // Use 'data' instead of 'items' for consistency
    total: filteredLists.length,
    page: parseInt(params.page, 10) || 1,
    limit: parseInt(params.limit, 10) || 25,
    totalPages: Math.ceil(filteredLists.length / (parseInt(params.limit, 10) || 25))
  };
};
