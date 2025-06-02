// Notification API Routes
// Provides REST endpoints and real-time connections for the notification system

import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import notificationModel from '../models/notificationModel.js';
import notificationService from '../services/notificationService.js';
import { logInfo, logError, logDebug } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications with pagination and filtering
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      unread_only = false,
      type = null,
      mark_as_seen = false
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50), // Cap at 50 per page
      unreadOnly: unread_only === 'true',
      notificationType: type,
      markAsSeen: mark_as_seen === 'true'
    };

    const result = await notificationModel.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      message: `Retrieved ${result.notifications.length} notifications`
    });

  } catch (error) {
    logError('[NotificationRoutes] Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get user's unread notification count
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
      message: `User has ${count} unread notifications`
    });

  } catch (error) {
    logError('[NotificationRoutes] Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const result = await notificationService.markAsRead([notificationId], userId);

    if (result.updated === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already read'
      });
    }

    res.json({
      success: true,
      data: { updated: result.updated },
      message: 'Notification marked as read'
    });

  } catch (error) {
    logError('[NotificationRoutes] Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/notifications/read-multiple
 * Mark multiple notifications as read
 */
router.post('/read-multiple', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_ids } = req.body;

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'notification_ids must be a non-empty array'
      });
    }

    // Validate all IDs are numbers
    const validIds = notification_ids.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
    if (validIds.length !== notification_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'All notification IDs must be valid numbers'
      });
    }

    const result = await notificationService.markAsRead(validIds, userId);

    res.json({
      success: true,
      data: { updated: result.updated },
      message: `Marked ${result.updated} notifications as read`
    });

  } catch (error) {
    logError('[NotificationRoutes] Error marking multiple notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the user
 */
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unread notification IDs for this user
    const unreadNotifications = await notificationModel.getUserNotifications(userId, {
      unreadOnly: true,
      limit: 1000 // Reasonable limit for bulk operation
    });

    if (unreadNotifications.notifications.length === 0) {
      return res.json({
        success: true,
        data: { updated: 0 },
        message: 'No unread notifications to mark as read'
      });
    }

    const notificationIds = unreadNotifications.notifications.map(n => n.id);
    const result = await notificationService.markAsRead(notificationIds, userId);

    res.json({
      success: true,
      data: { updated: result.updated },
      message: `Marked all ${result.updated} notifications as read`
    });

  } catch (error) {
    logError('[NotificationRoutes] Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const result = await notificationModel.deleteNotifications([notificationId], userId);

    if (result.deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: { deleted: result.deleted },
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    logError('[NotificationRoutes] Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await notificationModel.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences retrieved successfully'
    });

  } catch (error) {
    logError('[NotificationRoutes] Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Validate request body
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body'
      });
    }

    const preferences = await notificationModel.updateNotificationPreferences(userId, updates);

    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    logError('[NotificationRoutes] Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: error.message.includes('No valid fields') ? error.message : 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 * Uses optionalAuth in development to support bypass header, requireAuth in production
 */
const streamAuthMiddleware = process.env.NODE_ENV === 'development' ? optionalAuth : requireAuth;

router.get('/stream', streamAuthMiddleware, (req, res) => {
  try {
    // In development with bypass, create a mock user
    let userId;
    if (process.env.NODE_ENV === 'development' && !req.user) {
      // Mock user for development bypass
      userId = 1; // Default test user ID
      logDebug('[NotificationRoutes] Using mock user for SSE stream in development mode');
    } else if (req.user) {
      userId = req.user.id;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for notification stream'
      });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Notification stream connected',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Register SSE connection
    notificationService.registerSSEConnection(userId, res);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      logDebug(`[NotificationRoutes] SSE client disconnected for user ${userId}`);
    });

    logInfo(`[NotificationRoutes] SSE stream established for user ${userId}`);

  } catch (error) {
    logError('[NotificationRoutes] Error setting up SSE stream:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to establish notification stream'
    });
  }
});

/**
 * POST /api/notifications/test (Development only)
 * Create a test notification for development/debugging
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { title = 'Test Notification', message = 'This is a test notification', type = 'system_announcement' } = req.body;

      const notification = await notificationService.createAndDeliverNotification({
        recipientId: userId,
        senderId: null,
        notificationType: type,
        relatedEntityType: 'system',
        relatedEntityId: null,
        title,
        message,
        actionUrl: '/test',
        metadata: { isTest: true }
      });

      res.json({
        success: true,
        data: notification,
        message: 'Test notification created and delivered'
      });

    } catch (error) {
      logError('[NotificationRoutes] Error creating test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test notification',
        error: error.message
      });
    }
  });
}

/**
 * GET /api/notifications/stats (Admin only)
 * Get notification system statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get basic notification statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as notifications_last_24h,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as notifications_last_7d,
        COUNT(DISTINCT recipient_id) as users_with_notifications
      FROM notifications
    `;

    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get notification type breakdown
    const typeQuery = `
      SELECT notification_type, COUNT(*) as count
      FROM notifications
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY notification_type
      ORDER BY count DESC
    `;

    const typeResult = await db.query(typeQuery);
    const notificationTypes = typeResult.rows;

    // Get active connections
    const activeConnections = notificationService.getActiveConnectionsCount();

    res.json({
      success: true,
      data: {
        statistics: {
          total: parseInt(stats.total_notifications),
          unread: parseInt(stats.unread_notifications),
          last24Hours: parseInt(stats.notifications_last_24h),
          last7Days: parseInt(stats.notifications_last_7d),
          usersWithNotifications: parseInt(stats.users_with_notifications)
        },
        notificationTypes,
        activeConnections
      },
      message: 'Notification statistics retrieved successfully'
    });

  } catch (error) {
    logError('[NotificationRoutes] Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; 