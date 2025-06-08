// src/components/UI/RestaurantCard.jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Star, 
  Clock,
  TrendingUp,
  Award,
  Globe,
  Phone,
  Hash,
  Plus,
  ChefHat,
  Flame
} from 'lucide-react';
import { engagementService } from '@/services/engagementService';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { CARD_SPECS } from '@/models/cardModels';
import EnhancedRestaurantModal from '@/components/modals/EnhancedRestaurantModal';
import LoginPromptButton from './LoginPromptButton'; // Import LoginPromptButton

// Animation variants for better UX - fixed to prevent border clipping
const restaurantCardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

// Enhanced badge component for restaurant metadata
const RestaurantBadge = ({ icon: Icon, text, color = "gray", size = "sm", testId }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700"
  };

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-1 text-base"
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}
      data-testid={testId}
    >
      <Icon size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} className="mr-1" />
      {text}
    </span>
  );
};

// Add to List button component
const AddToListButton = ({ restaurant, onAddToList }) => {
  const { isAuthenticated  } = useAuth();

  const handleAddToList = useCallback((e) => {
    e.stopPropagation();
    if (onAddToList && restaurant) {
      onAddToList(restaurant);
    }
  }, [onAddToList, restaurant]);

  if (!isAuthenticated || !onAddToList) {
    return null;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAddToList}
      className="absolute top-2 right-2 z-10 w-8 h-8 bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
      title={`Add ${restaurant.name} to list`}
      aria-label={`Add ${restaurant.name} to list`}
      data-testid="add-to-list-button"
    >
      <Plus size={14} />
    </motion.button>
  );
};

