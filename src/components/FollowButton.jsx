import React, { memo, useCallback } from 'react';
import useUserListStore from '@/stores/useUserListStore';
import { Loader2 } from 'lucide-react';

const FollowButton = memo(({
    listId,
    isFollowing,
    isFollowable = true,
    className = "",
    ...props
}) => {
    const toggleFollowList = useUserListStore((state) => state.toggleFollowList);
    const isTogglingFollow = useUserListStore((state) => state.isTogglingFollow);

    const handleToggleFollow = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isFollowable) {
            console.log(`[FollowButton] Clicked for listId: ${listId}, but action is disabled (isFollowable=false).`);
            return;
        }

        if (listId === undefined || listId === null) {
            console.error("[FollowButton] listId is missing or invalid!");
            return;
        }

        if (isTogglingFollow) return;

        try {
            await toggleFollowList(listId);
            console.log(`[FollowButton] toggleFollowList action completed for listId: ${listId}`);
        } catch (error) {
            console.error("[FollowButton] Error calling toggleFollowList action:", error);
        }
    }, [listId, isFollowable, isTogglingFollow, toggleFollowList]);

    const isDisabled = isTogglingFollow || !isFollowable || listId === undefined || listId === null;

    const buttonClasses = `
        px-3 py-1.5 rounded-lg font-medium text-sm flex items-center justify-center
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399]
        ${isFollowing
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-[#D1B399] text-white hover:bg-[#b89e89]"
        }
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
    `;

    return (
        <button
            onClick={handleToggleFollow}
            disabled={isDisabled}
            className={buttonClasses}
            aria-pressed={!!isFollowing}
            aria-label={isFollowing ? `Unfollow list ${listId}` : `Follow list ${listId}`}
            title={!isFollowable && !isDisabled ? "Manage follows in My Lists" : ""}
            {...props}
        >
            {isTogglingFollow ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                isFollowing ? "Unfollow" : "Follow"
            )}
        </button>
    );
});

export default FollowButton;