import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { listService } from '@/services/listService';
import { queryClient } from '@/queryClient';

const useUserListStore = create(
    devtools(
        (set, get) => ({
            userLists: [],
            isAddingToList: false,
            isRemovingItem: null,
            isUpdatingVisibility: null,
            isLoading: false,
            error: null,

            clearError: () => set({ error: null }),

            fetchUserLists: async () => {
                set({ isLoading: true, error: null });
                try {
                    const lists = await listService.getLists({ createdByUser: true });
                    set({ userLists: lists, isLoading: false });
                    return lists;
                } catch (err) {
                    console.error('[UserListStore] Error fetching user lists:', err);
                    const message = err.response?.data?.error || err.message || 'Failed to fetch user lists';
                    set({ userLists: [], isLoading: false, error: message });
                    throw new Error(message);
                }
            },

            addToList: async ({ item, listId, createNew = false, listData = {} }) => {
                if (!item && !createNew) throw new Error('Item or createNew flag is required.');
                set({ isAddingToList: true, error: null });
                try {
                    let targetListId = listId;
                    let listType = null;

                    if (createNew) {
                        const newList = await listService.createList({
                            name: listData.name,
                            description: listData.description,
                            is_public: listData.is_public,
                            tags: listData.tags,
                            type: item?.type || listData.type || 'mixed',
                        });
                        if (!newList || !newList.id) throw new Error('Failed to create new list.');
                        targetListId = newList.id;
                        listType = newList.type || item?.type || 'mixed';
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                        queryClient.invalidateQueries({ queryKey: ['quickAddUserLists'] });
                    } else {
                        const list = get().userLists.find(l => l.id === listId);
                        listType = list?.type || 'mixed';
                        if (item && listType !== 'mixed' && item.type !== listType) {
                            throw new Error(`Cannot add a ${item.type} to a ${listType} list.`);
                        }
                    }

                    let addedItemData = null;
                    if (item && item.id && item.type && targetListId) {
                        addedItemData = await listService.addItemToList(targetListId, { item_id: item.id, item_type: item.type });
                        queryClient.invalidateQueries({ queryKey: ['listDetails', targetListId] });
                        queryClient.invalidateQueries({ queryKey: ['userLists'] });
                        queryClient.invalidateQueries({ queryKey: ['quickAddUserLists'] });
                    }

                    if (createNew) {
                        const updatedLists = await listService.getLists({ createdByUser: true });
                        set({ userLists: updatedLists });
                    }

                    set({ isAddingToList: false });
                    return { success: true, listId: targetListId, addedItem: addedItemData };
                } catch (err) {
                    console.error('[UserListStore] Error in addToList:', err);
                    const message = err.response?.data?.error || err.message || 'Operation failed';
                    set({ isAddingToList: false, error: message });
                    throw new Error(message);
                }
            },

            removeFromList: async (listId, listItemId) => {
                if (!listId || !listItemId) throw new Error('List ID and List Item ID are required.');
                set({ isRemovingItem: listItemId, error: null });
                try {
                    await listService.removeItemFromList(listId, listItemId);
                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                    queryClient.invalidateQueries({ queryKey: ['userLists'] });
                    queryClient.invalidateQueries({ queryKey: ['quickAddUserLists'] });
                    set({ isRemovingItem: null });
                    return true;
                } catch (err) {
                    console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, err);
                    const message = err.response?.data?.error || err.message || 'Failed to remove item';
                    set({ isRemovingItem: null, error: message });
                    throw new Error(message);
                }
            },

            // ... (rest unchanged)
        }),
        { name: 'UserListStore' }
    )
);

export default useUserListStore;