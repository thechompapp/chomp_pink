// NotificationPanel.jsx - Instagram-style notification panel for doof
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  List, 
  Star, 
  CheckCircle, 
  AlertCircle,
  X,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const eventSourceRef = useRef(null);
  
  // Get user from auth context
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        credentials: 'include',
        headers: { 'X-Bypass-Auth': 'true' } // For development
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !userId) return;
    
    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
        headers: { 'X-Bypass-Auth': 'true' }
      });
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Setup real-time notifications
  useEffect(() => {
    if (isOpen && isAuthenticated && userId) {
      // Setup Server-Sent Events
      eventSourceRef.current = new EventSource('/api/notifications/stream', {
        withCredentials: true
      });

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            setNotifications(prev => [data.notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Dispatch event for notification bell
            window.dispatchEvent(new CustomEvent('notificationReceived'));
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
      };

      fetchNotifications();
      fetchUnreadCount();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isOpen, isAuthenticated, userId]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Bypass-Auth': 'true' }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Dispatch event for notification bell
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Bypass-Auth': 'true' }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        
        // Dispatch event for notification bell
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      like_list: Heart,
      like_dish: Heart,
      like_restaurant: Heart,
      comment_list: MessageCircle,
      comment_dish: MessageCircle,
      comment_restaurant: MessageCircle,
      follow_user: UserPlus,
      list_item_added: List,
      list_shared: List,
      restaurant_recommendation: Star,
      dish_recommendation: Star,
      submission_approved: CheckCircle,
      submission_rejected: AlertCircle,
      system_announcement: Bell
    };
    
    const IconComponent = iconMap[type] || Bell;
    return <IconComponent className="w-5 h-5" />;
  };

  // Get notification color
  const getNotificationColor = (type) => {
    const colorMap = {
      like_list: 'text-red-500',
      like_dish: 'text-red-500',
      like_restaurant: 'text-red-500',
      comment_list: 'text-blue-500',
      comment_dish: 'text-blue-500',
      comment_restaurant: 'text-blue-500',
      follow_user: 'text-green-500',
      list_item_added: 'text-purple-500',
      list_shared: 'text-purple-500',
      restaurant_recommendation: 'text-yellow-500',
      dish_recommendation: 'text-yellow-500',
      submission_approved: 'text-green-500',
      submission_rejected: 'text-red-500',
      system_announcement: 'text-gray-500'
    };
    
    return colorMap[type] || 'text-gray-500';
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={markAllAsRead}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="w-12 h-12 mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`${getNotificationColor(notification.notificationType)} mt-1`}>
                    {getNotificationIcon(notification.notificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                      {notification.groupCount > 1 && (
                        <span className="text-xs text-gray-500">
                          +{notification.groupCount - 1} others
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 p-4 bg-gray-50"
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Notification Preferences
          </h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              Likes and reactions
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              Comments
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              New followers
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              Recommendations
            </label>
          </div>
          <div className="mt-3">
            <button 
              onClick={onClose}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Go to Profile Settings for full preferences
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotificationPanel; 