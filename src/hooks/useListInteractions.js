import { useCallback, useMemo } from 'react';
import { listService } from '@/services/listService';
import { engagementService } from '@/services/engagementService';
import useFollowStore from '@/stores/useFollowStore';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { logDebug, logError } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Provides standardized list interaction handlers to manage following, clicking, and
 * other common interactions across list-related components
 * 
 * @param {Object} list - The list object
 * @param {Object} options - Configuration options
 * @param {Function} options.onListClick - Optional handler for list click
 * @returns {Object} Object containing list interaction functions and states
 */
export function useListInteractions(list, options = {}) {
  const { onListClick } = options;
  const listId = list?.id;
  const { user, isAuthenticated  } = useAuth();
  const queryClient = useQueryClient();
  
  // Get follow state from Zustand store
  const { 
    isFollowing, 
    toggleFollowStatus 
  } = useFollowStore();
  
  // Get loading state for this specific list
  const isProcessingFollow = useFollowStore(
    state => listId ? state.isTogglingFollow[listId] || false : false
  );
  
  // Determine current follow status
  const followStatus = useMemo(() => 
    listId ? isFollowing(listId) : false, 
  [listId, isFollowing]);
  
  // Determine if user owns this list - centralized ownership check logic
  const isOwnList = useMemo(() => 
    Boolean(user && list && (
      // Direct ID comparison with type conversion for safety
      user.id === list.user_id || 
      Number(user.id) === Number(list.user_id) || 
      // Check different property patterns across components
      list.created_by_user === true ||
      list.creator_username === user.username ||
      (user.username && list.creator_handle && 
       user.username.toLowerCase() === list.creator_handle.toLowerCase())
    )),
  [user, list]);
  
  // Handle list click with engagement logging
  const handleListClick = useCallback((e) => {
    if (!listId) return;
    
    // Prevent default if it's an event
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Log engagement
    engagementService.logEngagement({
      item_id: parseInt(String(listId), 10),
      item_type: 'list',
      engagement_type: 'click',
    }).catch(err => {
      logError('[useListInteractions] Failed to log engagement:', err);
    });
    
    logDebug(`[useListInteractions] List ${listId} clicked`);
    
    // Call external handler if provided
    if (onListClick) {
      onListClick(listId, list);
    }
  }, [listId, list, onListClick]);
  
  // Handle follow/unfollow toggle with error handling
  const handleToggleFollow = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Guard conditions
    if (!listId || isOwnList || isProcessingFollow || !isAuthenticated) {
      if (!isAuthenticated) {
        alert('Please log in to follow lists.');
      }
      return { success: false, message: 'Cannot toggle follow state' };
    }
    
    try {
      logDebug(`[useListInteractions] Toggling follow for list ${listId}`);
      
      // Log the engagement event
      engagementService.logEngagement({
        item_id: parseInt(String(listId), 10),
        item_type: 'list',
        engagement_type: followStatus ? 'unfollow' : 'follow',
      }).catch(err => {
        logError('[useListInteractions] Failed to log follow engagement:', err);
      });
      
      // Perform the toggle operation
      const result = await toggleFollowStatus(listId, listService.toggleFollowList);
      
      // Invalidate relevant queries to ensure UI consistency
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['lists', 'following', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
      }
      
      return result;
    } catch (error) {
      logError(`[useListInteractions] Error toggling follow for list ${listId}:`, error);
      return { success: false, error };
    }
  }, [listId, isOwnList, isProcessingFollow, isAuthenticated, toggleFollowStatus, followStatus, user, queryClient]);
  
  return {
    listId,
    isOwnList,
    followStatus,
    isProcessingFollow,
    isAuthenticated,
    user,
    handleListClick,
    handleToggleFollow
  };
}

export default useListInteractions; 