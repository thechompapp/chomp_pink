/* src/stores/useUserListStore.ts */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { listService } from '@/services/listService'; // Use typed service
import { queryClient } from '@/queryClient';
import type { List, ListItem, AddItemPayload } from '@/types/List'; // Import types

// Define State and Actions Interfaces
interface UserListState {
    userLists: List[];
    isAddingToList: boolean;
    isRemovingItem: number | null; // Store listItemId being removed
    isUpdatingVisibility: number | null; // Store listId being updated
    isLoading: boolean; // For initial list fetch
    error: string | null;
}

interface UserListActions {
    clearError: () => void;
    fetchUserLists: () => Promise<List[]>; // Return fetched lists
    addToList: (payload: AddItemPayload) => Promise<{ success: boolean; listId: number | string | null; addedItem?: any }>;
    removeFromList: (listId: number | string, listItemId: number | string) => Promise<boolean>;
    // Add other actions like updateVisibility if needed
}

type UserListStore = UserListState & UserListActions;

// Create the store with types
const useUserListStore = create<UserListStore>()(
    devtools(
        (set, get) => ({
            // Initial State
            userLists: [],
            isAddingToList: false,
            isRemovingItem: null,
            isUpdatingVisibility: null,
            isLoading: false,
            error: null,

            // Actions
            clearError: () => set({ error: null }),

            fetchUserLists: async () => {
                // Avoid refetch if already loading
                if (get().isLoading) return get().userLists;
                set({ isLoading: true, error: null });
                try {
                    // listService returns typed List[]
                    const lists = await listService.getLists({ createdByUser: true });
                    set({ userLists: lists, isLoading: false });
                    // Update query cache for faster access elsewhere if needed
                    queryClient.setQueryData(['userLists', 'created'], lists);
                    return lists;
                } catch (err: any) {
                    console.error('[UserListStore] Error fetching user lists:', err);
                    const message = err?.message || 'Failed to fetch user lists';
                    set({ userLists: [], isLoading: false, error: message });
                    throw new Error(message); // Re-throw for callers
                }
            },

            addToList: async ({ item, listId, createNew = false, listData = {} }) => {
                if (!item && !createNew) throw new Error('Item or createNew flag is required.');
                // Type guard for item
                const validItem = item && item.id && item.type ? { id: item.id, type: item.type } : null;

                set({ isAddingToList: true, error: null });
                try {
                    let targetListId: number | string | null = listId ?? null;
                    let targetListType: List['type'] | null = null;
                    let addedItemData: any = null; // Store result from addItemToList

                    if (createNew && listData.name) {
                        // Ensure list type matches item type if provided, otherwise 'mixed'
                        const typeForNewList = validItem?.type || listData?.list_type || 'mixed';
                        const newList = await listService.createList({
                            ...listData, // Spread validated listData
                            list_type: typeForNewList, // Set determined type
                        });
                        if (!newList || !newList.id) throw new Error('Failed to create new list.');
                        targetListId = newList.id;
                        targetListType = newList.type;
                        // Invalidate queries after successful creation
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                        // Update local store state immediately
                        set(state => ({ userLists: [...state.userLists, newList] }));
                    } else if(listId) {
                        // Find existing list type for validation
                        const list = get().userLists.find(l => String(l.id) === String(listId)); // Compare as strings just in case
                        targetListType = list?.type || 'mixed';
                    } else if (!createNew) {
                        // Need listId if not creating new
                        throw new Error("List ID is required when not creating a new list.");
                    }


                    // Add item if provided and targetListId is known
                    if (validItem && targetListId) {
                         // Check type compatibility before adding
                         if (targetListType !== 'mixed' && validItem.type !== targetListType) {
                             throw new Error(`Cannot add a ${validItem.type} to a list restricted to ${targetListType}s.`);
                         }
                        // Assuming addItemToList returns { message: string, item: any }
                        const addItemResult = await listService.addItemToList(targetListId, validItem);
                        addedItemData = addItemResult.item;
                        // Invalidate the specific list detail and potentially user list counts
                        queryClient.invalidateQueries({ queryKey: ['listDetails', targetListId] });
                        queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Invalidate counts etc.
                    }

                    set({ isAddingToList: false });
                    return { success: true, listId: targetListId, addedItem: addedItemData };

                } catch (err: any) {
                    console.error('[UserListStore] Error in addToList:', err);
                    const message = err?.message || 'Operation failed';
                    set({ isAddingToList: false, error: message });
                    throw new Error(message); // Re-throw for UI
                }
            },

            removeFromList: async (listId, listItemId) => {
                if (!listId || !listItemId) throw new Error('List ID and List Item ID required.');
                set({ isRemovingItem: Number(listItemId), error: null }); // Store ID being removed
                try {
                    // listService returns { success: boolean }
                    const result = await listService.removeItemFromList(listId, listItemId);
                    if (!result.success) throw new Error("Remove item request failed.");

                    // Invalidate caches on success
                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                    queryClient.invalidateQueries({ queryKey: ['userLists'] }); // For item counts

                    set({ isRemovingItem: null });
                    return true;
                } catch (err: any) {
                    console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, err);
                    const message = err?.message || 'Failed to remove item';
                    set({ isRemovingItem: null, error: message });
                    throw new Error(message); // Re-throw for UI
                }
            },

        }),
        { name: 'UserListStore' } // Devtools name
    )
);

export default useUserListStore;