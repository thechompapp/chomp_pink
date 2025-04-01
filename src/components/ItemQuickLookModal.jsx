// src/components/ItemQuickLookModal.jsx
import React from 'react';
import { X, MapPin, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuickAdd } from '../context/QuickAddContext';
import useAppStore from '../hooks/useAppStore';

const ItemQuickLookModal = ({ item, onClose }) => {
  const { openQuickAdd } = useQuickAdd();
  const voteDish = useAppStore(state => state.voteDish);
  
  if (!item) return null;
  
  const isDish = item.type === 'dish';
  
  const handleQuickAdd = () => {
    openQuickAdd({
      id: item.id,
      name: item.name,
      type: item.type,
      image_url: item.image_url,
      restaurant_name: isDish ? item.restaurant_name : undefined
    });
  };
  
  const handleVote = async (vote) => {
    if (isDish) {
      await voteDish(item.id, vote);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md">
        {/* Modal Header */}
        <div className="relative">
          {/* Item Image */}
          <div className="h-56 bg-gray-200">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
          >
            <X size={20} className="text-gray-700" />
          </button>
          
          {/* Type Badge */}
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {isDish ? 'Dish' : 
             item.type === 'restaurant' ? 'Restaurant' : 'List'}
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="p-4">
          <h2 className="font-bold text-xl mb-1">
            <Link 
              to={`/${item.type}/${item.id}`} 
              className="hover:text-blue-600"
              onClick={onClose}
            >
              {item.name}
            </Link>
          </h2>
          
          {/* Restaurant (for dishes) */}
          {isDish && item.restaurant_name && (
            <p className="text-gray-700 mb-2">
              <Link 
                to={`/restaurant/${item.restaurant_id}`}
                className="hover:text-blue-600"
                onClick={onClose}
              >
                {item.restaurant_name}
              </Link>
            </p>
          )}
          
          {/* Location */}
          {item.location && (
            <div className="flex items-center text-gray-600 text-sm mb-3">
              <MapPin size={16} className="mr-1" />
              <span>{item.location}</span>
            </div>
          )}
          
          {/* Description */}
          {item.description && (
            <p className="text-gray-700 text-sm mb-4">
              {item.description}
            </p>
          )}
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {item.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-2">
            {/* Voting (for dishes) */}
            {isDish && (
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleVote('up')}
                  className="flex items-center text-gray-600 hover:text-green-600"
                >
                  <ThumbsUp size={18} className="mr-1" />
                  <span>{item.votes_up || 0}</span>
                </button>
                
                <button 
                  onClick={() => handleVote('down')}
                  className="flex items-center text-gray-600 hover:text-red-600"
                >
                  <ThumbsDown size={18} className="mr-1" />
                  <span>{item.votes_down || 0}</span>
                </button>
              </div>
            )}
            
            {/* Add to List Button */}
            <button
              onClick={handleQuickAdd}
              className="bg-blue-600 text-white py-2 px-4 rounded flex items-center hover:bg-blue-700"
            >
              <Plus size={18} className="mr-1" />
              <span>Add to List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemQuickLookModal;