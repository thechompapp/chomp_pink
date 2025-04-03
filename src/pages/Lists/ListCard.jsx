// src/pages/Lists/ListCard.jsx
// FIX: Remove useAppStore, import and use useUserListStore for follow state
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, List } from 'lucide-react'; // Using Users for saves, List for item count
import FollowButton from '@/components/FollowButton'; // Use '@' alias
// **FIX**: Import the specific store needed
import useUserListStore from '@/stores/useUserListStore.js'; // Use path alias and .js extension

const ListCard = React.memo(({
    id,
    name,
    description,
    saved_count = 0,
    item_count = 0,
    is_following, // Initial follow state passed as prop
    // Add other props if necessary, e.g., creator_handle, tags
}) => {

   // **FIX**: Select the specific list from the appropriate store to get potentially updated state
   // Check both userLists and followedLists for the most current data for this list card ID
   const listFromUserStore = useUserListStore(state =>
        state.userLists.find(list => list.id === id) || state.followedLists.find(list => list.id === id)
   );

   // Use the follow state from the store if the list exists there, otherwise fallback to the initial prop
   const currentFollowingState = listFromUserStore ? listFromUserStore.is_following : is_following;

   // Default values for display
   const cleanName = name || "Unnamed List";
   // Use item_count from props or store if available, default description otherwise
   const cleanDescription = description || `${listFromUserStore?.item_count ?? item_count} ${listFromUserStore?.item_count === 1 || item_count === 1 ? 'item' : 'items'}`;
   const displayItemCount = listFromUserStore?.item_count ?? item_count;
   const displaySavedCount = listFromUserStore?.saved_count ?? saved_count;

   // Log for debugging (optional)
   // console.log(`[ListCard ${id}] Initial Follow: ${is_following}, Store Follow: ${listFromUserStore?.is_following}, Current Render Follow: ${currentFollowingState}`);

  return (
     // Card structure remains the same
     <div className="group relative flex flex-col w-full min-h-[14rem] h-56 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
       {/* Card Content */}
       <div className="flex flex-col flex-grow p-4 text-left">
         {/* Top section */}
         <div className="flex-grow mb-2">
            {/* Link to List Detail Page */}
            <Link to={`/lists/${id}`} className="block mb-1.5 focus:outline-none focus:ring-1 focus:ring-[#D1B399] rounded">
               <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                 {cleanName}
               </h3>
            </Link>
           {/* Description */}
           <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">
              {cleanDescription}
           </p>
            {/* Saved Count */}
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <Users size={12} className="mr-1 flex-shrink-0" />
              <span>{displaySavedCount.toLocaleString()} saves</span>
            </div>
            {/* Item Count */}
            <div className="flex items-center text-gray-500 text-xs">
              <List size={12} className="mr-1 flex-shrink-0" />
              <span>{displayItemCount.toLocaleString()} {displayItemCount === 1 ? 'item' : 'items'}</span>
            </div>
         </div>

         {/* Follow Button section - appears at bottom */}
         <div className="mt-auto pt-3 border-t border-gray-100">
           <FollowButton
             listId={id}
             isFollowing={currentFollowingState} // Use the determined current state
             // You can add logic here if the follow button should ever be disabled
             // e.g., isFollowable={!listFromUserStore?.created_by_user} // Example: disable follow on own lists
             className="w-full !py-1.5" // Example: Override default button padding if needed
            />
         </div>
       </div>
     </div>
  );
});

export default ListCard;