// src/stores/useUserListStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import { queryClient } from '@/queryClient'; // Import from the new central file

const useUserListStore = create(
  devtools(
    (set, get) => ({
      // ... state ...
      clearError: () => { /* ... */ },
      fetchUserLists: async () => { /* ... */ },
      fetchFollowedLists: async () => { /* ... */ },
      addToList: async ({ item, listId, createNew = false, listData = null }) => {
        // ... logic ...
        if (createNew) {
            // ... create logic ...
            queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
            // ...
        }
        // ... add item logic ...
         if (!createNew && targetListId) {
             queryClient.invalidateQueries({ queryKey: ['listDetails', String(targetListId)] });
             queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Invalidate both created/followed
             // ... optimistic update ...
         }
         // ...
      },
      removeFromList: async (listId, listItemId) => {
        // ... logic ...
        queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
        queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Invalidate both created/followed
        // ... optimistic update ...
      },
      updateListVisibility: async (listId, isPublic) => {
        // ... logic ...
        queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
        // ... set state ...
      },
      toggleFollowList: async (listId) => {
        // ... logic ...
        queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
        queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] });
        queryClient.invalidateQueries({ queryKey: ['trendingPageData'] });
        queryClient.invalidateQueries({ queryKey: ['trendingData'] });
        // ... set state ...
      },
    }),
    { name: 'UserListStore' }
  )
);

export default useUserListStore;