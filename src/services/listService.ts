/* src/services/listService.ts */
import apiClient, { ApiResponse } from '@/services/apiClient';
import type { List, ListItem, ListDetails, ListParams, CreateListData, AddItemData, UpdateVisibilityData, FollowToggleResponse, AddItemResult } from '@/types/List';

const formatList = (list: any): List | null => {
    if (!list || typeof list.id !== 'number') {
        console.warn('[formatList] Invalid raw list data received:', list);
        return null;
    }
    const itemCount = Array.isArray(list.items) ? list.items.length : (typeof list.item_count === 'number' ? list.item_count : 0);

    return {
        id: list.id,
        name: list.name || 'Unnamed List',
        description: list.description ?? null,
        type: (list.list_type || list.type || 'mixed') as List['type'],
        list_type: (list.list_type || list.type || 'mixed') as List['list_type'],
        saved_count: typeof list.saved_count === 'number' ? list.saved_count : 0,
        item_count: itemCount,
        city: list.city_name || list.city || null,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: typeof list.is_public === 'boolean' ? list.is_public : true,
        is_following: !!list.is_following,
        created_by_user: !!list.created_by_user,
        user_id: typeof list.user_id === 'number' ? list.user_id : null,
        creator_handle: list.creator_handle ?? null,
        created_at: list.created_at,
        updated_at: list.updated_at,
        city_name: list.city_name ?? list.city ?? undefined,
    };
};

const formatListItem = (item: any): ListItem | null => {
    if (!item || typeof item.list_item_id !== 'number' || typeof item.item_id !== 'number' || !item.item_type) {
        console.warn('[formatListItem] Invalid list item data received:', item);
        return null;
    }
    return {
        list_item_id: item.list_item_id,
        id: item.item_id,
        item_id: item.item_id,
        item_type: item.item_type as ListItem['item_type'],
        name: item.name || `Item ${item.item_id}`,
        restaurant_name: item.restaurant_name ?? null,
        added_at: item.added_at,
        city: item.city ?? null,
        neighborhood: item.neighborhood ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
    };
};

const getLists = async (params: ListParams = {}): Promise<List[]> => {
    const queryParams: Record<string, string> = {};
    if (params.createdByUser !== undefined) queryParams.createdByUser = String(params.createdByUser);
    if (params.followedByUser !== undefined) queryParams.followedByUser = String(params.followedByUser);

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/api/lists${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

    const response = await apiClient<any[]>(endpoint, context);
    if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || `Invalid data format in ${context}`);
    }
    return response.data.map(formatList).filter((list): list is List => list !== null);
};

const getListDetails = async (listId: number | string): Promise<ListDetails> => {
    if (!listId) {
        throw new Error('List ID is required');
    }

    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
    const context = `ListService Details ${listId}`;

    const response = await apiClient<any>(endpoint, context);
    if (!response.success || !response.data || typeof response.data.id !== 'number') {
        throw new Error(response.error || `List details not found or invalid for ID: ${listId}`);
    }

    const formattedList = formatList(response.data);
    if (!formattedList) {
        throw new Error(`Failed to format list details for ID: ${listId}`);
    }

    const rawItems = response.data.items;
    const formattedItems = Array.isArray(rawItems)
        ? rawItems.map(formatListItem).filter((item): item is ListItem => item !== null)
        : [];

    return {
        ...formattedList,
        items: formattedItems,
        item_count: formattedItems.length,
        is_following: !!response.data.is_following,
        created_by_user: !!response.data.created_by_user,
    };
};

const createList = async (listData: CreateListData): Promise<List> => {
    if (!listData || !listData.name || String(listData.name).trim() === '') {
        throw new Error('List name is required for creation');
    }
    const payload: CreateListData = {
        name: listData.name.trim(),
        description: listData.description?.trim() || null,
        is_public: listData.is_public ?? true,
        tags: Array.isArray(listData.tags) ? listData.tags.map(String).filter(Boolean) : [],
        list_type: listData.list_type || 'mixed',
        city_name: listData.city_name?.trim() || null,
    };

    const response = await apiClient<any>('/api/lists', 'ListService Create', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (!response.success || !response.data) {
        throw new Error(response.error || 'Received invalid data after creating list');
    }
    const formatted = formatList(response.data);
    if (!formatted) {
        throw new Error('Failed to format created list data');
    }
    return { ...formatted, item_count: 0 };
};

const addItemToList = async (listId: number | string, itemData: AddItemData): Promise<AddItemResult> => {
    if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
        throw new Error('List ID, numerical Item ID, and Item Type are required');
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items`;
    const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

    const response = await apiClient<AddItemResult>(endpoint, 'ListService Add Item', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (!response.success || !response.data?.message || !response.data?.item) {
        throw new Error(response.error || 'Invalid response format after adding item');
    }
    return response.data;
};

const removeItemFromList = async (listId: number | string, listItemId: number | string): Promise<{ success: boolean }> => {
    if (!listId || !listItemId) {
        throw new Error('List ID and List Item ID are required');
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items/${encodeURIComponent(String(listItemId))}`;

    const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Remove Item', {
        method: 'DELETE',
    });
    return { success: response?.success ?? true };
};

const toggleFollow = async (listId: number | string): Promise<FollowToggleResponse> => {
    if (!listId) throw new Error('List ID is required');
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/follow`;

    const response = await apiClient<FollowToggleResponse>(endpoint, 'ListService Toggle Follow', {
        method: 'POST',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });

    if (!response.success || !response.data || typeof response.data.is_following !== 'boolean') {
        throw new Error(response.error || 'Invalid response format after toggling follow');
    }
    return response.data;
};

const updateVisibility = async (listId: number | string, visibilityData: UpdateVisibilityData): Promise<List> => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and a boolean 'is_public' flag are required");
    }
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    const response = await apiClient<any>(endpoint, 'ListService Update Visibility', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    if (!response.success || !response.data) {
        throw new Error(response.error || 'Received invalid data after updating visibility');
    }
    const formatted = formatList(response.data);
    if (!formatted) {
        throw new Error('Failed to format updated list visibility data');
    }
    return formatted;
};

const deleteList = async (listId: number | string): Promise<{ success: boolean }> => {
    if (!listId) throw new Error('List ID is required');
    const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;

    const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Delete List', {
        method: 'DELETE',
    });
    return { success: response?.success ?? true };
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