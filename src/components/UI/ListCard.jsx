import React from 'react';
import { Bookmark, PlusCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAppStore from '../../hooks/useAppStore';
import QuickAddPopup from '../QuickAdd/QuickAddPopup';  // Added correct import path if needed

const ListCard = ({ id, name, itemCount = 0, isPublic = true, savedCount = 0 }) => {
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const addToUserList = useAppStore((state) => state.addToUserList);

  // List of gradient backgrounds to use
  const gradients = [
    'from-emerald-500 to-teal-400',  
    'from-indigo-500 to-blue-400',
    'from-violet-500 to-purple-400',
    'from-amber-500 to-yellow-400'
  ];
  
  // Randomly select a gradient background
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  const handleQuickAdd = () => {
    setShowQuickAdd(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
        {/* Card header with gradient background */}
        <div className={`h-24 bg-gradient-to-r ${randomGradient} p-4 relative`}>
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1 flex items-center text-xs font-medium text-gray-700">
            <Users size={14} className="inline mr-1" />
            {savedCount}
          </div>
          <h3 className="font-bold text-white text-xl mb-1 line-clamp-1 mt-4">{name}</h3>
        </div>
        
        {/* Card content */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-gray-600 text-sm">
              <Bookmark size={16} className="mr-1" />
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs ${
              isPublic 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Link
              to={`/lists/${id}`}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
            >
              View List
            </Link>
            
            <button
              onClick={handleQuickAdd}
              className="flex items-center justify-center py-2 px-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-colors shadow-sm"
            >
              <PlusCircle size={16} className="mr-1" />
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