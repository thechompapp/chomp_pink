/* src/services/listService.js */
/* REMOVED: All TypeScript syntax */
import apiClient, { ApiError } from '@/services/apiClient'; // Import ApiError if used
// REMOVED: import type { List, ListItem, ListDetails, ... } from '@/types/List';

// REMOVED: Helper type guards (isValidList, isValidListItem, etc.)

// Refined formatList without TS types/guards
const formatList = (list) => { // REMOVED: : List | null
    if (!list || typeof list.id !== 'number' || typeof list.name !== 'string') {
        return null;
    }
    const itemCount = Array.isArray(list.items) ? list.items.length : Number(list.item_count ?? 0);
    const savedCount = Number(list.saved_count ?? 0);
    const listType = list.list_type || list.type || 'mixed';

    // Basic validation for listType in JS
    if (listType !== 'restaurant' && listType !== 'dish' && listType !== 'mixed') {
        console.warn(`[formatList] Invalid list_type '${listType}' found for list ID ${list.id}.`);
        // Handle invalid type - returning null or a default might be appropriate
        // return null; // Or default: listType = 'mixed';
    }

    const formatted = { // REMOVED: : List
        id: Number(list.id),
        name: list.name,
        description: list.description ?? null,
        type: listType,
        list_type: listType,
        saved_count: !isNaN(savedCount) ? savedCount : 0,
        item_count: !isNaN(itemCount) ? itemCount : 0,
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags.filter(t => typeof t === 'string' && !!t) : [], // Filter for truthy strings
        is_public: typeof list.is_public === 'boolean' ? list.is_public : true,
        is_following: !!list.is_following,
        created_by_user: !!list.created_by_user,
        user_id: list.user_id ? Number(list.user_id) : null,
        creator_handle: list.creator_handle ?? null,
        created_at: list.created_at,
        updated_at: list.updated_at,
        city_name: list.city_name ?? list.city ?? null, // Use null consistently
    };

    // Perform basic JS check if needed (optional)
    // if (typeof formatted.id !== 'number' || typeof formatted.name !== 'string') return null;

    return formatted;
};

// Refined formatListItem without TS types/guards
const formatListItem = (item) => { // REMOVED: : ListItem | null
    // Check essential properties required by your application logic
    if (!item || typeof item.list_item_id !== 'number' || typeof item.id !== 'number' || typeof item.item_type !== 'string') {
        return null;
    }
    // Basic validation for item_type
    if (item.item_type !== 'restaurant' && item.item_type !== 'dish') {
         console.warn('[formatListItem] Invalid item_type found:', item.item_type);
         return null;
    }

    const formatted/*REMOVED: : ListItem*/ = {
        list_item_id: Number(item.list_item_id),
        id: Number(item.id),
        item_id: Number(item.id), // Keep original if needed
        item_type: item.item_type, // REMOVED: as ListItem['item_type']
        name: item.name || `Item ${item.id}`,
        restaurant_name: item.restaurant_name ?? null,
        added_at: item.added_at,
        city: item.city ?? null,
        neighborhood: item.neighborhood ?? null,
        tags: Array.isArray(item.tags) ? item.tags.filter(t => typeof t === 'string' && !!t) : [],
    };

    return formatted;
};

// --- Service Functions ---

const getLists = async (params = {}) => { // REMOVED: : ListParams, : Promise<List[]>
    const queryParams = {}; // REMOVED: : Record<string, string>
    if (params.createdByUser !== undefined) queryParams.createdByUser = String(params.createdByUser);
    if (params.followedByUser !== undefined) queryParams.followedByUser = String(params.followedByUser);

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/api/lists${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

    try {
        // Assume apiClient returns { success: boolean, data: any[], error: string|null, status: number|null }
        const response = await apiClient/*REMOVED: <any[]>*/(endpoint, context);

        if (!response.success || !Array.isArray(response.data)) {
            throw new ApiError(response.error || `Invalid data format received: Expected an array.`, response.status ?? 500, response);
        }

        const formattedLists = response.data
            .map(formatList)
            .filter(list => list !== null); // Filter out nulls from formatting errors

        return formattedLists;
    } catch (error) {
        console.error(`[${context}] Error:`, error);
        throw error; // Re-throw ApiError or other errors
    }
};

const getListDetails = async (listId) => { // REMOVED: Type hints & Promise return type
    if (!listId) {
        throw new ApiError('List ID is required', 400);
    }

    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
    const context = `ListService Details ${listId}`;

    try {
        const response = await apiClient/*REMOVED: <any>*/(endpoint, context);

        if (!response.success || !response.data || typeof response.data.id !== 'number') {
             const status = response.status === 404 ? 404 : response.status ?? 500;
             throw new ApiError(response.error || `List details not found or invalid for ID: ${listId}`, status, response);
        }

        const formattedList = formatList(response.data);
        if (!formattedList) {
            console.error(`[${context}] Failed to format base list data:`, response.data);
            throw new ApiError(`Failed to process list details for ID: ${listId}`, 500);
        }

        const rawItems = response.data.items;
        const formattedItems = Array.isArray(rawItems)
            ? rawItems.map(formatListItem).filter(item => item !== null) // Filter nulls
            : [];

        const listDetails/*REMOVED: : ListDetails*/ = {
            ...formattedList,
            items: formattedItems,
            item_count: formattedItems.length, // Use length of formatted items
            is_following: typeof response.data.is_following === 'boolean' ? response.data.is_following : formattedList.is_following,
            created_by_user: typeof response.data.created_by_user === 'boolean' ? response.data.created_by_user : formattedList.created_by_user,
        };

        return listDetails;

    } catch (error) {
        console.error(`[${context}] Error:`, error);
         if (error instanceof ApiError) throw error;
         throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch list details', 500);
    }
};

const createList = async (listData) => { // REMOVED: Type hints & Promise return type
    if (!listData || !listData.name || String(listData.name).trim() === '') {
        throw new ApiError('List name is required for creation', 400);
    }
    const payload/*REMOVED: : CreateListData*/ = {
        name: listData.name.trim(),
        description: listData.description?.trim() || null,
        is_public: listData.is_public ?? true,
        tags: Array.isArray(listData.tags) ? listData.tags.map(String).filter(Boolean) : [],
        list_type: listData.list_type || 'mixed', // Backend should validate/handle this
        city_name: listData.city_name?.trim() || null,
    };

    try {
        const response = await apiClient/*REMOVED: <any>*/('/api/lists', 'ListService Create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.success || !response.data) {
             throw new ApiError(response.error || 'Received invalid data after creating list', response.status ?? 500, response);
        }

        const formatted = formatList(response.data);
        if (!formatted) {
             console.error('[ListService Create] Failed to format response data:', response.data);
            throw new ApiError('Failed to process created list data', 500);
        }
        return { ...formatted, item_count: 0 }; // Add item_count

    } catch (error) {
        console.error(`[ListService Create] Error:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to create list', 500);
    }
};

const addItemToList = async (listId, itemData) => { // REMOVED: Type hints & Promise return type
    if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
        throw new ApiError('List ID, numerical Item ID, and Item Type are required', 400);
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items`;
    const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

    try {
        // Assume backend returns { success: boolean, data: AddItemResult, error: string|null }
        const response = await apiClient/*REMOVED: <AddItemResult>*/(endpoint, 'ListService Add Item', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Basic validation of the response data structure in JS
        const responseData = response?.data;
        const isValid = responseData != null && typeof responseData === 'object' &&
                       (typeof responseData.message === 'string' || responseData.message === undefined) && // message optional
                       responseData.item != null && typeof responseData.item.id === 'number';

        if (!response.success || !isValid) {
             const errorMsg = response.error || responseData?.message || 'Invalid response format after adding item';
             throw new ApiError(errorMsg, response.status ?? 500, response);
        }
        return responseData; // Return the validated AddItemResult data

    } catch (error) {
        console.error(`[ListService Add Item] Error adding item to list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
         if (error?.status === 409) { // Check status if available
             throw new ApiError("Item already exists in this list.", 409);
         }
        throw new ApiError(error instanceof Error ? error.message : 'Failed to add item to list', 500);
    }
};

const removeItemFromList = async (listId, listItemId) => { // REMOVED: Type hints & Promise return type
    if (!listId || !listItemId) {
        throw new ApiError('List ID and List Item ID are required', 400);
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items/${encodeURIComponent(String(listItemId))}`;

    try {
        const response = await apiClient/*REMOVED: <null>*/(endpoint, 'ListService Remove Item', {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new ApiError(response.error || `Failed to remove item ${listItemId}`, response.status ?? 500, response);
        }
        return { success: true }; // Return object expected by store

    } catch (error) {
        console.error(`[ListService Remove Item] Error removing item ${listItemId} from list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to remove item', 500);
    }
};

const toggleFollow = async (listId) => { // REMOVED: Type hints & Promise return type
    if (!listId) throw new ApiError('List ID is required', 400);
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/follow`;

    try {
        const response = await apiClient/*REMOVED: <FollowToggleResponse>*/(endpoint, 'ListService Toggle Follow', {
            method: 'POST',
             headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' },
        });

        // Basic validation for the expected response structure in JS
         const responseData = response?.data;
         const isValid = responseData != null && typeof responseData === 'object' &&
                        typeof responseData.id === 'number' &&
                        typeof responseData.is_following === 'boolean' &&
                        typeof responseData.saved_count === 'number';

        if (!response.success || !isValid) {
             throw new ApiError(response.error || 'Invalid response format after toggling follow', response.status ?? 500, response);
        }
        return responseData; // Return validated data

    } catch (error) {
        console.error(`[ListService Toggle Follow] Error toggling follow for list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to toggle follow status', 500);
    }
};

const updateVisibility = async (listId, visibilityData) => { // REMOVED: Type hints & Promise return type
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new ApiError("List ID and a boolean 'is_public' flag are required", 400);
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    try {
        const response = await apiClient/*REMOVED: <any>*/(endpoint, 'ListService Update Visibility', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (!response.success || !response.data) {
             throw new ApiError(response.error || 'Received invalid data after updating visibility', response.status ?? 500, response);
        }

        const formatted = formatList(response.data);
        if (!formatted) {
            console.error('[ListService Update Visibility] Failed to format response data:', response.data);
            throw new ApiError('Failed to process updated list visibility data', 500);
        }
        return formatted;

    } catch (error) {
        console.error(`[ListService Update Visibility] Error updating visibility for list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to update list visibility', 500);
    }
};

const deleteList = async (listId) => { // REMOVED: Type hints & Promise return type
    if (!listId) throw new ApiError('List ID is required', 400);
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;

    try {
        const response = await apiClient/*REMOVED: <null>*/(endpoint, 'ListService Delete List', {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new ApiError(response.error || `Failed to delete list ${listId}`, response.status ?? 500, response);
        }
        return { success: true }; // Return object expected by store

    } catch (error) {
        console.error(`[ListService Delete List] Error deleting list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to delete list', 500);
    }
};


export const listService = {
    getLists,
    getListDetails,
    createList,
    addItemToList,
    removeItemFromList,
    toggleFollow,
    updateVisibility,
    deleteList,
};