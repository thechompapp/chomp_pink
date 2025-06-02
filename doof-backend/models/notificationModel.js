// Notification Model for Instagram-style notification system
// Handles all notification CRUD operations, preferences, and delivery tracking

import db from '../db/index.js';
import { logInfo, logError, logDebug } from '../utils/logger.js';

/**
 * Notification types supported by the system
 */
export const NOTIFICATION_TYPES = {
  // Social interactions
  LIKE_LIST: 'like_list',
  LIKE_DISH: 'like_dish', 
  LIKE_RESTAURANT: 'like_restaurant',
  COMMENT_LIST: 'comment_list',
  COMMENT_DISH: 'comment_dish',
  COMMENT_RESTAURANT: 'comment_restaurant',
  
  // Follow system
  FOLLOW_USER: 'follow_user',
  UNFOLLOW_USER: 'unfollow_user',
  
  // List activities
  LIST_ITEM_ADDED: 'list_item_added',
  LIST_SHARED: 'list_shared',
  
  // Recommendations
  RESTAURANT_RECOMMENDATION: 'restaurant_recommendation',
  DISH_RECOMMENDATION: 'dish_recommendation',
  NEW_DISH_AT_FAVORITE_RESTAURANT: 'new_dish_at_favorite_restaurant',
  
  // Admin/System
  SUBMISSION_APPROVED: 'submission_approved',
  SUBMISSION_REJECTED: 'submission_rejected',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  PROMOTIONAL: 'promotional'
};

/**
 * Entity types for related_entity_type
 */
export const ENTITY_TYPES = {
  USER: 'user',
  LIST: 'list',
  DISH: 'dish',
  RESTAURANT: 'restaurant',
  SUBMISSION: 'submission',
  SYSTEM: 'system'
};

/**
 * Delivery status options
 */
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

/**
 * Create a new notification
 */
