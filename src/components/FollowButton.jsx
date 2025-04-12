import React, { useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Heart, HeartOff, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/UI/Button';
// Corrected: Use default import for useAuthStore
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';

const FollowButton = ({ listId, isFollowing: initialIsFollowing, className = '', savedCount = 0 }) => {
    const queryClient = useQueryClient();
    // Correct usage after default import
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Fetch list details to get the latest following status and count
    const { data: listData } = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: () => listService.getListDetails(listId),
        enabled: !!listId && isAuthenticated, // Only fetch if needed and authenticated
        select: (data) => ({ // Select only the needed fields
            is_following: data?.is_following ?? initialIsFollowing,
            saved_count: data?.saved_count ?? savedCount,
        }),
        staleTime: 0, // Consider a small staleTime if immediate refetch isn't always needed
        refetchOnWindowFocus: false, // Avoid refetching just on focus
    });

    // Use fetched data or fall back to initial props
    const isFollowing = listData?.is_following ?? initialIsFollowing;
    const currentSavedCount = listData?.saved_count ?? savedCount;

    const {
        mutate,
        isPending,
        error
    } = useMutation({
        mutationFn: async () => {
            if (!listId) throw new Error("List ID is missing.");
            console.log(`[FollowButton] Toggling follow for list: ${listId}, current state: ${isFollowing}`);
            // listService.toggleFollow should return the updated list state { id, is_following, saved_count }
            return await listService.toggleFollow(listId);
        },
        // Optimistic Update (Optional but good for UX)
        onMutate: async () => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['listDetails', listId] });
            await queryClient.cancelQueries({ queryKey: ['userLists', 'followed'] });
            await queryClient.cancelQueries({ queryKey: ['trendingListsPage'] });


            // Snapshot the previous value
            const previousListDetails = queryClient.getQueryData(['listDetails', listId]);
            const previousFollowedLists = queryClient.getQueryData(['userLists', 'followed']);
             const previousTrendingLists = queryClient.getQueryData(['trendingListsPage']);

            // Optimistically update to the new value
            const optimisticUpdate = { is_following: !isFollowing, saved_count: isFollowing ? currentSavedCount - 1 : currentSavedCount + 1 };

             queryClient.setQueryData(['listDetails', listId], (old) =>
                 old ? { ...old, ...optimisticUpdate } : undefined
             );

            queryClient.setQueryData(['userLists', 'followed'], (old) => {
                 if (!old || !Array.isArray(old)) return old;
                 if (!isFollowing) { // If we are following now
                      // Add a minimal representation of the list if not already present
                      const exists = old.some(list => list.id === listId);
                      return exists ? old : [...old, { id: listId, name: '...', is_following: true, saved_count: optimisticUpdate.saved_count }]; // Add minimal data
                 } else { // If we are unfollowing
                     return old.filter(list => list.id !== listId);
                 }
            });

            queryClient.setQueryData(['trendingListsPage'], (old) => {
                 if (!old || !Array.isArray(old)) return old;
                 return old.map(list =>
                     list.id === listId ? { ...list, ...optimisticUpdate } : list
                 );
            });


            // Return a context object with the snapshotted value
            return { previousListDetails, previousFollowedLists, previousTrendingLists };
        },
        onError: (err, variables, context) => {
            console.error(`[FollowButton] Error toggling follow:`, err);
            // Rollback on error
            if (context?.previousListDetails) {
                queryClient.setQueryData(['listDetails', listId], context.previousListDetails);
            }
             if (context?.previousFollowedLists) {
                queryClient.setQueryData(['userLists', 'followed'], context.previousFollowedLists);
            }
            if (context?.previousTrendingLists) {
                queryClient.setQueryData(['trendingListsPage'], context.previousTrendingLists);
            }
        },
        onSuccess: (updatedList) => {
             console.log(`[FollowButton] Success! Server reported is_following=${updatedList?.is_following}, saved_count=${updatedList?.saved_count}`);
             // Update caches with the definitive server response
             queryClient.setQueryData(['listDetails', listId], (old) =>
                 old ? { ...old, is_following: updatedList.is_following, saved_count: updatedList.saved_count } : undefined
             );
            // We might not need to manually update userLists/trendingLists here if onSettled invalidates,
            // but explicit update ensures consistency if invalidation is slow/fails.
             queryClient.setQueryData(['userLists', 'followed'], (old) => {
                 if (!old || !Array.isArray(old)) return old;
                 if (updatedList.is_following) {
                     const exists = old.some(list => list.id === listId);
                      // Update existing or add the full new list data
                     return exists
                          ? old.map(list => list.id === listId ? { ...list, ...updatedList } : list)
                          : [...old, updatedList];
                 } else {
                     return old.filter(list => list.id !== listId);
                 }
            });
             queryClient.setQueryData(['trendingListsPage'], (old) => {
                 if (!old || !Array.isArray(old)) return old;
                 return old.map(list =>
                     list.id === listId ? { ...list, is_following: updatedList.is_following, saved_count: updatedList.saved_count } : list
                 );
             });
        },
        onSettled: () => {
            console.log('[FollowButton] Mutation settled, invalidating queries to ensure freshness.');
            // Invalidate queries after mutation settles to refetch data from server
            queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
            queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] });
            queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] });
            // Notify profile page or other listeners
            window.dispatchEvent(new Event('listFollowToggled'));
        }
    });

    const handleToggleFollow = useCallback((event) => {
        // Prevent event bubbling/default actions if necessary (e.g., if inside a link card)
        event.stopPropagation();
        event.preventDefault();

        if (!isAuthenticated || isPending || !listId) return;

        mutate(); // Trigger the mutation
    }, [isAuthenticated, isPending, mutate, listId]); // Dependencies

    // Add data attributes for testing or debugging
    const dataAttributes = {
        'data-testid': `follow-button-${listId}`,
        'data-following': isFollowing ? 'true' : 'false',
        'data-pending': isPending ? 'true' : 'false'
    };

    return (
        <>
            <Button
                variant={isFollowing ? "tertiary" : "primary"}
                size="sm"
                onClick={handleToggleFollow}
                disabled={isPending || !listId} // Disable while mutating or if listId is missing
                className={`flex items-center justify-center gap-1 transition-opacity w-full ${isPending ? 'opacity-70' : ''} ${className}`}
                aria-label={isFollowing ? `Unfollow list` : `Follow list`}
                aria-live="polite" // Announce changes for screen readers
                {...dataAttributes}
            >
                {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    // Use different icons based on following state
                    isFollowing ? <HeartOff size={14} /> : <Heart size={14} />
                )}
                {/* Change button text based on state */}
                <span>{isPending ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}</span>
                {/* Optional: Display count - consider placement */}
                {/* <span className="text-xs ml-1">({currentSavedCount})</span> */}
            </Button>
            {/* Display mutation error */}
            {error && (
                <p role="alert" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> {error.message || 'Action failed'}
                </p>
            )}
        </>
    );
};

export default FollowButton;