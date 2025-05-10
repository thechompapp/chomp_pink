/* src/services/trendingService.js */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';

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
    logDebug('[TrendingService] Fetching trending restaurants');
    
    return handleApiResponse(
        () => apiClient.get('/trending/restaurants'),
        'TrendingService GetRestaurants'
    ).then(data => {
        // Process and standardize restaurant data
        return Array.isArray(data) 
            ? data.filter((item) => !!item && item.id != null)
                .map(r => ({ ...r, id: Number(r.id) }))
            : [];
    }).catch(error => {
        logError('[TrendingService] Failed to fetch trending restaurants:', error);
        throw error;
    });
};

const getTrendingDishes = async () => {
    logDebug('[TrendingService] Fetching trending dishes');
    
    return handleApiResponse(
        () => apiClient.get('/trending/dishes'),
        'TrendingService GetDishes'
    ).then(data => {
        // Process and standardize dish data
        return Array.isArray(data) 
            ? data.filter((item) => !!item && item.id != null)
                .map(d => ({
                    ...d,
                    id: Number(d.id),
                    restaurant: d.restaurant_name || d.restaurant || 'Unknown Restaurant',
                    tags: Array.isArray(d.tags) ? d.tags.filter(t => typeof t === 'string' && !!t) : [],
                }))
            : [];
    }).catch(error => {
        logError('[TrendingService] Failed to fetch trending dishes:', error);
        throw error;
    });
};

const getTrendingLists = async () => {
    logDebug('[TrendingService] Fetching trending lists');
    
    return handleApiResponse(
        () => apiClient.get('/trending/lists'),
        'TrendingService GetLists'
    ).then(data => {
        // Process and standardize list data
        return Array.isArray(data) 
            ? data.map(formatList).filter(list => list !== null)
            : [];
    }).catch(error => {
        logError('[TrendingService] Failed to fetch trending lists:', error);
        throw error;
    });
};

const fetchAllTrendingData = async () => {
    logDebug('[TrendingService] Fetching all trending data');
    
    try {
        const [restaurants, dishes, lists] = await Promise.all([
            getTrendingRestaurants(),
            getTrendingDishes(),
            getTrendingLists(),
        ]);
        return { restaurants, dishes, lists };
    } catch (error) {
        logError('[TrendingService] Error fetching multiple trending datasets:', error);
        throw error;
    }
};

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
    fetchAllTrendingData,
};