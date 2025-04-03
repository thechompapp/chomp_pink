// src/components/FollowButton.jsx
// UPDATE: Use useUserListStore
import React from "react";
// Import specific store needed
import useUserListStore from '@/stores/useUserListStore.js';
import { Loader2 } from 'lucide-react'; // Import loader

const FollowButton = ({
  listId,
  isFollowing, // This prop reflects the initial state passed down
  isFollowable = true, // Default to true to enable by default
  className = "", // Allow passing additional classes
  ...props // Pass other props like size, style etc.
}) => {
  // Select the action and relevant loading/error state from the store
  const toggleFollowList = useUserListStore((state) => state.toggleFollowList);
  const isTogglingFollow = useUserListStore((state) => state.isTogglingFollow);
  // Optional: Get error state if you want to show specific feedback on the button
  // const toggleFollowError = useUserListStore((state) => state.toggleFollowError);

  const handleToggleFollow = async (e) => {
    e.preventDefault(); // Prevent default link behavior if wrapped in <a>
    e.stopPropagation(); // Prevent event bubbling if nested

    if (!isFollowable) {
      console.log(`[FollowButton] Clicked for listId: ${listId}, but action is disabled (isFollowable=false).`);
      return;
    }

    // Ensure listId is valid before proceeding
    if (listId === undefined || listId === null) {
      console.error("[FollowButton] listId is missing or invalid!");
      return;
    }

    // Prevent action if already processing
    if (isTogglingFollow) return;

    try {
      // Call the store action. Loading/error state is handled by the store.
      await toggleFollowList(listId);
      console.log(`[FollowButton] toggleFollowList action completed for listId: ${listId}`);
    } catch (error) {
      // Error is handled/set within the store action.
      console.error("[FollowButton] Error calling toggleFollowList action:", error);
      // Optionally show temporary error feedback here if needed
    }
  };

  // Determine if the button should be disabled
  const isDisabled = isTogglingFollow || !isFollowable || listId === undefined || listId === null;

  // Dynamic class based on following state and disabled state
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
      aria-pressed={!!isFollowing} // Accessibility attribute
      aria-label={isFollowing ? `Unfollow list ${listId}` : `Follow list ${listId}`}
      title={!isFollowable && !isDisabled ? "Manage follows in My Lists" : ""} // Tooltip if not followable
      {...props} // Spread other props
    >
      {isTogglingFollow ? (
          <Loader2 size={16} className="animate-spin" />
      ) : (
          isFollowing ? "Unfollow" : "Follow"
      )}
    </button>
  );
};

export default FollowButton;