// src/components/UI/DishCard.jsx
import React from 'react';
import { Utensils, ThumbsUp } from 'lucide-react'; // Changed icon for adds count
import { useQuickAdd } from '@/context/QuickAddContext';
import BaseCard from '@/components/UI/BaseCard';

// Added 'adds' prop with a default value
const DishCard = React.memo(({ id, name, restaurant, tags = [], adds = 0 }) => {
  const { openQuickAdd } = useQuickAdd();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
     // Pass all relevant data for the popup
    openQuickAdd({ id, name, restaurant: restaurant, tags, type: 'dish' });
  };

  const cleanName = name || "Unnamed Dish";
  const cleanRestaurant = restaurant || "Unknown Restaurant";
  const linkDestination = `/dish/${id}`;

  return (
    <BaseCard
        linkTo={linkDestination}
        onQuickAdd={handleQuickAdd}
        quickAddLabel={`Add dish ${cleanName} to list`}
      >
        {/* Content specific to Dish Card */}
        <div className="flex-grow mb-2">
          <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
            {cleanName}
          </h3>
          <div className="flex items-center text-gray-500 text-xs mb-1.5">
            <Utensils size={12} className="mr-1 flex-shrink-0" />
            <span className="truncate">at {cleanRestaurant}</span>
          </div>
          {/* Added Adds Count Display */}
           <div className="flex items-center text-gray-500 text-xs">
             <ThumbsUp size={12} className="mr-1 flex-shrink-0" />
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
});

export default DishCard;