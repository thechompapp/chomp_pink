/* src/services/listService.ts */
import apiClient, { ApiResponse, ApiError } from '@/services/apiClient'; // Import ApiError
// Import specific types needed for this service
import type {
    List,
    ListItem,
    ListDetails,
    ListParams,
    CreateListData,
    AddItemData,
    AddItemResult, // Use AddItemResult for response type
    FollowToggleResponse,
    UpdateVisibilityData
} from '@/types/List'; // Assuming types are correctly defined in @/types/List

// Helper to check if an object is a valid List after formatting
const isValidList = (list: any): list is List => {
    return list != null && typeof list === 'object' && typeof list.id === 'number' && typeof list.name === 'string';
};

// Helper to check if an object is a valid ListItem after formatting
const isValidListItem = (item: any): item is ListItem => {
    return item != null && typeof item === 'object' && typeof item.list_item_id === 'number' && typeof item.id === 'number' && typeof item.item_type === 'string';
};


// Type guard for AddItemResult
const isValidAddItemResult = (data: any): data is AddItemResult => {
    return data != null && typeof data === 'object' && typeof data.message === 'string' && data.item != null && typeof data.item.id === 'number';
};

// Type guard for FollowToggleResponse
const isValidFollowToggleResponse = (data: any): data is FollowToggleResponse => {
     return data != null && typeof data === 'object' && typeof data.id === 'number' && typeof data.is_following === 'boolean' && typeof data.saved_count === 'number';
};

// Refined formatList with stricter checks and using imported List type
const formatList = (list: any): List | null => {
    if (!list || typeof list.id !== 'number' || typeof list.name !== 'string') {
        // console.warn('[formatList] Invalid raw list data received:', list);
        return null;
    }
    // Ensure numeric fields are numbers, provide defaults for counts/booleans
    const itemCount = Array.isArray(list.items)
        ? list.items.length
        : (typeof list.item_count === 'number' ? list.item_count : (typeof list.item_count === 'string' ? parseInt(list.item_count, 10) : 0));
    const savedCount = typeof list.saved_count === 'number'
        ? list.saved_count
        : (typeof list.saved_count === 'string' ? parseInt(list.saved_count, 10) : 0);

    // Fallback logic for type/list_type
    const listType = (list.list_type || list.type || 'mixed') as List['type'];

    const formatted: List = {
        id: Number(list.id),
        name: list.name,
        description: list.description ?? null,
        type: listType,
        list_type: listType, // Keep both if needed
        saved_count: !isNaN(savedCount) ? savedCount : 0,
        item_count: !isNaN(itemCount) ? itemCount : 0,
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags.filter((t): t is string => typeof t === 'string' && !!t) : [],
        is_public: typeof list.is_public === 'boolean' ? list.is_public : true, // Default to true if undefined
        is_following: !!list.is_following, // Ensure boolean
        created_by_user: !!list.created_by_user, // Ensure boolean
        user_id: list.user_id ? Number(list.user_id) : null,
        creator_handle: list.creator_handle ?? null,
        created_at: list.created_at, // Keep original format (string or Date)
        updated_at: list.updated_at,
        city_name: list.city_name ?? list.city ?? undefined, // Use undefined if needed
    };

    // Final validation check
    if (!isValidList(formatted)) {
        console.warn('[formatList] Formatting resulted in invalid List:', formatted, 'Original:', list);
        return null;
    }
    return formatted;
};

