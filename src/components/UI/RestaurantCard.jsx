// src/components/UI/RestaurantCard.jsx
import React from 'react';
import { MapPin, Users } from 'lucide-react';
import BaseCard from '@/components/UI/BaseCard';
import { engagementService } from '@/services/engagementService';

const RestaurantCard = ({ id, name, neighborhood, city, tags = [], adds = 0, onQuickAdd }) => {
  const cleanName = name?.split(',')[0].trim() || 'Unnamed Restaurant';
  const linkDestination = `/restaurant/${id}`;
  const safeTags = Array.isArray(tags) ? tags : [];

  const handleCardClick = () => {
    if (id) {
      console.log(`[RestaurantCard] Logging click for restaurant ID: ${id}`);
      engagementService.logEngagement({
        item_id: parseInt(id, 10),
        item_type: 'restaurant',
        engagement_type: 'click',
      });
    }
  };

  return (
    <BaseCard
      linkTo={linkDestination}
      onClick={handleCardClick}
      onQuickAdd={onQuickAdd}
      quickAddLabel={`Add restaurant ${cleanName} to list`}
      className="w-full" // BaseCard provides h-64
      showQuickAdd={!!onQuickAdd}
    >
      {/* This div is the direct child passed to BaseCard's CardContent */}
      {/* It needs to manage its own height distribution within the h-64 */}
      <div className="flex flex-col h-full justify-between">

        {/* Main Content Area */}
        {/* Use flex-grow to take available space, min-h-0 to prevent expansion, overflow-hidden to clip */}
        <div className="flex-grow min-h-0 overflow-hidden">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
            {cleanName}
          </h3>
          {(neighborhood || city) && (
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <MapPin size={12} className="mr-1 flex-shrink-0 text-gray-400" />
              <span className="truncate">
                {neighborhood ? `${neighborhood}, ${city}` : city || 'Unknown Location'}
              </span>
            </div>
          )}
          <div className="flex items-center text-gray-500 text-xs">
            <Users size={12} className="mr-1 flex-shrink-0 text-gray-400" />
            <span>{adds.toLocaleString()} adds</span>
          </div>
        </div>

        {/* Footer Area (Tags) */}
        {/* Use flex-shrink-0 to prevent this section from shrinking */}
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

export default RestaurantCard;