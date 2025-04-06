// src/services/listService.js
import apiClient from '@/services/apiClient.js';

const BASE_PATH = '/api/lists';

// Helper function to ensure consistent list object structure
const formatList = (list) => {
    // Return null if list is invalid or has no ID
    if (!list || typeof list.id === 'undefined' || list.id === null) return null;
    return {
        ...list,
        // Map backend fields to expected frontend fields if needed
        city: list.city_name, // Example: map city_name to city
        is_following: !!list.is_following, // Ensure boolean, default false
        is_public: list.is_public ?? true, // Default to true if null/undefined
        created_by_user: !!list.created_by_user, // Ensure boolean, default false
        tags: Array.isArray(list.tags) ? list.tags : [], // Ensure tags is an array
        item_count: list.item_count || 0, // Default item_count to 0
        saved_count: list.saved_count || 0, // Default saved_count to 0
        // Ensure essential fields are present
        id: list.id,
        name: list.name || 'Unnamed List',
    };
};

// Helper function to ensure consistent list item structure
const formatListItem = (item) => {
    // Return null if item is invalid or missing key IDs
    if (!item || !item.list_item_id || !item.item_id || !item.item_type) return null;
    return {
        list_item_id: item.list_item_id,
        item_type: item.item_type,
        id: item.item_id, // Actual dish or restaurant ID
        name: item.name || `Item ${item.item_id}`, // Default name if missing
        restaurant_name: item.restaurant_name, // Can be null for restaurants
        added_at: item.added_at,
        city: item.city, // Use pre-joined city from backend query
        neighborhood: item.neighborhood, // Use pre-joined neighborhood
        tags: Array.isArray(item.tags) ? item.tags : [], // Ensure tags is an array
    };
};

// --- Service Functions ---

const getLists = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    // Corrected Endpoint Construction:
    const endpoint = `${BASE_PATH}${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

    const data = await apiClient(endpoint, context);

    if (!Array.isArray(data)) {
        console.warn(`[${context}] Invalid data format. Expected array, got:`, data);
        return []; // Return empty array on invalid format
    }
    // Map and filter null results from formatting
    return data.map(formatList).filter(Boolean);
};

const getListDetails = async (listId) => {
    if (!listId) throw new Error('List ID is required');

    // Corrected Endpoint Construction:
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}`;
    const context = `ListService Details ${listId}`;
    const data = await apiClient(endpoint, context);

    // Check for invalid main list data first
    const formattedList = formatList(data);
    if (!formattedList) {
        // If list data itself is invalid or not found by apiClient (which throws 404)
        // This case handles scenarios where API might return 200 OK with invalid data
        throw new Error(`List details not found or invalid for ID: ${listId}`);
    }

    // Format items, ensuring item array exists and filtering invalid items
    const formattedItems = Array.isArray(data.items)
        ? data.items.map(formatListItem).filter(Boolean)
        : [];

    // Return combined formatted data
    return {
        ...formattedList,
        items: formattedItems,
        // Recalculate item_count based on valid items returned, overriding potentially stale count from list data
        item_count: formattedItems.length,
    };
};

const createList = async (listData) => {
    // Validate required fields before sending
    if (!listData || !listData.name || String(listData.name).trim() === '') {
         throw new Error("List name is required for creation.");
    }
    // Validate tags if provided
     if (listData.tags && !Array.isArray(listData.tags)) {
         throw new Error("Tags must be provided as an array.");
     }
    // Ensure boolean for is_public, default true
     const payload = {
         ...listData,
         is_public: listData.is_public ?? true,
         tags: Array.isArray(listData.tags) ? listData.tags : [] // Ensure tags is array
     };

    const response = await apiClient(BASE_PATH, 'ListService Create', {
        method: 'POST',
        body: JSON.stringify(payload), // Send validated payload
    });
    // Format the response using the same helper
    const formatted = formatList(response);
     if (!formatted) {
         throw new Error("Received invalid data after creating list.");
     }
     // Add default item_count for newly created list
     return { ...formatted, item_count: 0 };
};

const addItemToList = async (listId, itemData) => {
    if (!listId || !itemData || !itemData.item_id || !itemData.item_type) {
        throw new Error("List ID, Item ID, and Item Type are required to add an item.");
    }
    // Corrected Endpoint Construction:
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}/items`;
    // Send only necessary data
    const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

    // apiClient returns the result of the add operation (e.g., the new list item or success message)
    return await apiClient(endpoint, 'ListService Add Item', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

const removeItemFromList = async (listId, listItemId) => {
    if (!listId || !listItemId) {
        throw new Error("List ID and List Item ID are required to remove an item.");
    }
    // Corrected Endpoint Construction:
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}/items/${encodeURIComponent(listItemId)}`;

    // apiClient returns success indicator for DELETE or throws error
    return await apiClient(endpoint, 'ListService Remove Item', {
        method: 'DELETE',
    });
};

const toggleFollow = async (listId) => {
    if (!listId) throw new Error("List ID is required to toggle follow status.");

    console.log(`[listService] Toggling follow for list ${listId}`);
    const encodedListId = encodeURIComponent(listId);
    // Corrected Endpoint Construction:
    const endpoint = `${BASE_PATH}/${encodedListId}/follow`;
    const context = 'ListService Toggle Follow';

    try {
        // Headers to attempt cache busting (may or may not be effective depending on server/proxies)
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

        // Validate the structure of the response strictly
        if (!response || typeof response.id === 'undefined' || typeof response.is_following !== 'boolean' || typeof response.saved_count !== 'number') {
            console.error('[listService] Invalid follow toggle response structure:', response);
            throw new Error("Server returned an invalid response structure for follow toggle.");
        }

        // Format using the helper, which ensures consistency
        const formattedResponse = formatList(response);
         if (!formattedResponse) {
             // This should ideally not happen if the above check passed, but belt-and-suspenders
             throw new Error("Failed to format the valid response after toggling follow.");
         }

        console.log(`[listService] Formatted toggle follow response:`, {
            id: formattedResponse.id,
            is_following: formattedResponse.is_following,
            saved_count: formattedResponse.saved_count
        });

        return formattedResponse; // Return the consistent, formatted list object
    } catch (error) {
        // Log the specific error before re-throwing
        console.error(`[listService] Error in toggleFollow for list ${listId}:`, error.message || error);
        // Re-throw the original error (or a new one with more context) for mutation handling
        throw error;
    }
};


const updateVisibility = async (listId, visibilityData) => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and a boolean 'is_public' flag are required.");
    }
    // Corrected Endpoint Construction:
    const endpoint = `${BASE_PATH}/${encodeURIComponent(listId)}/visibility`;
    const payload = { is_public: visibilityData.is_public }; // Send only the required field

    const response = await apiClient(endpoint, 'ListService Update Visibility', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
     // Format the response
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