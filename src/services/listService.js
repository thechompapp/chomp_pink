import apiClient from '@/services/apiClient.js';

const BASE_PATH = '/api/lists';

// Helper function to ensure consistent list object structure
const formatList = (list) => {
    if (!list || typeof list.id === 'undefined' || list.id === null) return null;
    return {
        ...list,
        city: list.city_name,
        is_following: !!list.is_following,
        is_public: list.is_public ?? true,
        created_by_user: !!list.created_by_user,
        tags: Array.isArray(list.tags) ? list.tags : [],
        item_count: list.item_count || 0,
        saved_count: list.saved_count || 0,
        id: list.id,
        name: list.name || 'Unnamed List',
    };
};

// Helper function to ensure consistent list item structure
const formatListItem = (item) => {
    if (!item || !item.id || !item.item_id || !item.item_type) {
        console.log('[formatListItem] Invalid item, skipping:', item);
        return null;
    }
    return {
        list_item_id: item.id,
        item_type: item.item_type,
        id: item.item_id,
        name: item.name || `Item ${item.item_id}`, // Backend now provides name
        restaurant_name: item.restaurant_name,
        added_at: item.added_at,
        city: item.city,
        neighborhood: item.neighborhood,
        tags: Array.isArray(item.tags) ? item.tags : [],
    };
};

// --- Service Functions ---

const getLists = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${BASE_PATH}${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

    const data = await apiClient(endpoint, context);

    if (!Array.isArray(data)) {
        console.warn(`[${context}] Invalid data format. Expected array, got:`, data);
        return [];
    }
    return data.map(formatList).filter(Boolean);
};

const getListDetails = async (listId) => {
    if (!listId) throw new Error('List ID is required');

    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}`;
    const context = `ListService Details ${listId}`;
    const data = await apiClient(endpoint, context);
    console.log(`[${context}] Raw API response:`, JSON.stringify(data, null, 2));

    const formattedList = formatList(data);
    if (!formattedList) {
        throw new Error(`List details not found or invalid for ID: ${listId}`);
    }

    const formattedItems = Array.isArray(data.items)
        ? data.items.map(formatListItem).filter(Boolean)
        : [];
    console.log(`[${context}] Formatted items:`, formattedItems);

    return {
        ...formattedList,
        items: formattedItems,
        item_count: formattedList.item_count,
    };
};

const createList = async (listData) => {
    if (!listData || !listData.name || String(listData.name).trim() === '') {
         throw new Error("List name is required for creation.");
    }
    if (listData.tags && !Array.isArray(listData.tags)) {
         throw new Error("Tags must be provided as an array.");
    }
    const payload = {
        ...listData,
        is_public: listData.is_public ?? true,
        tags: Array.isArray(listData.tags) ? listData.tags : [],
    };

    const response = await apiClient(BASE_PATH, 'ListService Create', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    const formatted = formatList(response);
    if (!formatted) {
        throw new Error("Received invalid data after creating list.");
    }
    return { ...formatted, item_count: 0 };
};

const addItemToList = async (listId, itemData) => {
    if (!listId || !itemData || !itemData.item_id || !itemData.item_type) {
        throw new Error("List ID, Item ID, and Item Type are required to add an item.");
    }
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}/items`;
    const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

    return await apiClient(endpoint, 'ListService Add Item', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

const removeItemFromList = async (listId, listItemId) => {
    if (!listId || !listItemId) {
        throw new Error("List ID and List Item ID are required to remove an item.");
    }
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}/items/${encodeURIComponent(listItemId)}`;

    return await apiClient(endpoint, 'ListService Remove Item', {
        method: 'DELETE',
    });
};

const toggleFollow = async (listId) => {
    if (!listId) throw new Error("List ID is required to toggle follow status.");

    console.log(`[listService] Toggling follow for list ${listId}`);
    const encodedListId = encodeURIComponent(listId);
    const endpoint = `${BASE_PATH}/${encodedListId}/follow`;
    const context = 'ListService Toggle Follow';

    try {
        const headers = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        const response = await apiClient(endpoint, context, {
            method: 'POST',
            headers,
        });

        console.log(`[listService] Raw toggle follow response:`, response);

        if (!response || typeof response.id === 'undefined' || typeof response.is_following !== 'boolean' || typeof response.saved_count !== 'number') {
            console.error('[listService] Invalid follow toggle response structure:', response);
            throw new Error("Server returned an invalid response structure for follow toggle.");
        }

        const formattedResponse = formatList(response);
        if (!formattedResponse) {
            throw new Error("Failed to format the valid response after toggling follow.");
        }

        console.log(`[listService] Formatted toggle follow response:`, {
            id: formattedResponse.id,
            is_following: formattedResponse.is_following,
            saved_count: formattedResponse.saved_count
        });

        return formattedResponse;
    } catch (error) {
        console.error(`[listService] Error in toggleFollow for list ${listId}:`, error.message || error);
        throw error;
    }
};

const updateVisibility = async (listId, visibilityData) => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and a boolean 'is_public' flag are required.");
    }
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    const response = await apiClient(endpoint, 'ListService Update Visibility', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    const formatted = formatList(response);
    if (!formatted) {
        throw new Error("Received invalid data after updating visibility.");
    }
    return formatted;
};

// Export the service object
export const listService = {
    getLists,
    getListDetails,
    createList,
    addItemToList,
    removeItemFromList,
    toggleFollow,
    updateVisibility,
};