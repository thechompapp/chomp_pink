/* src/stores/useFollowStore.js */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
      
      // Per-list loading states (map of listId to boolean)
      isTogglingFollow: {},
      
      // Error handling (map of listId to error message)
      errors: {},
      
      // Initialize the store with followed lists
      initializeFollowedLists: (lists) => {
        if (!lists || !Array.isArray(lists)) return;
        
        // Extract all list IDs that are followed
        const followedIds = lists
          .filter(list => list.is_following)
          .map(list => parseInt(String(list.id), 10));
        
        logInfo(`[useFollowStore] Initialized with ${followedIds.length} followed lists`);
        
        // Only update if the list is different from what we have
        const currentIds = get().followedListIds;
        if (JSON.stringify(followedIds.sort()) !== JSON.stringify(currentIds.sort())) {
          set({ followedListIds: followedIds });
        }
      },
      
      // Toggle follow status for a list
      // The toggleFollowListService parameter allows injecting the API service to avoid circular dependencies
      toggleFollowStatus: async (listId, toggleFollowListService) => {
        // Convert to number to ensure consistent comparison
        const numericId = parseInt(String(listId), 10);
        
        // Don't allow multiple simultaneous toggle operations for the same list
        if (get().isTogglingFollow[numericId]) {
          return { success: false, message: 'Already processing this follow operation' };
        }
        
        // Update only this list's loading state
        set(state => ({
          isTogglingFollow: {
            ...state.isTogglingFollow,
            [numericId]: true
          },
          errors: {
            ...state.errors,
            [numericId]: null
          }
        }));
        
        // Check current following status
        const isCurrentlyFollowing = get().isFollowing(numericId);
        
        // Perform optimistic update
        const currentIds = [...get().followedListIds];
        const newIds = isCurrentlyFollowing 
          ? currentIds.filter(id => id !== numericId) // Remove if following
          : [...currentIds, numericId]; // Add if not following
        
        // Update the followedListIds
        set({ followedListIds: newIds });
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('followStateChanged', { 
          detail: { listId: numericId, isFollowing: !isCurrentlyFollowing }
        }));
        
        logDebug(`[useFollowStore] Toggling follow for list ${numericId}`);
        
        try {
          // Make the actual API call if we have a service function
          if (typeof toggleFollowListService === 'function') {
            try {
              const response = await toggleFollowListService(numericId);
              logDebug(`[useFollowStore] Toggle completed for list ${numericId}, success: ${response.success}`);
              
              // In case the API result differs from our optimistic update (rare), sync with actual state
              if (response && typeof response.isFollowing === 'boolean' && 
                  response.isFollowing !== !isCurrentlyFollowing) {
                set({ 
                  followedListIds: response.isFollowing 
                    ? [...currentIds.filter(id => id !== numericId), numericId] 
                    : currentIds.filter(id => id !== numericId)
                });
              }
            } catch (apiError) {
              // Log the error but preserve optimistic update for UX
              logError(`[useFollowStore] API error with toggleFollowList:`, apiError);
              // We're intentionally not rolling back the optimistic update
            }
          }
          
          // Clear loading state only for this list
          set(state => ({
            isTogglingFollow: {
              ...state.isTogglingFollow,
              [numericId]: false
            }
          }));
          
          // Return successful result
          return { 
            success: true, 
            isFollowing: !isCurrentlyFollowing 
          };
        } catch (error) {
          // This catch block is only for errors in the store logic, not API calls
          logError(`[useFollowStore] Error in follow state management:`, error);
          
          // Set error and clear loading state only for this list
          set(state => ({
            isTogglingFollow: {
              ...state.isTogglingFollow,
              [numericId]: false
            },
            errors: {
              ...state.errors,
              [numericId]: error.message || 'An error occurred managing follow state'
            }
          }));
          
          return { success: false, error };
        }
      },
      
      // Check if a list is being followed - memoized by listId
      isFollowing: (listId) => {
        if (!listId) return false;
        const numericId = parseInt(String(listId), 10);
        return get().followedListIds.includes(numericId);
      },
      
      // Add a list to followed lists directly (without API call)
      followList: (listId) => {
        const numericId = parseInt(String(listId), 10);
        const currentIds = [...get().followedListIds];
        
        if (!currentIds.includes(numericId)) {
          set({ followedListIds: [...currentIds, numericId] });
          logInfo(`[useFollowStore] Directly followed list ${numericId}`);
        }
      },
      
      // Remove a list from followed lists directly (without API call)
      unfollowList: (listId) => {
        const numericId = parseInt(String(listId), 10);
        const currentIds = [...get().followedListIds];
        
        if (currentIds.includes(numericId)) {
          set({ followedListIds: currentIds.filter(id => id !== numericId) });
          logInfo(`[useFollowStore] Directly unfollowed list ${numericId}`);
        }
      },
      
      // Clear error for a specific list
      clearError: (listId) => {
        if (!listId) return;
        const numericId = parseInt(String(listId), 10);
        
        set(state => ({
          errors: {
            ...state.errors,
            [numericId]: null
          }
        }));
      },
      
      // Clear all errors
      clearAllErrors: () => set({ errors: {} }),
      
      // Get error for a specific list
      getError: (listId) => {
        if (!listId) return null;
        const numericId = parseInt(String(listId), 10);
        return get().errors[numericId] || null;
      }
    }),
    {
      name: 'chomp-followed-lists',  // Unique name for localStorage
      getStorage: () => localStorage,
      // Only persist these specific properties
      partialize: (state) => ({ 
        followedListIds: state.followedListIds 
      }),
    }
  )
);

export default useFollowStore;
