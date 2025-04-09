/* src/stores/useUserListStore.ts */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { listService } from '@/services/listService'; // Use typed service
import { queryClient } from '@/queryClient';
import type { List, AddItemPayload, AddItemResult } from '@/types/List'; // Import types

// Define State and Actions Interfaces
interface UserListState {
    userLists: List[];
    isAddingToList: boolean;
    isRemovingItem: number | null; // Store listItemId being removed
    isUpdatingVisibility: number | null; // Store listId being updated
    isLoading: boolean; // For initial list fetch
    error: string | null; // Store fetch/action errors
}

interface UserListActions {
    clearError: () => void;
    fetchUserLists: (options?: { createdByUser?: boolean; followedByUser?: boolean }) => Promise<List[]>; // Return fetched lists, accept options
    addToList: (payload: AddItemPayload) => Promise<AddItemResult>; // Ensure correct return type
    removeFromList: (listId: number | string, listItemId: number | string) => Promise<{ success: boolean }>; // Return structure from service
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
            isLoading: false, // Start not loading
            error: null,

            // Actions
            clearError: () => set({ error: null }),

            fetchUserLists: async (options = { createdByUser: true }) => {
                // Avoid refetch if already loading for the same type (basic check)
                if (get().isLoading) return get().userLists; // Maybe refine this later if needed

                console.log('[UserListStore] Fetching user lists with options:', options);
                set({ isLoading: true, error: null }); // Clear previous errors on new fetch

                try {
                    // listService returns typed List[] or throws an error
                    const lists = await listService.getLists(options);

                    set({ userLists: lists, isLoading: false });

                    // Update query cache for faster access elsewhere if needed
                    const queryKey = ['userLists', options.followedByUser ? 'followed' : 'created'];
                    queryClient.setQueryData(queryKey, lists);

                    console.log(`[UserListStore] Successfully fetched ${lists.length} lists.`);
                    return lists;
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Failed to fetch user lists';
                    console.error('[UserListStore] Error fetching user lists:', message);
                    // IMPORTANT: Set the error state and keep the list potentially empty
                    // Do not clear lists here, keep previous state if desired, or set empty based on requirements
                    set({ isLoading: false, error: message });
                    // Let the calling component handle the error state / empty list display
                    throw new Error(message); // Re-throw for callers (e.g., React Query if used elsewhere, or context)
                }
            },

            addToList: async ({ item, listId, createNew = false, listData = {} }) => {
                // Validate item structure only if adding an item (not just creating list)
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

                set({ isAddingToList: true, error: null }); // Clear previous errors
                try {
                    let targetListId: number | string | null = listId ?? null;
                    let targetListType: List['type'] | null = null;
                    let addedItemData: AddItemResult['item'] | null = null; // Initialize correctly

                    if (createNew && listData.name) {
                        // Ensure list type matches item type if provided, otherwise 'mixed'
                        const typeForNewList = validItem?.type || listData?.list_type || 'mixed';
                        const newList = await listService.createList({
                            ...listData, // Spread validated listData
                            list_type: typeForNewList, // Set determined type
                        });
                        if (!newList || !newList.id) throw new Error('Failed to create new list or received invalid response.');
                        targetListId = newList.id;
                        targetListType = newList.type;

                        // Update local store state immediately and invalidate query cache
                         set(state => ({ userLists: [...state.userLists, newList] })); // Add locally first
                         // Invalidate queries after successful creation
                         queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });

                    } else if (listId) {
                        // Find existing list type for validation (more efficient if lists are already fetched)
                        const list = get().userLists.find(l => String(l.id) === String(listId));
                        targetListType = list?.type || 'mixed'; // Default to mixed if list not found locally (might happen)
                    }

                    // Add item if it's valid and we have a target list ID
                    if (validItem && targetListId) {
                         // Check type compatibility before adding
                         if (targetListType !== 'mixed' && validItem.type !== targetListType) {
                             throw new Error(`Cannot add a ${validItem.type} to a list restricted to ${targetListType}s.`);
                         }

                        // Assuming addItemToList returns AddItemResult = { message: string, item: { id, list_id, item_id, item_type, added_at } }
                        const addItemResult = await listService.addItemToList(targetListId, { item_id: validItem.id, item_type: validItem.type });
                        if (!addItemResult?.item?.id) {
                             throw new Error(addItemResult?.message || 'Failed to add item or received invalid response.');
                        }
                        addedItemData = addItemResult.item;

                        // Invalidate the specific list detail and potentially user list counts
                        queryClient.invalidateQueries({ queryKey: ['listDetails', targetListId] });
                        // Re-fetch user lists to update counts (or update locally if counts are available)
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                        // Optionally update item count locally if possible
                        set(state => ({
                           userLists: state.userLists.map(l =>
                               l.id === targetListId ? { ...l, item_count: l.item_count + 1 } : l
                           )
                        }));

                    } else if (validItem && !targetListId && !createNew) {
                        // Case where item is valid but no list ID was provided or created
                        throw new Error("Cannot add item: No target list specified or created.");
                    }

                    set({ isAddingToList: false });
                    // Return structure matching AddItemResult
                     return {
                         success: true, // Indicate overall success
                         listId: targetListId, // The ID of the list affected/created
                         message: createNew ? 'List created successfully' : (addedItemData ? 'Item added successfully' : 'Operation successful'),
                         item: addedItemData // The added item details if applicable
                     };

                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Operation failed';
                    console.error('[UserListStore] Error in addToList:', message);
                    set({ isAddingToList: false, error: message });
                    throw err; // Re-throw for UI/hook
                }
            },

            removeFromList: async (listId, listItemId) => {
                if (!listId || !listItemId) throw new Error('List ID and List Item ID required.');
                set({ isRemovingItem: Number(listItemId), error: null }); // Store ID being removed, clear error
                try {
                    // listService returns { success: boolean }
                    const result = await listService.removeItemFromList(listId, listItemId);
                    if (!result.success) throw new Error("Remove item request failed via service.");

                    // Invalidate caches on success
                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                     // Re-fetch user lists to update counts (or update locally)
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    // Optionally update item count locally if possible
                    set(state => ({
                        userLists: state.userLists.map(l =>
                            l.id === listId ? { ...l, item_count: Math.max(0, l.item_count - 1) } : l
                        )
                    }));

                    set({ isRemovingItem: null });
                    return { success: true }; // Return success object
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Failed to remove item';
                    console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, message);
                    set({ isRemovingItem: null, error: message });
                    throw err; // Re-throw for UI
                }
            },

        }),
        { name: 'UserListStore' } // Devtools name
    )
);

export default useUserListStore;