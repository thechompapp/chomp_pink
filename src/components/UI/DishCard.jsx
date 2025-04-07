// src/components/UI/DishCard.jsx
import React from 'react';
import { Utensils, ThumbsUp } from 'lucide-react';
import BaseCard from '@/components/UI/BaseCard';
import { engagementService } from '@/services/engagementService';

const DishCard = ({ id, name, restaurant, tags = [], adds = 0, onQuickAdd }) => {
  const cleanName = name || 'Unnamed Dish';
  const cleanRestaurant = restaurant || 'Unknown Restaurant';
  const linkDestination = `/dish/${id}`;
  const safeTags = Array.isArray(tags) ? tags : [];

  const handleCardClick = () => {
    if (id) {
      console.log(`[DishCard] Logging click for dish ID: ${id}`);
      engagementService.logEngagement({
        item_id: parseInt(id, 10),
        item_type: 'dish',
        engagement_type: 'click',
      });
    }
  };

  return (
    <BaseCard
      linkTo={linkDestination}
      onClick={handleCardClick}
      onQuickAdd={onQuickAdd}
      quickAddLabel={`Add dish ${cleanName} to list`}
      className="w-full" // BaseCard provides h-64
      showQuickAdd={!!onQuickAdd}
    >
      {/* This div is the direct child passed to BaseCard's CardContent */}
      <div className="flex flex-col h-full justify-between">

        {/* Main Content Area */}
        <div className="flex-grow min-h-0 overflow-hidden">
            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                {cleanName}
            </h3>
            <div className="flex items-center text-gray-500 text-xs mb-1">
                <Utensils size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                <span className="truncate">at {cleanRestaurant}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
                <ThumbsUp size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                <span>{adds.toLocaleString()} adds</span>
            </div>
        </div>

        {/* Footer Area (Tags) */}
        {safeTags.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1 flex-shrink-0">
            {safeTags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">
                #{tag}
              </span>
            ))}
            {safeTags.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                +{safeTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default DishCard;