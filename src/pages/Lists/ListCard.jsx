// src/pages/Lists/ListCard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, List, User, Eye, Lock, Unlock, Type } from 'lucide-react'; // Added Lock, Unlock, Type icons
import FollowButton from '@/components/FollowButton'; // Use alias
import BaseCard from '@/components/UI/BaseCard'; // Use alias
import useAuthStore from '@/stores/useAuthStore'; // Use alias
import { listService } from '@/services/listService'; // Use alias
import { engagementService } from '@/services/engagementService'; // <<< Import Engagement Service

const ListCard = ({
  id,
  name,
  description,
  saved_count = 0,
  item_count = 0,
  is_following: initialIsFollowing,
  creator_handle = null,
  user_id, // ID of the list creator
  is_public = true,
  type = 'mixed', // Use provided type or default 'mixed'
}) => {
  const currentUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Fetch latest following state and saved count if authenticated
  const { data: listData } = useQuery({
    queryKey: ['listDetails', id], // Use listDetails key to potentially leverage existing cache
    queryFn: () => listService.getListDetails(id),
    enabled: !!id && isAuthenticated, // Only fetch if authenticated and ID exists
    // Select only the necessary data to minimize re-renders if other details change
    select: (data) => ({
      is_following: data?.is_following ?? initialIsFollowing,
      saved_count: data?.saved_count ?? saved_count,
    }),
    staleTime: 0, // Consider a slightly longer staleTime if rapid updates aren't crucial
    refetchOnWindowFocus: false, // Avoid excessive refetches on window focus for list cards
    // placeholderData can sometimes cause issues if structure mismatch, use cautiously or omit
  });

  // Determine final values to display, prioritizing fetched data
  const isFollowing = listData?.is_following ?? initialIsFollowing;
  const displaySavedCount = listData?.saved_count ?? saved_count;
  const displayListType = type || 'mixed'; // Ensure we have a type to display

  const displayCreatorHandle = creator_handle || 'unknown';
  const cleanName = name || 'Unnamed List';
  const displayItemCount = item_count || 0;
  const cleanDescription = description || `${displayItemCount.toLocaleString()} ${displayItemCount === 1 ? 'item' : 'items'}`;
  const linkDestination = `/lists/${id}`;

  // Show follow button only if logged in, list ID exists, and user is not the creator
  const shouldShowFollowButton = isAuthenticated && !!id && currentUser?.id !== user_id;

  // <<< Handler for logging click engagement >>>
  const handleCardClick = () => {
    if (id) {
      console.log(`[ListCard] Logging click for list ID: ${id}`);
      engagementService.logEngagement({
        item_id: parseInt(id, 10), // Ensure ID is number
        item_type: 'list',
        engagement_type: 'click',
      });
    }
    // Navigation will proceed automatically via the Link component within BaseCard
  };
  // <<< End Handler >>>

  return (
    <BaseCard
      linkTo={linkDestination}
      onClick={handleCardClick} // <<< Add onClick handler here
      onQuickAdd={null} // Lists don't have quick add directly on the card
      showQuickAdd={false}
      className="w-full" // BaseCard controls height
      isHighlighted={!is_public} // Highlight private lists
      aria-label={`View list: ${cleanName}`} // Add aria-label for accessibility
    >
      {/* Inner content structure */}
      <div className="flex flex-col h-full justify-between"> {/* Ensure inner div uses full height */}
        <div> {/* Content part */}
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
            {cleanName}
          </h3>
          {/* Metadata Row 1: Creator & List Type */}
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

          {/* Description */}
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8"> {/* Fixed height for description */}
            {cleanDescription}
          </p>
          {/* Metadata Row 2: Counts & Visibility */}
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1 flex-wrap gap-x-2 gap-y-0.5">
            {/* Item Count */}
            <span className="flex items-center" title={`${displayItemCount} items`}>
                <List size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                <span>{displayItemCount.toLocaleString()} {displayItemCount === 1 ? 'item' : 'items'}</span>
            </span>
            {/* Saved Count */}
            <span className="flex items-center" title={`${displaySavedCount} saves`}>
                 <Users size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                 <span>{displaySavedCount.toLocaleString()} saves</span>
             </span>
             {/* Visibility */}
             <span className="flex items-center" title={is_public ? 'Public List' : 'Private List'}>
                 {is_public ? <Unlock size={12} className="mr-1 flex-shrink-0 text-gray-400" /> : <Lock size={12} className="mr-1 flex-shrink-0 text-gray-400" />}
                 <span>{is_public ? 'Public' : 'Private'}</span>
             </span>
          </div>
        </div>
        {/* Follow Button Section */}
        {shouldShowFollowButton && (
          <div className="mt-3 pt-3 border-t border-gray-100"> {/* Follow Button part */}
            <FollowButton
              listId={id}
              // Pass the determined isFollowing state and saved count
              isFollowing={isFollowing}
              savedCount={displaySavedCount}
              // Optional: Callback if specific action needed after toggle besides query invalidation
              // onToggle={() => console.log('Follow toggled')}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default ListCard;