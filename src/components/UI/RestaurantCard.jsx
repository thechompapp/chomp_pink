import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Plus } from "lucide-react";
import QuickAddPopup from "../QuickAdd/QuickAddPopup";

const RestaurantCard = ({ id = 1, name, neighborhood, city, tags, followers = Math.floor(Math.random() * 900) + 100 }) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  return (
    <>
      <div className="w-72 h-64 bg-[#D1B399] bg-opacity-10 border border-[#D1B399] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative">
        {/* Updated QuickAdd button */}
        <button
          onClick={() => setShowQuickAdd(true)}
          className="absolute top-3 right-3 w-10 h-10 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow hover:bg-[#b89e89] transition-colors"
          aria-label="Add to list"
        >
          <Plus size={24} />
        </button>
      
        <div className="h-full flex flex-col justify-between">
          <div>
            <Link to={`/restaurant/${id}`} className="block">
              <h3 className="font-bold text-gray-900 text-lg mb-1 truncate hover:text-[#D1B399] transition-colors pr-8">{name}</h3>
            </Link>
            
            <div className="flex items-start text-gray-500 text-sm">
              <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span className="truncate">{neighborhood}, {city}</span>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <Users size={14} className="mr-1" />
              <span>{followers.toLocaleString()} adds</span> {/* Changed from followers */}
            </div>
          </div>
          
          <div className="my-3">
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 border border-[#D1B399] rounded-full text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-auto">
            <Link
              to={`/restaurant/${id}`}
              className="w-full py-2 border border-[#D1B399] text-[#D1B399] rounded-lg flex items-center justify-center font-medium hover:bg-[#D1B399]/10 transition-colors"
            >
              View
            </Link>
          </div>
        </div>
      </div>
      
      {showQuickAdd && (
        <QuickAddPopup 
          item={{ id, name, neighborhood, city, tags, type: 'restaurant' }} 
          onClose={() => setShowQuickAdd(false)} 
        />
      )}
    </>
  );
};

export default RestaurantCard;