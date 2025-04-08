/* src/services/listService.ts */
import apiClient, { ApiResponse } from '@/services/apiClient'; // Import ApiResponse type
// Assume List, ListItem interfaces exist, e.g., in src/types/List.ts
import type { List, ListItem, ListDetails, ListParams, CreateListData, AddItemData, UpdateVisibilityData, FollowToggleResponse, AddItemResult } from '@/types/List'; // Correctly import AddItemResult

// Helper: Format raw API list data (Add robust checks)
const formatList = (list: any): List | null => {
   if (!list || typeof list.id !== 'number' || typeof list.name !== 'string') {
        console.warn('[formatList] Invalid raw list data received:', list);
        return null;
   }
   // Calculate item_count directly if items array is present, otherwise use field
   const itemCount = Array.isArray(list.items) ? list.items.length : (typeof list.item_count === 'number' ? list.item_count : 0);

   return {
       id: list.id,
       name: list.name || 'Unnamed List',
       description: list.description ?? null,
       type: list.list_type || list.type || 'mixed',
       saved_count: typeof list.saved_count === 'number' ? list.saved_count : 0,
       item_count: itemCount, // Use calculated or provided count
       city: list.city_name || list.city || null,
       tags: Array.isArray(list.tags) ? list.tags : [],
       is_public: typeof list.is_public === 'boolean' ? list.is_public : true,
       is_following: !!list.is_following,
       created_by_user: !!list.created_by_user,
       user_id: typeof list.user_id === 'number' ? list.user_id : null,
       creator_handle: list.creator_handle ?? null,
       created_at: list.created_at,
       updated_at: list.updated_at,
   };
};

// Helper: Format raw API list item data (Add robust checks)
const formatListItem = (item: any): ListItem | null => {
    if (!item || typeof item.list_item_id !== 'number' || typeof item.item_id !== 'number' || !item.item_type) {
        console.warn('[formatListItem] Invalid list item data received:', item);
        return null;
    }
    return {
        list_item_id: item.list_item_id,
        id: item.item_id,
        item_id: item.item_id, // Keep for compatibility if needed
        item_type: item.item_type,
        name: item.name || `Item ${item.item_id}`,
        restaurant_name: item.restaurant_name ?? null,
        added_at: item.added_at,
        city: item.city ?? null,
        neighborhood: item.neighborhood ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
    };
};

// --- Service Functions ---

const getLists = async (params: ListParams = {}): Promise<List[]> => {
  const queryParams: Record<string, string> = {};
  if (params.createdByUser !== undefined) queryParams.createdByUser = String(params.createdByUser);
  if (params.followedByUser !== undefined) queryParams.followedByUser = String(params.followedByUser);

  const queryString = new URLSearchParams(queryParams).toString();
  const endpoint = `/api/lists${queryString ? `?${queryString}` : ''}`;
  const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

  // Expecting { data: List[] } from backend route
  const response = await apiClient<any[]>(endpoint, context); // Use any[] initially if backend structure varies

  if (!response.data || !Array.isArray(response.data)) {
      console.warn(`[${context}] Invalid data format. Expected array in response.data, got:`, response.data);
      return [];
  }
  return response.data.map(formatList).filter((list): list is List => list !== null);
};

const getListDetails = async (listId: number | string): Promise<ListDetails> => {
  if (!listId) throw new Error('List ID is required');

  const endpoint = `/api/lists/${encodeURIComponent(listId)}`;
  const context = `ListService Details ${listId}`;
  // Expecting { data: { ...listFields, items: any[] } } from backend route
  const response = await apiClient<any>(endpoint, context); // Use any temporarily

  // Check the response.data for the list details and items
  if (!response.data || typeof response.data.id !== 'number') {
       throw new Error(`List details not found or invalid for ID: ${listId}`);
  }

  // Format the main list details using the raw data from response.data
  const formattedList = formatList(response.data);
  if (!formattedList) {
      // This implies formatList found the raw data invalid
      throw new Error(`Failed to format valid list details from API response for ID: ${listId}`);
  }

  // Extract and format items from response.data.items
  const rawItems = response.data.items; // Assuming items are nested here
  const formattedItems = Array.isArray(rawItems)
    ? rawItems.map(formatListItem).filter((item): item is ListItem => item !== null)
    : [];

    // Recalculate item_count based on formatted items for accuracy
    const finalItemCount = formattedItems.length;

  // Combine formatted list details with formatted items
  return {
    ...formattedList,
    items: formattedItems,
    item_count: finalItemCount, // Use count of successfully formatted items
  };
};

