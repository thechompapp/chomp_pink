import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  Heart, 
  HeartOff, 
  Share2, 
  Edit3,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  User,
  Calendar,
  List,
  Bookmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { listService } from '@/services/listService';
import Button from '@/components/UI/Button';
import PillButton from '@/components/UI/PillButton';
import FollowButton from '@/components/FollowButton';
import { engagementService } from '@/services/engagementService';
import { formatRelativeDate } from '@/utils/formatting';
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

// List item preview component
const ListItemPreview = ({ item, listType }) => {
  if (listType === 'restaurant') {
    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-orange-600 text-xs font-medium">R</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {item.restaurant_name || item.name}
          </h4>
          {item.city_name && (
            <p className="text-xs text-gray-500 truncate">
              {item.neighborhood_name ? `${item.neighborhood_name}, ${item.city_name}` : item.city_name}
            </p>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-green-600 text-xs font-medium">D</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {item.dish_name || item.name}
          </h4>
          {item.restaurant_name && (
            <p className="text-xs text-gray-500 truncate">
              at {item.restaurant_name}
            </p>
          )}
        </div>
      </div>
    );
  }
};

// Privacy toggle component
const PrivacyToggle = ({ isPublic, onToggle, isOwner }) => {
  if (!isOwner) return null;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggle}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isPublic 
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
        <span>{isPublic ? 'Public' : 'Private'}</span>
      </button>
    </div>
  );
};

