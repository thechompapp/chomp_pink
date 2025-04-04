// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient'; // Import the new client
// Remove useAuthStore import if only used for token (now handled by apiClient)

const useUserListStore = create(
  devtools(
    (set, get) => ({
      // --- State (remains the same) ---
      userLists: [], followedLists: [],
      isLoadingUser: false, isLoadingFollowed: false, errorUser: null, errorFollowed: null,
      isAddingToList: false, addToListError: null, isTogglingFollow: false, toggleFollowError: null,
      isUpdatingVisibility: false, updateVisibilityError: null, isRemovingItem: false, removeItemError: null,

      // --- Actions (updated to use apiClient) ---
      fetchUserLists: async () => {
        if (get().isLoadingUser) return;
        set({ isLoadingUser: true, errorUser: null });
        try {
          // Use apiClient, expect array back for GET lists
          const lists = await apiClient('/api/lists?createdByUser=true', 'Fetch User Lists') || [];
          set({ userLists: lists, isLoadingUser: false });
          return lists;
        } catch (error) {
          console.error('[UserListStore fetchUserLists] Error:', error);
          // apiClient handles logout on 401, just set local error state for others
          if (error.message !== 'Session expired or invalid. Please log in again.') {
            set({ userLists: [], errorUser: error.message, isLoadingUser: false });
          } else {
            set({ isLoadingUser: false, errorUser: error.message }); // Stop loading, maybe show error
          }
          // Optional: re-throw non-401 errors if components need to react further
          if (error.message !== 'Session expired or invalid. Please log in again.') throw error;
          return []; // Return empty on 401 after logout
        }
      },

      fetchFollowedLists: async () => {
        if (get().isLoadingFollowed) return;
        set({ isLoadingFollowed: true, errorFollowed: null });
        try {
          // Use apiClient, expect array back
          const lists = await apiClient('/api/lists?followedByUser=true', 'Fetch Followed Lists') || [];
          set({ followedLists: lists, isLoadingFollowed: false });
          return lists;
        } catch (error) {
          console.error('[UserListStore fetchFollowedLists] Error:', error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
            set({ followedLists: [], errorFollowed: error.message, isLoadingFollowed: false });
          } else {
             set({ isLoadingFollowed: false, errorFollowed: error.message });
          }
           if (error.message !== 'Session expired or invalid. Please log in again.') throw error;
          return [];
        }
       },

      addToList: async ({ item, listId, createNew = false, listData = null }) => {
        if (get().isAddingToList) return Promise.reject(new Error('Add to list operation already in progress.'));
        set({ isAddingToList: true, addToListError: null });
        try {
          let targetListId = listId; let createdList = null;
          // Create new list if requested
          if (createNew) {
            if (!listData || !listData.name) { throw new Error('List name is required for creation.'); }
            // Use apiClient for POST, expect created list object back
            createdList = await apiClient('/api/lists', 'Create List', { method: 'POST', body: JSON.stringify(listData) });
            targetListId = createdList?.id;
            if (!targetListId) { throw new Error('List creation failed (no ID returned).'); }
            // Add to local state optimistically
            const formattedList = { /* ... formatting ... */ };
            set((state) => ({ userLists: [...state.userLists, formattedList] }));
            if (!item || !item.id || !item.type) { set({ isAddingToList: false }); return createdList; }
          }
          // Add item to the target list
          if (!targetListId) { throw new Error('Target list ID is missing.'); }
          if (!item || !item.id || !item.type) { throw new Error('Item details missing or invalid for adding.'); }
          // Use apiClient for POST item, expect added item object or success message
          await apiClient(`/api/lists/${targetListId}/items`, 'Add Item to List', { method: 'POST', body: JSON.stringify({ item_id: item.id, item_type: item.type }) });
          set((state) => ({ /* ... optimistic update ... */ }));
          set({ isAddingToList: false });
          return createdList || { success: true, message: 'Item added successfully.' };
        } catch (error) {
          console.error('[UserListStore addToList] Error:', error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
            set({ addToListError: error.message, isAddingToList: false });
          } else {
            set({ isAddingToList: false }); // Stop loading on 401
          }
          throw error;
        }
      },

      removeFromList: async (listId, listItemId) => {
        set({ isRemovingItem: true, removeItemError: null });
        try {
          // Use apiClient for DELETE, expect { success: true } or similar
          await apiClient(`/api/lists/${listId}/items/${listItemId}`, 'Remove Item from List', { method: 'DELETE' });
          const updateCount = (list) => (list.id === listId ? { ...list, item_count: Math.max(0, (list.item_count || 0) - 1) } : list);
          set((state) => ({ userLists: state.userLists.map(updateCount), followedLists: state.followedLists.map(updateCount), isRemovingItem: false }));
          return true;
        } catch (error) {
          console.error(`[UserListStore removeFromList] Error:`, error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
            set({ removeItemError: error.message, isRemovingItem: false });
          } else {
            set({ isRemovingItem: false });
          }
          throw error;
        }
      },

      updateListVisibility: async (listId, isPublic) => {
        set({ isUpdatingVisibility: true, updateVisibilityError: null });
        try {
          // Use apiClient for PUT, expect updated list object
          const updatedList = await apiClient(`/api/lists/${listId}/visibility`, 'Update Visibility', { method: 'PUT', body: JSON.stringify({ is_public: isPublic }) });
          if (!updatedList || typeof updatedList.is_public === 'undefined') { throw new Error('Invalid response after updating visibility.'); }
          const updateVisibilityState = (list) => (list.id === listId ? { ...list, is_public: updatedList.is_public, updated_at: updatedList.updated_at } : list);
          set((state) => ({ userLists: state.userLists.map(updateVisibilityState), isUpdatingVisibility: false }));
          return true;
        } catch (error) {
          console.error(`[UserListStore updateListVisibility] Error:`, error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
            set({ updateVisibilityError: error.message, isUpdatingVisibility: false });
          } else {
            set({ isUpdatingVisibility: false });
          }
          throw error;
        }
      },

      toggleFollowList: async (listId) => {
         if (get().isTogglingFollow) return Promise.reject(new Error('Toggle follow already in progress.'));
         set({ isTogglingFollow: true, toggleFollowError: null });
         try {
           // Use apiClient for POST, expect updated list object
           const updatedList = await apiClient(`/api/lists/${listId}/follow`, 'Toggle Follow List', { method: 'POST' });
           if (!updatedList || typeof updatedList.is_following === 'undefined' || typeof updatedList.saved_count === 'undefined') { throw new Error('Invalid response after toggling follow.'); }
           const newFollowingState = updatedList.is_following; const newSavedCount = updatedList.saved_count;
           // Update state synchronously (logic remains complex but uses result from apiClient)
           set((state) => { /* ... synchronous state update logic ... */ });
           return updatedList;
         } catch (error) {
             console.error(`[UserListStore toggleFollow] Error:`, error);
             if (error.message !== 'Session expired or invalid. Please log in again.') {
                  set({ toggleFollowError: error.message, isTogglingFollow: false });
             } else {
                  set({ isTogglingFollow: false });
             }
            throw error;
         }
       },

    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;