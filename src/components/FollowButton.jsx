// src/components/FollowButton.jsx
import React, { useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Heart, HeartOff, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';

const FollowButton = ({ listId, isFollowing: initialIsFollowing, className = '', savedCount = 0 }) => {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Fetch the latest is_following state from the cache
    const { data: listData } = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: () => listService.getListDetails(listId),
        enabled: !!listId && isAuthenticated, // Only fetch if authenticated
        select: (data) => ({
            is_following: data?.is_following ?? initialIsFollowing,
            saved_count: data?.saved_count ?? savedCount,
        }),
        staleTime: 0,
    });

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
            return await listService.toggleFollow(listId);
        },
        onSuccess: (updatedList) => {
            console.log(`[FollowButton] Success! Server reported is_following=${updatedList?.is_following}, saved_count=${updatedList?.saved_count}`);

            // Update all relevant caches
            queryClient.setQueryData(['trendingListsPage'], (old) => {
                if (!old || !Array.isArray(old)) return old;
                const updated = old.map(list =>
                    list.id === listId
                        ? { ...list, is_following: updatedList.is_following, saved_count: updatedList.saved_count }
                        : list
                );
                console.log('[FollowButton] Updated trendingListsPage:', updated);
                return updated;
            });

            queryClient.setQueryData(['userLists', 'followed'], (old) => {
                if (!old || !Array.isArray(old)) return old;
                if (updatedList.is_following) {
                    const exists = old.some(list => list.id === updatedList.id);
                    if (!exists) {
                        return [...old, updatedList];
                    }
                } else {
                    return old.filter(list => list.id !== listId);
                }
                return old;
            });

            queryClient.setQueryData(['listDetails', listId], (old) =>
                old ? { ...old, is_following: updatedList.is_following, saved_count: updatedList.saved_count } : old
            );
        },
        onError: (err) => {
            console.error(`[FollowButton] Error toggling follow:`, err);
        },
        onSettled: () => {
            console.log('[FollowButton] Settled, forcing refetch of all affected queries');
            queryClient.refetchQueries({ queryKey: ['trendingListsPage'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['userLists', 'followed'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['listDetails', listId], type: 'active' });
        }
    });

    const handleToggleFollow = useCallback((event) => {
        event.stopPropagation();
        event.preventDefault();

        if (!isAuthenticated || isPending || !listId) return;

        mutate();
    }, [isAuthenticated, isPending, mutate, listId]);

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
                disabled={isPending || !listId}
                className={`flex items-center justify-center gap-1 transition-opacity w-full ${isPending ? 'opacity-70' : ''} ${className}`}
                aria-label={isFollowing ? `Unfollow list` : `Follow list`}
                aria-live="polite"
                {...dataAttributes}
            >
                {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    isFollowing ? <HeartOff size={14} /> : <Heart size={14} />
                )}
                <span>{isPending ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}</span>
            </Button>
            {error && (
                <p role="alert" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> {error.message || 'Action failed'}
                </p>
            )}
        </>
    );
};

export default FollowButton;