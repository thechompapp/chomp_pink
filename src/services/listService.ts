/* src/services/listService.ts */
import apiClient, { ApiResponse } from '@/services/apiClient';
import type { List, ListItem, ListDetails, ListParams, CreateListData, AddItemData, UpdateVisibilityData, FollowToggleResponse, AddItemResult } from '@/types/List'; // Use global alias if configured, else keep relative/absolute

// Helper to format raw list data from API into the List type
const formatList = (list: any): List | null => {
    if (!list || typeof list.id !== 'number' || typeof list.name !== 'string') {
        console.warn('[formatList] Invalid raw list data received:', list);
        return null;
    }
    // Ensure item_count is derived correctly, defaulting to 0
    const itemCount = Array.isArray(list.items) ? list.items.length : (typeof list.item_count === 'number' ? list.item_count : 0);

    return {
        id: list.id,
        name: list.name || 'Unnamed List',
        description: list.description ?? null,
        // Use list_type if present, fallback to type, then default
        type: (list.list_type || list.type || 'mixed') as List['type'], // Assert type
        list_type: (list.list_type || list.type || 'mixed') as List['list_type'], // Keep original field
        saved_count: typeof list.saved_count === 'number' ? list.saved_count : 0,
        item_count: itemCount, // Use calculated item count
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: typeof list.is_public === 'boolean' ? list.is_public : true, // Default public
        is_following: !!list.is_following, // Ensure boolean
        created_by_user: !!list.created_by_user, // Ensure boolean
        user_id: typeof list.user_id === 'number' ? list.user_id : null,
        creator_handle: list.creator_handle ?? null,
        created_at: list.created_at,
        updated_at: list.updated_at,
        city_name: list.city_name ?? list.city ?? undefined, // Add city_name alias
    };
};

// Helper to format raw list item data from API into the ListItem type
const formatListItem = (item: any): ListItem | null => {
    // Check for essential fields
    if (!item || typeof item.list_item_id !== 'number' || typeof item.item_id !== 'number' || !item.item_type) {
        console.warn('[formatListItem] Invalid list item data received:', item);
        return null;
    }
    return {
        list_item_id: item.list_item_id,
        id: item.item_id, // Use item_id as primary 'id' for consistency if needed
        item_id: item.item_id, // Keep original field
        item_type: item.item_type as ListItem['item_type'], // Assert type
        name: item.name || `Item ${item.item_id}`, // Provide default name
        restaurant_name: item.restaurant_name ?? null, // Use nullish coalescing
        added_at: item.added_at,
        city: item.city ?? null,
        neighborhood: item.neighborhood ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
    };
};

