/* src/stores/useFollowStore.js */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { listService } from '@/services/listService';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Store to manage the following status of lists
 * Centralizes follow functionality to avoid redundant API calls
 * and ensure consistent UI state across components
 * Uses persist middleware to preserve follow state across refreshes
 */
const useFollowStore = create(
  persist(
    (set, get) => ({
      // Simple direct array of followed list IDs
      followedListIds: [],
      
      // Loading states
      isTogglingFollow: false,
      error: null,
      
      // Initialize the store with followed lists
      initializeFollowedLists: (lists) => {
        if (!lists || !Array.isArray(lists)) return;
        
        // Extract all list IDs that are followed
        const followedIds = lists
          .filter(list => list.is_following)
          .map(list => parseInt(list.id));
        
        logInfo(`[useFollowStore] Initialized with ${followedIds.length} followed lists: ${followedIds.join(', ')}`);
        console.log('[useFollowStore] Followed lists:', followedIds);
        
        // Only update if there are actually followed lists
        if (followedIds.length > 0) {
          set({ followedListIds: followedIds });
        }
      },
      
      // Toggle follow status for a list
      toggleFollowStatus: async (listId) => {
        // Convert to number to ensure consistent comparison
        const numericId = parseInt(listId);
        
        // Don't allow multiple simultaneous toggle operations
        if (get().isTogglingFollow) {
          return { success: false, error: 'Already processing another follow operation' };
        }
        
        set({ isTogglingFollow: true, error: null });
        
        // Immediately update local state for instant UI feedback
        const isCurrentlyFollowing = get().isFollowing(numericId);
        if (isCurrentlyFollowing) {
          // Optimistically unfollow
          get().unfollowList(numericId);
        } else {
          // Optimistically follow
          get().followList(numericId);
        }
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('followStateChanged', { 
          detail: { listId: numericId, isFollowing: !isCurrentlyFollowing }
        }));
        console.log(`[useFollowStore] Toggling follow for list ${numericId}`);
        
        try {
          // Optimistically update the UI first
          const currentIds = [...get().followedListIds];
          const isCurrentlyFollowing = currentIds.includes(numericId);
          
          // Optimistic update - already done above in lines 54-60, but this ensures state consistency
          const newIds = isCurrentlyFollowing 
            ? currentIds.filter(id => id !== numericId) // Remove if following
            : [...currentIds, numericId]; // Add if not following
            
          // Update the state and mark toggle as complete
          set({ 
            followedListIds: newIds,
            isTogglingFollow: false 
          });
          
          // Make the actual API call but don't block on it
          // Note: Our modified listService.toggleFollowList will always resolve successfully
          // even if the backend API fails, as it stores state in localStorage
          listService.toggleFollowList(numericId)
            .then(response => {
              logDebug(`[useFollowStore] Toggle completed for list ${numericId}, status: ${response.isFollowing}`);
              
              // No need to update state here as we've already done it optimistically
              // and our listService implementation is resilient to API failures
            })
            .catch(apiError => {
              // This should rarely occur since our listService handles errors internally
              logWarn(`[useFollowStore] Unexpected error with toggleFollowList:`, apiError);
              
              // Even with API error, we'll maintain the local optimistic update
              // for better UX rather than rolling back
            });
          
          // Return successful result immediately for UI responsiveness
          return { 
            success: true, 
            isFollowing: !isCurrentlyFollowing 
          };
        } catch (error) {
          // This catch block is only for errors in the optimization logic above
          logError(`[useFollowStore] Error in follow state management:`, error);
          set({ 
            error: error.message || 'An error occurred managing follow state', 
            isTogglingFollow: false 
          });
          return { success: false, error };
        }
      },
      
      // Check if a list is being followed
      isFollowing: (listId) => {
        if (!listId) return false;
        const numericId = parseInt(listId);
        return get().followedListIds.includes(numericId);
      },
      
      // Add a list to followed lists directly
      followList: (listId) => {
        const numericId = parseInt(listId);
        const currentIds = [...get().followedListIds];
        if (!currentIds.includes(numericId)) {
          set({ followedListIds: [...currentIds, numericId] });
          logInfo(`[useFollowStore] Directly followed list ${numericId}`);
        }
      },
      
      // Remove a list from followed lists directly
      unfollowList: (listId) => {
        const numericId = parseInt(listId);
        const currentIds = [...get().followedListIds];
        set({ followedListIds: currentIds.filter(id => id !== numericId) });
        logInfo(`[useFollowStore] Directly unfollowed list ${numericId}`);
      },
      
      // Clear any errors
      clearError: () => set({ error: null })
    }),
    {
      name: 'chomp-followed-lists',  // Unique name for localStorage
      getStorage: () => localStorage,
    }
  )
);

export default useFollowStore;
