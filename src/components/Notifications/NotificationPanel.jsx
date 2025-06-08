// NotificationPanel - Instagram-style notification panel component
// Features real-time updates, notification grouping, infinite scroll, and interactive actions

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings,
  Filter,
  RefreshCw,
  Users,
  Heart,
  MessageCircle,
  Plus,
  Star,
  TrendingUp,
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { useNotificationStore, useHasUnreadNotifications } from '@/stores/notificationStore';
import { formatRelativeDate } from '@/utils/formatting';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

/**
 * Notification type to icon mapping
 */
const NOTIFICATION_ICONS = {
  like_list: Heart,
  like_dish: Heart,
  like_restaurant: Heart,
  comment_list: MessageCircle,
  comment_dish: MessageCircle,
  comment_restaurant: MessageCircle,
  follow_user: Users,
  unfollow_user: Users,
  list_item_added: Plus,
  list_shared: Users,
  restaurant_recommendation: Star,
  dish_recommendation: Star,
  new_dish_at_favorite_restaurant: TrendingUp,
  submission_approved: Check,
  submission_rejected: X,
  system_announcement: AlertCircle,
  promotional: Star
};

/**
 * Notification type to color mapping
 */
const NOTIFICATION_COLORS = {
  like_list: 'text-red-500',
  like_dish: 'text-red-500',
  like_restaurant: 'text-red-500',
  comment_list: 'text-blue-500',
  comment_dish: 'text-blue-500',
  comment_restaurant: 'text-blue-500',
  follow_user: 'text-purple-500',
  unfollow_user: 'text-gray-500',
  list_item_added: 'text-green-500',
  list_shared: 'text-blue-500',
  restaurant_recommendation: 'text-yellow-500',
  dish_recommendation: 'text-yellow-500',
  new_dish_at_favorite_restaurant: 'text-orange-500',
  submission_approved: 'text-green-500',
  submission_rejected: 'text-red-500',
  system_announcement: 'text-blue-600',
  promotional: 'text-purple-600'
};

/**
 * Individual notification item component
 */
const NotificationItem = ({ notification, isSelected, onToggleSelect, onMarkRead, onDelete }) => {
  const IconComponent = NOTIFICATION_ICONS[notification.notificationType] || Bell;
  const iconColor = NOTIFICATION_COLORS[notification.notificationType] || 'text-gray-500';
  
  const handleClick = useCallback(() => {
    // Mark as read when clicked
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [notification, onMarkRead]);

  const handleToggleRead = useCallback((e) => {
    e.stopPropagation();
    onMarkRead(notification.id);
  }, [notification.id, onMarkRead]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(notification.id);
  }, [notification.id, onDelete]);

  const handleToggleSelect = useCallback((e) => {
    e.stopPropagation();
    onToggleSelect(notification.id);
  }, [notification.id, onToggleSelect]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-start space-x-3 p-4 cursor-pointer transition-all duration-200',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        !notification.isRead && 'bg-gray-50 border-l-4 border-gray-500',
        isSelected && 'bg-gray-100'
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox (when in selection mode) */}
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggleSelect}
          className="mt-1 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Notification icon */}
      <div className={cn(
        'flex-shrink-0 mt-1 p-2 rounded-full',
        !notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'
      )}>
        <IconComponent className={cn('w-5 h-5', iconColor)} />
      </div>

      {/* Notification content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title and sender */}
            <p className={cn(
              'text-sm',
              !notification.isRead 
                ? 'font-semibold text-gray-900 dark:text-white' 
                : 'font-medium text-gray-700 dark:text-gray-300'
            )}>
              {notification.title}
              {notification.senderUsername && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {' '}@{notification.senderUsername}
                </span>
              )}
            </p>

            {/* Message */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {notification.message}
            </p>

            {/* Group count indicator */}
            {notification.groupCount > 1 && (
              <div className="flex items-center mt-2">
                <div className="flex -space-x-1">
                  {/* Show multiple user avatars for grouped notifications */}
                  {[...Array(Math.min(notification.groupCount, 3))].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center"
                    >
                      <Users className="w-3 h-3 text-gray-600" />
                    </div>
                  ))}
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  and {notification.groupCount - 1} others
                </span>
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formatRelativeDate(notification.createdAt)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 ml-2">
            {/* Mark read/unread button */}
            <button
              onClick={handleToggleRead}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                'hover:bg-gray-200 dark:hover:bg-gray-700',
                notification.isRead ? 'text-gray-400' : 'text-blue-600'
              )}
              title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {notification.isRead ? <Bell className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </button>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
      )}
    </motion.div>
  );
};

/**
 * Notification filters component
 */
const NotificationFilters = ({ filters, onFiltersChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = { unreadOnly: false, type: null };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 mt-2"
    >
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Filter Notifications</h3>
        
        {/* Unread only toggle */}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localFilters.unreadOnly}
            onChange={(e) => setLocalFilters({ ...localFilters, unreadOnly: e.target.checked })}
            className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show unread only</span>
        </label>

        {/* Notification type filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notification Type
          </label>
          <select
            value={localFilters.type || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
          >
            <option value="">All types</option>
            <option value="like_list">Likes</option>
            <option value="comment_list">Comments</option>
            <option value="follow_user">Follows</option>
            <option value="system_announcement">System</option>
            <option value="promotional">Promotional</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleApplyFilters}
            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Main notification panel component
 */
const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    isNotificationPanelOpen,
    isConnected,
    connectionError,
    filters,
    isSelectionMode,
    selectedNotifications,
    
    // Actions
    fetchNotifications,
    loadMoreNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    toggleNotificationPanel,
    closeNotificationPanel,
    toggleSelectionMode,
    toggleNotificationSelection,
    selectAllNotifications,
    clearSelection,
    markSelectedAsRead,
    connectToNotificationStream
  } = useNotificationStore();

  const hasUnreadNotifications = useHasUnreadNotifications();
  
  const [showFilters, setShowFilters] = useState(false);
  const panelRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-fetch notifications on mount
  useEffect(() => {
    if (isNotificationPanelOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isNotificationPanelOpen, notifications.length, fetchNotifications]);

  // Ensure real-time connection
  useEffect(() => {
    if (!isConnected && !connectionError) {
      connectToNotificationStream();
    }
  }, [isConnected, connectionError, connectToNotificationStream]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        closeNotificationPanel();
        setShowFilters(false);
      }
    };

    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNotificationPanelOpen, closeNotificationPanel]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreNotifications();
    }
  }, [isLoadingMore, hasMore, loadMoreNotifications]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handlers
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  }, [markAsRead]);

  const handleDelete = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  }, [deleteNotification]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  }, [markAllAsRead]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshNotifications();
      toast.success('Notifications refreshed');
    } catch (error) {
      toast.error('Failed to refresh notifications');
    }
  }, [refreshNotifications]);

  const handleMarkSelectedRead = useCallback(async () => {
    try {
      await markSelectedAsRead();
      toast.success(`Marked ${selectedNotifications.size} notifications as read`);
    } catch (error) {
      toast.error('Failed to mark selected notifications as read');
    }
  }, [markSelectedAsRead, selectedNotifications.size]);

  // Grouped notifications for better UX
  const groupedNotifications = useMemo(() => {
    if (!notifications.length) return [];
    
    const today = [];
    const yesterday = [];
    const older = [];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    
    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      
      if (notificationDate >= todayStart) {
        today.push(notification);
      } else if (notificationDate >= yesterdayStart) {
        yesterday.push(notification);
      } else {
        older.push(notification);
      }
    });
    
    return [
      { label: 'Today', notifications: today },
      { label: 'Yesterday', notifications: yesterday },
      { label: 'Earlier', notifications: older }
    ].filter(group => group.notifications.length > 0);
  }, [notifications]);

  if (!isNotificationPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 bg-black bg-opacity-25 lg:hidden" />
      
      {/* Panel */}
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className={cn(
          'bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg',
          'fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-5rem)]',
          'lg:absolute lg:top-full lg:right-0 lg:mt-2',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center space-x-1">
            {/* Connection status */}
            {connectionError ? (
              <div className="w-2 h-2 bg-red-500 rounded-full" title="Connection error" />
            ) : isConnected ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Connecting..." />
            )}

            <button
              onClick={toggleNotificationPanel}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* Filter button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'p-2 rounded-md text-sm font-medium transition-colors',
                  showFilters || filters.unreadOnly || filters.type
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                <Filter className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showFilters && (
                  <NotificationFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClose={() => setShowFilters(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Selection mode toggle */}
            {notifications.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isSelectionMode
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>
            )}

            {/* Mark all read button */}
            {hasUnreadNotifications && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Selection toolbar */}
        <AnimatePresence>
          {isSelectionMode && selectedNotifications.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-gray-50 border-b border-gray-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {selectedNotifications.size} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllNotifications}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleMarkSelectedRead}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Mark Read
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
        >
          {/* Loading state */}
          {isLoading && notifications.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <BellOff className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                You'll see notifications here when there's activity
              </p>
            </div>
          )}

          {/* Notifications list */}
          {!isLoading && !error && groupedNotifications.length > 0 && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {groupedNotifications.map((group) => (
                  <div key={group.label}>
                    {/* Group header */}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {group.label}
                      </h3>
                    </div>

                    {/* Group notifications */}
                    {group.notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isSelected={selectedNotifications.has(notification.id)}
                        onToggleSelect={isSelectionMode ? toggleNotificationSelection : null}
                        onMarkRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ))}
              </AnimatePresence>

              {/* Load more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}

              {/* End of list */}
              {!hasMore && notifications.length > 0 && (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationPanel; 