/* src/services/listService.js */
/* REFACTORED: Let apiClient handle and propagate standardized errors */
import apiClient from '@/services/apiClient.js';
// REMOVED: ApiError import, as we rely on apiClient's rejection format

// --- Formatters remain the same ---
const formatList = (list) => { /* ... content from previous version ... */ if (!list || typeof list.id !== 'number' || typeof list.name !== 'string') { return null; } const itemCount = Array.isArray(list.items) ? list.items.length : Number(list.item_count ?? 0); const savedCount = Number(list.saved_count ?? 0); const listType = list.list_type || list.type || 'mixed'; if (listType !== 'restaurant' && listType !== 'dish' && listType !== 'mixed') { console.warn(`[formatList] Invalid list_type '${listType}' found for list ID ${list.id}. Defaulting to mixed.`); listType = 'mixed'; } const formatted = { id: Number(list.id), name: list.name, description: list.description ?? null, type: listType, list_type: listType, saved_count: !isNaN(savedCount) ? savedCount : 0, item_count: !isNaN(itemCount) ? itemCount : 0, city: list.city_name || list.city || null, tags: Array.isArray(list.tags) ? list.tags.filter(t => typeof t === 'string' && !!t) : [], is_public: typeof list.is_public === 'boolean' ? list.is_public : true, is_following: !!list.is_following, created_by_user: !!list.created_by_user, user_id: list.user_id ? Number(list.user_id) : null, creator_handle: list.creator_handle ?? null, created_at: list.created_at, updated_at: list.updated_at, city_name: list.city_name ?? list.city ?? null, }; if (typeof formatted.id !== 'number' || typeof formatted.name !== 'string') return null; return formatted; };
const formatListItem = (item) => { /* ... content from previous version ... */ if (!item || typeof item.list_item_id !== 'number' || (item.item_id == null && item.id == null) || typeof item.item_type !== 'string') { console.warn('[formatListItem] Invalid input:', item); return null; } const itemId = item.item_id ?? item.id; if (itemId == null) return null; if (item.item_type !== 'restaurant' && item.item_type !== 'dish') { console.warn('[formatListItem] Invalid item_type found:', item.item_type); return null; } const formatted = { list_item_id: Number(item.list_item_id), id: Number(itemId), item_id: Number(itemId), item_type: item.item_type, name: item.name || `Item ${itemId}`, notes: item.notes || null, restaurant_name: item.restaurant_name ?? null, added_at: item.added_at, city: item.city ?? null, neighborhood: item.neighborhood ?? null, tags: Array.isArray(item.tags) ? item.tags.filter(t => typeof t === 'string' && !!t) : [], restaurant_id: item.item_type === 'restaurant' ? Number(itemId) : (item.restaurant_id ? Number(item.restaurant_id) : null), dish_id: item.item_type === 'dish' ? Number(itemId) : null, }; return formatted; };
// --- End Formatters ---

// --- Service Functions ---

