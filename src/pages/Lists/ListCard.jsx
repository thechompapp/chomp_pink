// src/pages/Lists/ListCard.jsx
import React from 'react';
import { Users, List, User, Eye } from 'lucide-react';
import FollowButton from '@/components/FollowButton'; // Import FollowButton
import BaseCard from '@/components/UI/BaseCard';
import useAuthStore from '@/stores/useAuthStore'; // Import useAuthStore

// Define the component function first
const ListCardComponent = ({
  id,
  name,
  description,
  saved_count = 0,
  item_count = 0,
  is_following, // Use this for initial state
  creator_handle = null, // Use this for display
  user_id, // Need the list owner's ID
  is_public = true,
  // showFollowButton prop is no longer needed, logic is internal
}) => {
  // Get current user directly within the component
  const currentUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const displayCreatorHandle = creator_handle || 'unknown';
  const cleanName = name || 'Unnamed List';
  const displayItemCount = item_count || 0;
  const displaySavedCount = saved_count || 0;
  const cleanDescription = description || `${displayItemCount.toLocaleString()} ${displayItemCount === 1 ? 'item' : 'items'}`;
  const linkDestination = `/lists/${id}`;

  // Determine if the follow button should be shown
  // Show if: user is logged in AND the list exists AND the current user is NOT the owner
  const shouldShowFollowButton = isAuthenticated && !!id && currentUser?.id !== user_id;

  return (
    <BaseCard
      linkTo={linkDestination}
      onQuickAdd={null} // No quick add for List cards
      showQuickAdd={false}
      className="w-full"
      aspectRatioClass="!aspect-auto" // Lists don't need fixed aspect ratio
      isHighlighted={!is_public}
    >
      <div key={id} className="flex flex-col h-full justify-between p-3">
        <div> {/* Top Content Area */}
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
            {cleanName}
          </h3>
          {/* Display Creator Handle */}
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
        {/* Follow Button Area - Render conditionally */}
        <div className="mt-3 pt-3 border-t border-gray-100 h-[31px]"> {/* Maintain height */}
           {shouldShowFollowButton ? (
             <FollowButton
               listId={id}
               isFollowing={is_following} // Pass initial state
             />
           ) : (
                // Optionally show something else if the user is the owner,
                // or just leave empty space as the h-[31px] does.
                // <span className="text-xs text-gray-400">Your List</span>
                null
           )}
        </div>
      </div>
    </BaseCard>
  );
};

// Wrap the component definition with React.memo
const ListCard = React.memo(ListCardComponent);

export default ListCard;