// Enhanced List Detail Modal
const EnhancedListModal = ({ 
  isOpen, 
  onClose, 
  list,
  onFollow,
  onEdit,
  onShare 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isPrivacyToggling, setIsPrivacyToggling] = useState(false);
  const [localList, setLocalList] = useState(list);
  const [previewItems, setPreviewItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Update local state when list prop changes
  useEffect(() => {
    setLocalList(list);
    
    // Set preview items - first 4 items from the list
    if (list?.items && Array.isArray(list.items)) {
      setPreviewItems(list.items.slice(0, 4));
    } else {
      setPreviewItems([]);
    }
  }, [list, isOpen]);

  // Fetch list items when modal opens if not already provided
  useEffect(() => {
    const fetchListItems = async () => {
      if (isOpen && list?.id && (!list.items || list.items.length === 0) && list.item_count > 0) {
        setIsLoadingItems(true);
        try {
          const result = await listService.getListItems(list.id, { page: 1, limit: 4 });
          if (result.success && result.data) {
            setPreviewItems(result.data.slice(0, 4));
            // Update local list with items
            setLocalList(prev => ({
              ...prev,
              items: result.data
            }));
          }
        } catch (error) {
          logError('Error fetching list items for modal:', error);
        } finally {
          setIsLoadingItems(false);
        }
      }
    };

    fetchListItems();
  }, [isOpen, list?.id, list?.items, list?.item_count]);

  // Determine if user is the owner
  const isOwner = useMemo(() => {
    return isAuthenticated && user && localList && localList.user_id === user.id;
  }, [isAuthenticated, user, localList]);

  // Calculate creation date
  const creationDate = useMemo(() => {
    if (localList?.created_at) {
      return formatRelativeDate(new Date(localList.created_at));
    }
    return null;
  }, [localList?.created_at]);

  // Handle edit
  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(localList);
    }
    onClose();
  }, [localList, onEdit, onClose]);

  // Handle privacy toggle
  const handlePrivacyToggle = useCallback(async () => {
    if (!isOwner || !localList || isPrivacyToggling) return;

    setIsPrivacyToggling(true);
    try {
      const newPublicState = !localList.is_public;
      
      await listService.updateListPrivacy(localList.id, newPublicState);
      
      setLocalList(prev => ({
        ...prev,
        is_public: newPublicState
      }));

      logInfo(`List ${localList.id} privacy updated to ${newPublicState ? 'public' : 'private'}`);
      
      // Log engagement
      engagementService.logEngagement({
        item_id: localList.id,
        item_type: 'list',
        engagement_type: 'privacy_toggle'
      });
    } catch (error) {
      logError('Error toggling list privacy:', error);
    } finally {
      setIsPrivacyToggling(false);
    }
  }, [isOwner, localList, isPrivacyToggling]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!localList) return;

    const shareData = {
      title: localList.name || 'List',
      text: `Check out this ${localList.list_type} list on DOOF: ${localList.name}`,
      url: `${window.location.origin}/list/${localList.id}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        engagementService.logEngagement({
          item_id: localList.id,
          item_type: 'list',
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
        logInfo('List link copied to clipboard');
      } catch (error) {
        logError('Error copying to clipboard:', error);
      }
    }

    onShare?.(localList);
  }, [localList, onShare]);

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

  if (!localList) return null;

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
                  {/* List Name */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 pr-12">
                    {localList.name}
                  </h1>

                  {/* Creator & Privacy Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {localList.creator_handle && (
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>
                            {isOwner ? 'Your List' : `By @${localList.creator_handle}`}
                          </span>
                        </div>
                      )}
                      {creationDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{creationDate}</span>
                        </div>
                      )}
                    </div>
                    
                    <PrivacyToggle 
                      isPublic={localList.is_public}
                      onToggle={handlePrivacyToggle}
                      isOwner={isOwner}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6 mb-4">
                    <StatItem
                      icon={List}
                      label={`${localList.list_type}${localList.item_count !== 1 ? 's' : ''}`}
                      value={localList.item_count || 0}
                      color="text-blue-500"
                    />
                    {(localList.saved_count || 0) > 0 && (
                      <StatItem
                        icon={Bookmark}
                        label="saves"
                        value={localList.saved_count}
                        color="text-green-500"
                      />
                    )}
                    {(localList.follower_count || 0) > 0 && (
                      <StatItem
                        icon={Users}
                        label="followers"
                        value={localList.follower_count}
                        color="text-purple-500"
                      />
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
                  {/* Description */}
                  {localList.description && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">Description</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {localList.description}
                      </p>
                    </div>
                  )}

                  {/* Preview Items */}
                  {(localList.item_count > 0) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {localList.list_type === 'restaurant' ? 'Restaurants' : 'Dishes'}
                        </h3>
                        {!isLoadingItems && localList.item_count > previewItems.length && (
                          <span className="text-xs text-gray-500">
                            Showing {previewItems.length} of {localList.item_count}
                          </span>
                        )}
                      </div>
                      
                      {isLoadingItems ? (
                        <div className="space-y-2">
                          {/* Loading skeleton */}
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center space-x-3 p-2 rounded-lg">
                              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : previewItems.length > 0 ? (
                        <div className="space-y-1">
                          {previewItems.map((item, index) => (
                            <ListItemPreview 
                              key={item.id || index}
                              item={item}
                              listType={localList.list_type}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No items to preview
                        </div>
                      )}
                      
                      {!isLoadingItems && localList.item_count > previewItems.length && (
                        <div className="text-center pt-2">
                          <Link
                            to={`/lists/${localList.id}`}
                            onClick={onClose}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View all {localList.item_count} items →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {localList.tags && localList.tags.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {localList.tags.map((tag, index) => (
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
                    {/* Follow/Unfollow Button - only for other users' lists */}
                    {isAuthenticated && !isOwner && localList.is_public && (
                      <FollowButton
                        listId={localList.id}
                        initialFollowState={localList.is_following}
                        size="sm"
                        showIcon={true}
                        onToggle={(newState) => {
                          onFollow?.(localList, newState);
                        }}
                      />
                    )}

                    {/* Edit Button - only for owner */}
                    {isOwner && (
                      <Button
                        onClick={handleEdit}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Edit3 size={16} />
                        <span>Edit</span>
                      </Button>
                    )}

                    {/* Share Button */}
                    {localList.is_public && (
                      <Button
                        onClick={handleShare}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Share2 size={16} />
                        <span>Share</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* View Full List Link */}
                    <Link
                      to={`/lists/${localList.id}`}
                      onClick={onClose}
                      className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>View Full List</span>
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

EnhancedListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  list: PropTypes.object,
  onFollow: PropTypes.func,
  onEdit: PropTypes.func,
  onShare: PropTypes.func
};

export default EnhancedListModal; 