const listService = {
    // Example: getUserLists (used by MyLists.jsx with React Query)
    // React Query handles errors, so just return the promise from apiClient
    getUserLists: async (params = {}) => {
        const { view = 'created', page = 1, limit = 12 } = params;
        // Construct query parameters
        const queryParams = new URLSearchParams({
            view: view,
            page: String(page),
            limit: String(limit),
        }).toString();
        const endpoint = `/api/lists?${queryParams}`;
        const context = `ListService GetUserLists (view: ${view}, page: ${page})`;

        // Make the call and return the result directly (apiClient handles success/error structure)
        // The { success: true, data: [], pagination: {}, ... } structure comes from the backend
        // The error structure { message, status, errorDetails } comes from apiClient interceptor on failure
        return apiClient(endpoint, context);
    },

    getListDetails: async (listId) => {
        if (!listId) {
            // Throw simple error for invalid input before API call
            throw new Error('List ID is required');
        }
        const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
        const context = `ListService Details ${listId}`;

        // Let apiClient handle the call and potential errors
        const response = await apiClient(endpoint, context);

        // Assuming backend sends { success: true, data: { list details + items }, ... }
        // or apiClient rejects with { message, status, ... }
        if (response.success && response.data) {
            // Format the data before returning it to the component
            const formattedList = formatList(response.data); // Assuming raw data structure matches formatter
            if (!formattedList) {
                console.error(`[${context}] Failed to format base list data:`, response.data);
                throw new Error('Failed to process list details'); // Throw if formatting fails
            }
            const rawItems = response.data.items; // Adjust based on actual backend response structure
            formattedList.items = Array.isArray(rawItems)
                ? rawItems.map(formatListItem).filter(item => item !== null)
                : [];

            // Return the structured, formatted data expected by the component
            // Encapsulate within a 'data' property to mimic original structure if needed by component
            return { data: formattedList };
        } else {
            // This case should ideally not be reached if apiClient rejects properly
            // If it does, throw a generic error
            throw new Error(response.error || 'Failed to fetch list details');
        }
        // Removed try/catch - let React Query handle API call errors
    },

    createList: async (listData) => {
        if (!listData || !listData.name || String(listData.name).trim() === '') {
            throw new Error('List name is required for creation');
        }
        const payload = {
            name: listData.name.trim(),
            description: listData.description?.trim() || null,
            is_public: listData.is_public ?? true,
            tags: Array.isArray(listData.tags) ? listData.tags.map(String).filter(Boolean) : [],
            list_type: listData.list_type || 'mixed',
            city_name: listData.city_name?.trim() || null,
        };

        const response = await apiClient('/api/lists', 'ListService Create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Assuming backend sends { success: true, data: { created list }, ... }
        if (response.success && response.data) {
             const formatted = formatList(response.data);
             if (!formatted) {
                  console.error('[ListService Create] Failed to format response data:', response.data);
                 throw new Error('Failed to process created list data');
             }
             // Ensure component expects the list directly, not nested under 'data' unless necessary
             return formatted; // Return formatted list
        } else {
             throw new Error(response.error || 'Received invalid data after creating list');
        }
        // Removed try/catch
    },

    addItemToList: async (listId, itemData) => {
        if (!listId || !itemData || typeof itemData.item_id !== 'number' || !itemData.item_type) {
            throw new Error('List ID, numerical Item ID, and Item Type are required');
        }
        const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items`;
        const payload = {
            item_id: itemData.item_id,
            item_type: itemData.item_type,
            notes: itemData.notes || null // Include notes
        };

        // Let apiClient handle call and errors
        const response = await apiClient(endpoint, 'ListService Add Item', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        // Assuming backend returns { success: true, data: { message: '...', item: { added item } }, ... }
        if (response.success && response.data?.item) {
             const formattedItem = formatListItem(response.data.item);
             if (!formattedItem) {
                  console.error('[ListService Add Item] Failed to format added item data:', response.data.item);
                  throw new Error('Failed to process added item data');
             }
             // Return object with message and formatted item
             return { message: response.data.message || 'Item added', item: formattedItem };
        } else {
             throw new Error(response.error || 'Failed to add item to list');
        }
        // Removed try/catch
    },

    removeListItem: async (listId, listItemId) => {
        if (!listId || !listItemId) {
            throw new Error('List ID and List Item ID are required');
        }
        const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/items/${encodeURIComponent(String(listItemId))}`;

        // Let apiClient handle call and errors
        // Expects 204 No Content on success from backend, apiClient should handle this (e.g., resolve with { success: true })
        const response = await apiClient(endpoint, 'ListService Remove Item', {
            method: 'DELETE',
        });

        // Check if apiClient indicates success (even with no body)
        if (response.success) {
            return { success: true }; // Return simple success object
        } else {
            throw new Error(response.error || `Failed to remove item ${listItemId}`);
        }
        // Removed try/catch
    },

    toggleFollow: async (listId) => {
        if (!listId) throw new Error('List ID is required');
        const endpoint = `/api/lists/${encodeURIComponent(String(listId))}/follow`;

        // Let apiClient handle call and errors
        const response = await apiClient(endpoint, 'ListService Toggle Follow', {
            method: 'POST',
        });

        // Assuming backend sends { success: true, data: { is_following, saved_count, ... } }
        if (response.success && response.data) {
             // Return the data part containing follow status, count etc.
            return response.data;
        } else {
             throw new Error(response.error || 'Failed to toggle follow status');
        }
        // Removed try/catch
    },

    updateList: async (listId, listData) => {
        if (!listId) throw new Error('List ID required for update.');
        if (Object.keys(listData).length === 0) throw new Error('No update data provided.');

        const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;
        const payload = { ...listData }; // Prepare payload
        // Ensure tags are handled correctly if needed
        if (payload.tags && typeof payload.tags === 'string') {
            payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (payload.hasOwnProperty('is_public')) {
            payload.is_public = !!payload.is_public;
        }

        const response = await apiClient(endpoint, `ListService Update ${listId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (response.success && response.data) {
            const formatted = formatList(response.data);
            if (!formatted) {
                 console.error('[ListService Update] Failed to format response data:', response.data);
                throw new Error('Failed to process updated list data');
            }
            return formatted; // Return formatted list
        } else {
            throw new Error(response.error || 'Failed to update list');
        }
    },

    deleteList: async (listId) => {
        if (!listId) throw new Error('List ID is required');
        const endpoint = `/api/lists/${encodeURIComponent(String(listId))}`;

        // Let apiClient handle call and potential errors (e.g., 404, 403)
        // Expects 204 No Content on success from backend
        const response = await apiClient(endpoint, 'ListService Delete List', {
            method: 'DELETE',
        });

         if (response.success) {
            return { success: true }; // Indicate success
        } else {
            throw new Error(response.error || `Failed to delete list ${listId}`);
        }
        // Removed try/catch
    },
};

// Export as a service object
export default listService;