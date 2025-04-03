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
        if (get().isAddingToList) return Promise.reject(new Error("Add to list action already in progress.")); // Return rejected promise
        set({ isAddingToList: true, addToListError: null });
        console.log('[UserListStore addToList] Args:', { item, listId, createNew, listData });

        try {
            let targetListId = listId;
            let createdList = null;

            // 1. Create new list if requested
            if (createNew && listData && listData.name) {
                console.log('[UserListStore addToList] Creating new list with data:', listData);
                // *** Ensure listData has expected fields for POST /api/lists ***
                // Backend expects: name, description?, city_name?, tags?, is_public?
                const payload = {
                    name: listData.name,
                    description: listData.description || null,
                    city_name: listData.city_name || null,
                    tags: listData.tags || [],
                    is_public: listData.is_public !== undefined ? listData.is_public : true,
                };
                createdList = await simpleFetchAndParse(`${API_BASE_URL}/api/lists`, 'Create List', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload) // Send the validated payload
                });
                console.log('[UserListStore addToList] List created successfully:', createdList);
                if (!createdList || !createdList.id) {
                   throw new Error("List creation API call succeeded but returned invalid data.");
                }
                targetListId = createdList.id; // Get ID of the newly created list
                // Add the new list to the userLists state immediately
                // Ensure the createdList has all fields needed by ListCard/MyLists
                const newListForState = {
                    ...createdList, // Data from backend (id, name, is_public, etc.)
                    item_count: 0, // New lists start with 0 items
                    // Ensure defaults if backend doesn't return everything needed for UI state
                    tags: createdList.tags || [],
                    saved_count: createdList.saved_count || 0,
                    created_by_user: true, // We just created it
                    is_following: false, // Can't follow own list at creation
                };
                set(state => ({ userLists: [...state.userLists, newListForState] }));
            } else if (createNew) {
                throw new Error("List name is required to create a new list.");
            }

            // 2. Add item to the list (either existing or newly created) if an item is provided
            if (item && item.id && item.type && targetListId) {
                console.log(`[UserListStore addToList] Adding item ${item.type} ${item.id} to list ${targetListId}`);
                // *** This endpoint needs to be implemented on the backend ***
                // *** If endpoint doesn't exist, this will fail ***
                try {
                    await simpleFetchAndParse(`${API_BASE_URL}/api/lists/${targetListId}/items`, 'Add Item to List', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item_id: item.id, item_type: item.type })
                    });
                     console.log(`[UserListStore addToList] Item added successfully to list ${targetListId}`);
                     // Increment item count in the relevant list state
                     const updateItemCount = (list) => list.id === targetListId ? { ...list, item_count: (list.item_count || 0) + 1 } : list;
                     set(state => ({
                         userLists: state.userLists.map(updateItemCount),
                         followedLists: state.followedLists.map(updateItemCount)
                     }));
                } catch (addItemError) {
                    // If creating the list succeeded but adding the item failed (e.g., endpoint missing)
                    // Still report success for list creation, but warn about item add failure
                    console.warn(`[UserListStore addToList] List ${targetListId} created, but failed to add item ${item.id}: ${addItemError.message}`);
                    // Optionally set a different kind of partial error state?
                    // For now, we let the list creation be the primary success state.
                }
            } else if (item) {
                console.warn('[UserListStore addToList] Invalid item or targetListId provided, skipping item addition.');
            }

            set({ isAddingToList: false });
            // Return the created list object if created, otherwise success status
            return createdList ? createdList : { success: true };

        } catch (error) {
            console.error('[UserListStore addToList] Error:', error);
            set({ addToListError: error.message, isAddingToList: false });
            throw error; // Re-throw for component-level handling
        }
    }, // end addToList

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
        if (get().isTogglingFollow) return Promise.reject(new Error("Toggle follow action already in progress.")); // Return rejected promise
        set({ isTogglingFollow: true, toggleFollowError: null });
         try {
           const updatedList = await simpleFetchAndParse(
             `${API_BASE_URL}/api/lists/${listId}/follow`,
             'Toggle Follow List',
             { method: 'POST' } // Assuming POST toggles the state
           );

            // Ensure updatedList and is_following exist
           if (!updatedList || typeof updatedList.is_following === 'undefined') {
                throw new Error("API response for toggle follow is missing expected data.");
           }
           const newFollowingState = updatedList.is_following;

           console.log(`[UserListStore toggleFollowList] Toggled follow for list ${listId}. New state: ${newFollowingState}`);

           // Update the specific list in BOTH userLists and followedLists
           set(state => {
               const updateUserList = (list) => list.id === listId ? { ...list, is_following: newFollowingState, saved_count: updatedList.saved_count ?? list.saved_count } : list;
               const updatedUserLists = state.userLists.map(updateUserList);
               let updatedFollowedLists = state.followedLists.map(updateUserList);

               // Add/remove from followedLists based on new state
               const listInStore = state.userLists.find(l => l.id === listId) || state.followedLists.find(l => l.id === listId);
               const listToAddOrUpdate = listInStore ? { ...listInStore, ...updatedList, is_following: newFollowingState } : { ...updatedList };

               if (newFollowingState && !state.followedLists.some(l => l.id === listId)) {
                   updatedFollowedLists = [...updatedFollowedLists, listToAddOrUpdate];
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
           // It might be best to just refetch trending lists occasionally or on navigation.

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