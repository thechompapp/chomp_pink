// src/components/FollowButton.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import useUserListStore from '@/stores/useUserListStore';
import useAuthStore from '@/stores/useAuthStore';

const FollowButton = ({ listId, isFollowing: initialIsFollowing, className = '' }) => {
    // State for loading feedback during the API call
    const [isLoading, setIsLoading] = useState(false);
    // Local state for errors specific to this button action
    const [localError, setLocalError] = useState(null);

    // Get necessary store actions and auth state
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const toggleFollowAction = useUserListStore(state => state.toggleFollow); // Renamed action in store
    const storeError = useUserListStore(state => state.error);
    const isTogglingFollow = useUserListStore(state => state.isTogglingFollow); // Get loading state from store
    const clearStoreError = useUserListStore(state => state.clearError);

    // Use the initial prop as the source of truth, React Query invalidation will update the parent's data
    const currentFollowState = initialIsFollowing;

    // Clear local error if store error changes or disappears
    useEffect(() => {
        if (localError && !storeError) {
            setLocalError(null);
        }
        // Sync local error if store has an error related to *this* button's action
        if (storeError && isTogglingFollow === listId && !localError) {
            setLocalError(storeError);
        }
    }, [storeError, localError, isTogglingFollow, listId]);

    // Handler for the follow/unfollow action
    const handleToggleFollow = useCallback(async () => {
        setLocalError(null); // Clear local error on new attempt
        clearStoreError?.(); // Clear store error

        if (!isAuthenticated) {
            console.warn("FollowButton: User not authenticated.");
            setLocalError("Please log in to follow lists."); // Set local error
            return;
        }
        if (!listId) {
            console.error("FollowButton: listId is missing.");
            setLocalError("Cannot follow list: ID missing.");
            return;
        }

        setIsLoading(true); // Use local loading state for immediate feedback

        try {
            // Call the store action which handles the API and invalidates queries
            await toggleFollowAction(listId);
            // No need to update local state, parent component will re-render with new prop from query data
        } catch (err) {
            console.error(`FollowButton: Error toggling follow for list ${listId}:`, err);
            // Error state is set within the store action, but also set locally for display here
            setLocalError(err.message || 'Failed to update follow status');
        } finally {
            setIsLoading(false); // Clear local loading state
        }
    }, [listId, isAuthenticated, toggleFollowAction, clearStoreError]); // Dependencies

    // Determine button text and icon based on the prop passed down
    const buttonText = currentFollowState ? 'Unfollow' : 'Follow';
    const IconComponent = currentFollowState ? HeartOff : Heart;
    // Use combined loading state (local OR store's loading state for this specific list)
    const isProcessing = isLoading || isTogglingFollow === listId;

    return (
        <>
            <Button
                variant={currentFollowState ? "tertiary" : "primary"}
                size="sm"
                onClick={handleToggleFollow}
                disabled={isProcessing || !listId}
                className={`flex items-center justify-center gap-1 transition-opacity w-full ${isProcessing ? 'opacity-70' : ''} ${className}`}
                aria-label={currentFollowState ? `Unfollow list` : `Follow list`}
                aria-live="polite"
            >
                {isProcessing ? (
                   <Loader2 size={16} className="animate-spin" />
                ) : (
                   <IconComponent size={14} />
                )}
                <span>{isProcessing ? '...' : buttonText}</span>
            </Button>
            {/* Display local error below button */}
            {localError && (
                <p role="alert" className="text-xs text-red-500 mt-1">{localError}</p>
            )}
        </>
    );
};

export default React.memo(FollowButton); // Memoize if props don't change often