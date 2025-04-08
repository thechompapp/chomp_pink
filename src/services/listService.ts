/* src/services/listService.ts */
import apiClient from '@/services/apiClient'; // Use .ts version
// Assume List, ListItem interfaces exist, e.g., in src/types/List.ts
import type { List, ListItem, ListDetails, ListParams, CreateListData, AddItemData, UpdateVisibilityData, FollowToggleResponse, AddItemResult } from '@/types/List';

// Helper to format raw API list data (can be typed further)
// Input type 'any' is kept here for flexibility with potential backend variations,
// but the return type is strongly typed. Add validation inside.
const formatList = (list: any): List | null => {
   // Add more robust checks
   if (!list || typeof list.id !== 'number' || typeof list.name !== 'string') {
        console.warn('[formatList] Invalid raw list data received:', list);
        return null;
   }
   return {
       id: list.id,
       name: list.name || 'Unnamed List',
       description: list.description ?? null, // Use nullish coalescing
       type: list.list_type || list.type || 'mixed', // Handle potential key difference
       saved_count: typeof list.saved_count === 'number' ? list.saved_count : 0,
       item_count: typeof list.item_count === 'number' ? list.item_count : 0,
       city: list.city_name || list.city || null, // Handle potential key difference
       tags: Array.isArray(list.tags) ? list.tags : [],
       is_public: typeof list.is_public === 'boolean' ? list.is_public : true, // Default to true if missing/invalid
       is_following: !!list.is_following, // Coerce to boolean safely
       created_by_user: !!list.created_by_user, // Coerce to boolean safely
       user_id: typeof list.user_id === 'number' ? list.user_id : null,
       creator_handle: list.creator_handle ?? null,
       created_at: list.created_at, // Keep as is, or format/validate if needed
       updated_at: list.updated_at,
   };
};

// Helper to format raw API list item data (can be typed further)
const formatListItem = (item: any): ListItem | null => {
    if (!item || typeof item.list_item_id !== 'number' || typeof item.item_id !== 'number' || !item.item_type) {
        console.warn('[formatListItem] Invalid list item data received:', item);
        return null;
    }
    return {
        list_item_id: item.list_item_id, // ID of the item *within the list*
        id: item.item_id, // ID of the actual restaurant/dish
        item_type: item.item_type,
        name: item.name || `Item ${item.item_id}`,
        restaurant_name: item.restaurant_name ?? null,
        added_at: item.added_at, // Or format if needed
        city: item.city ?? null,
        neighborhood: item.neighborhood ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
    };
};


// --- Service Functions ---

// Fetches a list of lists based on parameters
const getLists = async (params: ListParams = {}): Promise<List[]> => {
  // Convert boolean params explicitly for URLSearchParams
  const queryParams: Record<string, string> = {};
  if (params.createdByUser !== undefined) queryParams.createdByUser = String(params.createdByUser);
  if (params.followedByUser !== undefined) queryParams.followedByUser = String(params.followedByUser);
  // Add other params like limit, offset if needed

  const queryString = new URLSearchParams(queryParams).toString();
  const endpoint = `/api/lists${queryString ? `?${queryString}` : ''}`;
  const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All';

  // Expecting { data: List[] }
  const response = await apiClient<any[]>(endpoint, context);

  if (!response.data || !Array.isArray(response.data)) {
      console.warn(`[${context}] Invalid data format. Expected array, got:`, response.data);
      return []; // Return empty array on invalid data
  }
  // Format each list and filter out nulls
  return response.data.map(formatList).filter((list): list is List => list !== null);
};

// Fetches detailed information for a single list, including its items
const getListDetails = async (listId: number | string): Promise<ListDetails> => {
  if (!listId) throw new Error('List ID is required');

  const endpoint = `/api/lists/${encodeURIComponent(listId)}`;
  const context = `ListService Details ${listId}`;
  // Expecting { data: ListDetailsResponseFromApi } where ListDetailsResponseFromApi has items[] field
  const response = await apiClient<any>(endpoint, context);

  if (!response.data || typeof response.data.id === 'undefined') {
       throw new Error(`List details not found or invalid for ID: ${listId}`);
  }

  const formattedList = formatList(response.data);
  if (!formattedList) {
      throw new Error(`Failed to format list details for ID: ${listId}`);
  }

  // Items should be part of the response.data structure now
  const rawItems = response.data.items;
  const formattedItems = Array.isArray(rawItems)
    ? rawItems.map(formatListItem).filter((item): item is ListItem => item !== null)
    : [];

  return {
    ...formattedList, // Spread formatted list base details
    items: formattedItems, // Add formatted items
    // Ensure item_count from response data is used if available, otherwise fallback
    item_count: typeof response.data.item_count === 'number' ? response.data.item_count : formattedItems.length,
  };
};

