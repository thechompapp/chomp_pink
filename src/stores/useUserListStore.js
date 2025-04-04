// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config';
import useAuthStore from './useAuthStore';

// Keep the updated simpleFetchAndParse helper function with token logging
const simpleFetchAndParse = async (url, errorContext, options = {}) => {
  // Check token value
  const token = useAuthStore.getState().token;
  console.log(`[${errorContext} Store - simpleFetchAndParse] Token from useAuthStore: ${token ? `Exists (Length: ${token.length})` : 'MISSING or NULL'}`);

  console.log(`[${errorContext} Store] Fetching from ${url}`);
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // Include token if it exists
    ...options.headers,
  };
  const loggedHeaders = { ...headers };
  if (loggedHeaders.Authorization) loggedHeaders.Authorization = 'Bearer [REDACTED]';
  console.log(`[${errorContext} Store] Request Headers:`, loggedHeaders);
  try {
    const response = await fetch(url, { ...options, headers });
    const responseText = await response.text();
    if (!response.ok) {
      console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${responseText}`);
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMsg = errorJson.msg || errorJson.error || errorJson.message || errorMsg;
      } catch (e) { /* Ignore parsing error */ }
      throw new Error(errorMsg);
    }
    if (!responseText) {
      console.log(`[${errorContext} Store] Received empty response body (status ${response.status}).`);
      return options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE' ? null : [];
    }
    const rawData = JSON.parse(responseText);
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
      userLists: [],
      followedLists: [],
      isLoadingUser: false, // Loading state for user's own lists
      isLoadingFollowed: false, // Separate loading state for followed lists
      errorUser: null,
      errorFollowed: null,
      isAddingToList: false,
      addToListError: null,
      isTogglingFollow: false,
      toggleFollowError: null,

      fetchUserLists: async () => {
        console.log(`[UserListStore fetchUserLists] Called. Current isLoadingUser: ${get().isLoadingUser}`);
        if (get().isLoadingUser) {
             console.log('[UserListStore fetchUserLists] Already loading, returning.');
             return;
        }
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          console.log('[UserListStore fetchUserLists] Not authenticated, skipping.');
          set({ userLists: [], errorUser: 'Please log in to view your lists.', isLoadingUser: false });
          return;
        }
        console.log('[UserListStore fetchUserLists] Setting isLoadingUser = true');
        set({ isLoadingUser: true, errorUser: null });
        try {
          const lists = await simpleFetchAndParse(`${API_BASE_URL}/api/lists?createdByUser=true`, 'User Lists');
          console.log(`[UserListStore fetchUserLists] Fetch successful. Received ${lists.length} lists. Setting isLoadingUser = false.`);
          set({ userLists: lists, isLoadingUser: false });
          console.log('[UserListStore] User-created lists state updated successfully.');
          return lists;
        } catch (error) {
          console.error('[UserListStore fetchUserLists] Error caught:', error);
           console.log('[UserListStore fetchUserLists] Fetch failed. Setting isLoadingUser = false.');
           set({ userLists: [], errorUser: error.message, isLoadingUser: false });
          throw error;
        }
      },

       fetchFollowedLists: async () => {
          console.log(`[UserListStore fetchFollowedLists] Called. Current isLoadingFollowed: ${get().isLoadingFollowed}`);
          if (get().isLoadingFollowed) {
              console.log('[UserListStore fetchFollowedLists] Already loading, returning.');
              return;
          }
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) {
            console.log('[UserListStore fetchFollowedLists] Not authenticated, skipping.');
            set({ followedLists: [], errorFollowed: 'Please log in to view followed lists.', isLoadingFollowed: false });
            return;
          }
           console.log('[UserListStore fetchFollowedLists] Setting isLoadingFollowed = true');
          set({ isLoadingFollowed: true, errorFollowed: null });
          try {
            const lists = await simpleFetchAndParse(`${API_BASE_URL}/api/lists?followedByUser=true`, 'Followed Lists');
            console.log(`[UserListStore fetchFollowedLists] Fetch successful. Received ${lists.length} lists. Setting isLoadingFollowed = false.`);
            set({ followedLists: lists, isLoadingFollowed: false });
            console.log('[UserListStore] Followed lists state updated successfully.');
            return lists;
          } catch (error) {
            console.error('[UserListStore fetchFollowedLists] Error caught:', error);
            console.log('[UserListStore fetchFollowedLists] Fetch failed. Setting isLoadingFollowed = false.');
            set({ followedLists: [], errorFollowed: error.message, isLoadingFollowed: false });
            throw error;
          }
        },

      addToList: async ({ item, listId, createNew = false, listData = null }) => {
         if (get().isAddingToList) return;
         const { isAuthenticated } = useAuthStore.getState();
         if (!isAuthenticated) { throw new Error('Please log in to add to a list.'); }
         set({ isAddingToList: true, addToListError: null });
         try {
           let targetListId = listId;
           let createdList = null;
           if (createNew && listData && listData.name) {
             createdList = await simpleFetchAndParse(`${API_BASE_URL}/api/lists`, 'Create List', { method: 'POST', body: JSON.stringify(listData) });
             targetListId = createdList?.id;
             if(createdList) {
                 const formattedList = { ...createdList, is_following: false, created_by_user: true, item_count: 0, tags: Array.isArray(createdList.tags) ? createdList.tags : [], };
                 set((state) => ({ userLists: [...state.userLists, formattedList] }));
             }
           } else if (createNew) { throw new Error('List name is required.'); }
           if (item && item.id && item.type && targetListId) {
             await simpleFetchAndParse(`${API_BASE_URL}/api/lists/${targetListId}/items`, 'Add Item to List', { method: 'POST', body: JSON.stringify({ item_id: item.id, item_type: item.type }) });
             set((state) => ({
               userLists: state.userLists.map(list => list.id === targetListId ? { ...list, item_count: (list.item_count || 0) + 1 } : list),
               followedLists: state.followedLists.map(list => list.id === targetListId ? { ...list, item_count: (list.item_count || 0) + 1 } : list),
             }));
           }
           set({ isAddingToList: false });
           return createdList || { success: true };
         } catch (error) { set({ addToListError: error.message, isAddingToList: false }); throw error; }
       },

       removeFromList: async (listId, listItemId) => {
         const token = useAuthStore.getState().token; if (!token) throw new Error("Authentication required.");
         try {
           // Using simpleFetchAndParse for consistency, check for null response on DELETE
           await simpleFetchAndParse(
                `${API_BASE_URL}/api/lists/${listId}/items/${listItemId}`,
                'Remove Item from List',
                { method: 'DELETE' }
            );
           // Update item count optimistically
           const updateCount = (list) => (list.id === listId ? { ...list, item_count: Math.max(0, (list.item_count || 1) - 1) } : list);
           set((state) => ({ userLists: state.userLists.map(updateCount), followedLists: state.followedLists.map(updateCount) }));
           return true;
         } catch (error) { throw error; }
       },

       updateListVisibility: async (listId, isPublic) => {
         // Use simpleFetchAndParse
         try {
           const updatedList = await simpleFetchAndParse(
               `${API_BASE_URL}/api/lists/${listId}/visibility`,
               'Update Visibility',
               { method: 'PUT', body: JSON.stringify({ is_public: isPublic }) }
           );
           if (!updatedList || typeof updatedList.is_public === 'undefined') {
                throw new Error('Invalid response after updating visibility.');
           }
           set((state) => ({
             userLists: state.userLists.map((list) => (list.id === listId ? { ...list, is_public: updatedList.is_public } : list)),
             followedLists: state.followedLists.map((list) => (list.id === listId ? { ...list, is_public: updatedList.is_public } : list)),
           }));
           return true;
         } catch (error) { throw error; }
       },

      toggleFollowList: async (listId) => {
         if (get().isTogglingFollow) return;
         const { isAuthenticated } = useAuthStore.getState(); if (!isAuthenticated) { set({ toggleFollowError: 'Please log in to follow lists.' }); return; }
         set({ isTogglingFollow: true, toggleFollowError: null });
         try {
           // Use simpleFetchAndParse
           const updatedList = await simpleFetchAndParse(
               `${API_BASE_URL}/api/lists/${listId}/follow`,
               'Toggle Follow List',
               { method: 'POST' }
           );
           if (!updatedList || typeof updatedList.is_following === 'undefined' || typeof updatedList.saved_count === 'undefined' || typeof updatedList.item_count === 'undefined') { // Check item_count too
                throw new Error('Invalid response after toggling follow.');
           }
           const newFollowingState = updatedList.is_following;
           set((state) => {
             const updateUserList = (list) => (list.id === listId ? { ...list, is_following: newFollowingState, saved_count: updatedList.saved_count } : list);
             const updatedUserLists = state.userLists.map(updateUserList);
             let updatedFollowedLists = state.followedLists.map(updateUserList);
             // Logic to add/remove from followedLists array based on the new state
             if (newFollowingState && !state.followedLists.some((l) => l.id === listId)) {
                 // Add to followed list. Rely on updatedList containing necessary fields (id, name, item_count etc.)
                 // *** FIX: Removed the await call, rely on updatedList having item_count ***
                 const listToAdd = { ...updatedList, is_following: true }; // Ensure is_following is true
                 updatedFollowedLists = [...updatedFollowedLists, listToAdd];
             } else if (!newFollowingState) {
                 updatedFollowedLists = updatedFollowedLists.filter((list) => list.id !== listId);
             }
             return { userLists: updatedUserLists, followedLists: updatedFollowedLists, isTogglingFollow: false, toggleFollowError: null };
           });
           return updatedList;
         } catch (error) { set({ toggleFollowError: error.message, isTogglingFollow: false }); throw error; }
       },


    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;