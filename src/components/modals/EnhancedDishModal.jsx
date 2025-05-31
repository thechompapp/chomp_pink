import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Star, 
  Heart, 
  HeartOff, 
  Share2, 
  ExternalLink,
  ChefHat,
  Utensils,
  Plus,
  ChevronRight,
  Bookmark,
  Users,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { dishService } from '@/services/dishService';
import Button from '@/components/UI/Button';
import PillButton from '@/components/UI/PillButton';
import AddToListModal from '@/components/AddToListModal';
import { engagementService } from '@/services/engagementService';
import { logInfo, logError } from '@/utils/logger';

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.1, duration: 0.2 }
  }
};

// Stat display component
const StatItem = ({ icon: Icon, label, value, color = "text-gray-600" }) => (
  <div className="flex items-center space-x-2">
    <Icon size={16} className={`${color} flex-shrink-0`} />
    <div className="text-sm">
      <span className="font-medium text-gray-900">{value}</span>
      <span className="text-gray-500 ml-1">{label}</span>
    </div>
  </div>
);

// Restaurant info component
const RestaurantInfo = ({ restaurant, onViewRestaurant }) => {
  if (!restaurant.name) return null;

  return (
    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Utensils size={18} className="text-orange-600" />
            <h3 className="font-semibold text-orange-900">Available at</h3>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-1">
            {restaurant.name}
          </h4>
          {(restaurant.neighborhood_name || restaurant.city_name) && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <MapPin size={12} />
              <span>
                {[restaurant.neighborhood_name, restaurant.city_name]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
        {onViewRestaurant && (
          <Button
            onClick={onViewRestaurant}
            variant="secondary"
            size="sm"
            className="ml-3 flex items-center space-x-1"
          >
            <span>View</span>
            <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};

// Enhanced Dish Detail Modal
const EnhancedDishModal = ({ 
  isOpen, 
  onClose, 
  dish,
  onSave,
  onShare 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [listCount, setListCount] = useState(0);

  // Initialize state from dish data
  useEffect(() => {
    if (dish) {
      setIsSaved(dish.is_saved || false);
      setSaveCount(dish.saved_count || 0);
      setListCount(dish.list_count || 0);
    }
  }, [dish]);

  // Handle save/unsave dish
  const handleSaveToggle = useCallback(async () => {
    if (!isAuthenticated || !dish) return;

    try {
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));

      if (newSavedState) {
        await dishService.saveDish(dish.id);
        logInfo(`Dish ${dish.id} saved`);
      } else {
        await dishService.unsaveDish(dish.id);
        logInfo(`Dish ${dish.id} unsaved`);
      }

      // Log engagement
      engagementService.logEngagement({
        item_id: dish.id,
        item_type: 'dish',
        engagement_type: newSavedState ? 'save' : 'unsave'
      });

      onSave?.(dish, newSavedState);
    } catch (error) {
      logError('Error toggling dish save:', error);
      // Revert state on error
      setIsSaved(!isSaved);
      setSaveCount(prev => isSaved ? prev + 1 : Math.max(0, prev - 1));
    }
  }, [isAuthenticated, dish, isSaved, onSave]);

  // Handle add to list
  const handleAddToList = useCallback(() => {
    if (!isAuthenticated) return;
    setIsAddToListOpen(true);
  }, [isAuthenticated]);

  // Handle share
  const handleShare = useCallback(async () => {
    const shareData = {
      title: dish?.name || 'Dish',
      text: `Check out ${dish?.name} ${dish?.restaurant_name ? `at ${dish.restaurant_name}` : ''} on DOOF!`,
      url: `${window.location.origin}/dish/${dish?.id}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        engagementService.logEngagement({
          item_id: dish.id,
          item_type: 'dish',
          engagement_type: 'share'
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          logError('Error sharing:', error);
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        logInfo('Dish link copied to clipboard');
      } catch (error) {
        logError('Error copying to clipboard:', error);
      }
    }

    onShare?.(dish);
  }, [dish, onShare]);

  // Handle view restaurant
  const handleViewRestaurant = useCallback(() => {
    if (dish?.restaurant_id) {
      // You might want to open the restaurant modal instead of navigating
      window.open(`/restaurant/${dish.restaurant_id}`, '_blank');
      
      engagementService.logEngagement({
        item_id: dish.restaurant_id,
        item_type: 'restaurant',
        engagement_type: 'view_from_dish'
      });
    }
  }, [dish]);

  // Format rating display
  const ratingDisplay = useMemo(() => {
    if (!dish?.rating) return null;
    const rating = parseFloat(dish.rating);
    return rating > 0 ? rating.toFixed(1) : null;
  }, [dish?.rating]);

  // Get restaurant info
  const restaurantInfo = useMemo(() => {
    if (!dish) return null;
    return {
      id: dish.restaurant_id,
      name: dish.restaurant_name,
      neighborhood_name: dish.neighborhood_name,
      city_name: dish.city_name
    };
  }, [dish]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!dish) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>

                <motion.div variants={contentVariants} initial="hidden" animate="visible">
                  {/* Dish Name */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 pr-12">
                    {dish.name}
                  </h1>

                  {/* Restaurant Name */}
                  {dish.restaurant_name && (
                    <div className="flex items-center space-x-2 text-lg text-gray-700 mb-3">
                      <ChefHat size={18} className="text-orange-500" />
                      <span>at <span className="font-medium">{dish.restaurant_name}</span></span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-6 mb-4">
                    {ratingDisplay && (
                      <StatItem
                        icon={Star}
                        label="rating"
                        value={ratingDisplay}
                        color="text-yellow-500"
                      />
                    )}
                    <StatItem
                      icon={Bookmark}
                      label="saves"
                      value={saveCount}
                      color="text-blue-500"
                    />
                    {listCount > 0 && (
                      <StatItem
                        icon={Users}
                        label="lists"
                        value={listCount}
                        color="text-green-500"
                      />
                    )}
                    {dish.is_common && (
                      <div className="flex items-center space-x-1">
                        <Tag size={16} className="text-purple-500" />
                        <span className="text-sm font-medium text-purple-700">
                          Popular
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                <motion.div 
                  variants={contentVariants} 
                  initial="hidden" 
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Restaurant Info */}
                  {restaurantInfo.name && (
                    <RestaurantInfo 
                      restaurant={restaurantInfo}
                      onViewRestaurant={handleViewRestaurant}
                    />
                  )}

                  {/* Description */}
                  {dish.description && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">Description</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {dish.tags && dish.tags.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {dish.tags.map((tag, index) => (
                          <PillButton
                            key={index}
                            label={tag}
                            prefix="#"
                            isActive={false}
                            className="!text-xs !px-3 !py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(dish.price || dish.dietary_info) && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {dish.price && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Price</p>
                            <p className="text-sm font-medium text-gray-900">{dish.price}</p>
                          </div>
                        )}
                        {dish.dietary_info && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Dietary Info</p>
                            <p className="text-sm font-medium text-gray-900">{dish.dietary_info}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-2">
                    {/* Save/Unsave Button */}
                    {isAuthenticated && (
                      <Button
                        onClick={handleSaveToggle}
                        variant={isSaved ? "primary" : "secondary"}
                        size="sm"
                        className={`flex items-center space-x-2 ${
                          isSaved ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-gray-100'
                        }`}
                      >
                        {isSaved ? <HeartOff size={16} /> : <Heart size={16} />}
                        <span>{isSaved ? 'Unsave' : 'Save'}</span>
                      </Button>
                    )}

                    {/* Share Button */}
                    <Button
                      onClick={handleShare}
                      variant="secondary"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </Button>

                    {/* View at Restaurant */}
                    {dish.restaurant_id && (
                      <Button
                        onClick={handleViewRestaurant}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Utensils size={16} />
                        <span>View Restaurant</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Add to List Button */}
                    {isAuthenticated && (
                      <Button
                        onClick={handleAddToList}
                        variant="primary"
                        size="md"
                        className="flex items-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>Add to List</span>
                      </Button>
                    )}

                    {/* View Full Details Link */}
                    <Link
                      to={`/dish/${dish.id}`}
                      onClick={onClose}
                      className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>View Details</span>
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Add to List Modal */}
          <AddToListModal
            isOpen={isAddToListOpen}
            onClose={() => setIsAddToListOpen(false)}
            item={{
              id: dish.id,
              name: dish.name,
              type: 'dish'
            }}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

EnhancedDishModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dish: PropTypes.object,
  onSave: PropTypes.func,
  onShare: PropTypes.func
};

export default EnhancedDishModal; 