// Creates a new list
const createList = async (listData: CreateListData): Promise<List> => {
   // Basic validation (can add more)
   if (!listData || !listData.name || String(listData.name).trim() === '') {
       throw new Error('List name is required for creation.');
   }
   // Prepare payload, ensuring defaults and array format for tags
   const payload: CreateListData = {
       ...listData,
       is_public: listData.is_public ?? true,
       tags: Array.isArray(listData.tags) ? listData.tags.map(String) : [], // Ensure strings
       list_type: listData.list_type || 'mixed', // Ensure type default
   };
    // Expecting { data: List }
   const response = await apiClient<any>('/api/lists', 'ListService Create', {
       method: 'POST',
       body: JSON.stringify(payload),
   });

   const formatted = formatList(response.data);
   if (!formatted) {
       throw new Error('Received invalid data after creating list.');
   }
   // Return formatted list, ensuring item_count is 0 for new lists
   return { ...formatted, item_count: 0 };
};

// Adds an item to a specific list
const addItemToList = async (listId: number | string, itemData: AddItemData): Promise<AddItemResult> => {
   if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
       throw new Error('List ID, numerical Item ID, and Item Type are required.');
   }
   const endpoint = `/api/lists/${encodeURIComponent(listId)}/items`;
   const payload = { item_id: itemData.item_id, item_type: itemData.item_type };

   // Expecting { data: { message: string; item: object } }
   const response = await apiClient<AddItemResult>(endpoint, 'ListService Add Item', {
       method: 'POST',
       body: JSON.stringify(payload),
   });
   // apiClient handles response structure, check if data is present
   if (!response.data?.message || !response.data?.item) {
       throw new Error('Invalid response format after adding item.');
   }
   return response.data;
};

// Removes an item from a specific list
const removeItemFromList = async (listId: number | string, listItemId: number | string): Promise<{ success: boolean }> => {
    if (!listId || !listItemId) {
        throw new Error('List ID and List Item ID are required.');
    }
    const endpoint = `/api/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(listItemId)}`;
    // Expecting 204 No Content, apiClient returns { success: true }
    const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Remove Item', {
        method: 'DELETE',
    });
    return { success: response?.success ?? false }; // Return explicit success boolean
};

// Toggles the follow status of a list for the current user
const toggleFollow = async (listId: number | string): Promise<FollowToggleResponse> => {
    if (!listId) throw new Error('List ID is required.');
    const endpoint = `/api/lists/${encodeURIComponent(listId)}/follow`;

    // Expecting { data: FollowToggleResponse }
    const response = await apiClient<FollowToggleResponse>(endpoint, 'ListService Toggle Follow', {
        method: 'POST',
        headers: { // Add cache-control headers to ensure fresh data
             'Cache-Control': 'no-cache, no-store, must-revalidate',
             'Pragma': 'no-cache',
             'Expires': '0',
         },
    });
     // Check required fields in the response data
     if (!response.data || typeof response.data.id === 'undefined' || typeof response.data.is_following !== 'boolean') {
        throw new Error('Invalid response format after toggling follow.');
     }
    // No need to format here, model returns necessary fields
    return response.data;
};

// Updates the visibility (public/private) of a list
const updateVisibility = async (listId: number | string, visibilityData: UpdateVisibilityData): Promise<List> => {
    if (!listId || typeof visibilityData?.is_public !== 'boolean') {
        throw new Error("List ID and a boolean 'is_public' flag are required.");
    }
    const endpoint = `/api/lists/${encodeURIComponent(listId)}/visibility`;
    const payload = { is_public: visibilityData.is_public };

    // Expecting { data: List }
    const response = await apiClient<any>(endpoint, 'ListService Update Visibility', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    const formatted = formatList(response.data); // Format the returned list data
    if (!formatted) {
        throw new Error('Received invalid data after updating visibility.');
    }
    return formatted;
};

// Deletes a list
const deleteList = async (listId: number | string): Promise<{ success: boolean }> => {
    if (!listId) throw new Error('List ID is required.');
    const endpoint = `/api/lists/${encodeURIComponent(listId)}`;
    // Expecting 204 No Content, apiClient returns { success: true }
    const response = await apiClient<{ success?: boolean }>(endpoint, 'ListService Delete List', {
        method: 'DELETE',
    });
    return { success: response?.success ?? false };
};


// Export the typed service object
export const listService = {
    getLists,
    getListDetails,
    createList,
    addItemToList,
    removeItemFromList,
    toggleFollow,
    updateVisibility,
    deleteList, // Added deleteList
};