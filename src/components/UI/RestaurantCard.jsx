// src/components/UI/RestaurantCard.jsx
import React from 'react';
import { MapPin, Users } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import BaseCard from '@/components/UI/BaseCard'; // Corrected import path

const RestaurantCard = React.memo(
  ({ id, name, neighborhood, city, tags = [], adds = 0 }) => {
    const { openQuickAdd } = useQuickAdd();

    const handleQuickAdd = (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log(`[${name} Card] handleQuickAdd: Calling openQuickAdd...`);
      // Pass all relevant data for the popup
      openQuickAdd({ id, name, neighborhood, city, tags, type: "restaurant" });
      console.log(`[${name} Card] handleQuickAdd: Called openQuickAdd.`);
    };

    // Basic name cleaning, same as before
    const cleanName = name?.split(',')[0].trim() || "Unnamed Restaurant";
    const linkDestination = `/restaurant/${id}`;

    return (
      <BaseCard
        linkTo={linkDestination}
        onQuickAdd={handleQuickAdd}
        quickAddLabel={`Add restaurant ${cleanName} to list`}
      >
        {/* Content specific to Restaurant Card */}
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

        {/* Tags section */}
        <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
              +{tags.length - 2} more
            </span>
          )}
        </div>
      </BaseCard>
    );
  }
);

export default RestaurantCard;