// Refined formatListItem with stricter checks and using imported ListItem type
const formatListItem = (item: any): ListItem | null => {
    if (!item || typeof item.list_item_id !== 'number' || typeof item.id !== 'number' || !item.item_type) {
        // Note: The raw data often has item.id from the underlying dish/restaurant, and list_item_id as the PK of the junction table.
        // Ensure the 'id' field expected by the ListItem interface is mapped correctly (usually from item_id)
        // console.warn('[formatListItem] Invalid raw list item data received:', item);
        return null;
    }
    const formatted: ListItem = {
        list_item_id: Number(item.list_item_id),
        id: Number(item.id), // Map item_id to the primary 'id'
        item_id: Number(item.id), // Keep original item_id if needed elsewhere
        item_type: item.item_type as ListItem['item_type'],
        name: item.name || `Item ${item.id}`, // Default name
        restaurant_name: item.restaurant_name ?? null,
        added_at: item.added_at, // Keep original format
        city: item.city ?? null,
        neighborhood: item.neighborhood ?? null,
        tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === 'string' && !!t) : [],
    };

     // Final validation check
    if (!isValidListItem(formatted)) {
        console.warn('[formatListItem] Formatting resulted in invalid ListItem:', formatted, 'Original:', item);
        return null;
    }
    return formatted;
};

// --- Service Functions ---

