import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { List, Users, Heart } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";

// Memoize to prevent unnecessary re-renders
const ListCard = React.memo(
  ({ id, name, itemCount, savedCount, city, tags, isFollowing = false }) => {
    const toggleFollowList = useAppStore((state) => state.toggleFollowList);

    const handleFollow = useCallback((e) => {
      e.stopPropagation(); // Prevent event bubbling to Link
      toggleFollowList(id);
    }, [id, toggleFollowList]);

    return (
      <div className="w-72 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md relative">
        <button
          onClick={handleFollow}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow ${
            isFollowing ? "bg-[#D1B399] text-white" : "bg-gray-200 text-gray-600"
          } hover:bg-[#b89e89] hover:text-white`}
          aria-label={isFollowing ? "Unfollow list" : "Follow list"}
        >
          <Heart size={20} fill={isFollowing ? "white" : "none"} />
        </button>

        <div className="flex flex-col h-full">
          <div className="flex-1">
            <Link to={`/lists/${id}`} className="block">
              <h3 className="text-lg font-bold text-gray-900 mb-2 truncate hover:text-[#D1B399]">{name}</h3>
            </Link>

            <div className="flex items-start text-gray-500 text-sm mb-2">
              <List size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span className="truncate">{itemCount} items</span>
            </div>

            <div className="flex items-center text-gray-500 text-sm mb-3">
              <Users size={14} className="mr-1" />
              <span>{savedCount.toLocaleString()} saves</span>
            </div>

            {city && (
              <div className="text-gray-500 text-sm mb-3">
                <span>{city}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Link
              to={`/lists/${id}`}
              className="w-full py-2 border border-[#D1B399] text-[#D1B399] rounded-lg flex items-center justify-center font-medium hover:bg-[#D1B399] hover:text-white"
            >
              View
            </Link>
          </div>
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
      prevProps.tags === nextProps.tags &&
      prevProps.isFollowing === nextProps.isFollowing
    );
  }
);

export default ListCard;