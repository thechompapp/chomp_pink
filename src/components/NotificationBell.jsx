// NotificationBell.jsx - Bell icon with unread count for navbar
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/auth/AuthContext';

const NotificationBell = ({ onClick, className = "" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Get auth state
  const { isAuthenticated } = useAuth();

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
        headers: { 'X-Bypass-Auth': 'true' } // For development
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates for unread count
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchUnreadCount();

    // Listen for notification events to update count
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notificationRead', handleNotificationUpdate);
    window.addEventListener('notificationReceived', handleNotificationUpdate);

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      window.removeEventListener('notificationRead', handleNotificationUpdate);
      window.removeEventListener('notificationReceived', handleNotificationUpdate);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-6 h-6" />
      
      {/* Unread count badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-gray-300 rounded-full animate-pulse"></div>
      )}
    </button>
  );
};

export default NotificationBell; 