const createList = async (listData: CreateListData): Promise<List> => {
   if (!listData || !listData.name || String(listData.name).trim() === '') {
       throw new Error('List name is required for creation.');
   }
   const payload: CreateListData = {
       ...listData,
       is_public: listData.is_public ?? true,
       tags: Array.isArray(listData.tags) ? listData.tags.map(String) : [],
       list_type: listData.list_type || 'mixed',
   };
   // Expecting { data: List } from backend route
   const response = await apiClient<any>('/api/lists', 'ListService Create', { // Use any temporarily
       method: 'POST',
       body: JSON.stringify(payload),
   });

   const formatted = formatList(response.data); // Format the response data
   if (!formatted) {
       throw new Error('Received invalid data after creating list.');
   }
   return { ...formatted, item_count: 0 }; // Ensure item_count is 0
};

// Type the result more specifically if possible based on AddItemResult interface
const addItemToList = async (listId: number | string, itemData: AddItemData): Promise<AddItemResult> => {
   if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
       throw new Error('List ID, numerical Item ID, and Item Type are required.');
   }
   const endpoint = `/api/lists/${encodeURIComponent(listId)}/items`;
   const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

   // Expecting { data: AddItemResult } from backend route
   const response = await apiClient<AddItemResult>(endpoint, 'ListService Add Item', {
       method: 'POST',
       body: JSON.stringify(payload),
   });
   // Check the specific structure expected by AddItemResult
   if (!response.data?.message || !response.data?.item || typeof response.data.item.id !== 'number') {
       throw new Error('Invalid response format after adding item.');
   }
   return response.data;
};

const removeItemFromList = async (listId: number | string, listItemId: number | string): Promise<{ success: boolean }> => {
    if (!listId || !listItemId) {
        throw new Error('List ID and List Item ID are required.');
    }
    const endpoint = `/api/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(listItemId)}`;
    // Expecting 204 No Content, apiClient returns { success: true }
    const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Remove Item', {
        method: 'DELETE',
    });
    return { success: response?.success ?? false };
};

const toggleFollow = async (listId: number | string): Promise<FollowToggleResponse> => {
    if (!listId) throw new Error('List ID is required.');
    const endpoint = `/api/lists/${encodeURIComponent(listId)}/follow`;

    // Expecting { data: FollowToggleResponse } from backend route
    const response = await apiClient<FollowToggleResponse>(endpoint, 'ListService Toggle Follow', {
        method: 'POST',
        headers: {
             'Cache-Control': 'no-cache, no-store, must-revalidate',
             'Pragma': 'no-cache',
             'Expires': '0',
         },
    });
     // Check required fields based on FollowToggleResponse interface
     if (!response.data || typeof response.data.id !== 'number' || typeof response.data.is_following !== 'boolean' || typeof response.data.saved_count !== 'number') {
        throw new Error('Invalid response format after toggling follow.');
     }
    return response.data;
};

const updateVisibility = async (listId: number | string, visibilityData: UpdateVisibilityData): Promise<List> => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and a boolean 'is_public' flag are required.");
    }
    const endpoint = `/api/lists/${encodeURIComponent(listId)}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    // Expecting { data: List } from backend route
    const response = await apiClient<any>(endpoint, 'ListService Update Visibility', { // Use any temporarily
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    const formatted = formatList(response.data); // Format the response data
    if (!formatted) {
        throw new Error('Received invalid data after updating visibility.');
    }
    return formatted;
};

const deleteList = async (listId: number | string): Promise<{ success: boolean }> => {
    if (!listId) throw new Error('List ID is required.');
    const endpoint = `/api/lists/${encodeURIComponent(listId)}`;
    // Expecting 204 No Content, apiClient returns { success: true }
    const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Delete List', {
        method: 'DELETE',
    });
    return { success: response?.success ?? false };
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