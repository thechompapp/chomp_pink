// src/components/UI/RestaurantCard.jsx
import React from 'react';
import { MapPin, Users, ExternalLink } from 'lucide-react'; // Added ExternalLink
import BaseCard from '@/components/UI/BaseCard';
import { engagementService } from '@/services/engagementService';
import { Link } from 'react-router-dom'; // Import Link

// Update props to expect *_name
const RestaurantCard = ({
  id,
  name,
  neighborhood_name, // Changed from neighborhood
  city_name,         // Changed from city
  tags = [],
  adds = 0,
  onQuickAdd, // Assuming this comes from parent/context if needed
  website // Add website prop
}) => {
  // Keep name cleaning logic
  const cleanName = name?.split(',')[0].trim() || 'Unnamed Restaurant';
  const linkDestination = `/restaurant/${id}`; // Link to restaurant detail page
  const safeTags = Array.isArray(tags) ? tags : [];

  // Combine location parts, handling nulls gracefully
  const locationParts = [neighborhood_name, city_name].filter(Boolean); // Filter out null/empty values
  const locationString = locationParts.join(', ') || 'Unknown Location';

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on the external link icon
    if (e.target.closest('.external-link-button')) {
      return;
    }

    if (id) {
      engagementService.logEngagement({
        item_id: parseInt(id, 10),
        item_type: 'restaurant',
        engagement_type: 'click',
      });
      // Navigation happens via BaseCard's Link wrapper now
    }
  };

   const handleExternalLinkClick = (e) => {
       e.preventDefault(); // Prevent Link navigation
       e.stopPropagation(); // Prevent card click handler
       if (website) {
           window.open(website, '_blank', 'noopener,noreferrer');
           // Optionally log this specific interaction
           engagementService.logEngagement({
               item_id: parseInt(id, 10),
               item_type: 'restaurant',
               engagement_type: 'website_click', // Example custom type
           });
       }
   };

  return (
    // BaseCard handles the Link wrapping if linkTo is provided
    <BaseCard
      linkTo={linkDestination}
      onClick={handleCardClick} // Handles logging, navigation is via Link
      onQuickAdd={onQuickAdd ? () => onQuickAdd({ id, name: cleanName, type: 'restaurant' }) : undefined}
      quickAddLabel={`Add ${cleanName} to list`}
      className="w-full group relative" // Added group and relative for positioning icon
      showQuickAdd={!!onQuickAdd}
    >
      {/* Main Content Area */}
      <div className="flex-grow min-h-0 overflow-hidden">
         {/* Website link icon - positioned top-right */}
         {website && (
             <button
                 onClick={handleExternalLinkClick}
                 className="external-link-button absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 z-10" // Positioned top-right
                 aria-label={`Visit website for ${cleanName}`}
                 title="Visit website"
             >
                 <ExternalLink size={14} />
             </button>
         )}

        {/* Use h-full text-base */}
        <h3 className="text-sm font-semibold text-black mb-1 line-clamp-2 pr-6"> {/* Black text for better visibility */}
          {cleanName}
        </h3>
        {/* Use locationString derived from *_name props */}
        <div className="flex items-center text-black text-xs mb-1">
          <MapPin size={12} className="mr-1 flex-shrink-0 text-black" />
          <span className="truncate" title={locationString}> {/* Add title for full text on hover */}
            {locationString}
          </span>
        </div>
        <div className="flex items-center text-black text-xs">
          <Users size={12} className="mr-1 flex-shrink-0 text-black" />
          <span>{adds?.toLocaleString() ?? 0} adds</span> {/* Handle potential null adds */}
        </div>
      </div>

      {/* Footer Area (Tags) */}
      {safeTags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-black flex flex-wrap gap-1 flex-shrink-0">
          {safeTags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-white border border-black rounded-full text-[10px] text-black whitespace-nowrap">
              #{tag}
            </span>
          ))}
          {safeTags.length > 3 && (
            <span className="px-1.5 py-0.5 bg-white border border-black rounded-full text-[10px] text-black">
              +{safeTags.length - 3}
            </span>
          )}
        </div>
      )}
    </BaseCard>
  );
};

export default RestaurantCard;