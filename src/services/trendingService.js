// src/services/trendingService.js
import apiClient from '@/services/apiClient';

const getTrendingRestaurants = async () => {
    try {
        const response = await apiClient('/api/trending/restaurants', 'TrendingService Restaurants');
        const data = response?.data || [];
        return Array.isArray(data) ? data.filter(item => item && item.id != null) : [];
    } catch (error) {
        console.error('[TrendingService] Error fetching trending restaurants:', error.message || error);
        return []; // Return empty array on error to prevent downstream issues
    }
};

const getTrendingDishes = async () => {
    try {
        const response = await apiClient('/api/trending/dishes', 'TrendingService Dishes');
        const data = response?.data || [];
        return Array.isArray(data) ? data.filter(item => item && item.id != null) : [];
    } catch (error) {
        console.error('[TrendingService] Error fetching trending dishes:', error.message || error);
        return []; // Return empty array on error
    }
};

const getTrendingLists = async () => {
    try {
        const response = await apiClient('/api/trending/lists', 'TrendingService Lists');
        const data = response?.data || [];
        const formatted = Array.isArray(data)
            ? data
                .map(list => {
                    if (!list || list.id == null) return null;
                    return {
                        ...list,
                        tags: Array.isArray(list.tags) ? list.tags : [],
                        is_following: list.is_following ?? false,
                        created_by_user: list.created_by_user ?? false,
                        item_count: typeof list.item_count === 'number' ? list.item_count : 0,
                        saved_count: typeof list.saved_count === 'number' ? list.saved_count : 0,
                        id: list.id,
                        type: list.type || list.list_type || 'mixed'
                    };
                })
                .filter(Boolean)
            : [];
        return formatted;
    } catch (error) {
        console.error('[TrendingService] Error fetching trending lists:', error.message || error);
        return []; // Return empty array on error
    }
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
};