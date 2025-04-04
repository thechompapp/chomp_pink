// src/pages/Lists/ListCard.jsx
import React from 'react';
// Removed Link import as BaseCard handles it
import { Users, List } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import useUserListStore from '@/stores/useUserListStore.js';
import BaseCard from '@/components/UI/BaseCard'; // Import BaseCard

const ListCard = React.memo(({
    id,
    name,
    description,
    saved_count = 0, // Renamed from adds for clarity specific to lists
    item_count = 0,
    is_following,
    // Add creator_handle if needed for display
    // creator_handle
}) => {

   // Logic to get potentially updated state from store remains the same
   const listFromUserStore = useUserListStore(state =>
        state.userLists.find(list => list.id === id) || state.followedLists.find(list => list.id === id)
   );
   const currentFollowingState = listFromUserStore ? listFromUserStore.is_following : is_following;

   const cleanName = name || "Unnamed List";
   const displayItemCount = listFromUserStore?.item_count ?? item_count;
   const displaySavedCount = listFromUserStore?.saved_count ?? saved_count; // Use saved_count
   // Use description prop first, fallback to item count
   const cleanDescription = description || `${displayItemCount.toLocaleString()} ${displayItemCount === 1 ? 'item' : 'items'}`;

   const linkDestination = `/lists/${id}`;

  return (
     // Use BaseCard for overall structure and link, pass null for onQuickAdd
     <BaseCard linkTo={linkDestination} onQuickAdd={null}>
       {/* Content specific to List Card passed as children */}
       <>
         {/* Top section */}
         <div className="flex-grow mb-2">
            {/* BaseCard provides the Link, so only render content */}
            <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
              {cleanName}
            </h3>
           {/* Description */}
           <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">
              {cleanDescription}
           </p>
            {/* Saved Count (using Users icon like RestaurantCard for adds/saves) */}
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <Users size={12} className="mr-1 flex-shrink-0" />
              <span>{displaySavedCount.toLocaleString()} saves</span>
            </div>
            {/* Item Count */}
            <div className="flex items-center text-gray-500 text-xs">
              <List size={12} className="mr-1 flex-shrink-0" />
              <span>{displayItemCount.toLocaleString()} {displayItemCount === 1 ? 'item' : 'items'}</span>
            </div>
             {/* Optionally display creator handle if needed */}
             {/* creator_handle && <p className="text-xs text-gray-400 mt-1">By {creator_handle}</p> */}
         </div>

         {/* Follow Button section */}
         <div className="mt-auto pt-3 border-t border-gray-100">
           <FollowButton
             listId={id}
             isFollowing={currentFollowingState}
             // Example: disable follow on own lists (requires creator info)
             // isFollowable={!listFromUserStore?.created_by_user}
             className="w-full !py-1.5" // Example style override
            />
         </div>
       </>
     </BaseCard>
  );
});

export default ListCard;