const getLists = async (params: ListParams = {}): Promise<List[]> => {
    const queryParams: Record<string, string> = {};
    if (params.createdByUser !== undefined) queryParams.createdByUser = String(params.createdByUser);
    if (params.followedByUser !== undefined) queryParams.followedByUser = String(params.followedByUser);

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/api/lists${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

    try {
        // Expect ApiResponse containing an array of raw list objects
        const response = await apiClient<any[]>(endpoint, context);

        if (!response.success || !Array.isArray(response.data)) {
            // Throw specific error based on response or default
            throw new ApiError(response.error || `Invalid data format received: Expected an array.`, response.status ?? 500, response);
        }

        // Format and filter rigorously
        const formattedLists = response.data
            .map(formatList)
            .filter(isValidList); // Use type guard

        return formattedLists;
    } catch (error) {
        console.error(`[${context}] Error:`, error);
        // Re-throw the error (ApiError or other) for React Query or calling code to handle
        throw error;
    }
};

const getListDetails = async (listId: number | string): Promise<ListDetails> => {
    if (!listId) {
        throw new ApiError('List ID is required', 400);
    }

    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
    const context = `ListService Details ${listId}`;

    try {
        // Expect ApiResponse containing the raw list detail object (including items)
        const response = await apiClient<any>(endpoint, context);

        if (!response.success || !response.data || typeof response.data.id !== 'number') {
             const status = response.status === 404 ? 404 : response.status ?? 500;
             throw new ApiError(response.error || `List details not found or invalid for ID: ${listId}`, status, response);
        }

        // Format the main list part
        const formattedList = formatList(response.data);
        if (!formattedList) {
            console.error(`[${context}] Failed to format base list data:`, response.data);
            throw new ApiError(`Failed to process list details for ID: ${listId}`, 500);
        }

        // Format the items array
        const rawItems = response.data.items;
        const formattedItems = Array.isArray(rawItems)
            ? rawItems.map(formatListItem).filter(isValidListItem) // Use type guard
            : [];

        // Combine into ListDetails structure
        const listDetails: ListDetails = {
            ...formattedList,
            items: formattedItems,
            // Ensure counts/flags from the detailed response are used, falling back to formattedList defaults
            item_count: formattedItems.length, // Recalculate based on formatted items
            is_following: typeof response.data.is_following === 'boolean' ? response.data.is_following : formattedList.is_following,
            created_by_user: typeof response.data.created_by_user === 'boolean' ? response.data.created_by_user : formattedList.created_by_user,
        };

        return listDetails;

    } catch (error) {
        console.error(`[${context}] Error:`, error);
         // Re-throw ApiError or wrap other errors
         if (error instanceof ApiError) {
             throw error;
         } else {
             throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch list details', 500);
         }
    }
};

const createList = async (listData: CreateListData): Promise<List> => {
    if (!listData || !listData.name || String(listData.name).trim() === '') {
        throw new ApiError('List name is required for creation', 400);
    }
    // Prepare payload with defaults and cleaning
    const payload: CreateListData = {
        name: listData.name.trim(),
        description: listData.description?.trim() || null,
        is_public: listData.is_public ?? true,
        tags: Array.isArray(listData.tags) ? listData.tags.map(String).filter(Boolean) : [],
        list_type: listData.list_type || 'mixed',
        city_name: listData.city_name?.trim() || null,
    };

    try {
        const response = await apiClient<any>('/api/lists', 'ListService Create', {
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
        // New lists start with 0 items
        return { ...formatted, item_count: 0 };

    } catch (error) {
        console.error(`[ListService Create] Error:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to create list', 500);
    }
};

// Updated to return AddItemResult directly from backend response
const addItemToList = async (listId: number | string, itemData: AddItemData): Promise<AddItemResult> => {
    if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
        throw new ApiError('List ID, numerical Item ID, and Item Type are required', 400);
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items`;
    const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

    try {
        // Expect ApiResponse containing AddItemResult structure in 'data'
        const response = await apiClient<AddItemResult>(endpoint, 'ListService Add Item', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Use type guard to validate the nested data structure
        if (!response.success || !isValidAddItemResult(response.data)) {
             const errorMsg = response.error || response.data?.message || 'Invalid response format after adding item';
             throw new ApiError(errorMsg, response.status ?? 500, response);
        }
        // Return the validated AddItemResult data
        return response.data;

    } catch (error) {
        console.error(`[ListService Add Item] Error adding item to list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        // Handle specific case like 409 Conflict manually if needed, though ApiError might capture it
         if ((error as any)?.status === 409) {
             throw new ApiError("Item already exists in this list.", 409);
         }
        throw new ApiError(error instanceof Error ? error.message : 'Failed to add item to list', 500);
    }
};

// Updated return type to match store expectation
const removeItemFromList = async (listId: number | string, listItemId: number | string): Promise<{ success: boolean }> => {
    if (!listId || !listItemId) {
        throw new ApiError('List ID and List Item ID are required', 400);
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items/${encodeURIComponent(String(listItemId))}`;

    try {
        // Expect 204 No Content on success
        const response = await apiClient<null>(endpoint, 'ListService Remove Item', {
            method: 'DELETE',
        });

        // apiClient returns { success: true } for 204
        if (!response.success) {
             // Throw specific error if available, otherwise generic
            throw new ApiError(response.error || `Failed to remove item ${listItemId}`, response.status ?? 500, response);
        }
        return { success: true };

    } catch (error) {
        console.error(`[ListService Remove Item] Error removing item ${listItemId} from list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to remove item', 500);
    }
};

const toggleFollow = async (listId: number | string): Promise<FollowToggleResponse> => {
    if (!listId) throw new ApiError('List ID is required', 400);
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/follow`;

    try {
        // Expect ApiResponse containing FollowToggleResponse structure in 'data'
        const response = await apiClient<FollowToggleResponse>(endpoint, 'ListService Toggle Follow', {
            method: 'POST',
             headers: { // Ensure no caching interferes with follow status
                 'Cache-Control': 'no-cache, no-store, must-revalidate',
                 'Pragma': 'no-cache',
                 'Expires': '0',
             },
        });

        // Use type guard to validate the data structure
        if (!response.success || !isValidFollowToggleResponse(response.data)) {
             throw new ApiError(response.error || 'Invalid response format after toggling follow', response.status ?? 500, response);
        }
        // Return the validated FollowToggleResponse data
        return response.data;

    } catch (error) {
        console.error(`[ListService Toggle Follow] Error toggling follow for list ${listId}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(error instanceof Error ? error.message : 'Failed to toggle follow status', 500);
    }
};

const updateVisibility = async (listId: number | string, visibilityData: UpdateVisibilityData): Promise<List> => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new ApiError("List ID and a boolean 'is_public' flag are required", 400);
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    try {
        const response = await apiClient<any>(endpoint, 'ListService Update Visibility', {
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

// Updated return type to match store expectation
const deleteList = async (listId: number | string): Promise<{ success: boolean }> => {
    if (!listId) throw new ApiError('List ID is required', 400);
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;

    try {
        // Expect 204 No Content on success
        const response = await apiClient<null>(endpoint, 'ListService Delete List', {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new ApiError(response.error || `Failed to delete list ${listId}`, response.status ?? 500, response);
        }
        return { success: true };

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