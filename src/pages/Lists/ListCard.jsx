// src/components/ListCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { List, Users } from "lucide-react";
import FollowButton from "@/components/FollowButton";

const ListCard = React.memo(
  ({
    id,
    name,
    itemCount,
    savedCount,
    city,
    tags,
    isFollowing = false,
    canFollow = true, // Default to true to enable follow functionality
    createdByUser = false,
    creatorHandle = "@user",
    isPublic
  }) => {
    return (
      <div className="w-72 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md relative flex flex-col h-full">
        {!createdByUser && (
          <div className="absolute top-3 right-3 z-10">
            <FollowButton
              listId={id}
              isFollowing={isFollowing}
              isFollowable={canFollow}
            />
          </div>
        )}
        <div className="flex-grow">
          <Link to={`/lists/${id}`} className={`block mb-2 ${!createdByUser ? 'pr-12' : ''}`}>
            <h3 className="text-lg font-bold text-gray-900 truncate hover:text-[#D1B399]">{name || "Unnamed List"}</h3>
          </Link>
          {!createdByUser && (
            <div className="text-gray-500 text-sm mb-2">Created by {creatorHandle}</div>
          )}
          <div className="flex items-start text-gray-500 text-sm mb-2">
            <List size={14} className="mr-1 mt-0.5 flex-shrink-0" />
            <span className="truncate">{itemCount || 0} items</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <Users size={14} className="mr-1" />
            <span>{(savedCount || 0).toLocaleString()} saves</span>
          </div>
          {city && (
            <div className="text-gray-500 text-sm mb-3">
              <span>{city}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {(tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                #{tag}
              </span>
            ))}
            {(tags || []).length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">...</span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Link
            to={`/lists/${id}`}
            className="block w-full py-2 border border-[#D1B399] text-[#D1B399] rounded-lg text-center font-medium hover:bg-[#D1B399] hover:text-white transition-colors duration-150"
          >
            View
          </Link>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.name === nextProps.name &&
      prevProps.itemCount === nextProps.itemCount &&
      prevProps.savedCount === nextProps.savedCount &&
      prevProps.city === nextProps.city &&
      JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags) &&
      prevProps.isFollowing === nextProps.isFollowing &&
      prevProps.canFollow === nextProps.canFollow &&
      prevProps.createdByUser === nextProps.createdByUser &&
      prevProps.creatorHandle === nextProps.creatorHandle &&
      prevProps.isPublic === nextProps.isPublic
    );
  }
);

export default ListCard;