const RestaurantCard = ({
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
  hours,
  image_url,
  description,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated  } = useAuth();
  
  // Keep name cleaning logic
  const cleanName = name?.split(',')[0].trim() || 'Unnamed Restaurant';
  const safeTags = Array.isArray(tags) ? tags : [];

  // Combine location parts, handling nulls gracefully
  const locationParts = [neighborhood_name, city_name].filter(Boolean);
  const locationString = locationParts.join(', ') || 'Unknown Location';

  // Rating display
  const ratingDisplay = useMemo(() => {
    if (!rating) return null;
    return parseFloat(rating).toFixed(1);
  }, [rating]);

  const handleCardClick = useCallback((e) => {
    // Prevent modal opening if clicking on action buttons
    if (e.target.closest('.add-to-list-button') || e.target.closest('.external-link-button')) {
      return;
    }

    // Prevent default and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (id) {
      engagementService.logEngagement({
        item_id: parseInt(id, 10),
        item_type: 'restaurant',
        engagement_type: 'click',
      });
    }

    // Open modal instead of navigating
    console.log(`[RestaurantCard] Opening modal for restaurant ${id}`);
    setIsModalOpen(true);
  }, [id]);

  const handleExternalLinkClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (website) {
      window.open(website, '_blank', 'noopener,noreferrer');
      engagementService.logEngagement({
        item_id: parseInt(id, 10),
        item_type: 'restaurant',
        engagement_type: 'website_click',
      });
    }
  }, [website, id]);

  // Create restaurant object for modal
  const restaurantForModal = useMemo(() => ({
    id,
    name: cleanName,
    neighborhood_name,
    city_name,
    description,
    rating,
    tags: safeTags,
    website,
    phone,
    hours,
    image_url,
    is_trending,
    is_featured,
    adds
  }), [
    id, cleanName, neighborhood_name, city_name, description, rating,
    safeTags, website, phone, hours, image_url, is_trending, is_featured, adds
  ]);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={restaurantCardVariants}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`group relative ${className}`}
        data-testid={`restaurant-card-${id}`}
        role="article"
        aria-label={`Restaurant: ${cleanName}`}
      >
        <div onClick={handleCardClick} className="block cursor-pointer">
          <div className={CARD_SPECS.FULL_CLASS}>
            {/* Add to List Button */}
            <div className="add-to-list-button">
              <AddToListButton
                restaurant={{ id, name: cleanName }}
                onAddToList={onAddToList}
              />
            </div>

            {/* Restaurant Type Label */}
            <div className="flex justify-between items-start mb-2">
              <RestaurantBadge 
                icon={Hash} 
                text="Restaurant" 
                color="orange"
                size="xs" 
                testId="restaurant-type-badge"
              />

              {/* External Link Button */}
              {website && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleExternalLinkClick}
                  className="external-link-button p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Visit website"
                  data-testid="external-link-button"
                >
                  <Globe size={14} />
                </motion.button>
              )}
            </div>

            {/* Enhanced Header with Image Support */}
            <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
              {/* Image Section (if available) */}
              {image_url && (
                <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 h-32">
                  <img 
                    src={image_url} 
                    alt={cleanName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Main Content */}
              <div className="mb-2">
                <h3 className="text-lg font-bold text-black line-clamp-2 mb-1">
                  {cleanName}
                </h3>
                {description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {/* Enhanced Metadata Section */}
              <div className="space-y-2 mb-3">
                {/* Location */}
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-2 flex-shrink-0 text-orange-500" />
                  <span className="truncate" title={locationString}>
                    {locationString}
                  </span>
                </div>

                {/* Rating and Phone */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    {ratingDisplay && (
                      <div 
                        className="flex items-center text-yellow-600"
                        data-testid="rating-display"
                        aria-label={`Rating: ${ratingDisplay} stars`}
                      >
                        <Star size={12} className="mr-1 fill-current" />
                        <span className="font-medium">{ratingDisplay}</span>
                      </div>
                    )}
                  </div>

                  {phone && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      href={`tel:${phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-blue-600 hover:text-blue-700 rounded"
                      title={`Call ${phone}`}
                    >
                      <Phone size={12} />
                    </motion.a>
                  )}
                </div>

                {/* Popularity */}
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={14} className="mr-2 flex-shrink-0 text-blue-500" />
                  <span>{adds?.toLocaleString() ?? 0} adds</span>
                </div>
              </div>

              {/* Enhanced Badges Section */}
              <motion.div 
                className="flex items-center flex-wrap gap-1.5 mb-3"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {is_featured && (
                  <RestaurantBadge 
                    icon={Award} 
                    text="Featured" 
                    color="purple"
                    size="xs" 
                    testId="featured-badge"
                  />
                )}
                
                {is_trending && (
                  <RestaurantBadge 
                    icon={TrendingUp} 
                    text="Trending" 
                    color="red"
                    size="xs" 
                    testId="trending-badge"
                  />
                )}
                
                {hours && (
                  <RestaurantBadge 
                    icon={Clock} 
                    text={hours.includes('Open') ? 'Open' : 'Hours'} 
                    color={hours.includes('Open') ? 'green' : 'gray'}
                    size="xs" 
                    testId={hours.includes('Open') ? 'open-badge' : 'hours-badge'}
                  />
                )}
              </motion.div>
            </div>

            {/* Enhanced Tags Footer */}
            {safeTags.length > 0 && (
              <motion.div 
                className="mt-auto pt-3 border-t border-black flex flex-wrap gap-1.5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
              >
                {safeTags.slice(0, 3).map((tag, index) => (
                  <motion.span
                    key={tag}
                    variants={tagVariants}
                    className="px-1.5 py-0.5 bg-white border border-black rounded-full text-xs text-black font-medium whitespace-nowrap"
                  >
                    #{tag}
                  </motion.span>
                ))}
                {safeTags.length > 3 && (
                  <motion.span
                    variants={tagVariants}
                    className="px-1.5 py-0.5 bg-white border border-black rounded-full text-xs text-black font-medium"
                    title={`${safeTags.length - 3} more tags: ${safeTags.slice(3).join(', ')}`}
                  >
                    +{safeTags.length - 3}
                  </motion.span>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Restaurant Modal */}
      <EnhancedRestaurantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurant={restaurantForModal}
        onSave={(restaurant, saved) => {
          console.log(`Restaurant ${restaurant.id} ${saved ? 'saved' : 'unsaved'}`);
        }}
        onShare={(restaurant) => {
          console.log(`Shared restaurant ${restaurant.id}`);
        }}
      />
    </>
  );
};

RestaurantCard.propTypes = {
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
  hours: PropTypes.string,
  image_url: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
};

export default React.memo(RestaurantCard);