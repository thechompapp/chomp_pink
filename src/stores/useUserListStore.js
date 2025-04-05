import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '@/utils/apiClient';
import { queryClient } from '@/queryClient';

const useUserListStore = create(
    devtools(
        (set, get) => ({
            userLists: [],
            followedLists: [],
            isLoadingUser: false,
            isAddingToList: false,
            isRemovingItem: false,
            isTogglingFollow: false,
            isUpdatingVisibility: false,
            error: null,

            clearError: () => set({ error: null }),

            fetchUserLists: async () => {
                if (!Array.isArray(get().userLists)) {
                    console.warn('[UserListStore] userLists state was not an array, resetting.');
                    set({ userLists: [] });
                }
                if (get().isLoadingUser) return get().userLists;
                set({ isLoadingUser: true, error: null });
                try {
                    const fetchedLists = await apiClient('/api/lists?createdByUser=true', 'UserStore Created Lists') || [];
                    set({ userLists: Array.isArray(fetchedLists) ? fetchedLists : [], isLoadingUser: false });
                    console.log("[UserListStore] fetchUserLists completed.");
                    return Array.isArray(fetchedLists) ? fetchedLists : [];
                } catch (error) {
                    console.error('[UserListStore] Error fetching user lists:', error);
                    set({ error: error.message || 'Failed to fetch created lists.', isLoadingUser: false, userLists: [] });
                    throw error;
                }
            },

            fetchFollowedLists: async () => {
                if (!Array.isArray(get().followedLists)) {
                    console.warn('[UserListStore] followedLists state was not an array, resetting.');
                    set({ followedLists: [] });
                }
                if (get().isLoadingUser) return get().followedLists;
                set({ isLoadingUser: true, error: null });
                try {
                    const fetchedLists = await apiClient('/api/lists?followedByUser=true', 'UserStore Followed Lists') || [];
                    set({ followedLists: Array.isArray(fetchedLists) ? fetchedLists : [], isLoadingUser: false });
                    console.log("[UserListStore] fetchFollowedLists completed.");
                    return Array.isArray(fetchedLists) ? fetchedLists : [];
                } catch (error) {
                    console.error('[UserListStore] Error fetching followed lists:', error);
                    set({ error: error.message || 'Failed to fetch followed lists.', isLoadingUser: false, followedLists: [] });
                    throw error;
                }
            },

            addToList: async ({ item, listId, createNew = false, listData = null }) => {
                if (createNew) {
                    if (!listData) throw new Error("List data is required to create a new list.");
                    set({ isAddingToList: true, error: null });
                    try {
                        const newList = await apiClient('/api/lists', 'UserStore Create List', {
                            method: 'POST',
                            body: JSON.stringify(listData),
                        });
                        if (!newList || typeof newList.id === 'undefined') {
                            throw new Error("Invalid response received when creating list.");
                        }
                        set((state) => ({
                            userLists: [newList, ...(Array.isArray(state.userLists) ? state.userLists : [])],
                            isAddingToList: false,
                        }));
                        queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                        console.log(`[UserListStore] New list created and added to state: ${newList.id}`);
                        return newList;
                    } catch (error) {
                        console.error('[UserListStore] Error creating list:', error);
                        set({ error: error.message || 'Failed to create list.', isAddingToList: false });
                        throw error;
                    }
                } else {
                    if (!item || !listId) throw new Error("Item and listId are required to add to a list.");
                    const targetListId = parseInt(listId, 10);
                    if (isNaN(targetListId)) throw new Error("Invalid listId provided.");
                    set({ isAddingToList: true, error: null });
                    try {
                        await apiClient(`/api/lists/${targetListId}/items`, 'UserStore Add Item', {
                            method: 'POST',
                            body: JSON.stringify({ item_id: item.id, item_type: item.type }),
                        });
                        set({ isAddingToList: false });
                        queryClient.invalidateQueries({ queryKey: ['listDetails', String(targetListId)] });
                        queryClient.invalidateQueries({ queryKey: ['userLists'] });
                        console.log(`[UserListStore] Item ${item.type}:${item.id} added to list ${targetListId}. Queries invalidated.`);
                        return { success: true };
                    } catch (error) {
                        console.error(`[UserListStore] Error adding item to list ${targetListId}:`, error);
                        set({ error: error.message || 'Failed to add item to list.', isAddingToList: false });
                        throw error;
                    }
                }
            },

            removeFromList: async (listId, listItemId) => {
                if (!listId || !listItemId) throw new Error("listId and listItemId are required.");
                set({ isRemovingItem: true, error: null });
                try {
                    await apiClient(`/api/lists/${listId}/items/${listItemId}`, 'UserStore Remove Item', { method: 'DELETE' });
                    set({ isRemovingItem: false });
                    queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
                    queryClient.invalidateQueries({ queryKey: ['userLists'] });
                    console.log(`[UserListStore] Item ${listItemId} removed from list ${listId}. Queries invalidated.`);
                    return { success: true };
                } catch (error) {
                    console.error(`[UserListStore] Error removing item ${listItemId} from list ${listId}:`, error);
                    set({ error: error.message || 'Failed to remove item.', isRemovingItem: false });
                    throw error;
                }
            },

            updateListVisibility: async (listId, isPublic) => {
                if (listId === undefined || typeof isPublic !== 'boolean') {
                    throw new Error("listId and isPublic boolean are required.");
                }
                set({ isUpdatingVisibility: true, error: null });
                try {
                    const updatedList = await apiClient(`/api/lists/${listId}/visibility`, 'UserStore Update Visibility', {
                        method: 'PUT',
                        body: JSON.stringify({ is_public: isPublic }),
                    });
                    if (!updatedList || typeof updatedList.id === 'undefined') {
                        throw new Error("Invalid response received when updating visibility.");
                    }
                    set(state => ({
                        userLists: (Array.isArray(state.userLists) ? state.userLists : []).map(list =>
                            list.id === listId ? { ...list, ...updatedList, city: updatedList.city_name } : list
                        ),
                        isUpdatingVisibility: false
                    }));
                    queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'created'] });
                    console.log(`[UserListStore] Visibility updated for list ${listId}. Queries invalidated.`);
                    return updatedList;
                } catch (error) {
                    console.error(`[UserListStore] Error updating visibility for list ${listId}:`, error);
                    set({ error: error.message || 'Failed to update list visibility.', isUpdatingVisibility: false });
                    throw error;
                }
            },

            toggleFollowList: async (listId) => {
                if (listId === undefined) throw new Error("listId is required.");
                set({ isTogglingFollow: true, error: null });

                const findList = (id) => (Array.isArray(get().userLists) ? get().userLists.find(l => l.id === id) : undefined) ||
                                        (Array.isArray(get().followedLists) ? get().followedLists.find(l => l.id === id) : undefined);
                const list = findList(listId);
                const initialFollowingState = list?.is_following ?? false;

                set(state => ({
                    userLists: (Array.isArray(state.userLists) ? state.userLists : []).map(l => 
                        l.id === listId ? { ...l, is_following: !initialFollowingState, saved_count: Math.max(0, (l.saved_count || 0) + (!initialFollowingState ? 1 : -1)) } : l
                    ),
                    followedLists: (Array.isArray(state.followedLists) ? state.followedLists : []).map(l => 
                        l.id === listId ? { ...l, is_following: !initialFollowingState, saved_count: Math.max(0, (l.saved_count || 0) + (!initialFollowingState ? 1 : -1)) } : l
                    ),
                }));

                try {
                    const updatedList = await apiClient(`/api/lists/${listId}/follow`, 'UserStore Toggle Follow', { method: 'POST' });
                    if (!updatedList || typeof updatedList.id === 'undefined') {
                        throw new Error("Invalid response received when toggling follow.");
                    }
                    set(state => ({
                        userLists: (Array.isArray(state.userLists) ? state.userLists : []).map(l => 
                            l.id === listId ? { ...l, ...updatedList, city: updatedList.city_name } : l
                        ),
                        followedLists: (Array.isArray(state.followedLists) ? state.followedLists : []).map(l => 
                            l.id === listId ? { ...l, ...updatedList, city: updatedList.city_name } : l
                        ),
                        isTogglingFollow: false,
                    }));
                    queryClient.invalidateQueries({ queryKey: ['listDetails', String(listId)] });
                    queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] });
                    console.log(`[UserListStore] Follow toggled for list ${listId}. Limited queries invalidated.`);
                    return updatedList;
                } catch (error) {
                    console.error(`[UserListStore] Error toggling follow for list ${listId}:`, error);
                    set(state => ({
                        userLists: (Array.isArray(state.userLists) ? state.userLists : []).map(l => 
                            l.id === listId ? { ...l, is_following: initialFollowingState, saved_count: (list?.saved_count || 0) } : l
                        ),
                        followedLists: (Array.isArray(state.followedLists) ? state.followedLists : []).map(l => 
                            l.id === listId ? { ...l, is_following: initialFollowingState, saved_count: (list?.saved_count || 0) } : l
                        ),
                        error: error.message || 'Failed to toggle follow status.',
                        isTogglingFollow: false,
                    }));
                    throw error;
                }
            },
        }),
        { name: 'UserListStore' }
    )
);

export default useUserListStore;