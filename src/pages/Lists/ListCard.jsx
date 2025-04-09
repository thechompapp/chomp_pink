// src/pages/Lists/ListCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, List, User, Lock, Unlock, Type } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import BaseCard from '@/components/UI/BaseCard';
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';
import { engagementService } from '@/services/engagementService'; // Updated import to remove .js

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
    type = 'mixed',
    tags = [],
}) => {
    const currentUser = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const initialSelectedData = React.useMemo(
        () => ({
            is_following: initialIsFollowing,
            saved_count: saved_count,
        }),
        [initialIsFollowing, saved_count]
    );

    const { data: listData } = useQuery({
        queryKey: ['listDetails', id],
        queryFn: async () => {
            try {
                return await listService.getListDetails(id);
            } catch (error) {
                console.warn(`[ListCard] Failed to fetch details queryFn for list ${id}:`, error.message);
                return null;
            }
        },
        enabled: !!id && isAuthenticated,
        select: (data) => {
            if (!data) return initialSelectedData;
            return {
                is_following: data?.is_following ?? initialIsFollowing,
                saved_count: data?.saved_count ?? saved_count,
            };
        },
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        initialData: initialSelectedData,
        placeholderData: initialSelectedData,
    });

    const isFollowing = listData?.is_following ?? initialIsFollowing;
    const displaySavedCount = listData?.saved_count ?? saved_count;

    const displayListType = type || 'mixed';
    const safeTags = Array.isArray(tags) ? tags : [];
    const displayCreatorHandle = creator_handle || 'unknown';
    const cleanName = name || 'Unnamed List';
    const displayItemCount = item_count || 0;
    const cleanDescription = description || `${displayItemCount.toLocaleString()} ${displayItemCount === 1 ? 'item' : 'items'}`;
    const linkDestination = `/lists/${id}`;
    const shouldShowFollowButton = isAuthenticated && !!id && currentUser?.id !== user_id;

    const handleCardClick = () => {
        if (id) {
            console.log(`[ListCard] Logging click for list ID: ${id}`);
            engagementService.logEngagement({
                item_id: parseInt(String(id), 10),
                item_type: 'list',
                engagement_type: 'click',
            }).catch((err) => {
                console.error('[ListCard] Failed to log click engagement:', err);
            });
        }
    };

    return (
        <BaseCard
            linkTo={linkDestination}
            onClick={handleCardClick}
            onQuickAdd={null}
            showQuickAdd={false}
            className="w-full"
            isHighlighted={!is_public}
            aria-label={`View list: ${cleanName}`}
        >
            <div className="flex flex-col h-full justify-between">
                <div className="flex-grow min-h-0 overflow-hidden">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                        {cleanName}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1 gap-2">
                        <span className="flex items-center truncate" title={`Created by @${displayCreatorHandle}`}>
                            <User size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            <span className="truncate">@{displayCreatorHandle}</span>
                        </span>
                        <span className="flex items-center flex-shrink-0 capitalize" title={`List type: ${displayListType}`}>
                            <Type size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            {displayListType}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{cleanDescription}</p>
                    <div className="flex items-center justify-between text-gray-500 text-xs flex-wrap gap-x-2 gap-y-0.5">
                        <span className="flex items-center" title={`${displayItemCount} items`}>
                            <List size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            <span>{displayItemCount.toLocaleString()} item{displayItemCount !== 1 ? 's' : ''}</span>
                        </span>
                        <span className="flex items-center" title={`${displaySavedCount} saves`}>
                            <Users size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            <span>{displaySavedCount.toLocaleString()} save{displaySavedCount !== 1 ? 's' : ''}</span>
                        </span>
                        <span className="flex items-center" title={is_public ? 'Public List' : 'Private List'}>
                            {is_public ? (
                                <Unlock size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            ) : (
                                <Lock size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            )}
                            <span>{is_public ? 'Public' : 'Private'}</span>
                        </span>
                    </div>
                    {safeTags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {safeTags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">
                                    #{tag}
                                </span>
                            ))}
                            {safeTags.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                                    +{safeTags.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {shouldShowFollowButton && (
                    <div className="mt-auto pt-3 border-t border-gray-100 flex-shrink-0">
                        <FollowButton listId={id} isFollowing={isFollowing} savedCount={displaySavedCount} />
                    </div>
                )}
            </div>
        </BaseCard>
    );
};

export default ListCard;