export const createNotification = async ({
  recipientId,
  senderId = null,
  notificationType,
  relatedEntityType = null,
  relatedEntityId = null,
  title,
  message,
  actionUrl = null,
  metadata = {},
  imageUrl = null,
  groupKey = null,
  expiresAt = null
}) => {
  try {
    // Validate required fields
    if (!recipientId || !notificationType || !title || !message) {
      throw new Error('Missing required notification fields');
    }

    // Check if this is a grouped notification
    let insertQuery, params;
    
    if (groupKey) {
      // Check if a notification with this group key already exists
      const existingQuery = `
        SELECT id, group_count FROM notifications 
        WHERE recipient_id = $1 AND group_key = $2 AND is_read = false
        ORDER BY created_at DESC LIMIT 1
      `;
      const existing = await db.query(existingQuery, [recipientId, groupKey]);
      
      if (existing.rows.length > 0) {
        // Update existing grouped notification
        const updateQuery = `
          UPDATE notifications 
          SET group_count = group_count + 1,
              title = $1,
              message = $2,
              metadata = $3,
              updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        const result = await db.query(updateQuery, [
          title, message, JSON.stringify(metadata), existing.rows[0].id
        ]);
        
        logInfo(`[NotificationModel] Updated grouped notification ${existing.rows[0].id} (count: ${existing.rows[0].group_count + 1})`);
        return formatNotification(result.rows[0]);
      }
    }

    // Create new notification
    insertQuery = `
      INSERT INTO notifications (
        recipient_id, sender_id, notification_type, related_entity_type, 
        related_entity_id, title, message, action_url, metadata, image_url,
        group_key, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    
    params = [
      recipientId, senderId, notificationType, relatedEntityType,
      relatedEntityId, title, message, actionUrl, JSON.stringify(metadata),
      imageUrl, groupKey, expiresAt
    ];

    const result = await db.query(insertQuery, params);
    const notification = formatNotification(result.rows[0]);
    
    logInfo(`[NotificationModel] Created notification ${notification.id} for user ${recipientId}`);
    return notification;
    
  } catch (error) {
    logError(`[NotificationModel] Error creating notification:`, error);
    throw error;
  }
};

/**
 * Get notifications for a user with pagination and filtering
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      notificationType = null,
      includeRead = true,
      markAsSeen = false
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = ['n.recipient_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    // Filter conditions
    if (unreadOnly) {
      whereConditions.push(`n.is_read = false`);
    } else if (!includeRead) {
      whereConditions.push(`n.is_read = false`);
    }

    if (notificationType) {
      whereConditions.push(`n.notification_type = $${paramIndex}`);
      params.push(notificationType);
      paramIndex++;
    }

    // Main query with sender information
    const query = `
      SELECT 
        n.*,
        sender.username as sender_username,
        sender.email as sender_email
      FROM notifications n
      LEFT JOIN users sender ON n.sender_id = sender.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Mark notifications as seen if requested
    if (markAsSeen && result.rows.length > 0) {
      const notificationIds = result.rows
        .filter(row => !row.is_seen)
        .map(row => row.id);
      
      if (notificationIds.length > 0) {
        await markNotificationsAsSeen(notificationIds);
      }
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countParams = params.slice(0, params.length - 2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);
    
    return {
      notifications: result.rows.map(formatNotification),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
    
  } catch (error) {
    logError(`[NotificationModel] Error getting user notifications:`, error);
    throw error;
  }
};

/**
 * Mark notifications as read
 */
export const markNotificationsAsRead = async (notificationIds, userId = null) => {
  try {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return { updated: 0 };
    }

    let query = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE id = ANY($1) AND is_read = false
    `;
    let params = [notificationIds];

    // Add user filter for security
    if (userId) {
      query += ` AND recipient_id = $2`;
      params.push(userId);
    }
    
    query += ` RETURNING id`;

    const result = await db.query(query, params);
    
    logInfo(`[NotificationModel] Marked ${result.rows.length} notifications as read`);
    return { updated: result.rows.length };
    
  } catch (error) {
    logError(`[NotificationModel] Error marking notifications as read:`, error);
    throw error;
  }
};

/**
 * Mark notifications as seen (shown in notification feed)
 */
export const markNotificationsAsSeen = async (notificationIds, userId = null) => {
  try {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return { updated: 0 };
    }

    let query = `
      UPDATE notifications 
      SET is_seen = true, seen_at = NOW(), updated_at = NOW()
      WHERE id = ANY($1) AND is_seen = false
    `;
    let params = [notificationIds];

    if (userId) {
      query += ` AND recipient_id = $2`;
      params.push(userId);
    }
    
    query += ` RETURNING id`;

    const result = await db.query(query, params);
    return { updated: result.rows.length };
    
  } catch (error) {
    logError(`[NotificationModel] Error marking notifications as seen:`, error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE recipient_id = $1 AND is_read = false
    `;
    
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].unread_count) || 0;
    
  } catch (error) {
    logError(`[NotificationModel] Error getting unread count:`, error);
    throw error;
  }
};

/**
 * Delete notification(s)
 */
export const deleteNotifications = async (notificationIds, userId = null) => {
  try {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return { deleted: 0 };
    }

    let query = `DELETE FROM notifications WHERE id = ANY($1)`;
    let params = [notificationIds];

    if (userId) {
      query += ` AND recipient_id = $2`;
      params.push(userId);
    }

    const result = await db.query(query, params);
    
    logInfo(`[NotificationModel] Deleted ${result.rowCount} notifications`);
    return { deleted: result.rowCount };
    
  } catch (error) {
    logError(`[NotificationModel] Error deleting notifications:`, error);
    throw error;
  }
};

/**
 * Get or create notification preferences for a user
 */
