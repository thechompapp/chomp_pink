// src/pages/Lists/ListCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, List, User, Eye } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import BaseCard from '@/components/UI/BaseCard';
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';

const ListCard = ({
    id,
    name,
    description,
    saved_count = 0,
    item_count = 0,
    is_following: initialIsFollowing,
    creator_handle = null,
    user_id,
    is_public = true,
}) => {
    const currentUser = useAuthStore(state => state.user);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Fetch the latest is_following state from the cache
    const { data: listData } = useQuery({
        queryKey: ['listDetails', id],
        queryFn: () => listService.getListDetails(id),
        enabled: !!id && isAuthenticated, // Only fetch if authenticated
        select: (data) => ({
            is_following: data?.is_following ?? initialIsFollowing,
            saved_count: data?.saved_count ?? saved_count,
        }),
        staleTime: 0,
    });

    const isFollowing = listData?.is_following ?? initialIsFollowing;
    const displaySavedCount = listData?.saved_count ?? saved_count;

    console.log(`[ListCard] Rendering List ID: ${id}, is_following: ${isFollowing}`);

    const displayCreatorHandle = creator_handle || 'unknown';
    const cleanName = name || 'Unnamed List';
    const displayItemCount = item_count || 0;
    const cleanDescription = description || `${displayItemCount.toLocaleString()} ${displayItemCount === 1 ? 'item' : 'items'}`;
    const linkDestination = `/lists/${id}`;

    const shouldShowFollowButton = isAuthenticated && !!id && currentUser?.id !== user_id;

    return (
        <BaseCard
            linkTo={linkDestination}
            onQuickAdd={null}
            showQuickAdd={false}
            className="w-full"
            aspectRatioClass="!aspect-auto"
            isHighlighted={!is_public}
        >
            <div key={id} className="flex flex-col h-full justify-between p-3">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                        {cleanName}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 flex items-center">
                        <User size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                        <span className="truncate">@{displayCreatorHandle}</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">
                        {cleanDescription}
                    </p>
                    <div className="flex items-center text-gray-500 text-xs mb-1">
                        <List size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                        <span>{displayItemCount.toLocaleString()} {displayItemCount === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs mb-1">
                        <Users size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                        <span>{displaySavedCount.toLocaleString()} saves</span>
                    </div>
                    {!is_public && (
                        <div className="flex items-center text-gray-500 text-xs">
                            <Eye size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            <span>Private</span>
                        </div>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 h-[31px]">
                    {shouldShowFollowButton ? (
                        <FollowButton
                            listId={id}
                            isFollowing={isFollowing}
                            savedCount={displaySavedCount}
                        />
                    ) : null}
                </div>
            </div>
        </BaseCard>
    );
};

export default ListCard;