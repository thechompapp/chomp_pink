// src/components/UI/DishCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQuickAdd } from '../../context/QuickAddContext';
import useAppStore from '../../hooks/useAppStore';

const DishCard = ({ dish }) => {
  const { openQuickAdd } = useQuickAdd();
  const voteDish = useAppStore(state => state.voteDish);
  
  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    openQuickAdd({
      id: dish.id,
      name: dish.name,
      type: 'dish',
      image_url: dish.image_url,
      restaurant_name: dish.restaurant_name
    });
  };
  
  const handleVote = async (vote) => {
    await voteDish(dish.id, vote);
    // Note: In a real app, you'd update the UI here or refetch data
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Dish Image */}
      <div className="h-48 bg-gray-200 relative">
        {dish.image_url ? (
          <img 
            src={dish.image_url} 
            alt={dish.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        
        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
          aria-label="Add to list"
        >
          <Plus size={20} className="text-blue-600" />
        </button>
      </div>
      
      {/* Dish Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1 truncate">
          <Link 
            to={`/dish/${dish.id}`} 
            className="hover:text-blue-600"
          >
            {dish.name}
          </Link>
        </h3>
        
        {/* Restaurant */}
        <p className="text-gray-700 text-sm mb-2">
          <Link 
            to={`/restaurant/${dish.restaurant_id}`}
            className="hover:text-blue-600"
          >
            {dish.restaurant_name}
          </Link>
        </p>
        
        {/* Location */}
        {dish.neighborhood && (
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin size={14} className="mr-1" />
            <span>{dish.neighborhood}, {dish.city || 'NYC'}</span>
          </div>
        )}
        
        {/* Tags */}
        {dish.tags && dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {dish.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {dish.tags.length > 3 && (
              <span className="text-gray-500 text-xs">
                +{dish.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Vote Buttons */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex space-x-2">
            <button 
              onClick={() => handleVote('up')}
              className="flex items-center text-sm text-gray-600 hover:text-green-600"
            >
              <ThumbsUp size={16} className="mr-1" />
              <span>{dish.votes_up || 0}</span>
            </button>
            
            <button 
              onClick={() => handleVote('down')}
              className="flex items-center text-sm text-gray-600 hover:text-red-600"
            >
              <ThumbsDown size={16} className="mr-1" />
              <span>{dish.votes_down || 0}</span>
            </button>
          </div>
          
          {dish.price && (
            <span className="text-gray-700 font-medium">${dish.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCard;