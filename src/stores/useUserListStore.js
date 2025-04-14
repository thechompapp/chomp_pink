/* src/stores/useUserListStore.js */
/* REMOVED: All TypeScript syntax */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { listService } from '@/services/listService'; // Use JS service
import { queryClient } from '@/queryClient';
// REMOVED: import type { List, AddItemPayload, AddItemResult } from '@/types/List';

// REMOVED: Define State and Actions Interfaces
// REMOVED: interface UserListState { ... }
// REMOVED: interface UserListActions { ... }
// REMOVED: type UserListStore = UserListState & UserListActions;

// Create the store without types
const useUserListStore = create/*REMOVED: <UserListStore>*/()(
    devtools(
        (set, get) => ({
            // Initial State
            userLists: [],
            isAddingToList: false,
            isRemovingItem: null, // Store listItemId being removed
            isUpdatingVisibility: null, // Store listId being updated
            isLoading: false, // For initial list fetch
            error: null, // Store fetch/action errors

            // Actions
            clearError: () => set({ error: null }),

            fetchUserLists: async (options = { createdByUser: true }) => { // REMOVED: Type hints
                if (get().isLoading) return get().userLists;

                console.log('[UserListStore] Fetching user lists with options:', options);
                set({ isLoading: true, error: null });

                try {
                    const lists = await listService.getLists(options);

                    set({ userLists: lists || [], isLoading: false }); // Ensure lists is an array

                    const queryKey = ['userLists', options.followedByUser ? 'followed' : 'created'];
                    queryClient.setQueryData(queryKey, lists);

                    console.log(`[UserListStore] Successfully fetched ${lists?.length || 0} lists.`);
                    return lists || []; // Return fetched lists or empty array
                } catch (err/*REMOVED: : unknown*/) {
                    const message = err instanceof Error ? err.message : 'Failed to fetch user lists';
                    console.error('[UserListStore] Error fetching user lists:', message);
                    set({ isLoading: false, error: message });
                    throw new Error(message); // Re-throw for callers
                }
            },

            addToList: async ({ item, listId, createNew = false, listData = {} }) => { // REMOVED: Type hints
                 const validItem = item && typeof item.id === 'number' && item.type ? { id: item.id, type: item.type } : null;

                if (!createNew && !validItem) {
                    throw new Error('Valid item data (ID and type) is required when adding to an existing list.');
                }
                if (createNew && !listData.name) {
                    throw new Error('List name is required when creating a new list.');
                }
                if (!createNew && !listId) {
                     throw new Error("List ID is required when not creating a new list.");
                }

                set({ isAddingToList: true, error: null });
                try {
                    let targetListId/*REMOVED: : number | string | null*/ = listId ?? null;
                    let targetListType/*REMOVED: : List['type'] | null*/ = null;
                    let addedItemData/*REMOVED: : AddItemResult['item'] | null*/ = null;

                    if (createNew && listData.name) {
                        // Assume backend defaults to 'mixed' if type is missing, or enforce based on item
                        const typeForNewList = validItem?.type || listData?.list_type || 'mixed'; // Simplified logic
                        const newList = await listService.createList({
                            ...listData,
                            list_type: typeForNewList, // Pass determined type
                        });
                        if (!newList || !newList.id) throw new Error('Failed to create new list or received invalid response.');
                        targetListId = newList.id;
                        targetListType = newList.type; // Use type from response

                         set(state => ({ userLists: [...(state.userLists || []), newList] })); // Add locally
                         queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });

                    } else if (listId) {
                        const list = get().userLists.find(l => String(l.id) === String(listId));
                        targetListType = list?.type || 'mixed';
                    }

                    if (validItem && targetListId) {
                         // Backend should handle type compatibility check now
                        const addItemResult = await listService.addItemToList(targetListId, { item_id: validItem.id, item_type: validItem.type });
                        // Check the structure returned by the service
                        if (!addItemResult?.item?.id) {
                             throw new Error(addItemResult?.message || 'Failed to add item or received invalid response.');
                        }
                        addedItemData = addItemResult.item;

                        queryClient.invalidateQueries({ queryKey: ['listDetails', targetListId] });
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                        set(state => ({
                           userLists: state.userLists.map(l =>
                               l.id === targetListId ? { ...l, item_count: (l.item_count || 0) + 1 } : l // Increment count
                           )
                        }));

                    } else if (validItem && !targetListId && !createNew) {
                        throw new Error("Cannot add item: No target list specified or created.");
                    }

                    set({ isAddingToList: false });
                     return { // Return structure matching expectations
                         success: true,
                         listId: targetListId,
                         message: createNew ? 'List created successfully' : (addedItemData ? 'Item added successfully' : 'Operation successful'),
                         item: addedItemData // The added item details
                     };

                } catch (err/*REMOVED: : unknown*/) {
                    const message = err instanceof Error ? err.message : 'Operation failed';
                    console.error('[UserListStore] Error in addToList:', message);
                    set({ isAddingToList: false, error: message });
                    throw err; // Re-throw
                }
            },

            removeFromList: async (listId, listItemId) => { // REMOVED: Type hints
                if (!listId || !listItemId) throw new Error('List ID and List Item ID required.');
                set({ isRemovingItem: Number(listItemId), error: null });
                try {
                    const result = await listService.removeItemFromList(listId, listItemId);
                    // Assuming service throws on failure or returns { success: false }
                    if (!result?.success) throw new Error("Remove item request failed via service.");

                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    set(state => ({
                        userLists: state.userLists.map(l =>
                            l.id === listId ? { ...l, item_count: Math.max(0, (l.item_count || 0) - 1) } : l // Decrement count
                        )
                    }));

                    set({ isRemovingItem: null });
                    return { success: true };
                } catch (err/*REMOVED: : unknown*/) {
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