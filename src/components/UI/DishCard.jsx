// src/components/UI/DishCard.jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, 
  ThumbsUp, 
  Star,
  Clock,
  TrendingUp,
  Award,
  Flame,
  Leaf,
  Hash,
  Plus,
  BookOpen
} from 'lucide-react';
import { engagementService } from '@/services/engagementService';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { CARD_SPECS } from '@/models/cardModels';
import EnhancedDishModal from '@/components/modals/EnhancedDishModal';
import LoginPromptButton from './LoginPromptButton'; // Import LoginPromptButton

// Animation variants for better UX - fixed to prevent border clipping
const dishCardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

// Enhanced badge component for dish metadata
const DishBadge = ({ icon: Icon, text, color = "gray", size = "sm", testId }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    xs: "px-1.5 py-0.5 text-xs"
  };

  return (
    <motion.span
      variants={tagVariants}
      className={`inline-flex items-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}
      data-testid={testId}
    >
      <Icon size={size === 'xs' ? 8 : 10} className="mr-1" />
      {text}
    </motion.span>
  );
};

// Add to List button component
const AddToListButton = ({ dish, onAddToList }) => {
  const { isAuthenticated  } = useAuth();

  const handleAddToList = useCallback((e) => {
    e.stopPropagation();
    if (onAddToList && dish) {
      onAddToList(dish);
    }
  }, [onAddToList, dish]);

  if (!isAuthenticated || !onAddToList) {
    return null;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAddToList}
      className="absolute top-2 right-2 z-10 w-8 h-8 bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
      title={`Add ${dish.name} to list`}
      aria-label={`Add ${dish.name} to list`}
      data-testid="add-to-list-button"
    >
      <Plus size={14} />
    </motion.button>
  );
};

const DishCard = ({ 
  id, 
  name, 
  restaurant, 
  restaurant_id,
  tags = [], 
  adds = 0, 
  onAddToList,
  rating,
  description,
  is_trending = false,
  is_featured = false,
  is_spicy = false,
  is_vegetarian = false,
  is_vegan = false,
  prep_time,
  image_url,
  price,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated  } = useAuth();

  const cleanName = name || 'Unnamed Dish';
  const cleanRestaurant = restaurant || 'Unknown Restaurant';
  const safeTags = Array.isArray(tags) ? tags : [];

  // Rating display
  const ratingDisplay = useMemo(() => {
    if (!rating) return null;
    return parseFloat(rating).toFixed(1);
  }, [rating]);

  const handleCardClick = useCallback((e) => {
    // Prevent modal opening if clicking on action buttons
    if (e.target.closest('.add-to-list-button')) {
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
        item_type: 'dish',
        engagement_type: 'click',
      });
    }

    // Open modal instead of navigating
    console.log(`[DishCard] Opening modal for dish ${id}`);
    setIsModalOpen(true);
  }, [id]);

  const handleRestaurantClick = useCallback((e) => {
    e.stopPropagation();
    if (restaurant_id) {
      engagementService.logEngagement({
        item_id: parseInt(restaurant_id, 10),
        item_type: 'restaurant',
        engagement_type: 'click_from_dish',
      });
    }
  }, [restaurant_id]);

  // Create dish object for modal
  const dishForModal = useMemo(() => ({
    id,
    name: cleanName,
    restaurant_name: cleanRestaurant,
    restaurant_id,
    description,
    rating,
    tags: safeTags,
    price,
    is_trending,
    is_featured,
    is_spicy,
    is_vegetarian,
    is_vegan,
    prep_time,
    image_url,
    adds
  }), [
    id, cleanName, cleanRestaurant, restaurant_id, description, rating, 
    safeTags, price, is_trending, is_featured, is_spicy, is_vegetarian, 
    is_vegan, prep_time, image_url, adds
  ]);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={dishCardVariants}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`group relative ${className}`}
        data-testid={`dish-card-${id}`}
        role="article"
        aria-label={`Dish: ${cleanName}`}
      >
        <div onClick={handleCardClick} className="block cursor-pointer">
          <div className={CARD_SPECS.FULL_CLASS}>
            {/* Add to List Button */}
            <div className="add-to-list-button">
              <AddToListButton
                dish={{ id, name: cleanName }}
                onAddToList={onAddToList}
              />
            </div>

            {/* Dish Type Label */}
            <div className="flex justify-between items-start mb-2">
              <DishBadge 
                icon={BookOpen} 
                text="Dish" 
                color="green"
                size="xs" 
                testId="dish-type-badge"
              />
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
                {/* Restaurant */}
                <div className="flex items-center text-sm text-gray-600">
                  <Utensils size={14} className="mr-2 flex-shrink-0 text-orange-500" />
                  <span className="truncate">at {cleanRestaurant}</span>
                </div>

                {/* Rating and Prep Time */}
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

                  {prep_time && (
                    <div className="flex items-center text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span className="text-xs">{prep_time}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                {price && (
                  <div className="flex items-center text-sm text-green-600 font-semibold" data-testid="price-display">
                    <span>{price}</span>
                  </div>
                )}

                {/* Popularity */}
                <div className="flex items-center text-sm text-gray-600">
                  <ThumbsUp size={14} className="mr-2 flex-shrink-0 text-blue-500" />
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
                  <DishBadge 
                    icon={Award} 
                    text="Featured" 
                    color="purple"
                    size="xs" 
                    testId="featured-badge"
                  />
                )}
                
                {is_trending && (
                  <DishBadge 
                    icon={TrendingUp} 
                    text="Trending" 
                    color="red"
                    size="xs" 
                    testId="trending-badge"
                  />
                )}
                
                {is_spicy && (
                  <DishBadge 
                    icon={Flame} 
                    text="Spicy" 
                    color="red"
                    size="xs" 
                    testId="spicy-badge"
                  />
                )}
                
                {is_vegan && (
                  <DishBadge 
                    icon={Leaf} 
                    text="Vegan" 
                    color="green"
                    size="xs" 
                    testId="vegan-badge"
                  />
                )}
                
                {is_vegetarian && !is_vegan && (
                  <DishBadge 
                    icon={Leaf} 
                    text="Vegetarian" 
                    color="green"
                    size="xs" 
                    testId="vegetarian-badge"
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

      {/* Enhanced Dish Modal */}
      <EnhancedDishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dish={dishForModal}
        onSave={(dish, saved) => {
          console.log(`Dish ${dish.id} ${saved ? 'saved' : 'unsaved'}`);
        }}
        onShare={(dish) => {
          console.log(`Shared dish ${dish.id}`);
        }}
      />
    </>
  );
};

DishCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  restaurant: PropTypes.string,
  restaurant_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tags: PropTypes.array,
  adds: PropTypes.number,
  onAddToList: PropTypes.func,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  description: PropTypes.string,
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  is_spicy: PropTypes.bool,
  is_vegetarian: PropTypes.bool,
  is_vegan: PropTypes.bool,
  prep_time: PropTypes.string,
  image_url: PropTypes.string,
  price: PropTypes.string,
  className: PropTypes.string,
};

export default React.memo(DishCard);