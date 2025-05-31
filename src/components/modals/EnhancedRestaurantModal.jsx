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
  Phone,
  Clock,
  Users,
  Award,
  Plus,
  ChevronRight,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { restaurantService } from '@/services/restaurantService';
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

// Enhanced Restaurant Detail Modal
const EnhancedRestaurantModal = ({ 
  isOpen, 
  onClose, 
  restaurant,
  onSave,
  onShare 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [listCount, setListCount] = useState(0);

  // Initialize state from restaurant data
  useEffect(() => {
    if (restaurant) {
      setIsSaved(restaurant.is_saved || false);
      setSaveCount(restaurant.saved_count || 0);
      setListCount(restaurant.list_count || 0);
    }
  }, [restaurant]);

  // Handle save/unsave restaurant
  const handleSaveToggle = useCallback(async () => {
    if (!isAuthenticated || !restaurant) return;

    try {
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));

      if (newSavedState) {
        await restaurantService.saveRestaurant(restaurant.id);
        logInfo(`Restaurant ${restaurant.id} saved`);
      } else {
        await restaurantService.unsaveRestaurant(restaurant.id);
        logInfo(`Restaurant ${restaurant.id} unsaved`);
      }

      // Log engagement
      engagementService.logEngagement({
        item_id: restaurant.id,
        item_type: 'restaurant',
        engagement_type: newSavedState ? 'save' : 'unsave'
      });

      onSave?.(restaurant, newSavedState);
    } catch (error) {
      logError('Error toggling restaurant save:', error);
      // Revert state on error
      setIsSaved(!isSaved);
      setSaveCount(prev => isSaved ? prev + 1 : Math.max(0, prev - 1));
    }
  }, [isAuthenticated, restaurant, isSaved, onSave]);

  // Handle add to list
  const handleAddToList = useCallback(() => {
    if (!isAuthenticated) return;
    setIsAddToListOpen(true);
  }, [isAuthenticated]);

  // Handle share
  const handleShare = useCallback(async () => {
    const shareData = {
      title: restaurant?.name || 'Restaurant',
      text: `Check out ${restaurant?.name} on DOOF!`,
      url: `${window.location.origin}/restaurant/${restaurant?.id}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        engagementService.logEngagement({
          item_id: restaurant.id,
          item_type: 'restaurant',
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
        // You could show a toast notification here
        logInfo('Restaurant link copied to clipboard');
      } catch (error) {
        logError('Error copying to clipboard:', error);
      }
    }

    onShare?.(restaurant);
  }, [restaurant, onShare]);

  // Handle directions/map
  const handleDirections = useCallback(() => {
    if (!restaurant?.latitude || !restaurant?.longitude) {
      // Fallback to address search
      const query = encodeURIComponent(`${restaurant?.name} ${restaurant?.address || ''}`);
      window.open(`https://maps.google.com/?q=${query}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(
        `https://maps.google.com/?q=${restaurant.latitude},${restaurant.longitude}`,
        '_blank',
        'noopener,noreferrer'
      );
    }

    engagementService.logEngagement({
      item_id: restaurant.id,
      item_type: 'restaurant',
      engagement_type: 'directions'
    });
  }, [restaurant]);

  // Format rating display
  const ratingDisplay = useMemo(() => {
    if (!restaurant?.rating) return null;
    const rating = parseFloat(restaurant.rating);
    return rating > 0 ? rating.toFixed(1) : null;
  }, [restaurant?.rating]);

  // Format location
  const locationDisplay = useMemo(() => {
    if (!restaurant) return '';
    const parts = [restaurant.neighborhood_name, restaurant.city_name].filter(Boolean);
    return parts.join(', ') || 'Location not specified';
  }, [restaurant]);

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

  if (!restaurant) return null;

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
                  {/* Restaurant Name */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 pr-12">
                    {restaurant.name}
                  </h1>

                  {/* Cuisine & Location */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    {restaurant.cuisine_type && (
                      <span className="font-medium text-gray-800">
                        {restaurant.cuisine_type}
                      </span>
                    )}
                    {locationDisplay && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{locationDisplay}</span>
                      </div>
                    )}
                  </div>

                  {/* Rating & Stats */}
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
                    {restaurant.the_take_reviewer_verified && (
                      <div className="flex items-center space-x-1">
                        <Award size={16} className="text-purple-500" />
                        <span className="text-sm font-medium text-purple-700">
                          The Take Verified
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
                  {/* The Take Section - Special reviewer content */}
                  {restaurant.the_take_reviewer_verified && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award size={18} className="text-purple-600" />
                        <h3 className="font-semibold text-purple-900">The Take</h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          @{restaurant.reviewer_handle || 'verified'}
                        </span>
                      </div>
                      <p className="text-sm text-purple-800 leading-relaxed">
                        {restaurant.the_take_review || "This restaurant has been verified by our curated reviewers."}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  {(restaurant.phone_number || restaurant.website || restaurant.address) && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Contact & Location</h3>
                      
                      {restaurant.address && (
                        <div className="flex items-start space-x-3">
                          <MapPin size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{restaurant.address}</p>
                            <button
                              onClick={handleDirections}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                            >
                              Get directions →
                            </button>
                          </div>
                        </div>
                      )}

                      {restaurant.phone_number && (
                        <div className="flex items-center space-x-3">
                          <Phone size={16} className="text-gray-500" />
                          <a 
                            href={`tel:${restaurant.phone_number}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {restaurant.phone_number}
                          </a>
                        </div>
                      )}

                      {restaurant.website && (
                        <div className="flex items-center space-x-3">
                          <ExternalLink size={16} className="text-gray-500" />
                          <a 
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Visit website
                          </a>
                        </div>
                      )}

                      {restaurant.hours && (
                        <div className="flex items-start space-x-3">
                          <Clock size={16} className="text-gray-500 mt-0.5" />
                          <p className="text-sm text-gray-700">{restaurant.hours}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags/Attributes */}
                  {restaurant.tags && restaurant.tags.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Attributes</h3>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.tags.map((tag, index) => (
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
                      to={`/restaurant/${restaurant.id}`}
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
              id: restaurant.id,
              name: restaurant.name,
              type: 'restaurant'
            }}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

EnhancedRestaurantModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  restaurant: PropTypes.object,
  onSave: PropTypes.func,
  onShare: PropTypes.func
};

export default EnhancedRestaurantModal; 