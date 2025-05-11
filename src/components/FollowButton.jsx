/* src/components/FollowButton.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useCallback, useEffect } from 'react'; // Added useEffect
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Heart, HeartOff, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/UI/Button';
import useAuthStore from '@/stores/useAuthStore'; // Use default import
import { listService } from '@/services/listService';

const FollowButton = ({ listId, isFollowing: initialIsFollowing, className = '', savedCount = 0 }) => {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Fetch latest list details (including follow status and count)
    const { data: listData } = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: async () => {
            // Add basic error handling within queryFn
            try {
                return await listService.getListDetails(listId);
            } catch (error) {
                 // Don't throw here, let RQ handle it, but log for debugging
                 console.warn(`[FollowButton Query] Failed to fetch details for list ${listId}:`, error.message);
                 return null; // Return null on error
            }
        },
        enabled: !!listId && isAuthenticated, // Only fetch if ID exists and user is logged in
        select: (data) => ({ // Select only needed fields, provide defaults
            is_following: data?.is_following ?? initialIsFollowing,
            saved_count: data?.saved_count ?? savedCount,
        }),
        staleTime: 0, // Refetch immediately if invalidated
        refetchOnWindowFocus: false,
        // Use placeholderData for initial render based on props
        placeholderData: { is_following: initialIsFollowing, saved_count: savedCount }
    });

    // Use fetched data or fall back gracefully
    const isFollowing = listData?.is_following ?? initialIsFollowing;
    const currentSavedCount = listData?.saved_count ?? savedCount;

    const {
        mutate,
        isPending, // Renamed from isMutating for RQ v4/v5
        error
    } = useMutation({
        mutationFn: async () => {
            if (!listId) throw new Error("List ID is missing.");
            console.log(`[FollowButton] Toggling follow for list: ${listId}, current state: ${isFollowing}`);
            
            // CRITICAL FIX: Using toggleFollowList for consistency - this matches what the backend expects
            return await listService.toggleFollowList(listId); // Use the main service method directly
        },
        onMutate: async () => {
            // Cancel outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['listDetails', listId] });
            await queryClient.cancelQueries({ queryKey: ['userLists', 'followed'] });
            await queryClient.cancelQueries({ queryKey: ['trendingListsPage'] });

            // Snapshot previous values
            const previousListDetails = queryClient.getQueryData(['listDetails', listId]);
            const previousFollowedLists = queryClient.getQueryData(['userLists', 'followed']);
            const previousTrendingLists = queryClient.getQueryData(['trendingListsPage']);

            // Optimistically update local cache
            const optimisticUpdate = { is_following: !isFollowing, saved_count: isFollowing ? Math.max(0, currentSavedCount - 1) : currentSavedCount + 1 };

            queryClient.setQueryData(['listDetails', listId], (old) => old ? { ...old, ...optimisticUpdate } : undefined);

             // Update followed lists cache optimistically
            queryClient.setQueryData(['userLists', 'followed'], (old) => {
                 if (!Array.isArray(old)) return old; // Handle case where cache might not exist yet
                 if (!isFollowing) { // Optimistically following
                      // Add a minimal list representation if it doesn't exist
                      const exists = old.some(list => list.id === listId);
                      // Use placeholder name if details aren't fully loaded yet
                      const listName = previousListDetails?.name || '...';
                      return exists ? old : [...old, { id: listId, name: listName, is_following: true, saved_count: optimisticUpdate.saved_count }];
                 } else { // Optimistically unfollowing
                     return old.filter(list => list.id !== listId);
                 }
            });

            // Update trending lists cache optimistically
             queryClient.setQueryData(['trendingListsPage'], (old) => {
                 if (!Array.isArray(old)) return old;
                 return old.map(list =>
                     list.id === listId ? { ...list, ...optimisticUpdate } : list
                 );
             });

            return { previousListDetails, previousFollowedLists, previousTrendingLists }; // Return context for rollback
        },
        onError: (err, variables, context) => {
            console.error(`[FollowButton] Error toggling follow:`, err);
            // Rollback optimistic updates on error
            if (context?.previousListDetails) queryClient.setQueryData(['listDetails', listId], context.previousListDetails);
            if (context?.previousFollowedLists) queryClient.setQueryData(['userLists', 'followed'], context.previousFollowedLists);
            if (context?.previousTrendingLists) queryClient.setQueryData(['trendingListsPage'], context.previousTrendingLists);
             // Note: No need to set local error state, RQ handles it via the `error` variable
        },
        onSuccess: (updatedList) => {
             // This runs after the mutation is successful and the backend returned data
             console.log(`[FollowButton] Success! Server reported is_following=${updatedList?.is_following}, saved_count=${updatedList?.saved_count}`);
             // Update caches with definitive server response ONLY IF different from optimistic update
             // (or simply rely on onSettled invalidation)
              queryClient.setQueryData(['listDetails', listId], (old) =>
                 old ? { ...old, is_following: updatedList.is_following, saved_count: updatedList.saved_count } : undefined
              );
              // Update other caches if needed (might duplicate onSettled, but ensures consistency)
               queryClient.setQueryData(['userLists', 'followed'], (old) => {
                 if (!Array.isArray(old)) return old;
                 if (updatedList.is_following) {
                     const exists = old.some(list => list.id === listId);
                     return exists
                          ? old.map(list => list.id === listId ? { ...list, ...updatedList } : list)
                          : [...old, updatedList];
                 } else {
                     return old.filter(list => list.id !== listId);
                 }
              });
               queryClient.setQueryData(['trendingListsPage'], (old) => {
                  if (!Array.isArray(old)) return old;
                  return old.map(list =>
                      list.id === listId ? { ...list, is_following: updatedList.is_following, saved_count: updatedList.saved_count } : list
                  );
               });
        },
        onSettled: () => {
            // Always refetch data after mutation finishes (success or error) to ensure consistency
            console.log('[FollowButton] Mutation settled, invalidating queries.');
            queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
            queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] });
            queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] });
            // Dispatch custom event for other components (like Profile page) to listen to
            window.dispatchEvent(new Event('listFollowToggled'));
        }
    });

    const handleToggleFollow = useCallback((event) => {
        // Ensure we have an event (might be called programmatically)
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        // Extra logging for debugging
        console.log(`[FollowButton] Click handler fired for list ${listId}`);
        
        // Don't proceed if conditions aren't met
        if (!isAuthenticated || isPending || !listId) {
            console.log(`[FollowButton] Click ignored - auth: ${isAuthenticated}, pending: ${isPending}, listId: ${!!listId}`);
            return;
        }
        
        // Trigger the mutation
        mutate();
    }, [isAuthenticated, isPending, mutate, listId]);

    const dataAttributes = {
        'data-testid': `follow-button-${listId}`,
        'data-following': String(isFollowing), // Use string true/false
        'data-pending': String(isPending)
    };

    return (
        <Button
            variant={isFollowing ? "outline" : "primary"}
            size="sm"
            onClick={(e) => {
                // Stop event propagation at all costs
                if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }
                
                // Extra debug logging
                console.log(`[FollowButton] Button clicked for list ${listId}`);
                
                // Call the mutation
                if (!isPending && isAuthenticated && listId) {
                    mutate();
                }
            }}
            disabled={isPending || !listId || !isAuthenticated}
            className={`relative z-50 ${className}`}
            style={{
                pointerEvents: 'auto', // Force pointer events
                position: 'relative' // Create stacking context
            }}
            data-testid={`follow-button-${listId}`}
            data-following={String(isFollowing)}
            data-pending={String(isPending)}
            aria-label={isFollowing ? `Unfollow list` : `Follow list`}
        >
            {isPending ? (
                <Loader2 size={16} className="animate-spin mr-1" />
            ) : (
                isFollowing ? <HeartOff size={14} className="mr-1" /> : <Heart size={14} className="mr-1" />
            )}
            <span>{isPending ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}</span>
        </Button>
    );
};

export default FollowButton; // Removed React.memo as state/props change frequently