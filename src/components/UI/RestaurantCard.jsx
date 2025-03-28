import React, { useState } from "react";
import { MapPin, Users, PlusCircle } from "lucide-react";
import QuickAddPopup from "../QuickAdd/QuickAddPopup";

const RestaurantCard = ({ name, neighborhood, city, tags, followers = Math.floor(Math.random() * 900) + 100 }) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  return (
    <>
      <div className="w-72 h-64 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="h-full flex flex-col justify-between">
          {/* Card header */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{name}</h3>
            
            <div className="flex items-start text-gray-500 text-sm">
              <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span className="truncate">{neighborhood}, {city}</span>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <Users size={14} className="mr-1" />
              <span>{followers.toLocaleString()} followers</span>
            </div>
          </div>
          
          {/* Tags */}
          <div className="my-3">
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 border border-gray-200 rounded-full text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Action button */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full py-2 border border-black text-black rounded-lg flex items-center justify-center font-medium hover:bg-black hover:text-white transition-colors"
          >
            <PlusCircle size={16} className="mr-2" />
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