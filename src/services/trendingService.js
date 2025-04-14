/* src/services/trendingService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient';
// REMOVED: import type { Restaurant, Dish, List } from '@/types';

// REMOVED: interface definitions (RestaurantsResponse, DishesResponse, ListsResponse)

// Helper function to format list data (basic JS validation)
const formatList = (list) => { // REMOVED: : List | null
    if (!list || list.id == null || typeof list.name !== 'string') { // Basic check
        return null;
    }
    const listType = list.type || list.list_type || 'mixed';
    // Basic validation for listType
    if (listType !== 'restaurant' && listType !== 'dish' && listType !== 'mixed') {
        console.warn(`[formatList in trendingService] Invalid list_type '${listType}' found for list ID ${list.id}.`);
        // return null; // Or default to 'mixed'
    }

    return {
        id: Number(list.id),
        name: list.name,
        description: list.description ?? null,
        type: listType, // REMOVED: as List['type']
        list_type: listType, // REMOVED: as List['list_type']
        saved_count: Number(list.saved_count ?? 0),
        item_count: Number(list.item_count ?? 0),
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags.filter(t => typeof t === 'string' && !!t) : [],
        is_public: typeof list.is_public === 'boolean' ? list.is_public : true,
        is_following: !!list.is_following,
        created_by_user: !!list.created_by_user,
        user_id: list.user_id ? Number(list.user_id) : null,
        creator_handle: list.creator_handle ?? null,
        created_at: list.created_at,
        updated_at: list.updated_at,
    };
};

const getTrendingRestaurants = async () => { // REMOVED: : Promise<Restaurant[]>
    // Assuming apiClient returns { success: boolean, data: Restaurant[], error: string|null }
    const response = await apiClient/*REMOVED: <RestaurantsResponse>*/('/api/trending/restaurants', 'TrendingService Restaurants');
    if (!response.success || !Array.isArray(response.data)) {
        // Throw error or return empty array based on desired error handling
        console.error("Failed to fetch trending restaurants:", response.error);
        throw new Error(response.error || 'Invalid trending restaurants data');
        // return [];
    }
    // Basic JS filter and map
    return response.data
        .filter((item) => !!item && item.id != null) // REMOVED: : item is Restaurant type guard
        .map(r => ({ ...r, id: Number(r.id) })); // Ensure ID is number
};

const getTrendingDishes = async () => { // REMOVED: : Promise<Dish[]>
    const response = await apiClient/*REMOVED: <DishesResponse>*/('/api/trending/dishes', 'TrendingService Dishes');
    if (!response.success || !Array.isArray(response.data)) {
        console.error("Failed to fetch trending dishes:", response.error);
        throw new Error(response.error || 'Invalid trending dishes data');
        // return [];
    }
    // Basic JS filter and map
    return response.data
        .filter((item) => !!item && item.id != null) // REMOVED: : item is Dish type guard
        .map(d => ({
            ...d,
            id: Number(d.id),
            // Handle potential variations in restaurant name field from backend
            restaurant: d.restaurant_name || d.restaurant || 'Unknown Restaurant',
            tags: Array.isArray(d.tags) ? d.tags.filter(t => typeof t === 'string' && !!t) : [],
        }));
};

const getTrendingLists = async () => { // REMOVED: : Promise<List[]>
    const response = await apiClient/*REMOVED: <ListsResponse>*/('/api/trending/lists', 'TrendingService Lists');
    if (!response.success || !Array.isArray(response.data)) {
        console.error("Failed to fetch trending lists:", response.error);
        throw new Error(response.error || 'Invalid trending lists data');
        // return [];
    }
    // Use the JS formatter and filter nulls
    return response.data.map(formatList).filter((list) => list !== null); // REMOVED: : list is List type guard
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
};