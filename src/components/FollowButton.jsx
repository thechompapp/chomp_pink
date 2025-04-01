// src/components/FollowButton.jsx
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import useAppStore from '../hooks/useAppStore';

const FollowButton = ({ listId, isFollowed: initialIsFollowed = false }) => {
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [isLoading, setIsLoading] = useState(false);
  
  const followList = useAppStore(state => state.followList);
  const unfollowList = useAppStore(state => state.unfollowList);
  
  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (isFollowed) {
        await unfollowList(listId);
        setIsFollowed(false);
      } else {
        await followList(listId);
        setIsFollowed(true);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`
        flex items-center px-3 py-1.5 rounded-full 
        ${isFollowed
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        transition-colors duration-200
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Heart
        size={16}
        className={`mr-1 ${isFollowed ? 'fill-red-600' : ''}`}
      />
      <span className="text-sm font-medium">
        {isFollowed ? 'Following' : 'Follow'}
      </span>
    </button>
  );
};

export default FollowButton;