// Function to fetch multiple lists based on parameters
const getLists = async (params: ListParams = {}): Promise<List[]> => {
    const queryParams: Record<string, string> = {};
    // Stringify boolean parameters for the query
    if (params.createdByUser !== undefined) queryParams.createdByUser = String(params.createdByUser);
    if (params.followedByUser !== undefined) queryParams.followedByUser = String(params.followedByUser);

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/api/lists${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

    try {
        const response = await apiClient<any[]>(endpoint, context); // Expecting an array in response.data
        // Validate the response structure
        if (!response.success || !Array.isArray(response.data)) {
            console.warn(`[${context}] Invalid data format or unsuccessful response. Expected { success: true, data: [...] }, got:`, response);
            return []; // Return empty array on failure or invalid format
        }
        // Map and filter valid lists
        return response.data.map(formatList).filter((list): list is List => list !== null);
    } catch (error) {
        console.error(`[${context}] API call failed:`, error);
        // Don't return undefined, return empty array or re-throw
        return []; // Return empty array on caught error
    }
};

// Function to fetch detailed information for a single list
const getListDetails = async (listId: number | string): Promise<ListDetails> => {
    if (!listId) {
        const error = new Error('List ID is required');
        // error.status = 400; // You might assign status codes if needed
        throw error;
    }

    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
    const context = `ListService Details ${listId}`;

    try {
        const response = await apiClient<any>(endpoint, context); // Expecting a single list object in response.data

        // Validate response structure and essential data
        if (!response.success || !response.data || typeof response.data.id !== 'number') {
            // Throw a more specific error for not found or invalid data
            const error = new Error(`List details not found or invalid for ID: ${listId}`);
            // error.status = 404; // Example status
            throw error;
        }

        // Format the base list details
        const formattedList = formatList(response.data);
        if (!formattedList) {
            // Throw error if formatting fails (shouldn't happen with checks above)
            throw new Error(`Failed to format valid list details from API response for ID: ${listId}`);
        }

        // Format list items, ensuring it handles cases where 'items' might be missing or not an array
        const rawItems = response.data.items;
        const formattedItems = Array.isArray(rawItems)
            ? rawItems.map(formatListItem).filter((item): item is ListItem => item !== null)
            : []; // Default to empty array if items missing/invalid

        // Combine into ListDetails, ensuring item_count matches formatted items length
        const listDetails: ListDetails = {
            ...formattedList,
            items: formattedItems,
            item_count: formattedItems.length, // Use length of successfully formatted items
            // Ensure is_following and created_by_user are present and boolean
            is_following: !!response.data.is_following,
            created_by_user: !!response.data.created_by_user,
        };

        return listDetails;

    } catch (error) {
        // Log the error and re-throw it so React Query can handle it
        console.error(`[${context}] API call failed:`, error);
        // Ensure the original error (with potential status code) is thrown
        throw error;
    }
};

// Function to create a new list
const createList = async (listData: CreateListData): Promise<List> => {
    // Validate essential input
    if (!listData || !listData.name || String(listData.name).trim() === '') {
        throw new Error('List name is required for creation.');
    }
    // Prepare payload with defaults
    const payload: CreateListData = {
        name: listData.name.trim(),
        description: listData.description?.trim() || null,
        is_public: listData.is_public ?? true, // Default to public
        tags: Array.isArray(listData.tags) ? listData.tags.map(String).filter(Boolean) : [], // Ensure tags are valid strings
        list_type: listData.list_type || 'mixed', // Default to mixed
        city_name: listData.city_name?.trim() || null,
    };

    try {
        const response = await apiClient<any>('/api/lists', 'ListService Create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Validate response and format
        if (!response.success || !response.data) {
            throw new Error(response.error || 'Received invalid data after creating list.');
        }
        const formatted = formatList(response.data);
        if (!formatted) {
            throw new Error('Failed to format created list data.');
        }
        // Ensure item_count is 0 for a newly created list
        return { ...formatted, item_count: 0 };

    } catch (error) {
        console.error(`[ListService Create] API call failed:`, error);
        throw error; // Re-throw
    }
};

// Function to add an item to a list
const addItemToList = async (listId: number | string, itemData: AddItemData): Promise<AddItemResult> => {
    // Validate input
    if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
        throw new Error('List ID, numerical Item ID, and Item Type are required.');
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items`;
    const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

    try {
        // apiClient handles success/error response structure
        const response = await apiClient<AddItemResult>(endpoint, 'ListService Add Item', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Validate the structure of the successful response data
        if (!response.success || !response.data?.message || !response.data?.item || typeof response.data.item.id !== 'number') {
            throw new Error(response.error || 'Invalid response format after adding item.');
        }
        return response.data; // Return the data part of the ApiResponse

    } catch (error) {
        console.error(`[ListService Add Item] API call failed for list ${listId}:`, error);
        throw error; // Re-throw
    }
};

// Function to remove an item from a list
const removeItemFromList = async (listId: number | string, listItemId: number | string): Promise<{ success: boolean }> => {
    if (!listId || !listItemId) {
        throw new Error('List ID and List Item ID are required.');
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items/${encodeURIComponent(String(listItemId))}`;

    try {
        // DELETE requests might return 204 No Content or a simple success body
        const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Remove Item', {
            method: 'DELETE',
        });
        // Success might be indicated by response.success or just a 2xx status code handled by apiClient
        return { success: response?.success ?? true }; // Assume success if no error is thrown and response indicates it or is empty
    } catch (error) {
        console.error(`[ListService Remove Item] API call failed for list ${listId}, item ${listItemId}:`, error);
        // Return success: false on error
        return { success: false }; // Indicate failure
    }
};

// Function to toggle following a list
const toggleFollow = async (listId: number | string): Promise<FollowToggleResponse> => {
    if (!listId) throw new Error('List ID is required.');
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/follow`;

    try {
        // The backend should return the updated follow status and count
        const response = await apiClient<FollowToggleResponse>(endpoint, 'ListService Toggle Follow', {
            method: 'POST',
            // Add cache-control headers to ensure fresh data is requested/returned
             headers: {
                 'Cache-Control': 'no-cache, no-store, must-revalidate',
                 'Pragma': 'no-cache',
                 'Expires': '0',
            },
        });
        // Validate the response structure
        if (!response.success || !response.data || typeof response.data.id !== 'number' || typeof response.data.is_following !== 'boolean' || typeof response.data.saved_count !== 'number') {
            throw new Error(response.error || 'Invalid response format after toggling follow.');
        }
        return response.data; // Return the data part

    } catch (error) {
        console.error(`[ListService Toggle Follow] API call failed for list ${listId}:`, error);
        throw error; // Re-throw
    }
};

// Function to update list visibility
const updateVisibility = async (listId: number | string, visibilityData: UpdateVisibilityData): Promise<List> => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and a boolean 'is_public' flag are required.");
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    try {
        // Expecting the updated List object in response.data
        const response = await apiClient<any>(endpoint, 'ListService Update Visibility', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        if (!response.success || !response.data) {
             throw new Error(response.error || 'Received invalid data after updating visibility.');
        }
        const formatted = formatList(response.data);
        if (!formatted) {
            throw new Error('Failed to format updated list visibility data.');
        }
        return formatted;

    } catch (error) {
        console.error(`[ListService Update Visibility] API call failed for list ${listId}:`, error);
        throw error; // Re-throw
    }
};

// Function to delete a list
const deleteList = async (listId: number | string): Promise<{ success: boolean }> => {
    if (!listId) throw new Error('List ID is required.');
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
    try {
        const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Delete List', {
            method: 'DELETE',
        });
        // Assume success if apiClient doesn't throw and response is ok (e.g., 204 No Content)
        return { success: response?.success ?? true };
    } catch (error) {
        console.error(`[ListService Delete List] API call failed for list ${listId}:`, error);
        return { success: false }; // Indicate failure
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