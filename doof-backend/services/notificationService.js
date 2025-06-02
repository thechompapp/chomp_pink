// Notification Service - Business logic and real-time delivery
// Handles notification creation triggers, real-time delivery, and background processing

import notificationModel, { NOTIFICATION_TYPES, ENTITY_TYPES } from '../models/notificationModel.js';
import { logInfo, logError, logDebug } from '../utils/logger.js';
import EventEmitter from 'events';

/**
 * Notification Service Event Emitter for real-time updates
 */
class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.activeConnections = new Map(); // WebSocket connections by userId
    this.sseConnections = new Map(); // Server-Sent Events connections by userId
  }

  /**
   * Register a WebSocket connection for real-time notifications
   */
  registerWebSocketConnection(userId, ws) {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId).add(ws);
    
    // Handle connection close
    ws.on('close', () => {
      this.unregisterWebSocketConnection(userId, ws);
    });

    logInfo(`[NotificationService] WebSocket registered for user ${userId}`);
  }

  /**
   * Unregister a WebSocket connection
   */
  unregisterWebSocketConnection(userId, ws) {
    if (this.activeConnections.has(userId)) {
      this.activeConnections.get(userId).delete(ws);
      if (this.activeConnections.get(userId).size === 0) {
        this.activeConnections.delete(userId);
      }
    }
  }

  /**
   * Register a Server-Sent Events connection
   */
  registerSSEConnection(userId, res) {
    this.sseConnections.set(userId, res);
    
    // Handle connection close
    res.on('close', () => {
      this.sseConnections.delete(userId);
      logDebug(`[NotificationService] SSE connection closed for user ${userId}`);
    });

    logInfo(`[NotificationService] SSE registered for user ${userId}`);
  }

  /**
   * Send real-time notification to user via WebSocket and/or SSE
   */
  async sendRealTimeNotification(userId, notification) {
    try {
      const message = {
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      };

      // Send via WebSocket
      if (this.activeConnections.has(userId)) {
        const connections = this.activeConnections.get(userId);
        for (const ws of connections) {
          try {
            if (ws.readyState === 1) { // WebSocket.OPEN
              ws.send(JSON.stringify(message));
            }
          } catch (error) {
            logError(`[NotificationService] Error sending WebSocket message:`, error);
            this.unregisterWebSocketConnection(userId, ws);
          }
        }
      }

      // Send via Server-Sent Events
      if (this.sseConnections.has(userId)) {
        const res = this.sseConnections.get(userId);
        try {
          res.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
          logError(`[NotificationService] Error sending SSE message:`, error);
          this.sseConnections.delete(userId);
        }
      }

      // Emit event for other services to handle
      this.emit('notification:sent', { userId, notification });

      logDebug(`[NotificationService] Real-time notification sent to user ${userId}`);
      
    } catch (error) {
      logError(`[NotificationService] Error sending real-time notification:`, error);
    }
  }

  /**
   * Create and deliver a notification
   */
  async createAndDeliverNotification(notificationData) {
    try {
      // Create the notification in database
      const notification = await notificationModel.createNotification(notificationData);
      
      // Send real-time notification if user is online
      await this.sendRealTimeNotification(notification.recipientId, notification);
      
      // Emit event for potential email/push notification processing
      this.emit('notification:created', notification);
      
      return notification;
      
    } catch (error) {
      logError(`[NotificationService] Error creating and delivering notification:`, error);
      throw error;
    }
  }

  /**
   * Handle list like notification
   */
  async handleListLike(listId, likerId, listOwnerId, listName) {
    if (likerId === listOwnerId) return; // Don't notify yourself

    try {
      const notification = await this.createAndDeliverNotification({
        recipientId: listOwnerId,
        senderId: likerId,
        notificationType: NOTIFICATION_TYPES.LIKE_LIST,
        relatedEntityType: ENTITY_TYPES.LIST,
        relatedEntityId: listId,
        title: 'Someone liked your list',
        message: `Your list "${listName}" received a new like!`,
        actionUrl: `/lists/${listId}`,
        groupKey: `likes_list_${listId}`,
        metadata: { listId, listName }
      });

      logInfo(`[NotificationService] List like notification created: ${notification.id}`);
      return notification;
      
    } catch (error) {
      logError(`[NotificationService] Error handling list like:`, error);
      throw error;
    }
  }

  /**
   * Handle user follow notification
   */
  async handleUserFollow(followerId, followedUserId, followerUsername) {
    if (followerId === followedUserId) return; // Don't notify yourself

    try {
      const notification = await this.createAndDeliverNotification({
        recipientId: followedUserId,
        senderId: followerId,
        notificationType: NOTIFICATION_TYPES.FOLLOW_USER,
        relatedEntityType: ENTITY_TYPES.USER,
        relatedEntityId: followerId,
        title: 'New follower',
        message: `${followerUsername} started following you!`,
        actionUrl: `/profile/${followerUsername}`,
        metadata: { followerId, followerUsername }
      });

      logInfo(`[NotificationService] User follow notification created: ${notification.id}`);
      return notification;
      
    } catch (error) {
      logError(`[NotificationService] Error handling user follow:`, error);
      throw error;
    }
  }

  /**
   * Handle list item added notification
   */
  async handleListItemAdded(listId, listOwnerId, itemType, itemName, adderUsername) {
    try {
      const notification = await this.createAndDeliverNotification({
        recipientId: listOwnerId,
        senderId: null, // Could be system or the person who added
        notificationType: NOTIFICATION_TYPES.LIST_ITEM_ADDED,
        relatedEntityType: ENTITY_TYPES.LIST,
        relatedEntityId: listId,
        title: 'Item added to your list',
        message: `${adderUsername} added "${itemName}" to your list`,
        actionUrl: `/lists/${listId}`,
        metadata: { listId, itemType, itemName, adderUsername }
      });

      logInfo(`[NotificationService] List item added notification created: ${notification.id}`);
      return notification;
      
    } catch (error) {
      logError(`[NotificationService] Error handling list item added:`, error);
      throw error;
    }
  }

  /**
   * Handle submission approved notification
   */
  async handleSubmissionApproved(submissionId, userId, submissionType, submissionName) {
    try {
      const notification = await this.createAndDeliverNotification({
        recipientId: userId,
        senderId: null, // System notification
        notificationType: NOTIFICATION_TYPES.SUBMISSION_APPROVED,
        relatedEntityType: ENTITY_TYPES.SUBMISSION,
        relatedEntityId: submissionId,
        title: 'Submission approved!',
        message: `Your ${submissionType} "${submissionName}" has been approved and is now live.`,
        actionUrl: `/${submissionType}s/${submissionId}`,
        metadata: { submissionId, submissionType, submissionName }
      });

      logInfo(`[NotificationService] Submission approved notification created: ${notification.id}`);
      return notification;
      
    } catch (error) {
      logError(`[NotificationService] Error handling submission approved:`, error);
      throw error;
    }
  }

  /**
   * Handle new dish at favorite restaurant notification
   */
  async handleNewDishAtFavoriteRestaurant(dishId, dishName, restaurantId, restaurantName, userIds) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.createAndDeliverNotification({
          recipientId: userId,
          senderId: null,
          notificationType: NOTIFICATION_TYPES.NEW_DISH_AT_FAVORITE_RESTAURANT,
          relatedEntityType: ENTITY_TYPES.DISH,
          relatedEntityId: dishId,
          title: 'New dish at favorite restaurant',
          message: `${restaurantName} added a new dish: "${dishName}"`,
          actionUrl: `/dishes/${dishId}`,
          metadata: { dishId, dishName, restaurantId, restaurantName }
        });
        
        notifications.push(notification);
      }

      logInfo(`[NotificationService] Created ${notifications.length} new dish notifications`);
      return notifications;
      
    } catch (error) {
      logError(`[NotificationService] Error handling new dish at favorite restaurant:`, error);
      throw error;
    }
  }

  /**
   * Send system announcement to all users
   */
  async sendSystemAnnouncement(title, message, actionUrl = null, userIds = null) {
    try {
      let targetUsers = userIds;
      
      // If no specific users provided, get all active users
      if (!targetUsers) {
        const query = `
          SELECT id FROM users 
          WHERE created_at > NOW() - INTERVAL '6 months'
          ORDER BY id
        `;
        const result = await db.query(query);
        targetUsers = result.rows.map(row => row.id);
      }

      const notifications = [];
      
      for (const userId of targetUsers) {
        const notification = await this.createAndDeliverNotification({
          recipientId: userId,
          senderId: null,
          notificationType: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
          relatedEntityType: ENTITY_TYPES.SYSTEM,
          relatedEntityId: null,
          title,
          message,
          actionUrl,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expire in 30 days
          metadata: { isSystemAnnouncement: true }
        });
        
        notifications.push(notification);
      }

      logInfo(`[NotificationService] Sent system announcement to ${notifications.length} users`);
      return notifications;
      
    } catch (error) {
      logError(`[NotificationService] Error sending system announcement:`, error);
      throw error;
    }
  }

  /**
   * Get notification count for user (including real-time updates)
   */
  async getUnreadCount(userId) {
    try {
      const count = await notificationModel.getUnreadNotificationCount(userId);
      
      // Send real-time count update
      await this.sendRealTimeNotification(userId, {
        type: 'unread_count',
        count
      });
      
      return count;
      
    } catch (error) {
      logError(`[NotificationService] Error getting unread count:`, error);
      throw error;
    }
  }

  /**
   * Mark notifications as read and send real-time update
   */
  async markAsRead(notificationIds, userId) {
    try {
      const result = await notificationModel.markNotificationsAsRead(notificationIds, userId);
      
      // Send real-time update about read status
      if (result.updated > 0) {
        const newCount = await notificationModel.getUnreadNotificationCount(userId);
        await this.sendRealTimeNotification(userId, {
          type: 'notifications_read',
          readIds: notificationIds,
          newUnreadCount: newCount
        });
      }
      
      return result;
      
    } catch (error) {
      logError(`[NotificationService] Error marking notifications as read:`, error);
      throw error;
    }
  }

  /**
   * Clean up old notifications and expired connections
   */
  async performMaintenance() {
    try {
      logInfo('[NotificationService] Starting maintenance tasks...');
      
      // Clean up expired notifications
      const query = `SELECT cleanup_old_notifications() as deleted_count`;
      const result = await db.query(query);
      const deletedCount = result.rows[0]?.deleted_count || 0;
      
      // Clean up stale WebSocket connections
      let staleConnections = 0;
      for (const [userId, connections] of this.activeConnections.entries()) {
        for (const ws of connections) {
          if (ws.readyState !== 1) { // Not OPEN
            this.unregisterWebSocketConnection(userId, ws);
            staleConnections++;
          }
        }
      }
      
      logInfo(`[NotificationService] Maintenance completed - deleted ${deletedCount} old notifications, cleaned ${staleConnections} stale connections`);
      
    } catch (error) {
      logError(`[NotificationService] Error during maintenance:`, error);
    }
  }

  /**
   * Get active user connections count
   */
  getActiveConnectionsCount() {
    return {
      websockets: this.activeConnections.size,
      sse: this.sseConnections.size,
      totalUsers: new Set([
        ...this.activeConnections.keys(),
        ...this.sseConnections.keys()
      ]).size
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Set up maintenance interval (run every hour)
setInterval(() => {
  notificationService.performMaintenance();
}, 60 * 60 * 1000);

export default notificationService; 