import React, { useState } from 'react';
import { Bookmark, Users, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAppStore from '../../hooks/useAppStore';
import QuickAddPopup from '../QuickAdd/QuickAddPopup';

const ListCard = ({ id, name, itemCount = 0, isPublic = true, savedCount = Math.floor(Math.random() * 500) + 50 }) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <>
      <div className="w-72 h-64 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="h-full flex flex-col justify-between">
          {/* Card header */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{name}</h3>
            
            <div className="flex items-start text-gray-500 text-sm">
              <Bookmark size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span className="truncate">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <Users size={14} className="mr-1" />
              <span>{savedCount.toLocaleString()} followers</span>
            </div>
          </div>
          
          {/* Visibility */}
          <div className="my-3 flex items-center">
            <span className={`px-2 py-0.5 border rounded-full text-xs ${
              isPublic 
                ? 'border-gray-300 text-gray-700' 
                : 'border-gray-300 text-gray-700'
            }`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/lists/${id}`}
              className="py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-center text-sm font-medium"
            >
              View
            </Link>
            
            <button
              onClick={() => setShowQuickAdd(true)}
              className="py-2 border border-black text-black rounded-lg flex items-center justify-center font-medium hover:bg-black hover:text-white transition-colors"
            >
              <PlusCircle size={14} className="mr-1" />
              Save
            </button>
          </div>
        </div>
      </div>
      
      {showQuickAdd && (
        <QuickAddPopup 
          item={{ name, type: 'list', id }}
          onClose={() => setShowQuickAdd(false)} 
        />
      )}
    </>
  );
};

export default ListCard;