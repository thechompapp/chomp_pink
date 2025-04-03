// src/stores/useUserListStore.js
// FIX: Correct handling of listData in addToList for creating new lists
// ADD: Loading/Error state for addToList action
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config';

// Helper function (can be shared or duplicated)
const simpleFetchAndParse = async (url, errorContext, options = {}) => {
    console.log(`[${errorContext} Store] Fetching from ${url}`);
    try {
      const response = await fetch(url, options); // Pass options like method, headers, body
      const responseText = await response.text(); // Read text first for better error reporting
      if (!response.ok) {
        console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${responseText}`);
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorJson = JSON.parse(responseText);
            errorMsg = errorJson.error || errorJson.message || errorMsg;
        } catch (e) { /* Ignore parsing error if body wasn't JSON */ }
        throw new Error(errorMsg);
      }
      if (!responseText) return options.method === 'POST' || options.method === 'PUT' ? null : []; // Handle empty responses
      const rawData = JSON.parse(responseText);
      // If not expecting an array (e.g., POST returns the created object)
      if (options.method === 'POST' || options.method === 'PUT') return rawData;
      return Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
    } catch (error) {
      console.error(`[${errorContext} Store] Network or processing error (${url}):`, error);
      throw new Error(`Error processing ${errorContext}: ${error.message}`);
    }
};


const useUserListStore = create(
  devtools(
    (set, get) => ({
      userLists: [], // Lists created by the user
      followedLists: [], // Lists followed by the user
      isLoadingUser: false,
      isLoadingFollowed: false,
      errorUser: null,
      errorFollowed: null,

      // State for addToList action
      isAddingToList: false,
      addToListError: null,

      // State for toggleFollow action
      isTogglingFollow: false,
      toggleFollowError: null,

      // --- FETCH ACTIONS ---
      fetchUserLists: async () => {
        if (get().isLoadingUser) return;
        set({ isLoadingUser: true, errorUser: null });
        try {
          // Assuming endpoint requires authentication header later
          const lists = await simpleFetchAndParse(`${API_BASE_URL}/api/lists?createdByUser=true`, 'User Lists');
          set({ userLists: lists, isLoadingUser: false });
          console.log('[UserListStore] User-created lists fetched successfully.');
          return lists;
        } catch (error) {
          console.error('[UserListStore] Error fetching user lists:', error);
          set({ errorUser: error.message, isLoadingUser: false });
          throw error;
        }
      },

      fetchFollowedLists: async () => {
         if (get().isLoadingFollowed) return;
         set({ isLoadingFollowed: true, errorFollowed: null });
         try {
            // Assuming endpoint requires authentication header later
           const lists = await simpleFetchAndParse(`${API_BASE_URL}/api/lists?followedByUser=true`, 'Followed Lists');
           set({ followedLists: lists, isLoadingFollowed: false });
           console.log('[UserListStore] Followed lists fetched successfully.');
           return lists;
         } catch (error) {
           console.error('[UserListStore] Error fetching followed lists:', error);
           set({ errorFollowed: error.message, isLoadingFollowed: false });
           throw error;
         }
       },

      // --- MUTATION ACTIONS ---

      // Unified action to add item to existing list OR create new list (+ optionally add item)
      addToList: async ({ item, listId, createNew = false, listData = null }) => {
        if (get().isAddingToList) return; // Prevent concurrent actions
        set({ isAddingToList: true, addToListError: null });
        console.log('[UserListStore addToList] Args:', { item, listId, createNew, listData });

        try {
            let targetListId = listId;
            let createdList = null;

            // 1. Create new list if requested
            if (createNew && listData && listData.name) {
                console.log('[UserListStore addToList] Creating new list with data:', listData);
                // *** FIX: Pass listData directly as JSON body ***
                createdList = await simpleFetchAndParse(`${API_BASE_URL}/api/lists`, 'Create List', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(listData) // Send the listData object
                });
                console.log('[UserListStore addToList] List created successfully:', createdList);
                targetListId = createdList?.id; // Get ID of the newly created list
                // Add the new list to the userLists state immediately
                set(state => ({ userLists: [...state.userLists, createdList] }));
            } else if (createNew) {
                throw new Error("List name is required to create a new list.");
            }

            // 2. Add item to the list (either existing or newly created) if an item is provided
            if (item && item.id && item.type && targetListId) {
                console.log(`[UserListStore addToList] Adding item ${item.type} ${item.id} to list ${targetListId}`);
                // *** This endpoint needs to be implemented on the backend ***
                await simpleFetchAndParse(`${API_BASE_URL}/api/lists/${targetListId}/items`, 'Add Item to List', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_id: item.id, item_type: item.type })
                });
                console.log(`[UserListStore addToList] Item added successfully to list ${targetListId}`);
                // Optional: Update item_count for the list in state? Or rely on fresh fetch?
            } else if (item) {
                console.warn('[UserListStore addToList] Invalid item or targetListId, skipping item addition.');
            }

            set({ isAddingToList: false });
            return createdList || { success: true }; // Return created list or success status

        } catch (error) {
            console.error('[UserListStore addToList] Error:', error);
            set({ addToListError: error.message, isAddingToList: false });
            throw error; // Re-throw for component-level handling
        }
    },

    // Action to remove an item from a specific list
    removeFromList: async (listId, listItemId) => {
        // Add specific loading/error state if needed
        console.log(`[UserListStore removeFromList] Removing item ${listItemId} from list ${listId}`);
        try {
            // *** This endpoint needs to be implemented on the backend ***
            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/items/${listItemId}`, { method: 'DELETE' });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                 throw new Error(errorData.error || `Failed to remove item (${response.status})`);
            }
            console.log(`[UserListStore removeFromList] Item ${listItemId} removed successfully from list ${listId}.`);
            // Update item_count in the relevant list within the state
            const updateCount = (list) => list.id === listId ? { ...list, item_count: Math.max(0, (list.item_count || 1) - 1) } : list;
            set(state => ({
                userLists: state.userLists.map(updateCount),
                followedLists: state.followedLists.map(updateCount)
                // Potentially update popularLists in TrendingStore too if applicable
            }));
            return true;
        } catch (error) {
            console.error(`[UserListStore removeFromList] Error removing item ${listItemId} from list ${listId}:`, error);
            throw error;
        }
    },

    // Action to toggle list visibility
    updateListVisibility: async (listId, isPublic) => {
        // Add specific loading/error state if needed
        console.log(`[UserListStore updateListVisibility] Setting visibility for list ${listId} to ${isPublic}`);
         try {
             // *** This endpoint needs to be implemented on the backend ***
             const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/visibility`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ is_public: isPublic })
             });
             if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Failed to update visibility (${response.status})`);
             }
             const updatedList = await response.json(); // Assuming backend returns the updated list
             console.log(`[UserListStore updateListVisibility] Visibility updated for list ${listId}.`);
             // Update the specific list in userLists state
             set(state => ({
                 userLists: state.userLists.map(list => list.id === listId ? { ...list, is_public: updatedList.is_public } : list)
             }));
             return true;
         } catch (error) {
             console.error(`[UserListStore updateListVisibility] Error updating visibility for list ${listId}:`, error);
             throw error;
         }
     },

     // Action to follow/unfollow a list
     toggleFollowList: async (listId) => {
        if (get().isTogglingFollow) return; // Prevent concurrent actions
        set({ isTogglingFollow: true, toggleFollowError: null });
         try {
           const updatedList = await simpleFetchAndParse(
             `${API_BASE_URL}/api/lists/${listId}/follow`,
             'Toggle Follow List',
             { method: 'POST' } // Assuming POST toggles the state
           );

           const newFollowingState = updatedList.is_following;

           console.log(`[UserListStore toggleFollowList] Toggled follow for list ${listId}. New state: ${newFollowingState}`);

           // Update the specific list in BOTH userLists and followedLists
           // And potentially in TrendingStore's popularLists
           set(state => {
               const updateUserList = (list) => list.id === listId ? { ...list, is_following: newFollowingState } : list;
               const updatedUserLists = state.userLists.map(updateUserList);
               let updatedFollowedLists = state.followedLists.map(updateUserList);

               // Add/remove from followedLists based on new state
               if (newFollowingState && !state.followedLists.some(l => l.id === listId)) {
                   // Find the list details (might need to fetch if not in userLists)
                   const listToAdd = updatedUserLists.find(l => l.id === listId) || updatedList; // Use data from API response
                   if (listToAdd) updatedFollowedLists = [...updatedFollowedLists, listToAdd];
               } else if (!newFollowingState) {
                   updatedFollowedLists = updatedFollowedLists.filter(list => list.id !== listId);
               }

               return {
                   userLists: updatedUserLists,
                   followedLists: updatedFollowedLists,
                   isTogglingFollow: false
               };
           });

           // TODO: Consider how to update TrendingStore's popularLists if necessary
           // Option 1: Trigger a re-fetch in TrendingStore
           // Option 2: Have TrendingStore also listen for this action (more complex)
           // Option 3: Pass the updated list data back and let the component update the source array (if applicable)

           return updatedList; // Return the updated list data
         } catch (error) {
           console.error(`[UserListStore toggleFollowList] Error toggling follow for list ${listId}:`, error);
           set({ toggleFollowError: error.message, isTogglingFollow: false });
           throw error;
         }
      },

    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;