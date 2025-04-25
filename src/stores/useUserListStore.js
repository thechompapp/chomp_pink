/* src/stores/useUserListStore.js */
/* REMOVED: All TypeScript syntax */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import listService from '@/services/listService.js'; // Use default import
import { queryClient } from '@/queryClient';

const useUserListStore = create()(
    devtools(
        (set, get) => ({
            userLists: [],
            isAddingToList: false,
            isRemovingItem: null,
            isUpdatingVisibility: null,
            isLoading: false,
            error: null,

            clearError: () => set({ error: null }),

            fetchUserLists: async (options = { createdByUser: true }) => {
                if (get().isLoading) return get().userLists;

                console.log('[UserListStore] Fetching user lists with options:', options);
                set({ isLoading: true, error: null });

                try {
                    const lists = await listService.getLists(options);

                    set({ userLists: lists || [], isLoading: false });

                    const queryKey = ['userLists', options.followedByUser ? 'followed' : 'created'];
                    queryClient.setQueryData(queryKey, lists);

                    console.log(`[UserListStore] Successfully fetched ${lists?.length || 0} lists.`);
                    return lists || [];
                } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to fetch user lists';
                    console.error('[UserListStore] Error fetching user lists:', message);
                    set({ isLoading: false, error: message });
                    throw new Error(message);
                }
            },

            addToList: async ({ item, listId, createNew = false, listData = {} }) => {
                 const validItem = item && typeof item.id === 'number' && item.type ? { id: item.id, type: item.type } : null;
                 if (!createNew && !validItem) {
                     const errorMsg = 'Valid item data (ID and type) is required when adding to an existing list.';
                     set({ isAddingToList: false, error: errorMsg });
                     throw new Error(errorMsg);
                 }

                 if (createNew && (!listData.name || !listData.list_type)) {
                     const errorMsg = 'List name and type are required when creating a new list.';
                     set({ isAddingToList: false, error: errorMsg });
                     throw new Error(errorMsg);
                 }

                 if (!createNew && !listId) {
                      const errorMsg = "List ID is required when not creating a new list.";
                      set({ isAddingToList: false, error: errorMsg });
                      throw new Error(errorMsg);
                 }

                set({ isAddingToList: true, error: null });
                try {
                    let targetListId = listId ?? null;
                    let newListData = null;
                    let addedItemData = null;

                    if (createNew && listData.name && listData.list_type) {
                        const newList = await listService.createList({
                            name: listData.name,
                            list_type: listData.list_type,
                            is_public: listData.is_public !== undefined ? listData.is_public : true,
                            description: listData.description || null,
                        });
                        if (!newList || !newList.id) {
                            throw new Error('Failed to create new list or received invalid response.');
                        }
                        targetListId = newList.id;
                        newListData = { ...newList, item_count: 0 };

                         set(state => ({
                            userLists: [...(state.userLists || []), newListData],
                         }));
                         queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    }

                    if (validItem && targetListId) {
                        const addItemResult = await listService.addItemToList(targetListId, { item_id: validItem.id, item_type: validItem.type });

                        if (!addItemResult?.success || !addItemResult?.item?.id) {
                             throw new Error(addItemResult?.message || 'Failed to add item or received invalid response.');
                        }
                        addedItemData = addItemResult.item;

                        set(state => ({
                           userLists: state.userLists.map(l =>
                               String(l.id) === String(targetListId) ? { ...l, item_count: (l.item_count || 0) + 1 } : l
                           )
                        }));
                        queryClient.invalidateQueries({ queryKey: ['listDetails', String(targetListId)] });
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    }

                    let message = '';
                    if (newListData && addedItemData) message = 'List created and item added successfully.';
                    else if (newListData) message = 'List created successfully.';
                    else if (addedItemData) message = 'Item added successfully.';
                    else message = 'Operation completed (no item added).';

                    set({ isAddingToList: false });
                    return {
                         success: true,
                         listId: targetListId,
                         message: message,
                         createdList: newListData,
                         addedItem: addedItemData
                     };
                } catch (err) {
                    const message = err instanceof Error ? err.message : 'Operation failed';
                    console.error('[UserListStore] Error in addToList:', message);
                    set({ isAddingToList: false, error: message });
                    throw err;
                }
            },

            removeFromList: async (listId, listItemId) => {
                if (!listId || !listItemId) throw new Error('List ID and List Item ID required.');
                set({ isRemovingItem: Number(listItemId), error: null });
                try {
                    const result = await listService.removeItemFromList(listId, listItemId);
                    if (!result?.success) throw new Error(result?.message || "Remove item request failed via service.");

                    queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });

                     set(state => ({
                        userLists: state.userLists.map(l =>
                            String(l.id) === String(listId) ? { ...l, item_count: Math.max(0, (l.item_count || 1) - 1) } : l
                        )
                    }));

                    set({ isRemovingItem: null });
                    return { success: true, message: result.message || "Item removed successfully." };
                } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to remove item';
                    console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, message);
                    set({ isRemovingItem: null, error: message });
                    throw err;
                }
            },
        }),
        { name: 'UserListStore' }
    )
);

export default useUserListStore;