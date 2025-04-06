// src/services/trendingService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const getTrendingRestaurants = async () => {
    const data = await apiClient('/api/trending/restaurants', 'TrendingService Restaurants') || [];
    return Array.isArray(data) ? data : [];
};

const getTrendingDishes = async () => {
    const data = await apiClient('/api/trending/dishes', 'TrendingService Dishes') || [];
    return Array.isArray(data) ? data : [];
};

const getTrendingLists = async () => {
    const data = await apiClient('/api/trending/lists', 'TrendingService Lists') || [];
    // Ensure lists have default values needed by UI
    const formatted = Array.isArray(data) ? data.map(list => ({
        ...list,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_following: list.is_following ?? false,
        created_by_user: list.created_by_user ?? false,
        item_count: list.item_count || 0,
        id: list.id
     })).filter(list => typeof list.id !== 'undefined' && list.id !== null) : [];
    return formatted;
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
};