// src/services/listService.js
import apiClient from '@/services/apiClient.js';

const BASE_PATH = '/api/lists';

// Helper function to ensure consistent list object structure
const formatList = (list) => {
    if (!list || typeof list.id === 'undefined') return null;
    return {
        ...list,
        city: list.city_name, // Map city_name to city if frontend expects 'city'
        is_following: !!list.is_following, // Ensure boolean
        is_public: list.is_public ?? true, // Default to true if null/undefined
        created_by_user: !!list.created_by_user, // Ensure boolean
        tags: Array.isArray(list.tags) ? list.tags : [],
        item_count: list.item_count || 0, // Default item_count to 0
    };
};

// Helper function to ensure consistent list item structure
const formatListItem = (item) => {
    if (!item || !item.list_item_id) return null;
    return {
        list_item_id: item.list_item_id,
        item_type: item.item_type,
        id: item.item_id, // Actual dish or restaurant ID
        name: item.name,
        restaurant_name: item.restaurant_name,
        added_at: item.added_at,
        city: item.city, // Use pre-joined city from backend query
        neighborhood: item.neighborhood, // Use pre-joined neighborhood
        tags: Array.isArray(item.tags) ? item.tags : [], // ITEM's tags
    };
};

const getLists = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${BASE_PATH}${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All (Default)';

    const data = await apiClient(endpoint, context);

    if (!Array.isArray(data)) {
        console.warn(`[${context}] Invalid data format received. Expected array, got:`, data);
        return [];
    }

    return data.map(formatList).filter(Boolean);
};

const getListDetails = async (listId) => {
    if (!listId) throw new Error('List ID is required');

    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}`;
    const data = await apiClient(endpoint, `ListService Details ${listId}`);

    if (!data || typeof data.id === 'undefined') {
        throw new Error(`List details not found for ID: ${listId}`);
    }

    const formattedList = formatList(data);
    const formattedItems = Array.isArray(data.items) ? data.items.map(formatListItem).filter(Boolean) : [];

    return {
        ...formattedList,
        items: formattedItems,
        item_count: formattedItems.length,
    };
};

const createList = async (listData) => {
    if (!listData || !listData.name) throw new Error("List name is required for creation.");

    const response = await apiClient(BASE_PATH, 'ListService Create', {
        method: 'POST',
        body: JSON.stringify(listData),
    });
    return formatList(response);
};

const addItemToList = async (listId, itemData) => {
    if (!listId || !itemData || !itemData.item_id || !itemData.item_type) {
        throw new Error("List ID, Item ID, and Item Type are required.");
    }
    return await apiClient(`${BASE_PATH}/${encodeURIComponent(listId)}/items`, 'ListService Add Item', {
        method: 'POST',
        body: JSON.stringify(itemData),
    });
};

const removeItemFromList = async (listId, listItemId) => {
    if (!listId || !listItemId) {
        throw new Error("List ID and List Item ID are required.");
    }
    return await apiClient(`${BASE_PATH}/${encodeURIComponent(listId)}/items/${encodeURIComponent(listItemId)}`, 'ListService Remove Item', {
        method: 'DELETE',
    });
};

const toggleFollow = async (listId) => {
    if (!listId) throw new Error("List ID is required.");

    console.log(`[listService] Toggling follow for list ${listId}`);

    try {
        const encodedListId = encodeURIComponent(listId);
        const headers = {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache',
            'X-Request-Time': Date.now().toString(),
        };

        const response = await apiClient(`${BASE_PATH}/${encodedListId}/follow`, 'ListService Toggle Follow', {
            method: 'POST',
            headers,
        });

        console.log(`[listService] Toggle follow response:`, response);

        if (!response || typeof response.is_following !== 'boolean') {
            console.error('[listService] Invalid follow response:', response);
            throw new Error("Server returned an invalid response for follow toggle.");
        }

        const formattedResponse = formatList(response);
        if (!formattedResponse) {
            throw new Error("Invalid response received after toggling follow.");
        }

        console.log(`[listService] Formatted follow response:`, {
            id: formattedResponse.id,
            is_following: formattedResponse.is_following,
            saved_count: formattedResponse.saved_count
        });

        return formattedResponse;
    } catch (error) {
        console.error(`[listService] Error toggling follow for list ${listId}:`, error);
        throw error;
    }
};

const updateVisibility = async (listId, visibilityData) => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and visibility flag are required.");
    }
    const response = await apiClient(`${BASE_PATH}/${encodeURIComponent(listId)}/visibility`, 'ListService Update Visibility', {
        method: 'PUT',
        body: JSON.stringify(visibilityData),
    });
    return formatList(response);
};

export const listService = {
    getLists,
    getListDetails,
    createList,
    addItemToList,
    removeItemFromList,
    toggleFollow,
    updateVisibility,
};