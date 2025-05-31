import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Star, 
  Clock,
  TrendingUp,
  Award,
  Eye,
  Hash,
  Plus,
  UserPlus,
  UserMinus,
  Share2
} from 'lucide-react';
import { engagementService } from '@/services/engagementService';
import { useAuth } from '@/contexts/auth/AuthContext';
import { CARD_SPECS } from '@/models/cardModels';
import { formatRelativeDate } from '@/utils/formatting';
import EnhancedListModal from '@/components/modals/EnhancedListModal';

// Animation variants for better UX - consistent with other cards
const listCardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

// Enhanced badge component for list metadata
const ListBadge = ({ icon: Icon, text, color = "gray", size = "sm", testId }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700"
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

// Follow button component
const FollowButton = ({ list, onFollow, onUnfollow }) => {
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(Boolean(list.is_following));
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFollowToggle = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (isFollowing) {
        if (onUnfollow) {
          await onUnfollow(list.id);
        }
        setIsFollowing(false);
      } else {
        if (onFollow) {
          await onFollow(list.id);
        }
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isFollowing, isProcessing, onFollow, onUnfollow, list.id]);

  // Don't show follow button if user owns the list or isn't authenticated
  if (!isAuthenticated || list.created_by_user || !list.can_follow) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleFollowToggle}
      disabled={isProcessing}
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
        isFollowing 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
      }`}
      title={isFollowing ? `Unfollow ${list.name}` : `Follow ${list.name}`}
      aria-label={isFollowing ? `Unfollow ${list.name}` : `Follow ${list.name}`}
      data-testid="follow-button"
    >
      {isProcessing ? (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <UserMinus size={12} />
      ) : (
        <UserPlus size={12} />
      )}
    </motion.button>
  );
};

// Quick Add button component
const QuickAddButton = ({ list, onQuickAdd }) => {
  const { isAuthenticated } = useAuth();

  const handleQuickAdd = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onQuickAdd) {
      onQuickAdd({
        listId: list.id,
        listName: list.name
      });
    }
  }, [onQuickAdd, list]);

  if (!isAuthenticated || !onQuickAdd) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleQuickAdd}
      className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
      title={`Add item to ${list.name}`}
      aria-label={`Add item to ${list.name}`}
      data-testid="quick-add-button"
    >
      <Plus size={12} />
    </motion.button>
  );
};

const ListCard = ({
  id,
  name,
  description,
  list_type,
  tags = [],
  items,
  items_count = 0,
  view_count = 0,
  follow_count = 0,
  comment_count = 0,
  is_trending = false,
  is_featured = false,
  is_public = true,
  user,
  created_by_user = false,
  is_following = false,
  can_follow = true,
  cover_image_url,
  updated_at,
  created_at,
  onQuickAdd,
  onFollow,
  onUnfollow,
  onShare,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const cleanName = name?.trim() || 'Unnamed List';
  const safeTags = Array.isArray(tags) ? tags : [];
  const displayItemCount = items_count || (Array.isArray(items) ? items.length : 0);
  
  // Format update time
  const updatedText = useMemo(() => {
    if (updated_at) {
      return formatRelativeDate(updated_at);
    }
    return 'Recently updated';
  }, [updated_at]);

  // Preview items (first 3)
  const previewItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 3);
  }, [items]);

  const handleCardClick = useCallback((e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('.follow-button') || e.target.closest('.quick-add-button')) {
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
        item_type: 'list',
        engagement_type: 'click',
      });
    }

    // Open modal instead of navigating
    console.log(`[ListCard] Opening modal for list ${id}`);
    setIsModalOpen(true);
  }, [id]);

  // Create list object for modal
  const listForModal = useMemo(() => ({
    id,
    name: cleanName,
    description,
    list_type,
    tags: safeTags,
    items,
    item_count: displayItemCount,
    view_count,
    follow_count,
    comment_count,
    is_trending,
    is_featured,
    is_public,
    user,
    created_by_user,
    is_following,
    can_follow,
    cover_image_url,
    updated_at,
    created_at
  }), [
    id, cleanName, description, list_type, safeTags, items, displayItemCount,
    view_count, follow_count, comment_count, is_trending, is_featured, is_public,
    user, created_by_user, is_following, can_follow, cover_image_url, updated_at, created_at
  ]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={listCardVariants}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative ${className}`}
      data-testid={`list-card-${id}`}
      role="article"
      aria-label={`List: ${cleanName}`}
    >
      <div onClick={handleCardClick} className="block cursor-pointer">
        <div className={CARD_SPECS.FULL_CLASS}>
          {/* List Type Label */}
          <div className="flex justify-between items-start mb-2">
            <ListBadge 
              icon={BookOpen} 
              text="List" 
              color="blue"
              size="xs" 
              testId="list-type-badge"
            />

            {/* Action Buttons Container */}
            <div className="flex items-center space-x-1">
              {/* Follow Button - positioned first (leftmost) */}
              <div className="follow-button">
                <FollowButton
                  list={{
                    id,
                    name: cleanName,
                    is_following,
                    created_by_user,
                    can_follow
                  }}
                  onFollow={onFollow}
                  onUnfollow={onUnfollow}
                />
              </div>

              {/* Quick Add Button - positioned second (rightmost) */}
              <div className="quick-add-button">
                <QuickAddButton
                  list={{ id, name: cleanName }}
                  onQuickAdd={onQuickAdd}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Header with Cover Image Support */}
          <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
            {/* Cover Image Section (if available) */}
            {cover_image_url && (
              <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 h-32">
                <img 
                  src={cover_image_url} 
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
              {/* Items Count */}
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen size={14} className="mr-2 flex-shrink-0 text-blue-500" />
                <span>{displayItemCount} {displayItemCount === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Creator and Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  {user && (
                    <div className="flex items-center text-gray-600">
                      <Users size={12} className="mr-1" />
                      <span className="truncate">{user.name || user.username}</span>
                    </div>
                  )}
                </div>

                {follow_count > 0 && (
                  <div className="flex items-center text-gray-500">
                    <Star size={12} className="mr-1" />
                    <span className="text-xs">{follow_count}</span>
                  </div>
                )}
              </div>

              {/* Last Updated */}
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={14} className="mr-2 flex-shrink-0 text-gray-500" />
                <span className="text-xs">{updatedText}</span>
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
                <ListBadge 
                  icon={Award} 
                  text="Featured" 
                  color="purple"
                  size="xs" 
                  testId="featured-badge"
                />
              )}
              
              {is_trending && (
                <ListBadge 
                  icon={TrendingUp} 
                  text="Trending" 
                  color="red"
                  size="xs" 
                  testId="trending-badge"
                />
              )}
              
              {!is_public && (
                <ListBadge 
                  icon={Eye} 
                  text="Private" 
                  color="gray"
                  size="xs" 
                  testId="private-badge"
                />
              )}
              
              {list_type && list_type !== 'custom' && (
                <ListBadge 
                  icon={Hash} 
                  text={list_type} 
                  color="green"
                  size="xs" 
                  testId="type-badge"
                />
              )}
            </motion.div>

            {/* Preview Items */}
            {previewItems.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Recent items:</div>
                <div className="space-y-1">
                  {previewItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="text-xs text-gray-700 truncate">
                      • {item.name}
                    </div>
                  ))}
                  {displayItemCount > 3 && (
                    <div className="text-xs text-gray-500">
                      +{displayItemCount - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}
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
                  +{safeTags.length - 3} more
                </motion.span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced List Modal */}
      <EnhancedListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        list={listForModal}
        onShare={(listData) => {
          console.log('Sharing list:', listData);
        }}
      />
    </motion.div>
  );
};

ListCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  list_type: PropTypes.string,
  tags: PropTypes.array,
  items: PropTypes.array,
  items_count: PropTypes.number,
  view_count: PropTypes.number,
  follow_count: PropTypes.number,
  comment_count: PropTypes.number,
  is_trending: PropTypes.bool,
  is_featured: PropTypes.bool,
  is_public: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    username: PropTypes.string,
    avatar_url: PropTypes.string,
  }),
  created_by_user: PropTypes.bool,
  is_following: PropTypes.bool,
  can_follow: PropTypes.bool,
  cover_image_url: PropTypes.string,
  updated_at: PropTypes.string,
  created_at: PropTypes.string,
  onQuickAdd: PropTypes.func,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  onShare: PropTypes.func,
  className: PropTypes.string,
};

export default React.memo(ListCard);