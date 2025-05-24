/* src/services/trendingService.js */
/**
 * Trending service handling all trending data API requests
 * Follows the standardized API client implementation pattern
 */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';
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

/**
 * Get trending restaurants with standardized response handling
 * @param {Object} options - Optional parameters for filtering
 * @returns {Promise<Object>} Object with success flag and data array
 */
const getTrendingRestaurants = async (options = {}) => {
    logDebug('[TrendingService] Fetching trending restaurants', options);
    
    // Create query parameters if options are provided
    const queryParams = createQueryParams({
        limit: options.limit,
        period: options.period || 'week',
        city_id: options.cityId
    });
    
    const endpoint = `/trending/restaurants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const result = await handleApiResponse(
        () => apiClient.get(endpoint, { params: queryParams }),
        'TrendingService.getTrendingRestaurants'
    );
    
    if (!result.success) {
        logError('[TrendingService] Failed to fetch trending restaurants:', result.error);
        return { success: false, data: [], error: result.error };
    }
    
    // Standardize response format handling
    let processedData = [];
    
    if (Array.isArray(result.data)) {
        processedData = result.data;
    } else if (result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
        processedData = result.data.data;
    } else {
        logWarn('[TrendingService] Unexpected data format for restaurants:', result.data);
        return { success: true, data: [] };
    }
    
    // Process and standardize the data
    const standardizedData = processedData
        .filter((item) => !!item && item.id != null)
        .map(r => ({ ...r, id: Number(r.id) }));
    
    return { success: true, data: standardizedData };
};

/**
 * Get trending dishes with standardized response handling
 * @param {Object} options - Optional parameters for filtering
 * @returns {Promise<Object>} Object with success flag and data array
 */
const getTrendingDishes = async (options = {}) => {
    logDebug('[TrendingService] Fetching trending dishes', options);
    
    // Create query parameters if options are provided
    const queryParams = createQueryParams({
        limit: options.limit,
        period: options.period || 'week',
        city_id: options.cityId,
        cuisine_id: options.cuisineId
    });
    
    const endpoint = `/trending/dishes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const result = await handleApiResponse(
        () => apiClient.get(endpoint, { params: queryParams }),
        'TrendingService.getTrendingDishes'
    );
    
    if (!result.success) {
        logError('[TrendingService] Failed to fetch trending dishes:', result.error);
        return { success: false, data: [], error: result.error };
    }
    
    // Standardize response format handling
    let processedData = [];
    
    if (Array.isArray(result.data)) {
        processedData = result.data;
    } else if (result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
        processedData = result.data.data;
    } else {
        logWarn('[TrendingService] Unexpected data format for dishes:', result.data);
        return { success: true, data: [] };
    }
    
    // Standardize and clean dish data
    const standardizedData = processedData
        .filter((item) => !!item && item.id != null)
        .map(d => ({
            ...d,
            id: Number(d.id),
            restaurant: d.restaurant_name || d.restaurant || 'Unknown Restaurant',
            tags: Array.isArray(d.tags) ? d.tags.filter(t => typeof t === 'string' && !!t) : [],
        }));
    
    return { success: true, data: standardizedData };
};

/**
 * Get trending lists with standardized response handling
 * @param {Object} options - Optional parameters for filtering
 * @returns {Promise<Object>} Object with success flag and data array
 */
const getTrendingLists = async (options = {}) => {
    logDebug('[TrendingService] Fetching trending lists', options);
    
    // Create query parameters if options are provided
    const queryParams = createQueryParams({
        limit: options.limit,
        period: options.period || 'week',
        type: options.type // 'restaurant', 'dish', or 'mixed'
    });
    
    const endpoint = `/trending/lists${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const result = await handleApiResponse(
        () => apiClient.get(endpoint, { params: queryParams }),
        'TrendingService.getTrendingLists'
    );
    
    if (!result.success) {
        logError('[TrendingService] Failed to fetch trending lists:', result.error);
        return { success: false, data: [], error: result.error };
    }
    
    // Standardize response format handling
    let processedData = [];
    
    if (Array.isArray(result.data)) {
        processedData = result.data;
    } else if (result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
        processedData = result.data.data;
    } else {
        logWarn('[TrendingService] Unexpected data format for lists:', result.data);
        return { success: true, data: [] };
    }
    
    // Apply list formatting and filter out invalid entries
    const standardizedData = processedData.map(formatList).filter(list => list !== null);
    
    return { success: true, data: standardizedData };
};

/**
 * Fetch all trending data in a single aggregated response
 * @param {Object} options - Optional parameters for filtering all datasets
 * @returns {Promise<Object>} An object containing restaurants, dishes, and lists arrays with success flags
 */
const fetchAllTrendingData = async (options = {}) => {
    logDebug('[TrendingService] Fetching all trending data', options);
    
    try {
        // Create individual options objects for each request to allow specific filtering
        const restaurantOptions = { ...options, ...options.restaurants };
        const dishOptions = { ...options, ...options.dishes };
        const listOptions = { ...options, ...options.lists };
        
        // Use Promise.allSettled instead of Promise.all to ensure partial data returns even if some requests fail
        const results = await Promise.allSettled([
            getTrendingRestaurants(restaurantOptions),
            getTrendingDishes(dishOptions),
            getTrendingLists(listOptions),
        ]);
        
        // Process results to handle both success and failure states
        return {
            restaurants: results[0].status === 'fulfilled' ? results[0].value.data : [],
            dishes: results[1].status === 'fulfilled' ? results[1].value.data : [],
            lists: results[2].status === 'fulfilled' ? results[2].value.data : [],
            // Include metadata about request success/failure for debugging
            _meta: {
                success: results.every(r => r.status === 'fulfilled' && r.value.success),
                errors: results.filter(r => r.status === 'rejected').map(r => r.reason?.message || 'Unknown error')
            }
        };
    } catch (error) {
        logError('[TrendingService] Critical error fetching multiple trending datasets:', error);
        // Return empty arrays for all data types rather than throwing
        return { 
            restaurants: [], 
            dishes: [], 
            lists: [],
            _meta: {
                success: false,
                errors: [error?.message || 'Unknown error']
            } 
        };
    }
}

export const trendingService = {
    getTrendingRestaurants,
    getTrendingDishes,
    getTrendingLists,
    fetchAllTrendingData,
};