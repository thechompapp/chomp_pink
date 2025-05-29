/* src/components/UI/CompactRestaurantCard.jsx */
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Star, 
  Award,
  TrendingUp,
  Globe,
  Hash,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';

// Compact animation variants - fixed to prevent border clipping
const compactRestaurantCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  hover: { scale: 1.02, y: -1 }
};

// Compact badge component
const CompactBadge = ({ icon: Icon, text, color = "gray" }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-orange-600"
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colorClasses[color]}`}>
      <Icon size={8} className="mr-1" />
      {text}
    </span>
  );
};

const CompactRestaurantCard = ({ 
  id,
  name,
  neighborhood_name,
  city_name,
  tags = [],
  adds = 0,
  onAddToList,
  website,
  phone,
  rating,
  is_trending = false,
  is_featured = false,
  onClick,
  showActions = true,
  showMetadata = true,
  className = ""
}) => {
  const { isAuthenticated } = useAuthStore();

  const cleanName = name?.split(',')[0].trim() || 'Unnamed Restaurant';
  const locationParts = [neighborhood_name, city_name].filter(Boolean);
  const locationString = locationParts.join(', ') || 'Unknown Location';
  const safeTags = Array.isArray(tags) ? tags : [];

  // Rating display
  const ratingDisplay = useMemo(() => {
    if (!rating) return null;
    return parseFloat(rating).toFixed(1);
  }, [rating]);

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(id);
    }
    
    // Log engagement
    try {
      engagementService.logEngagement({
        item_id: parseInt(id, 10),
        item_type: 'restaurant',
        engagement_type: 'view_compact',
      });
    } catch (error) {
      console.error('[CompactRestaurantCard] Error logging engagement:', error);
    }
  }, [onClick, id]);

  const handleAddToList = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onAddToList) {
      onAddToList({
        id,
        name: cleanName,
        type: 'restaurant'
      });
    }
  }, [onAddToList, id, cleanName]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={compactRestaurantCardVariants}
      transition={{ duration: 0.15 }}
      className={`bg-white rounded-lg border border-black p-3 cursor-pointer hover:shadow-md transition-all duration-200 group relative ${className}`}
    >
      <Link to={`/restaurant/${id}`} onClick={handleCardClick} className="block">
        {/* Restaurant Type Label */}
        <div className="flex items-center justify-between mb-2">
          <CompactBadge 
            icon={Hash} 
            text="Restaurant" 
            color="orange" 
          />
          
          {/* Add to List Button */}
          {isAuthenticated && onAddToList && showActions && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToList}
              className="p-1 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Add to list"
            >
              <Plus size={12} />
            </motion.button>
          )}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-black line-clamp-1 mb-1">
              {cleanName}
            </h4>
            {showMetadata && (
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin size={10} className="mr-1 text-orange-500" />
                  <span className="truncate">{locationString}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Users size={10} className="mr-1 text-blue-500" />
                    {adds?.toLocaleString() ?? 0}
                  </span>
                  {ratingDisplay && (
                    <span className="flex items-center text-yellow-600">
                      <Star size={10} className="mr-1 fill-current" />
                      {ratingDisplay}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Website Button */}
          {showActions && website && (
            <motion.a
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-gray-400 hover:text-blue-600 rounded ml-2"
              title="Visit website"
            >
              <Globe size={12} />
            </motion.a>
          )}
        </div>

        {/* Compact Metadata Badges */}
        {showMetadata && (
          <div className="flex items-center space-x-1 flex-wrap mb-2">
            {is_featured && (
              <CompactBadge 
                icon={Award} 
                text="Featured" 
                color="purple" 
              />
            )}
            
            {is_trending && (
              <CompactBadge 
                icon={TrendingUp} 
                text="Trending" 
                color="red" 
              />
            )}
            
            {adds > 100 && (
              <CompactBadge 
                icon={Users} 
                text="Popular" 
                color="blue" 
              />
            )}
          </div>
        )}

        {/* Tags Preview */}
        {safeTags.length > 0 && (
          <div className="flex items-center space-x-1 flex-wrap">
            {safeTags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-white border border-black rounded-full text-xs text-black font-medium whitespace-nowrap">
                #{tag}
              </span>
            ))}
            {safeTags.length > 2 && (
              <span className="text-xs text-gray-400">
                +{safeTags.length - 2}
              </span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
};

CompactRestaurantCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  neighborhood_name: PropTypes.string,
  city_name: PropTypes.string,
  tags: PropTypes.array,
  adds: PropTypes.number,
  onAddToList: PropTypes.func,
  website: PropTypes.string,
  phone: PropTypes.string,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  onClick: PropTypes.func,
  showActions: PropTypes.bool,
  showMetadata: PropTypes.bool,
  className: PropTypes.string,
};

export default React.memo(CompactRestaurantCard); 