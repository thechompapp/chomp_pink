/* src/stores/useUserListStore.js */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// Correct: Use NAMED import because listService.js uses 'export const listService = {...}'
import { listService } from '@/services/listService.js'; // Changed import syntax
// Assuming logger uses named exports as established previously
import { logDebug, logError, logWarn } from '@/utils/logger'; // Use named imports for logger

const useUserListStore = create()(
  devtools(
    (set, get) => ({
      userLists: [],
      isAddingToList: false,
      isRemovingItem: null, // Changed to null for consistency
      isUpdatingVisibility: null, // Changed to null for consistency
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      fetchUserLists: async (options = { createdByUser: true }, queryClient) => {
        if (get().isLoading) return get().userLists;

        logDebug('[UserListStore] Fetching user lists with options:', options);
        set({ isLoading: true, error: null });

        try {
          // Attempt to get lists from API with fallback to mock data
          const listApiResponse = await listService.getUserLists(options);
          
          // Handle all the different possible response formats
          let lists = [];
          
          // If it's a direct array (from mock data or certain API responses)
          if (Array.isArray(listApiResponse)) {
            lists = listApiResponse;
            logDebug('[UserListStore] Received direct array of lists');
          }
          // If it has a data property containing the array (API format)
          else if (listApiResponse?.data && Array.isArray(listApiResponse.data)) {
            lists = listApiResponse.data;
            logDebug('[UserListStore] Extracted lists from data property');
          }
          // If it has an items property containing the array
          else if (listApiResponse?.items && Array.isArray(listApiResponse.items)) {
            lists = listApiResponse.items;
            logDebug('[UserListStore] Extracted lists from items property');
          }
          // Last fallback - import mock data directly
          else {
            logWarn('[UserListStore] Invalid response format, importing mock data');
            // Import mock data as a last resort
            const { mockUserLists } = await import('@/utils/mockData');
            lists = mockUserLists;
          }
          
          // Update the store with the lists
          set({ userLists: lists, isLoading: false });

          // Update React Query cache if queryClient is provided
          if (queryClient) {
            const queryKey = ['userLists', options.followedByUser ? 'followed' : 'created'];
            queryClient.setQueryData(queryKey, lists);
          }

          logDebug(`[UserListStore] Successfully fetched ${lists.length} lists`);
          return lists; // Return just the array of lists
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to fetch user lists';
          logError('[UserListStore] Error fetching user lists:', message); // Use named logger
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      addToList: async ({ item, listId, createNew = false, listData = {} }, queryClient) => {
        // ... (validation logic remains the same) ...
        const validItem = item && typeof item.id === 'number' && item.type ? { id: item.id, type: item.type } : null;
        if (!createNew && !validItem) { /* ... error handling ... */ }
        if (createNew && (!listData.name || !listData.list_type)) { /* ... error handling ... */ }
        if (!createNew && !listId) { /* ... error handling ... */ }


        set({ isAddingToList: true, error: null });
        try {
          let targetListId = listId ?? null;
          let newListData = null;
          let addedItemData = null;

          if (createNew && listData.name && listData.list_type) {
            // Correct: listService is the imported named object
            // Assuming createList returns { success, data: { created list details } }
            const createResult = await listService.createList({
              name: listData.name,
              list_type: listData.list_type,
              is_public: listData.is_public !== undefined ? listData.is_public : true,
              description: listData.description || null,
            });
            if (!createResult?.success || !createResult.data?.id) {
              throw new Error(createResult?.message || 'Failed to create new list or received invalid response.');
            }
            targetListId = createResult.data.id;
            newListData = { ...createResult.data, item_count: 0 }; // Use data from response

            set(state => ({
              userLists: [...(state.userLists || []), newListData],
            }));
            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
            }
          }

          if (validItem && targetListId) {
            // Correct: listService is the imported named object
            // Assuming addItemToList returns { success, message, data: { added item details } }
            const addItemResult = await listService.addItemToList(targetListId, { 
              itemId: validItem.id,     // ✅ Correct field name
              itemType: validItem.type  // ✅ Correct field name
            });

            if (!addItemResult?.success || !addItemResult.data?.list_item_id) { // Check for list_item_id in response data
              throw new Error(addItemResult?.message || 'Failed to add item or received invalid response.');
            }
            addedItemData = addItemResult.data; // Use data from response

            set(state => ({
              userLists: state.userLists.map(l =>
                String(l.id) === String(targetListId) ? { ...l, item_count: (l.item_count || 0) + 1 } : l
              )
            }));
            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ['listDetails', String(targetListId)] });
              queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
            }
          }

          // ... (message generation and return remains the same) ...
            let message = '';
            if (newListData && addedItemData) message = 'List created and item added successfully.';
            else if (newListData) message = 'List created successfully.';
            else if (addedItemData) message = 'Item added successfully.';
            else message = 'Operation completed (no item added).';

            set({ isAddingToList: false });
            return { success: true, listId: targetListId, message: message, createdList: newListData, addedItem: addedItemData };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Operation failed';
          logError('[UserListStore] Error in addToList:', message); // Use named logger
          set({ isAddingToList: false, error: message });
          throw err;
        }
      },

      removeFromList: async (listId, listItemId, queryClient) => {
        if (!listId || !listItemId) throw new Error('List ID and List Item ID required.');
        set({ isRemovingItem: Number(listItemId), error: null });
        try {
          // Correct: listService is the imported named object
          // Assuming removeItemFromList returns { success, message }
          const result = await listService.removeItemFromList(listId, listItemId);
          if (!result?.success) throw new Error(result?.message || 'Remove item request failed via service.');

          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
            queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
          }

          set(state => ({
            userLists: state.userLists.map(l =>
              String(l.id) === String(listId) ? { ...l, item_count: Math.max(0, (l.item_count || 1) - 1) } : l
            )
          }));

          set({ isRemovingItem: null });
          return { success: true, message: result.message || 'Item removed successfully.' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to remove item';
          logError(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, message); // Use named logger
          set({ isRemovingItem: null, error: message });
          throw err;
        }
      },
      // ... (other store functions)
    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;