import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config'; // Named export
import useAuthStore from './useAuthStore'; // Default export

// *** UPDATED simpleFetchAndParse HELPER ***
const simpleFetchAndParse = async (url, errorContext, options = {}) => {
  console.log(`[${errorContext} Store] Fetching from ${url}`);
  // *** FIX: Get token directly from auth store state ***
  const token = useAuthStore.getState().token;
  const headers = {
    'Content-Type': 'application/json',
    // *** FIX: Conditionally add Authorization header if token exists ***
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers, // Allow overriding/adding headers via options
  };

  // Log headers (excluding Authorization value for security)
  const loggedHeaders = { ...headers };
  if (loggedHeaders.Authorization) {
    loggedHeaders.Authorization = 'Bearer [REDACTED]';
  }
  console.log(`[${errorContext} Store] Request Headers:`, loggedHeaders);

  try {
    const response = await fetch(url, { ...options, headers }); // Use updated headers
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${responseText}`);
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        // *** FIX: Check for 'msg' property from auth middleware/validation errors ***
        errorMsg = errorJson.msg || errorJson.error || errorJson.message || errorMsg;
      } catch (e) { /* Ignore parsing error if body wasn't JSON */ }
      // Throw the potentially more specific error message
      throw new Error(errorMsg);
    }

    // Handle empty responses, especially after successful POST/PUT/DELETE
    if (!responseText) {
        console.log(`[${errorContext} Store] Received empty response body (status ${response.status}).`);
        // Return null or an indicator of success for mutation methods, empty array for GET
        return options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE' ? null : [];
    }

    const rawData = JSON.parse(responseText);
    // For mutations, often the backend might return the updated/created object or just a success message
    if (options.method === 'POST' || options.method === 'PUT') return rawData;
    // For GET, assume an array is expected, but handle single objects too
    return Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

  } catch (error) {
    console.error(`[${errorContext} Store] Network or processing error (${url}):`, error);
    // *** FIX: Ensure the thrown error message includes the specific backend message if available ***
    throw new Error(`Error processing ${errorContext}: ${error.message}`);
  }
};
// *** END UPDATED simpleFetchAndParse HELPER ***

const useUserListStore = create(
  devtools(
    (set, get) => ({
      userLists: [],
      followedLists: [],
      isLoadingUser: false,
      isLoadingFollowed: false,
      errorUser: null,
      errorFollowed: null,
      isAddingToList: false,
      addToListError: null,
      isTogglingFollow: false,
      toggleFollowError: null,

      fetchUserLists: async () => {
        if (get().isLoadingUser) return;
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          console.log('[UserListStore] Not authenticated, skipping fetchUserLists.');
          set({ errorUser: 'Please log in to view your lists.', isLoadingUser: false });
          return;
        }
        set({ isLoadingUser: true, errorUser: null });
        try {
          // Use the updated helper
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
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          console.log('[UserListStore] Not authenticated, skipping fetchFollowedLists.');
          set({ errorFollowed: 'Please log in to view followed lists.', isLoadingFollowed: false });
          return;
        }
        set({ isLoadingFollowed: true, errorFollowed: null });
        try {
          // Use the updated helper
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

      addToList: async ({ item, listId, createNew = false, listData = null }) => {
        if (get().isAddingToList) return;
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          console.log('[UserListStore] Not authenticated, skipping addToList.');
          set({ addToListError: 'Please log in to add to a list.', isAddingToList: false });
          // Throw an error so the UI can potentially catch it
          throw new Error('Please log in to add to a list.');
        }
        set({ isAddingToList: true, addToListError: null });
        console.log('[UserListStore addToList] Args:', { item, listId, createNew, listData });

        try {
          let targetListId = listId;
          let createdList = null;

          if (createNew && listData && listData.name) {
            console.log('[UserListStore addToList] Creating new list with data:', listData);
            // Use the updated helper
            createdList = await simpleFetchAndParse(`${API_BASE_URL}/api/lists`, 'Create List', {
              method: 'POST',
              body: JSON.stringify(listData), // Headers are handled by helper
            });
            console.log('[UserListStore addToList] List created successfully:', createdList);
            targetListId = createdList?.id;
            // Add the newly created list to the state
            set((state) => ({ userLists: [...state.userLists, createdList] }));
          } else if (createNew) {
            throw new Error('List name is required to create a new list.');
          }

          if (item && item.id && item.type && targetListId) {
            console.log(`[UserListStore addToList] Adding item ${item.type} ${item.id} to list ${targetListId}`);
            // Use the updated helper
            await simpleFetchAndParse(`${API_BASE_URL}/api/lists/${targetListId}/items`, 'Add Item to List', {
              method: 'POST',
              body: JSON.stringify({ item_id: item.id, item_type: item.type }), // Headers are handled by helper
            });
            console.log(`[UserListStore addToList] Item added successfully to list ${targetListId}`);
             // Optionally refetch the specific list to update its item count visually if needed
             // get().fetchListDetails(targetListId); // Example, assumes fetchListDetails exists
          } else if (item) {
            console.warn('[UserListStore addToList] Invalid item or targetListId, skipping item addition.');
          }

          set({ isAddingToList: false });
          return createdList || { success: true };
        } catch (error) {
          console.error('[UserListStore addToList] Error:', error);
          set({ addToListError: error.message, isAddingToList: false });
          throw error; // Re-throw error for UI handling
        }
      },

      removeFromList: async (listId, listItemId) => {
        console.log(`[UserListStore removeFromList] Removing item ${listItemId} from list ${listId}`);
        const token = useAuthStore.getState().token;
        if (!token) throw new Error("Authentication required to remove items.");

        try {
          const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/items/${listItemId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }, // Ensure token is sent
          });
          if (response.status === 204) { // Successfully deleted (No Content)
             console.log(`[UserListStore removeFromList] Item ${listItemId} removed successfully from list ${listId}.`);
             // Update item count optimistically or refetch list details
              const updateCount = (list) => (list.id === listId ? { ...list, item_count: Math.max(0, (list.item_count || 1) - 1) } : list);
              set((state) => ({
                userLists: state.userLists.map(updateCount),
                followedLists: state.followedLists.map(updateCount),
              }));
             return true;
          } else {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to remove item (${response.status})`);
          }
        } catch (error) {
          console.error(`[UserListStore removeFromList] Error removing item ${listItemId} from list ${listId}:`, error);
          throw error; // Re-throw for UI handling
        }
      },

      updateListVisibility: async (listId, isPublic) => {
        console.log(`[UserListStore updateListVisibility] Setting visibility for list ${listId} to ${isPublic}`);
        const token = useAuthStore.getState().token;
        if (!token) throw new Error("Authentication required to update list visibility.");

        try {
           // Use the updated helper
          const updatedList = await simpleFetchAndParse(
              `${API_BASE_URL}/api/lists/${listId}/visibility`,
              'Update List Visibility',
              {
                  method: 'PUT',
                  body: JSON.stringify({ is_public: isPublic }),
                  // Token added automatically by simpleFetchAndParse
              }
          );
          console.log(`[UserListStore updateListVisibility] Visibility updated for list ${listId}.`);
          // Update state based on the response from the backend
          set((state) => ({
            userLists: state.userLists.map((list) => (list.id === listId ? { ...list, is_public: updatedList.is_public } : list)),
             // Optionally update followedLists if the list is present there too
             followedLists: state.followedLists.map((list) => (list.id === listId ? { ...list, is_public: updatedList.is_public } : list)),
          }));
          return true;
        } catch (error) {
          console.error(`[UserListStore updateListVisibility] Error updating visibility for list ${listId}:`, error);
          throw error; // Re-throw for UI handling
        }
      },

      toggleFollowList: async (listId) => {
        if (get().isTogglingFollow) return;
        // *** FIX: Check authentication before proceeding ***
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
            console.warn('[UserListStore toggleFollowList] Not authenticated. Aborting.');
            set({ toggleFollowError: 'Please log in to follow lists.' });
            return; // Don't proceed if not authenticated
        }

        set({ isTogglingFollow: true, toggleFollowError: null });
        try {
          // Use the updated helper (token added automatically)
          const updatedList = await simpleFetchAndParse(
            `${API_BASE_URL}/api/lists/${listId}/follow`,
            'Toggle Follow List',
            { method: 'POST' } // No body needed, token in header
          );

          // Ensure updatedList is valid before proceeding
           if (!updatedList || typeof updatedList.is_following === 'undefined') {
                console.error('[UserListStore toggleFollowList] Invalid response from backend:', updatedList);
                throw new Error('Received invalid response after toggling follow.');
           }

          const newFollowingState = updatedList.is_following;
          console.log(`[UserListStore toggleFollowList] Toggled follow for list ${listId}. New state: ${newFollowingState}`);

          set((state) => {
            // Update the specific list in both userLists and followedLists if present
            const updateUserList = (list) => (list.id === listId ? { ...list, is_following: newFollowingState, saved_count: updatedList.saved_count } : list);
            const updatedUserLists = state.userLists.map(updateUserList);
            let updatedFollowedLists = state.followedLists.map(updateUserList);

            // Add to followedLists if now following and not present
            if (newFollowingState && !state.followedLists.some((l) => l.id === listId)) {
              // Find the updated list details (prefer from userLists if creator, else use response)
               const listToAdd = updatedUserLists.find((l) => l.id === listId && l.created_by_user) || updatedList;
               if (listToAdd) {
                    updatedFollowedLists = [...updatedFollowedLists, { ...listToAdd, is_following: true }]; // Ensure follow state is correct
               } else {
                   console.warn(`[UserListStore toggleFollowList] Could not find list ${listId} details to add to followed list.`);
               }
            }
            // Remove from followedLists if now unfollowing
            else if (!newFollowingState) {
              updatedFollowedLists = updatedFollowedLists.filter((list) => list.id !== listId);
            }

            return {
              userLists: updatedUserLists,
              followedLists: updatedFollowedLists,
              isTogglingFollow: false, // Reset loading state
              toggleFollowError: null, // Clear error on success
            };
          });

          return updatedList; // Return the updated list details
        } catch (error) {
          console.error(`[UserListStore toggleFollowList] Error toggling follow for list ${listId}:`, error);
          // Use the specific error message from the fetch helper
          set({ toggleFollowError: error.message, isTogglingFollow: false });
          throw error; // Re-throw for potential UI handling
        }
      },
    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;