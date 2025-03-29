import React, { useState } from 'react'; // Explicitly ensure React is imported
import { Link } from 'react-router-dom';
import { Bookmark, Users, UserPlus } from "lucide-react";
import useAppStore from '../../hooks/useAppStore';

const ListCard = ({ id = 1, name, itemCount = 0, isPublic = true, savedCount = Math.floor(Math.random() * 500) + 50 }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const toggleFollowList = useAppStore((state) => state.toggleFollowList);

  const handleFollow = () => {
    toggleFollowList(id);
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="w-72 h-64 bg-[#D1B399] bg-opacity-10 border border-[#D1B399] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative">
      <button
        onClick={handleFollow}
        className="absolute top-3 right-3 w-10 h-10 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow hover:bg-[#b89e89] transition-colors"
        aria-label={isFollowing ? "Unfollow list" : "Follow list"}
      >
        <UserPlus size={24} /> {/* Prominent Follow button */}
      </button>
      <div className="h-full flex flex-col justify-between">
        <div>
          <Link to={`/lists/${id}`} className="block">
            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate hover:text-[#D1B399] transition-colors pr-8">{name}</h3>
          </Link>
          <div className="flex items-start text-gray-500 text-sm">
            <Bookmark size={14} className="mr-1 mt-0.5 flex-shrink-0" />
            <span className="truncate">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <Users size={14} className="mr-1" />
            <span>{savedCount.toLocaleString()} adds</span>
          </div>
        </div>
        <div className="my-3 flex items-center">
          <span className="px-2 py-0.5 border border-[#D1B399] rounded-full text-xs text-gray-700">
            {isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        <div className="mt-auto">
          <Link
            to={`/lists/${id}`}
            className="w-full py-2 border border-[#D1B399] text-[#D1B399] rounded-lg hover:bg-[#D1B399]/10 transition-colors text-center text-sm font-medium block"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListCard;