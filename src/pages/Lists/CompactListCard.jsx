/* src/pages/Lists/CompactListCard.jsx */
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  Star, 
  Eye, 
  Clock, 
  Users, 
  Hash,
  TrendingUp,
  Share2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import { engagementService } from '@/services/engagementService';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug } from '@/utils/logger';

// Compact animation variants
const compactCardVariants = {
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
    red: "bg-red-100 text-red-600"
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colorClasses[color]}`}>
      <Icon size={8} className="mr-1" />
      {text}
    </span>
  );
};

const CompactListCard = ({ 
  list, 
  onQuickAdd, 
  onClick, 
  showActions = true,
  showMetadata = true,
  className = "" 
}) => {
  const [followStatus, setFollowStatus] = useState(Boolean(list.is_following));
  const { user, isAuthenticated  } = useAuth() || {};

  // Simplified list data query for compact view
  const { data: listData } = useQuery({
    queryKey: ['list-compact', list.id],
    queryFn: () => listService.getListDetails(list.id),
    enabled: Boolean(list.id),
    staleTime: 300000, // 5 minutes
  });

  const isOwnList = useMemo(() => {
    if (!user) return false;
    return (
      (list.user_id != null && user.id != null && list.user_id === user.id) ||
      (list.created_by_user === true) ||
      (list.creator_handle != null && user.username != null && list.creator_handle === user.username)
    );
  }, [user, list]);

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(list.id);
    }
    
    // Log engagement
    try {
      engagementService.logEngagement({
        item_id: parseInt(list.id, 10),
        item_type: 'list',
        engagement_type: 'view_compact',
      });
    } catch (error) {
      console.error('[CompactListCard] Error logging engagement:', error);
    }
  }, [onClick, list.id]);

  const handleToggleFollow = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setFollowStatus((prev) => !prev);
    
    try {
      const key = `follow_state_${list.id}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          isFollowing: !followStatus,
          updatedAt: new Date().toISOString(),
        })
      );
      
      logDebug(`[CompactListCard] List ${list.id} ${!followStatus ? 'followed' : 'unfollowed'}`);
    } catch (error) {
      console.error('[CompactListCard] Error updating follow state:', error);
      setFollowStatus(followStatus); // Revert on error
    }
  }, [followStatus, list.id]);

  const handleShare = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: list.name,
          text: `Check out this list: ${list.name}`,
          url: `${window.location.origin}/lists/${list.id}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/lists/${list.id}`);
      }
    } catch (error) {
      console.error('[CompactListCard] Error sharing list:', error);
    }
  }, [list.name, list.id]);

  const itemCount = list.item_count || listData?.items?.length || list.items?.length || 0;
  const updatedText = formatRelativeDate(list.updated_at ? new Date(list.updated_at) : new Date());

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={compactCardVariants}
      transition={{ duration: 0.15 }}
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-black line-clamp-1 mb-1">
            {list.name}
          </h4>
          {showMetadata && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="flex items-center">
                <Users size={10} className="mr-1" />
                {itemCount}
              </span>
              <span className="flex items-center">
                <Clock size={10} className="mr-1" />
                {updatedText}
              </span>
            </div>
          )}
        </div>

        {/* Compact Action Buttons */}
        {showActions && (
          <div className="flex items-center space-x-1 ml-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Share"
            >
              <Share2 size={12} />
            </motion.button>
            
            {isAuthenticated && !isOwnList && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleFollow}
                className={`p-1 rounded transition-colors ${
                  followStatus 
                    ? 'text-yellow-500 hover:text-yellow-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={followStatus ? 'Unfollow' : 'Follow'}
              >
                <Star className={followStatus ? 'fill-current' : ''} size={12} />
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Compact Metadata Badges */}
      {showMetadata && (
        <div className="flex items-center space-x-1 flex-wrap">
          {list.list_type && (
            <CompactBadge 
              icon={Hash} 
              text={list.list_type} 
              color="blue" 
            />
          )}
          
          {list.is_trending && (
            <CompactBadge 
              icon={TrendingUp} 
              text="Trending" 
              color="red" 
            />
          )}
          
          {itemCount > 10 && (
            <CompactBadge 
              icon={Eye} 
              text="Popular" 
              color="green" 
            />
          )}
        </div>
      )}

      {/* Description Preview */}
      {list.description && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
          {list.description}
        </p>
      )}
    </motion.div>
  );
};

CompactListCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    list_type: PropTypes.string,
    items: PropTypes.array,
    item_count: PropTypes.number,
    updated_at: PropTypes.string,
    is_following: PropTypes.bool,
    is_trending: PropTypes.bool,
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_by_user: PropTypes.bool,
    creator_handle: PropTypes.string,
  }).isRequired,
  onQuickAdd: PropTypes.func,
  onClick: PropTypes.func,
  showActions: PropTypes.bool,
  showMetadata: PropTypes.bool,
  className: PropTypes.string,
};

export default React.memo(CompactListCard); 