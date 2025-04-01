// src/components/UI/ListCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';
import FollowButton from '../FollowButton';

const ListCard = ({ list, showFollowButton = true }) => {
  // Get number of items in the list
  const itemCount = list.items ? list.items.length : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* List Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg truncate pr-2">
            <Link 
              to={`/list/${list.id}`} 
              className="hover:text-blue-600"
            >
              {list.name}
            </Link>
          </h3>
          
          {showFollowButton && (
            <FollowButton listId={list.id} isFollowed={list.is_followed} />
          )}
        </div>
        
        {/* List Creator */}
        <div className="flex items-center text-gray-600 text-sm mt-1">
          <User size={14} className="mr-1" />
          <span>{list.created_by || 'Anonymous'}</span>
        </div>
      </div>
      
      {/* List Preview */}
      <div className="p-4">
        {/* List Description */}
        {list.description && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
            {list.description}
          </p>
        )}
        
        {/* Item Count */}
        <p className="text-sm text-gray-600">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        
        {/* Preview Items */}
        {list.items && list.items.length > 0 && (
          <ul className="mt-2 space-y-2">
            {list.items.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-gray-700 truncate flex-1">
                  {item.name}
                </span>
              </li>
            ))}
            
            {list.items.length > 3 && (
              <li className="text-blue-600 text-sm flex items-center">
                <Link to={`/list/${list.id}`} className="flex items-center">
                  <span>View all {list.items.length} items</span>
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ListCard;