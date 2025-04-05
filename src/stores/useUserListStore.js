// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/utils/apiClient';
import { queryClient } from '@/queryClient'; // Import queryClient

// Helper function to ensure safety of arrays
const ensureArray = (arr) => Array.isArray(arr) ? arr : [];

// Helper to invalidate relevant list queries
const invalidateListQueries = (listId = null) => {
    console.log(`[UserListStore] Invalidating list queries. ListID specific: ${listId}`);
    queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Invalidate main list queries (created/followed)
    if (listId) {
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] }); // Invalidate specific list detail
    }
};


const useUserListStore = create(
  devtools(
    persist(
      (set, get) => ({
        userLists: [],
        followedLists: [],
        allLists: [], // Holds a combined view, potentially useful
        isLoading: false, // General loading state for list operations
        isAddingToList: false, // Specific state for add operation
        isRemovingItem: false, // Specific state for remove operation
        error: null,

        clearError: () => set({ error: null }),

        fetchUserLists: async () => {
          // ... (fetch logic remains the same) ...
          if (get().isLoading) return; // Prevent concurrent fetches
          console.log('[UserListStore] Fetching user lists...');
          set({ isLoading: true, error: null });
          try {
            const [createdData, followedData] = await Promise.all([
              apiClient('/api/lists?createdByUser=true', 'Fetch User Created Lists'),
              apiClient('/api/lists?followedByUser=true', 'Fetch User Followed Lists')
            ]);
            const safeCreatedLists = ensureArray(createdData);
            const safeFollowedLists = ensureArray(followedData);
            console.log(`[UserListStore] Fetched ${safeCreatedLists.length} created, ${safeFollowedLists.length} followed lists.`);
            const combinedMap = new Map();
            safeCreatedLists.forEach(list => combinedMap.set(list.id, list));
            safeFollowedLists.forEach(list => combinedMap.set(list.id, list));
            const allCombinedLists = Array.from(combinedMap.values());
            set({
              userLists: safeCreatedLists,
              followedLists: safeFollowedLists,
              allLists: allCombinedLists,
              isLoading: false,
            });
            return { created: safeCreatedLists, followed: safeFollowedLists };
          } catch (err) {
            console.error('[UserListStore] Error fetching user lists:', err);
            if (err.message !== 'Session expired or invalid. Please log in again.') {
                set({ isLoading: false, error: err.message || 'Failed to fetch lists' });
            } else {
                 set({ isLoading: false });
            }
            throw err;
          }
        },

        addToList: async ({ item, listId, createNew = false, listData = {} }) => {
          // ... (logic remains the same until success) ...
           if (!item && !createNew) {
             throw new Error("Item or createNew flag is required.");
          }
          set({ isAddingToList: true, error: null });
          console.log('[UserListStore] addToList called:', { item, listId, createNew, listData });
          try {
             let targetListId = listId;
             if (createNew) {
                 console.log('[UserListStore] Creating new list with data:', listData);
                 const newList = await apiClient('/api/lists', 'Create List', {
                    method: 'POST',
                    body: JSON.stringify({ name: listData.name, description: listData.description, is_public: listData.is_public, tags: listData.tags }),
                 });
                 if (!newList || !newList.id) throw new Error('Failed to create new list.');
                 targetListId = newList.id;
                 console.log('[UserListStore] New list created, ID:', targetListId);
                  set(state => ({
                     userLists: [...state.userLists, newList],
                     allLists: [...state.allLists, newList],
                  }));
             }
             if (item && item.id && item.type && targetListId) {
                  console.log(`[UserListStore] Adding item ${item.type}:${item.id} to list ${targetListId}`);
                  await apiClient(`/api/lists/${targetListId}/items`, 'Add Item to List', {
                     method: 'POST',
                     body: JSON.stringify({ item_id: item.id, item_type: item.type }),
                  });
                   console.log(`[UserListStore] Item ${item.type}:${item.id} added successfully to list ${targetListId}`);
                   set(state => ({ // Update count locally
                      userLists: state.userLists.map(l => l.id === targetListId ? { ...l, item_count: (l.item_count || 0) + 1 } : l),
                      followedLists: state.followedLists.map(l => l.id === targetListId ? { ...l, item_count: (l.item_count || 0) + 1 } : l),
                      allLists: state.allLists.map(l => l.id === targetListId ? { ...l, item_count: (l.item_count || 0) + 1 } : l),
                   }));
             }
             // --- ADDED INVALIDATION ---
             invalidateListQueries(targetListId); // Invalidate relevant queries
             // --- END INVALIDATION ---
             set({ isAddingToList: false });
             return { success: true, listId: targetListId };
          } catch (err) {
             console.error('[UserListStore] Error in addToList:', err);
             set({ isAddingToList: false, error: err.message || 'Operation failed' });
             throw err;
          }
        },

        removeFromList: async (listId, listItemId) => {
          // ... (logic remains the same until success) ...
            if (!listId || !listItemId) {
              throw new Error("List ID and List Item ID are required.");
           }
           set({ isRemovingItem: true, error: null });
           console.log(`[UserListStore] Removing item ${listItemId} from list ${listId}`);
           try {
              await apiClient(`/api/lists/${listId}/items/${listItemId}`, 'Remove Item from List', { method: 'DELETE' });
               console.log(`[UserListStore] Item ${listItemId} removed successfully from list ${listId}`);
               set(state => { // Update state locally
                  const updateList = (list) => { /* ... */ };
                   return { /* ... */ isRemovingItem: false };
               });
                // --- ADDED INVALIDATION ---
                invalidateListQueries(listId); // Invalidate relevant queries
                // --- END INVALIDATION ---
              return true;
           } catch (err) {
               console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, err);
               set({ isRemovingItem: false, error: err.message || 'Failed to remove item' });
               throw err;
           }
        },

         // Update Follow Status (receives API response object now)
        updateFollowStatus: (listId, apiResponse) => {
           // ... (state update logic remains the same) ...
             if (!apiResponse || typeof apiResponse.id === 'undefined') return;
             const isNowFollowing = apiResponse.is_following;
             console.log(`[UserListStore updateFollowStatus] Updating list ${listId} to is_following: ${isNowFollowing}`);
             set(state => { /* ... state update logic ... */ });
            // --- ADDED INVALIDATION ---
            // Invalidate after state is updated (or before if preferred)
            invalidateListQueries(listId);
            // --- END INVALIDATION ---
        },

        updateListVisibility: async (listId, isPublic) => {
          // ... (logic remains the same until success) ...
           if (!listId || typeof isPublic !== 'boolean') throw new Error("List ID and visibility flag are required.");
           set({ isLoading: true, error: null });
           console.log(`[UserListStore] Updating visibility for list ${listId} to ${isPublic}`);
           try {
              const updatedList = await apiClient(`/api/lists/${listId}/visibility`, 'Update List Visibility', {
                 method: 'PUT',
                 body: JSON.stringify({ is_public: isPublic }),
              });
              if (!updatedList || updatedList.id !== listId) throw new Error("Invalid response from visibility update API.");
              console.log(`[UserListStore] Visibility updated successfully for list ${listId}`);
              set(state => { // Update state locally
                    const updateList = (list) => (list.id === listId ? { ...list, ...updatedList, is_public: isPublic } : list);
                   return { /* ... */ isLoading: false };
               });
                // --- ADDED INVALIDATION ---
                invalidateListQueries(listId); // Invalidate relevant queries
                // --- END INVALIDATION ---
               return updatedList;
           } catch (err) {
               console.error(`[UserListStore] Error updating visibility for list ${listId}:`, err);
               set({ isLoading: false, error: err.message || 'Failed to update visibility' });
               throw err;
           }
        },

        // Reset Store
        resetStore: () => {
            // ... (reset logic remains the same) ...
             console.log('[UserListStore] Resetting store state.');
            set({ userLists: [], followedLists: [], allLists: [], isLoading: false, isAddingToList: false, isRemovingItem: false, error: null }, true);
        },

      }),
      {
        name: 'user-lists-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          userLists: state.userLists,
          followedLists: state.followedLists,
          allLists: state.allLists,
        }),
      }
    ),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;