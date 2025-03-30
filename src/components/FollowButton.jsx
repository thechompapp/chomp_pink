import React from "react";
import useAppStore from "../hooks/useAppStore";

const FollowButton = ({ listId, isFollowing }) => {
  const toggleFollowList = useAppStore((state) => state.toggleFollowList);

  const handleToggleFollow = () => {
    toggleFollowList(listId);
  };

  return (
    <button
      onClick={handleToggleFollow}
      className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
        isFollowing
          ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
          : "bg-[#D1B399] text-white hover:bg-[#b89e89]"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
};

export default FollowButton;