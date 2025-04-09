/* src/services/trendingService.ts */
import apiClient from '@/services/apiClient';
import type { Restaurant, Dish, List } from '@/types';

interface RestaurantsResponse { data?: Restaurant[] }
interface DishesResponse { data?: Dish[] }
interface ListsResponse { data?: List[] }

const formatList = (list: any): List | null => {
    if (!list || list.id == null) return null;
    const listType = list.type || list.list_type || 'mixed';
    return {
        id: Number(list.id),
        name: list.name || 'Unnamed List',
        description: list.description ?? null,
        type: listType as List['type'],
        list_type: listType as List['list_type'],
        saved_count: typeof list.saved_count === 'number' ? list.saved_count : 0,
        item_count: typeof list.item_count === 'number' ? list.item_count : 0,
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags.filter(Boolean).map(String) : [],
        is_public: typeof list.is_public === 'boolean' ? list.is_public : true,
        is_following: list.is_following ?? false,
        created_by_user: list.created_by_user ?? false,
        user_id: list.user_id ? Number(list.user_id) : null,
        creator_handle: list.creator_handle ?? null,
        created_at: list.created_at,
        updated_at: list.updated_at,
    };
};

const getTrendingRestaurants = async (): Promise<Restaurant[]> => {
    const response = await apiClient<RestaurantsResponse>('/api/trending/restaurants', 'TrendingService Restaurants');
    if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || 'Invalid trending restaurants data');
    }
    return response.data
        .filter((item): item is Restaurant => !!item && item.id != null)
        .map(r => ({ ...r, id: Number(r.id) }));
};

const getTrendingDishes = async (): Promise<Dish[]> => {
    const response = await apiClient<DishesResponse>('/api/trending/dishes', 'TrendingService Dishes');
    if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || 'Invalid trending dishes data');
    }
    return response.data
        .filter((item): item is Dish => !!item && item.id != null)
        .map(d => ({
            ...d,
            id: Number(d.id),
            restaurant: d.restaurant_name || d.restaurant,
            tags: Array.isArray(d.tags) ? d.tags.filter(Boolean).map(String) : [],
        }));
};

const getTrendingLists = async (): Promise<List[]> => {
    const response = await apiClient<ListsResponse>('/api/trending/lists', 'TrendingService Lists');
    if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || 'Invalid trending lists data');
    }
    return response.data.map(formatList).filter((list): list is List => list !== null);
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
};