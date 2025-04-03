// src/components/UI/RestaurantCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Plus } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button'; // Assuming Button component is styled appropriately

const RestaurantCard = React.memo(
  ({ id, name, neighborhood, city, tags = [], adds = 0 }) => { // Default tags to empty array and adds to 0
    const { openQuickAdd } = useQuickAdd();

    const handleQuickAdd = (e) => {
       e.stopPropagation(); // Prevent triggering link navigation
       e.preventDefault();
      console.log("RestaurantCard: handleQuickAdd called: id=", id);
      openQuickAdd({ id, name, neighborhood, city, tags, type: "restaurant" });
    };

    const cleanName = name?.split(',')[0].trim() || "Unnamed Restaurant"; // Handle potential undefined name

    return (
      <div className="group relative flex flex-col w-full h-56 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#b89e89] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399]"
          aria-label="Add restaurant to list"
        >
          <Plus size={20} />
        </button>

        {/* Card Content */}
        <Link to={`/restaurant/${id}`} className="flex flex-col flex-grow p-4 text-left">
          {/* Top section */}
          <div className="flex-grow mb-2">
            <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
              {cleanName}
            </h3>
            <div className="flex items-center text-gray-500 text-xs mb-1.5">
              <MapPin size={12} className="mr-1 flex-shrink-0" />
              <span className="truncate">
                {neighborhood ? `${neighborhood}, ${city}` : city || "Unknown Location"}
              </span>
            </div>
             <div className="flex items-center text-gray-500 text-xs">
               <Users size={12} className="mr-1 flex-shrink-0" />
               <span>{adds.toLocaleString()} adds</span>
             </div>
          </div>

          {/* Tags section - appears at bottom */}
          <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
            {tags.slice(0, 2).map((tag) => ( // Show max 2 tags
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap"
              >
                #{tag}
              </span>
            ))}
             {tags.length > 2 && (
                 <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">+{tags.length - 2} more</span>
             )}
          </div>
        </Link>
      </div>
    );
  }
);

export default RestaurantCard;