export const getNotificationPreferences = async (userId) => {
  try {
    const query = `
      SELECT * FROM notification_preferences WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default preferences
      return await createNotificationPreferences(userId);
    }
    
    return formatNotificationPreferences(result.rows[0]);
    
  } catch (error) {
    logError(`[NotificationModel] Error getting notification preferences:`, error);
    throw error;
  }
};

/**
 * Create default notification preferences for a user
 */
export const createNotificationPreferences = async (userId) => {
  try {
    const query = `
      INSERT INTO notification_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) 
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `;
    
    const result = await db.query(query, [userId]);
    
    logInfo(`[NotificationModel] Created notification preferences for user ${userId}`);
    return formatNotificationPreferences(result.rows[0]);
    
  } catch (error) {
    logError(`[NotificationModel] Error creating notification preferences:`, error);
    throw error;
  }
};

/**
 * Update notification preferences for a user
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const allowedFields = [
      'email_notifications', 'push_notifications', 'in_app_notifications',
      'likes_enabled', 'comments_enabled', 'follows_enabled',
      'recommendations_enabled', 'list_activity_enabled', 'submissions_enabled',
      'system_announcements_enabled', 'promotional_enabled',
      'digest_frequency', 'quiet_hours_start', 'quiet_hours_end', 'timezone'
    ];

    // Map camelCase to snake_case
    const fieldMapping = {
      emailNotifications: 'email_notifications',
      pushNotifications: 'push_notifications',
      inAppNotifications: 'in_app_notifications',
      likesEnabled: 'likes_enabled',
      commentsEnabled: 'comments_enabled',
      followsEnabled: 'follows_enabled',
      recommendationsEnabled: 'recommendations_enabled',
      listActivityEnabled: 'list_activity_enabled',
      submissionsEnabled: 'submissions_enabled',
      systemAnnouncementsEnabled: 'system_announcements_enabled',
      promotionalEnabled: 'promotional_enabled',
      digestFrequency: 'digest_frequency',
      quietHoursStart: 'quiet_hours_start',
      quietHoursEnd: 'quiet_hours_end',
      timezone: 'timezone'
    };

    const updateFields = [];
    const params = [userId];
    let paramIndex = 2;

    Object.keys(preferences).forEach(key => {
      const dbField = fieldMapping[key] || key; // Use mapping or original key
      if (allowedFields.includes(dbField) && preferences[key] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`);
        params.push(preferences[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE notification_preferences 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('User preferences not found');
    }

    logInfo(`[NotificationModel] Updated notification preferences for user ${userId}`);
    return formatNotificationPreferences(result.rows[0]);
    
  } catch (error) {
    logError(`[NotificationModel] Error updating notification preferences:`, error);
    throw error;
  }
};

/**
 * Check if user should receive a specific type of notification
 */
