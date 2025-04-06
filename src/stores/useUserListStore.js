// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { listService } from '@/services/listService';
import { queryClient } from '@/queryClient';

const useUserListStore = create(
    devtools(
        (set, get) => ({
            isAddingToList: false,
            isRemovingItem: null,
            isUpdatingVisibility: null,
            error: null,

            clearError: () => set({ error: null }),

            addToList: async ({ item, listId, createNew = false, listData = {} }) => {
                if (!item && !createNew) throw new Error("Item or createNew flag is required.");
                set({ isAddingToList: true, error: null });
                try {
                    let targetListId = listId;
                    if (createNew) {
                        const newList = await listService.createList({
                            name: listData.name,
                            description: listData.description,
                            is_public: listData.is_public,
                            tags: listData.tags,
                        });
                        if (!newList || !newList.id) throw new Error('Failed to create new list.');
                        targetListId = newList.id;
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                        queryClient.invalidateQueries({ queryKey: ['quickAddUserLists'] });
                    }

                    let addedItemData = null;
                    if (item && item.id && item.type && targetListId) {
                        addedItemData = await listService.addItemToList(targetListId, { item_id: item.id, item_type: item.type });
                        queryClient.invalidateQueries({ queryKey: ['listDetails', targetListId] });
                        queryClient.invalidateQueries({ queryKey: ['userLists'] });
                        queryClient.invalidateQueries({ queryKey: ['quickAddUserLists'] });
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
                if (!listId || !listItemId) throw new Error("List ID and List Item ID are required.");
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

            updateListVisibility: async (listId, isPublic) => {
                if (!listId || typeof isPublic !== 'boolean') throw new Error("List ID and visibility flag are required.");
                set({ isUpdatingVisibility: listId, error: null });
                try {
                    const updatedList = await listService.updateVisibility(listId, { is_public: isPublic });
                    if (!updatedList || updatedList.id !== listId) throw new Error("Invalid response from visibility update API.");
                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] });
                    set({ isUpdatingVisibility: null });
                    return updatedList;
                } catch (err) {
                    console.error(`[UserListStore] Error updating visibility for list ${listId}:`, err);
                    const message = err.response?.data?.error || err.message || 'Failed to update visibility';
                    set({ isUpdatingVisibility: null, error: message });
                    throw new Error(message);
                }
            },
        }),
        { name: 'UserListStore' }
    )
);

export default useUserListStore;