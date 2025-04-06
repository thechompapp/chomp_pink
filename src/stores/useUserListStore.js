// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; // Removed persist
import { listService } from '@/services/listService';
import { queryClient } from '@/queryClient';

// Helper functions (Keep as is)
const ensureArray = (arr) => Array.isArray(arr) ? arr : [];

const useUserListStore = create(
    devtools(
        (set, get) => ({
            // State: Removed persisted state, now relies on React Query primarily
            // We might still keep a simple error/loading state for actions
            isAddingToList: false,
            isRemovingItem: null, // Store the ID of the item being removed
            isTogglingFollow: null, // Store the ID of the list being followed/unfollowed
            isUpdatingVisibility: null, // Store the ID of the list being updated
            error: null, // Action-specific error

            // Actions
            clearError: () => set({ error: null }),

            // Note: fetchUserLists is now primarily handled by useQuery in MyLists.jsx
            // This store focuses on MUTATIONS (add, remove, follow, visibility)

            addToList: async ({ item, listId, createNew = false, listData = {} }) => {
                if (!item && !createNew) throw new Error("Item or createNew flag is required.");
                set({ isAddingToList: true, error: null });
                try {
                    let targetListId = listId;
                    if (createNew) {
                        const newList = await listService.createList({
                            name: listData.name, description: listData.description,
                            is_public: listData.is_public, tags: listData.tags,
                        });
                        if (!newList || !newList.id) throw new Error('Failed to create new list.');
                        targetListId = newList.id;
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    }

                    let addedItemData = null;
                    if (item && item.id && item.type && targetListId) {
                        addedItemData = await listService.addItemToList(targetListId, { item_id: item.id, item_type: item.type });
                        queryClient.invalidateQueries({ queryKey: ['listDetails', targetListId] });
                        queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Both created and followed might need update if count is shown
                    }

                    set({ isAddingToList: false });
                    return { success: true, listId: targetListId, addedItem: addedItemData };
                } catch (err) {
                    console.error('[UserListStore] Error in addToList:', err);
                    const message = err.response?.data?.error || err.message || 'Operation failed';
                    set({ isAddingToList: false, error: message });
                    throw new Error(message); // Re-throw for component handling
                }
            },

            removeFromList: async (listId, listItemId) => {
                if (!listId || !listItemId) throw new Error("List ID and List Item ID are required.");
                set({ isRemovingItem: listItemId, error: null }); // Store ID being removed
                try {
                    await listService.removeItemFromList(listId, listItemId);
                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                    queryClient.invalidateQueries({ queryKey: ['userLists'] }); // If item counts shown in list view
                    set({ isRemovingItem: null });
                    return true;
                } catch (err) {
                    console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, err);
                     const message = err.response?.data?.error || err.message || 'Failed to remove item';
                    set({ isRemovingItem: null, error: message });
                    throw new Error(message); // Re-throw
                }
            },

            toggleFollow: async (listId) => { // Renamed for clarity
                 if (!listId) throw new Error("List ID required.");
                 set({ isTogglingFollow: listId, error: null }); // Store ID being toggled
                 try {
                     const updatedList = await listService.toggleFollow(listId);
                     if (!updatedList || typeof updatedList.id === 'undefined') {
                         throw new Error('Invalid response from follow toggle API');
                     }

                     // Invalidate queries - let React Query handle the state update
                     queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                     queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] }); // Invalidate specific keys
                     queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] }); // Invalidate specific keys
                     queryClient.invalidateQueries({ queryKey: ['trendingData'] }); // Trending lists might change
                     queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });

                     set({ isTogglingFollow: null });
                     return updatedList; // Return updated list data
                 } catch (err) {
                      console.error(`[UserListStore toggleFollow] Error toggling follow for ${listId}:`, err);
                      const message = err.response?.data?.error || err.message || 'Failed to toggle follow status';
                      set({ isTogglingFollow: null, error: message });
                      throw new Error(message); // Re-throw
                 }
            },

            updateListVisibility: async (listId, isPublic) => {
                if (!listId || typeof isPublic !== 'boolean') throw new Error("List ID and visibility flag are required.");
                set({ isUpdatingVisibility: listId, error: null }); // Store ID being updated
                try {
                    const updatedList = await listService.updateVisibility(listId, { is_public: isPublic });
                    if (!updatedList || updatedList.id !== listId) throw new Error("Invalid response from visibility update API.");

                    queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] }); // Update user's lists view

                    set({ isUpdatingVisibility: null });
                    return updatedList;
                } catch (err) {
                    console.error(`[UserListStore] Error updating visibility for list ${listId}:`, err);
                     const message = err.response?.data?.error || err.message || 'Failed to update visibility';
                    set({ isUpdatingVisibility: null, error: message });
                    throw new Error(message); // Re-throw
                }
            },

        }),
        { name: 'UserListStore' } // Devtools name
    )
);

export default useUserListStore;