// src/services/trendingService.js
import apiClient from '@/services/apiClient'; // Corrected import (removed .js extension)

const getTrendingRestaurants = async () => {
    // Expecting { data: Restaurant[] }
    const response = await apiClient('/api/trending/restaurants', 'TrendingService Restaurants');
    const data = response?.data || [];
    // Ensure data integrity, filter out null/undefined items
    return Array.isArray(data) ? data.filter(item => item && item.id != null) : [];
};

const getTrendingDishes = async () => {
    // Expecting { data: Dish[] }
    const response = await apiClient('/api/trending/dishes', 'TrendingService Dishes');
    const data = response?.data || [];
    // Ensure data integrity, filter out null/undefined items
    return Array.isArray(data) ? data.filter(item => item && item.id != null) : [];
};

const getTrendingLists = async () => {
    // Expecting { data: List[] }
    const response = await apiClient('/api/trending/lists', 'TrendingService Lists');
    const data = response?.data || [];
    // Ensure lists have default values needed by UI and filter invalid ones
    const formatted = Array.isArray(data)
     ? data
         .map(list => {
             if (!list || list.id == null) return null; // Filter out invalid entries early
             return {
                 ...list,
                 tags: Array.isArray(list.tags) ? list.tags : [],
                 is_following: list.is_following ?? false, // Default to false
                 created_by_user: list.created_by_user ?? false, // Default to false
                 item_count: list.item_count || 0, // Default to 0
                 saved_count: list.saved_count || 0, // Default to 0
                 id: list.id // Ensure ID is present
             };
         })
         .filter(Boolean) // Remove null entries resulted from filtering
     : [];
    return formatted;
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
};