export const shouldReceiveNotification = async (userId, notificationType) => {
  try {
    const preferences = await getNotificationPreferences(userId);
    
    // Check general in-app notifications setting
    if (!preferences.in_app_notifications) {
      return false;
    }

    // Check specific notification type settings
    const typeMapping = {
      [NOTIFICATION_TYPES.LIKE_LIST]: 'likes_enabled',
      [NOTIFICATION_TYPES.LIKE_DISH]: 'likes_enabled', 
      [NOTIFICATION_TYPES.LIKE_RESTAURANT]: 'likes_enabled',
      [NOTIFICATION_TYPES.COMMENT_LIST]: 'comments_enabled',
      [NOTIFICATION_TYPES.COMMENT_DISH]: 'comments_enabled',
      [NOTIFICATION_TYPES.COMMENT_RESTAURANT]: 'comments_enabled',
      [NOTIFICATION_TYPES.FOLLOW_USER]: 'follows_enabled',
      [NOTIFICATION_TYPES.UNFOLLOW_USER]: 'follows_enabled',
      [NOTIFICATION_TYPES.LIST_ITEM_ADDED]: 'list_activity_enabled',
      [NOTIFICATION_TYPES.LIST_SHARED]: 'list_activity_enabled',
      [NOTIFICATION_TYPES.RESTAURANT_RECOMMENDATION]: 'recommendations_enabled',
      [NOTIFICATION_TYPES.DISH_RECOMMENDATION]: 'recommendations_enabled',
      [NOTIFICATION_TYPES.NEW_DISH_AT_FAVORITE_RESTAURANT]: 'recommendations_enabled',
      [NOTIFICATION_TYPES.SUBMISSION_APPROVED]: 'submissions_enabled',
      [NOTIFICATION_TYPES.SUBMISSION_REJECTED]: 'submissions_enabled',
      [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: 'system_announcements_enabled',
      [NOTIFICATION_TYPES.PROMOTIONAL]: 'promotional_enabled'
    };

    const settingKey = typeMapping[notificationType];
    return settingKey ? preferences[settingKey] : true;
    
  } catch (error) {
    logError(`[NotificationModel] Error checking notification permission:`, error);
    return false; // Default to not sending if there's an error
  }
};

/**
 * Batch create notifications for multiple users
 */
export const createBatchNotifications = async (notifications) => {
  try {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    const client = await db.getClient();
    await client.query('BEGIN');

    const created = [];

    try {
      for (const notification of notifications) {
        // Check if user should receive this notification
        const shouldReceive = await shouldReceiveNotification(
          notification.recipientId, 
          notification.notificationType
        );

        if (shouldReceive) {
          const result = await createNotification(notification);
          created.push(result);
        }
      }

      await client.query('COMMIT');
      
      logInfo(`[NotificationModel] Created ${created.length} batch notifications`);
      return created;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    logError(`[NotificationModel] Error creating batch notifications:`, error);
    throw error;
  }
};

/**
 * Format notification object for API responses
 */
const formatNotification = (notification) => {
  if (!notification) return null;

  return {
    id: notification.id,
    recipientId: notification.recipient_id,
    senderId: notification.sender_id,
    senderUsername: notification.sender_username,
    notificationType: notification.notification_type,
    relatedEntityType: notification.related_entity_type,
    relatedEntityId: notification.related_entity_id,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.action_url,
    metadata: typeof notification.metadata === 'string' 
      ? JSON.parse(notification.metadata) 
      : notification.metadata,
    imageUrl: notification.image_url,
    isRead: notification.is_read,
    isSeen: notification.is_seen,
    readAt: notification.read_at,
    seenAt: notification.seen_at,
    deliveryStatus: notification.delivery_status,
    deliveryAttempts: notification.delivery_attempts,
    deliveredAt: notification.delivered_at,
    groupKey: notification.group_key,
    groupCount: notification.group_count,
    createdAt: notification.created_at,
    updatedAt: notification.updated_at,
    expiresAt: notification.expires_at
  };
};

/**
 * Format notification preferences object for API responses
 */
const formatNotificationPreferences = (preferences) => {
  if (!preferences) return null;

  return {
    id: preferences.id,
    userId: preferences.user_id,
    emailNotifications: preferences.email_notifications,
    pushNotifications: preferences.push_notifications,
    inAppNotifications: preferences.in_app_notifications,
    likesEnabled: preferences.likes_enabled,
    commentsEnabled: preferences.comments_enabled,
    followsEnabled: preferences.follows_enabled,
    recommendationsEnabled: preferences.recommendations_enabled,
    listActivityEnabled: preferences.list_activity_enabled,
    submissionsEnabled: preferences.submissions_enabled,
    systemAnnouncementsEnabled: preferences.system_announcements_enabled,
    promotionalEnabled: preferences.promotional_enabled,
    digestFrequency: preferences.digest_frequency,
    quietHoursStart: preferences.quiet_hours_start,
    quietHoursEnd: preferences.quiet_hours_end,
    timezone: preferences.timezone,
    createdAt: preferences.created_at,
    updatedAt: preferences.updated_at
  };
};

// Export all functions
export default {
  createNotification,
  getUserNotifications,
  markNotificationsAsRead,
  markNotificationsAsSeen,
  getUnreadNotificationCount,
  deleteNotifications,
  getNotificationPreferences,
  createNotificationPreferences,
  updateNotificationPreferences,
  shouldReceiveNotification,
  createBatchNotifications,
  NOTIFICATION_TYPES,
  ENTITY_TYPES,
  DELIVERY_STATUS
}; 