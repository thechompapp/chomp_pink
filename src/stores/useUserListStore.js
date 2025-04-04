// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import { queryClient } from '@/main'; // Import the exported queryClient

const useUserListStore = create(
  devtools(
    (set, get) => ({
      // --- State ---
      userLists: [],
      followedLists: [],
      isLoadingUser: false,
      isLoadingFollowed: false,
      isAddingToList: false,
      isTogglingFollow: false,
      isUpdatingVisibility: false,
      isRemovingItem: false,
      error: null,

      // --- Actions ---
      clearError: () => set({ error: null }),

      fetchUserLists: async () => { /* ... action logic ... */ },
      fetchFollowedLists: async () => { /* ... action logic ... */ },

      addToList: async ({ item, listId, createNew = false, listData = null }) => {
        if (get().isAddingToList) return Promise.reject(new Error('Add to list operation already in progress.'));
        set({ isAddingToList: true, error: null });
        try {
          let targetListId = listId; let createdList = null;
          if (createNew) {
            // ... (create list logic using apiClient)
            createdList = await apiClient('/api/lists', 'Create List', { method: 'POST', body: JSON.stringify(listData) });
            targetListId = createdList?.id;
            if (!targetListId) { throw new Error('List creation failed (no ID returned).'); }
            const formattedList = { /* ... formatting ... */ };
            set((state) => ({ userLists: [...state.userLists, formattedList] }));
            // --- Invalidation for Create List ---
            queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
            console.log('[UserListStore] Invalidated user created lists query after creating new list.');
            // --- End Invalidation ---
            if (!item || !item.id || !item.type) { set({ isAddingToList: false }); return createdList; }
          }

          if (!targetListId) { throw new Error('Target list ID is missing.'); }
          if (!item || !item.id || !item.type) { throw new Error('Item details missing or invalid for adding.'); }
          await apiClient(`/api/lists/${targetListId}/items`, 'Add Item to List', { method: 'POST', body: JSON.stringify({ item_id: item.id, item_type: item.type }) });

          // --- Invalidation for Add Item ---
          if (!createNew && targetListId) {
             // Invalidate the specific list detail query
             queryClient.invalidateQueries({ queryKey: ['listDetails', String(targetListId)] }); // Ensure ID is string? Check key usage
             console.log(`[UserListStore] Invalidated list details query for list ${targetListId} after adding item.`);
             // Optimistic update for item count
             const updateCount = (list) => (list.id === targetListId ? { ...list, item_count: (list.item_count || 0) + 1 } : list);
             set((state) => ({
                 userLists: state.userLists.map(updateCount),
                 followedLists: state.followedLists.map(updateCount)
             }));
          }
          // --- End Invalidation ---

          set({ isAddingToList: false });
          return createdList || { success: true, message: 'Item added successfully.' };
        } catch (error) {
          // ... (error handling remains the same) ...
          console.error('[UserListStore addToList] Error:', error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
            set({ error: error.message, isAddingToList: false });
          } else {
            set({ isAddingToList: false, error: error.message });
          }
          throw error;
        }
      },

      removeFromList: async (listId, listItemId) => {
        if (get().isRemovingItem) return Promise.reject(new Error('Remove item operation already in progress.'));
        set({ isRemovingItem: true, error: null });
        try {
          await apiClient(`/api/lists/${listId}/items/${listItemId}`, 'Remove Item from List', { method: 'DELETE' });
          // --- Invalidation for Remove Item ---
          queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
          console.log(`[UserListStore] Invalidated list details query for list ${listId} after removing item.`);
          // --- End Invalidation ---
          const updateCount = (list) => (list.id === listId ? { ...list, item_count: Math.max(0, (list.item_count || 0) - 1) } : list);
          set((state) => ({ userLists: state.userLists.map(updateCount), followedLists: state.followedLists.map(updateCount), isRemovingItem: false }));
          return true;
        } catch (error) {
          // ... (error handling remains the same) ...
           console.error(`[UserListStore removeFromList] Error:`, error);
           if (error.message !== 'Session expired or invalid. Please log in again.') {
             set({ error: error.message, isRemovingItem: false });
           } else {
             set({ isRemovingItem: false, error: error.message });
           }
           throw error;
        }
      },

      updateListVisibility: async (listId, isPublic) => {
        if (get().isUpdatingVisibility) return Promise.reject(new Error('Visibility update already in progress.'));
        set({ isUpdatingVisibility: true, error: null });
        try {
          const updatedList = await apiClient(`/api/lists/${listId}/visibility`, 'Update Visibility', { method: 'PUT', body: JSON.stringify({ is_public: isPublic }) });
          if (!updatedList || typeof updatedList.is_public === 'undefined') { throw new Error('Invalid response after updating visibility.'); }
          // --- Invalidation for Visibility Change ---
          // Invalidate both list detail and the main user lists query as visibility affects where it might show up
          queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
          queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] }); // User's own lists
          console.log(`[UserListStore] Invalidated queries for list ${listId} after visibility change.`);
          // --- End Invalidation ---
          const updateVisibilityState = (list) => (list.id === listId ? { ...list, is_public: updatedList.is_public, updated_at: updatedList.updated_at } : list);
          set((state) => ({ userLists: state.userLists.map(updateVisibilityState), isUpdatingVisibility: false }));
          return true;
        } catch (error) {
          // ... (error handling remains the same) ...
           console.error(`[UserListStore updateListVisibility] Error:`, error);
           if (error.message !== 'Session expired or invalid. Please log in again.') {
             set({ error: error.message, isUpdatingVisibility: false });
           } else {
             set({ isUpdatingVisibility: false, error: error.message });
           }
           throw error;
        }
      },

      toggleFollowList: async (listId) => {
         if (get().isTogglingFollow) return Promise.reject(new Error('Toggle follow already in progress.'));
         set({ isTogglingFollow: true, error: null });
         try {
           const updatedList = await apiClient(`/api/lists/${listId}/follow`, 'Toggle Follow List', { method: 'POST' });
           if (!updatedList || typeof updatedList.is_following === 'undefined' || typeof updatedList.saved_count === 'undefined') { throw new Error('Invalid response after toggling follow.'); }

           // --- Invalidation for Follow Toggle ---
           // Invalidate detail, both user list types, and potentially trending lists
           queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
           queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] }); // Affects is_following flag if shown there
           queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] }); // Adds/removes from this list
           queryClient.invalidateQueries({ queryKey: ['trendingPageData'] }); // Popular lists might change order/state
           queryClient.invalidateQueries({ queryKey: ['trendingData'] }); // Also invalidate home page results
           console.log(`[UserListStore] Invalidated relevant queries after toggling follow for list ${listId}.`);
           // --- End Invalidation ---

           // Update state synchronously (logic remains the same)
           set((state) => { /* ... synchronous state update logic ... */ });
           return updatedList;
         } catch (error) {
             // ... (error handling remains the same) ...
             console.error(`[UserListStore toggleFollow] Error:`, error);
             if (error.message !== 'Session expired or invalid. Please log in again.') {
                  set({ error: error.message, isTogglingFollow: false });
             } else {
                  set({ isTogglingFollow: false, error: error.message });
             }
            throw error;
         }
       },

    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;