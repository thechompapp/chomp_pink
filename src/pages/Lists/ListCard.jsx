import React, { useMemo } from 'react';
import { Users, List, User } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import useUserListStore from '@/stores/useUserListStore.js';
import useAuthStore from '@/stores/useAuthStore';
import BaseCard from '@/components/UI/BaseCard';

const ListCard = React.memo(({
    id,
    name,
    description,
    saved_count = 0,
    item_count = 0,
    is_following,
    created_by_user = false,
    creator_handle = null, // Add prop for creator handle
}) => {
    const listFromUserStore = useMemo(() => {
        const state = useUserListStore.getState();
        return state.userLists.find(list => list.id === id) || 
               state.followedLists.find(list => list.id === id);
    }, [id]);

    const { user } = useAuthStore(); // Get current user
    const isOwnList = created_by_user || (listFromUserStore && listFromUserStore.created_by_user);

    // Use handle from props or fallback to store data
    const displayCreatorHandle = creator_handle || listFromUserStore?.creator_handle || null;

    const currentFollowingState = listFromUserStore?.is_following ?? is_following;
    const cleanName = name || "Unnamed List";
    const displayItemCount = listFromUserStore?.item_count ?? item_count;
    const displaySavedCount = listFromUserStore?.saved_count ?? saved_count;
    const cleanDescription = description || `${displayItemCount.toLocaleString()} ${displayItemCount === 1 ? 'item' : 'items'}`;
    const linkDestination = `/lists/${id}`;

    return (
        <BaseCard linkTo={linkDestination} onQuickAdd={null}>
            <>
                <div className="flex-grow mb-2">
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                        {cleanName}
                    </h3>
                    
                    {/* Add creator handle display */}
                    {displayCreatorHandle && (
                        <p className="text-xs text-gray-600 mb-1.5 flex items-center">
                            <User size={12} className="mr-1 flex-shrink-0" />
                            <span>@{displayCreatorHandle}</span>
                        </p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">
                        {cleanDescription}
                    </p>
                    <div className="flex items-center text-gray-500 text-xs mb-1">
                        <Users size={12} className="mr-1 flex-shrink-0" />
                        <span>{displaySavedCount.toLocaleString()} saves</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs">
                        <List size={12} className="mr-1 flex-shrink-0" />
                        <span>{displayItemCount.toLocaleString()} {displayItemCount === 1 ? 'item' : 'items'}</span>
                    </div>
                </div>
                {!isOwnList && ( // Only show FollowButton if not the creator
                    <div className="mt-auto pt-3 border-t border-gray-100">
                        <FollowButton
                            listId={id}
                            isFollowing={currentFollowingState}
                            className="w-full !py-1.5"
                        />
                    </div>
                )}
            </>
        </BaseCard>
    );
});

export default ListCard;