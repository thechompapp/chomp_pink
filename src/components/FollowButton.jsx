// src/components/FollowButton.jsx
import React from "react";
import useAppStore from "../hooks/useAppStore.js";

const FollowButton = ({
  listId,
  isFollowing,
  isFollowable = true // Default to true to enable by default
}) => {
  const toggleFollowList = useAppStore((state) => state.toggleFollowList);
  const isLoading = useAppStore((state) => state.isLoadingUserLists || state.isInitializing);

  const handleToggleFollow = async (e) => {
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

    try {
      await toggleFollowList(listId);
      console.log(`[FollowButton] Toggled follow for listId: ${listId}, new state: ${!isFollowing}`);
    } catch (error) {
      console.error("[FollowButton] Error toggling follow:", error);
    }
  };

  const isDisabled = isLoading || !isFollowable || listId === undefined || listId === null;

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isDisabled}
      className={`px-3 py-1.5 rounded-lg font-medium text-sm flex items-center justify-center transition-colors duration-150 ${
        isFollowing
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-[#D1B399] text-white hover:bg-[#b89e89]"
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-pressed={!!isFollowing}
      aria-label={isFollowing ? `Unfollow list ${listId}` : `Follow list ${listId}`}
      title={!isFollowable && !isLoading ? "Manage follows in My Lists" : ""}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
};

export default FollowButton;