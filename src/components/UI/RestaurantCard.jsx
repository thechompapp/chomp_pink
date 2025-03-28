import React, { useState } from "react";
import { Star, PlusCircle, MapPin } from "lucide-react";
import QuickAddPopup from "../QuickAdd/QuickAddPopup";  // Fixed import path

const RestaurantCard = ({ name, neighborhood, city, tags, rating = 4.5 }) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
        {/* Card image */}
        <div className="h-32 bg-gradient-to-r from-pink-500 to-orange-400 relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center text-xs font-medium text-yellow-600">
            <Star size={14} className="text-yellow-500 mr-1" fill="#F59E0B" />
            {rating}
          </div>
        </div>
        
        {/* Card content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
          
          <p className="text-gray-600 text-sm mb-2 flex items-center">
            <MapPin size={14} className="inline mr-1" />
            {neighborhood}, {city}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-3 mb-2">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          <button
            onClick={() => setShowQuickAdd(true)}
            className="mt-2 w-full py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg flex items-center justify-center font-medium hover:from-pink-600 hover:to-orange-500 transition-colors shadow-sm"
          >
            <PlusCircle size={16} className="mr-1" />
            Add to List
          </button>
        </div>
      </div>
      
      {showQuickAdd && (
        <QuickAddPopup 
          item={{ name, neighborhood, city, tags }} 
          onClose={() => setShowQuickAdd(false)} 
        />
      )}
    </>
  );
};

export default RestaurantCard;