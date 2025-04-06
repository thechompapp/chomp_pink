// src/components/UI/RestaurantCard.jsx
import React from 'react';
import { MapPin, Users } from 'lucide-react';
import BaseCard from '@/components/UI/BaseCard'; // Ensure path is correct

// Removed React.memo temporarily for debugging
const RestaurantCard = ({ id, name, neighborhood, city, tags = [], adds = 0, onQuickAdd }) => {
  const cleanName = name?.split(',')[0].trim() || 'Unnamed Restaurant';
  const linkDestination = `/restaurant/${id}`;

  // Ensure tags is always an array
  const safeTags = Array.isArray(tags) ? tags : [];

  return (
    <BaseCard
      linkTo={linkDestination}
      onQuickAdd={onQuickAdd}
      quickAddLabel={`Add restaurant ${cleanName} to list`}
      className="w-full" // Let BaseCard handle aspect ratio
      showQuickAdd={!!onQuickAdd}
      aspectRatioClass="aspect-w-1 aspect-h-1" // Explicitly set square aspect ratio here
    >
      <div className="flex flex-col h-full justify-between p-3"> {/* Ensure padding is inside */}
        <div> {/* Top Content */}
            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                {cleanName}
            </h3>
            <div className="flex items-center text-gray-500 text-xs mb-1">
                <MapPin size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                <span className="truncate">
                    {neighborhood ? `${neighborhood}, ${city}` : city || 'Unknown Location'}
                </span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
                <Users size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                <span>{adds.toLocaleString()} adds</span>
            </div>
        </div>
        {/* Tags Area */}
        {safeTags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                {safeTags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">
                        #{tag}
                    </span>
                ))}
                {safeTags.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                        +{safeTags.length - 3} more
                    </span>
                )}
            </div>
        )}
      </div>
    </BaseCard>
  );
};

export default RestaurantCard;