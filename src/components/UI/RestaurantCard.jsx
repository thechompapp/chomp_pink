// src/components/UI/RestaurantCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { useQuickAdd } from '../../context/QuickAddContext';

const RestaurantCard = ({ restaurant }) => {
  const { openQuickAdd } = useQuickAdd();
  
  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    openQuickAdd({
      id: restaurant.id,
      name: restaurant.name,
      type: 'restaurant',
      image_url: restaurant.image_url
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Restaurant Image */}
      <div className="h-48 bg-gray-200 relative">
        {restaurant.image_url ? (
          <img 
            src={restaurant.image_url} 
            alt={restaurant.name} 
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
      
      {/* Restaurant Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1 truncate">
          <Link 
            to={`/restaurant/${restaurant.id}`} 
            className="hover:text-blue-600"
          >
            {restaurant.name}
          </Link>
        </h3>
        
        {/* Location */}
        {restaurant.neighborhood && (
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin size={14} className="mr-1" />
            <span>{restaurant.neighborhood}, {restaurant.city || 'NYC'}</span>
          </div>
        )}
        
        {/* Cuisines/Tags */}
        {restaurant.cuisines && restaurant.cuisines.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {restaurant.cuisines.slice(0, 3).map((cuisine) => (
              <span 
                key={cuisine} 
                className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
              >
                {cuisine}
              </span>
            ))}
            {restaurant.cuisines.length > 3 && (
              <span className="text-gray-500 text-xs">
                +{restaurant.cuisines.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Popular Dishes (if available) */}
        {restaurant.popular_dishes && restaurant.popular_dishes.length > 0 && (
          <div className="mt-auto pt-2">
            <p className="text-sm text-gray-700 font-medium">Popular Dishes:</p>
            <ul className="text-sm text-gray-600">
              {restaurant.popular_dishes.slice(0, 2).map((dish, index) => (
                <li key={index} className="truncate">
                  • {dish}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;