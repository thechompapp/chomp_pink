/* src/services/trendingService.js */
import apiClient from '@/services/apiClient';

const formatList = (list) => {
    if (!list || list.id == null || typeof list.name !== 'string') {
        return null;
    }
    const listType = list.type || list.list_type || 'mixed';
    if (listType !== 'restaurant' && listType !== 'dish' && listType !== 'mixed') {
        console.warn(`[formatList in trendingService] Invalid list_type '${listType}' found for list ID ${list.id}.`);
    }

    return {
        id: Number(list.id),
        name: list.name,
        description: list.description ?? null,
        type: listType,
        list_type: listType,
        saved_count: Number(list.saved_count ?? 0),
        item_count: Number(list.item_count ?? 0), // Ensure we use the backend's item_count
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

const getTrendingRestaurants = async () => {
    const response = await apiClient('/api/trending/restaurants');
    if (!response.success || !Array.isArray(response.data)) {
        console.error("Failed to fetch trending restaurants:", response.error);
        throw new Error(response.error || 'Invalid trending restaurants data');
    }
    return response.data
        .filter((item) => !!item && item.id != null)
        .map(r => ({ ...r, id: Number(r.id) }));
};

const getTrendingDishes = async () => {
    const response = await apiClient('/api/trending/dishes');
    if (!response.success || !Array.isArray(response.data)) {
        console.error("Failed to fetch trending dishes:", response.error);
        throw new Error(response.error || 'Invalid trending dishes data');
    }
    return response.data
        .filter((item) => !!item && item.id != null)
        .map(d => ({
            ...d,
            id: Number(d.id),
            restaurant: d.restaurant_name || d.restaurant || 'Unknown Restaurant',
            tags: Array.isArray(d.tags) ? d.tags.filter(t => typeof t === 'string' && !!t) : [],
        }));
};

const getTrendingLists = async () => {
    const response = await apiClient('/api/trending/lists');
    if (!response.success || !Array.isArray(response.data)) {
        console.error("Failed to fetch trending lists:", response.error);
        throw new Error(response.error || 'Invalid trending lists data');
    }
    return response.data
        .map(formatList)
        .filter(list => list !== null);
};

const fetchAllTrendingData = async () => {
    try {
        const [restaurants, dishes, lists] = await Promise.all([
            getTrendingRestaurants(),
            getTrendingDishes(),
            getTrendingLists(),
        ]);
        return { restaurants, dishes, lists };
    } catch (error) {
        console.error("Failed to fetch all trending data:", error);
        throw new Error(error.message || 'Failed to fetch trending data');
    }
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
    fetchAllTrendingData,
};