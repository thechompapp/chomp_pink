// Notification Triggers - Integration utilities for triggering notifications
// Connects existing doof features (likes, follows, submissions) with the notification system

import notificationService from '../services/notificationService.js';
import { NOTIFICATION_TYPES, ENTITY_TYPES } from '../models/notificationModel.js';
import { logInfo, logError, logDebug } from './logger.js';
import db from '../db/index.js';
import notificationModel from '../models/notificationModel.js';

/**
 * Like-related notification triggers
 */
export const LikeTriggers = {
  /**
   * Trigger notification when a list is liked
   */
  async onListLiked(listId, likerId, likerUsername) {
    try {
      // Get list details and owner
      const listQuery = `
        SELECT l.id, l.name, l.user_id as owner_id, u.username as owner_username
        FROM lists l
        JOIN users u ON l.user_id = u.id
        WHERE l.id = $1
      `;
      const listResult = await db.query(listQuery, [listId]);
      
      if (listResult.rows.length === 0) {
        logError('[LikeTriggers] List not found:', listId);
        return;
      }
      
      const list = listResult.rows[0];
      
      // Don't notify if user liked their own list
      if (list.owner_id === likerId) {
        return;
      }
      
      await notificationService.handleListLike(
        listId,
        likerId,
        list.owner_id,
        list.name
      );
      
      logDebug(`[LikeTriggers] List like notification triggered for list ${listId}`);
      
    } catch (error) {
      logError('[LikeTriggers] Error triggering list like notification:', error);
    }
  },

  /**
   * Trigger notification when a dish is liked
   */
  async onDishLiked(dishId, likerId, likerUsername) {
    try {
      // Get dish details
      const dishQuery = `
        SELECT d.id, d.name, d.restaurant_id, r.name as restaurant_name
        FROM dishes d
        JOIN restaurants r ON d.restaurant_id = r.id
        WHERE d.id = $1
      `;
      const dishResult = await db.query(dishQuery, [dishId]);
      
      if (dishResult.rows.length === 0) {
        logError('[LikeTriggers] Dish not found:', dishId);
        return;
      }
      
      const dish = dishResult.rows[0];
      
      // Get users who have this dish in their lists (potential recipients)
      const recipientsQuery = `
        SELECT DISTINCT l.user_id, u.username
        FROM list_dishes ld
        JOIN lists l ON ld.list_id = l.id
        JOIN users u ON l.user_id = u.id
        WHERE ld.dish_id = $1 AND l.user_id != $2
      `;
      const recipientsResult = await db.query(recipientsQuery, [dishId, likerId]);
      
      // Create notifications for users who have this dish in their lists
      for (const recipient of recipientsResult.rows) {
        await notificationService.createAndDeliverNotification({
          recipientId: recipient.user_id,
          senderId: likerId,
          notificationType: NOTIFICATION_TYPES.LIKE_DISH,
          relatedEntityType: ENTITY_TYPES.DISH,
          relatedEntityId: dishId,
          title: 'Dish from your list was liked',
          message: `${likerUsername} liked "${dish.name}" from ${dish.restaurant_name}`,
          actionUrl: `/dishes/${dishId}`,
          metadata: {
            dishId,
            dishName: dish.name,
            restaurantName: dish.restaurant_name,
            likerId,
            likerUsername
          }
        });
      }
      
      logDebug(`[LikeTriggers] Dish like notifications sent to ${recipientsResult.rows.length} users`);
      
    } catch (error) {
      logError('[LikeTriggers] Error triggering dish like notification:', error);
    }
  },

  /**
   * Trigger notification when a restaurant is liked
   */
  async onRestaurantLiked(restaurantId, likerId, likerUsername) {
    try {
      // Get restaurant details
      const restaurantQuery = `
        SELECT id, name FROM restaurants WHERE id = $1
      `;
      const restaurantResult = await db.query(restaurantQuery, [restaurantId]);
      
      if (restaurantResult.rows.length === 0) {
        logError('[LikeTriggers] Restaurant not found:', restaurantId);
        return;
      }
      
      const restaurant = restaurantResult.rows[0];
      
      // Get users who have dishes from this restaurant in their lists
      const recipientsQuery = `
        SELECT DISTINCT l.user_id, u.username
        FROM list_dishes ld
        JOIN lists l ON ld.list_id = l.id
        JOIN dishes d ON ld.dish_id = d.id
        JOIN users u ON l.user_id = u.id
        WHERE d.restaurant_id = $1 AND l.user_id != $2
      `;
      const recipientsResult = await db.query(recipientsQuery, [restaurantId, likerId]);
      
      // Create notifications for users interested in this restaurant
      for (const recipient of recipientsResult.rows) {
        await notificationService.createAndDeliverNotification({
          recipientId: recipient.user_id,
          senderId: likerId,
          notificationType: NOTIFICATION_TYPES.LIKE_RESTAURANT,
          relatedEntityType: ENTITY_TYPES.RESTAURANT,
          relatedEntityId: restaurantId,
          title: 'Restaurant you follow was liked',
          message: `${likerUsername} liked ${restaurant.name}`,
          actionUrl: `/restaurants/${restaurantId}`,
          metadata: {
            restaurantId,
            restaurantName: restaurant.name,
            likerId,
            likerUsername
          }
        });
      }
      
      logDebug(`[LikeTriggers] Restaurant like notifications sent to ${recipientsResult.rows.length} users`);
      
    } catch (error) {
      logError('[LikeTriggers] Error triggering restaurant like notification:', error);
    }
  }
};

/**
 * Follow-related notification triggers
 */
export const FollowTriggers = {
  /**
   * Trigger notification when a user is followed
   */
  async onUserFollowed(followerId, followedUserId) {
    try {
      // Get follower details
      const followerQuery = `
        SELECT username FROM users WHERE id = $1
      `;
      const followerResult = await db.query(followerQuery, [followerId]);
      
      if (followerResult.rows.length === 0) {
        logError('[FollowTriggers] Follower not found:', followerId);
        return;
      }
      
      const follower = followerResult.rows[0];
      
      await notificationService.handleUserFollow(
        followerId,
        followedUserId,
        follower.username
      );
      
      logDebug(`[FollowTriggers] User follow notification triggered: ${followerId} -> ${followedUserId}`);
      
    } catch (error) {
      logError('[FollowTriggers] Error triggering user follow notification:', error);
    }
  },

  /**
   * Trigger notification when a user unfollows (optional, for transparency)
   */
  async onUserUnfollowed(followerId, unfollowedUserId) {
    try {
      // Get follower details
      const followerQuery = `
        SELECT username FROM users WHERE id = $1
      `;
      const followerResult = await db.query(followerQuery, [followerId]);
      
      if (followerResult.rows.length === 0) {
        logError('[FollowTriggers] Follower not found:', followerId);
        return;
      }
      
      const follower = followerResult.rows[0];
      
      await notificationService.createAndDeliverNotification({
        recipientId: unfollowedUserId,
        senderId: followerId,
        notificationType: NOTIFICATION_TYPES.UNFOLLOW_USER,
        relatedEntityType: ENTITY_TYPES.USER,
        relatedEntityId: followerId,
        title: 'Someone unfollowed you',
        message: `${follower.username} unfollowed you`,
        actionUrl: `/profile/${follower.username}`,
        metadata: {
          followerId,
          followerUsername: follower.username
        }
      });
      
      logDebug(`[FollowTriggers] User unfollow notification triggered: ${followerId} -> ${unfollowedUserId}`);
      
    } catch (error) {
      logError('[FollowTriggers] Error triggering user unfollow notification:', error);
    }
  }
};

/**
 * List-related notification triggers
 */
export const ListTriggers = {
  /**
   * Trigger notification when an item is added to a list
   */
  async onListItemAdded(listId, itemType, itemId, adderUserId, adderUsername) {
    try {
      // Get list details and owner
      const listQuery = `
        SELECT l.id, l.name, l.user_id as owner_id, u.username as owner_username
        FROM lists l
        JOIN users u ON l.user_id = u.id
        WHERE l.id = $1
      `;
      const listResult = await db.query(listQuery, [listId]);
      
      if (listResult.rows.length === 0) {
        logError('[ListTriggers] List not found:', listId);
        return;
      }
      
      const list = listResult.rows[0];
      
      // Don't notify if user added to their own list
      if (list.owner_id === adderUserId) {
        return;
      }
      
      // Get item details based on type
      let itemName = 'Unknown item';
      if (itemType === 'dish') {
        const dishQuery = `SELECT name FROM dishes WHERE id = $1`;
        const dishResult = await db.query(dishQuery, [itemId]);
        itemName = dishResult.rows[0]?.name || itemName;
      } else if (itemType === 'restaurant') {
        const restQuery = `SELECT name FROM restaurants WHERE id = $1`;
        const restResult = await db.query(restQuery, [itemId]);
        itemName = restResult.rows[0]?.name || itemName;
      }
      
      await notificationService.handleListItemAdded(
        listId,
        list.owner_id,
        itemType,
        itemName,
        adderUsername
      );
      
      logDebug(`[ListTriggers] List item added notification triggered for list ${listId}`);
      
    } catch (error) {
      logError('[ListTriggers] Error triggering list item added notification:', error);
    }
  },

  /**
   * Trigger notification when a list is shared
   */
  async onListShared(listId, sharerId, sharerUsername, sharedWithUserIds = []) {
    try {
      // Get list details
      const listQuery = `
        SELECT l.id, l.name FROM lists l WHERE l.id = $1
      `;
      const listResult = await db.query(listQuery, [listId]);
      
      if (listResult.rows.length === 0) {
        logError('[ListTriggers] List not found:', listId);
        return;
      }
      
      const list = listResult.rows[0];
      
      // If specific users provided, notify them
      if (sharedWithUserIds.length > 0) {
        for (const userId of sharedWithUserIds) {
          if (userId !== sharerId) {
            await notificationService.createAndDeliverNotification({
              recipientId: userId,
              senderId: sharerId,
              notificationType: NOTIFICATION_TYPES.LIST_SHARED,
              relatedEntityType: ENTITY_TYPES.LIST,
              relatedEntityId: listId,
              title: 'List shared with you',
              message: `${sharerUsername} shared their list "${list.name}" with you`,
              actionUrl: `/lists/${listId}`,
              metadata: {
                listId,
                listName: list.name,
                sharerId,
                sharerUsername
              }
            });
          }
        }
      } else {
        // If no specific users, notify followers
        const followersQuery = `
          SELECT f.follower_id, u.username
          FROM follows f
          JOIN users u ON f.follower_id = u.id
          WHERE f.followed_id = $1
        `;
        const followersResult = await db.query(followersQuery, [sharerId]);
        
        for (const follower of followersResult.rows) {
          await notificationService.createAndDeliverNotification({
            recipientId: follower.follower_id,
            senderId: sharerId,
            notificationType: NOTIFICATION_TYPES.LIST_SHARED,
            relatedEntityType: ENTITY_TYPES.LIST,
            relatedEntityId: listId,
            title: 'New list from someone you follow',
            message: `${sharerUsername} shared a new list: "${list.name}"`,
            actionUrl: `/lists/${listId}`,
            metadata: {
              listId,
              listName: list.name,
              sharerId,
              sharerUsername
            }
          });
        }
      }
      
      logDebug(`[ListTriggers] List shared notification triggered for list ${listId}`);
      
    } catch (error) {
      logError('[ListTriggers] Error triggering list shared notification:', error);
    }
  }
};

/**
 * Submission-related notification triggers
 */
export const SubmissionTriggers = {
  /**
   * Trigger notification when a submission is approved
   */
  async onSubmissionApproved(submissionId, userId, submissionType, submissionName) {
    try {
      await notificationService.handleSubmissionApproved(
        submissionId,
        userId,
        submissionType,
        submissionName
      );
      
      logDebug(`[SubmissionTriggers] Submission approved notification triggered: ${submissionId}`);
      
    } catch (error) {
      logError('[SubmissionTriggers] Error triggering submission approved notification:', error);
    }
  },

  /**
   * Trigger notification when a submission is rejected
   */
  async onSubmissionRejected(submissionId, userId, submissionType, submissionName, reason = null) {
    try {
      await notificationService.createAndDeliverNotification({
        recipientId: userId,
        senderId: null,
        notificationType: NOTIFICATION_TYPES.SUBMISSION_REJECTED,
        relatedEntityType: ENTITY_TYPES.SUBMISSION,
        relatedEntityId: submissionId,
        title: 'Submission rejected',
        message: reason 
          ? `Your ${submissionType} "${submissionName}" was rejected: ${reason}`
          : `Your ${submissionType} "${submissionName}" was rejected. Please review and try again.`,
        actionUrl: `/submissions/${submissionId}`,
        metadata: {
          submissionId,
          submissionType,
          submissionName,
          reason
        }
      });
      
      logDebug(`[SubmissionTriggers] Submission rejected notification triggered: ${submissionId}`);
      
    } catch (error) {
      logError('[SubmissionTriggers] Error triggering submission rejected notification:', error);
    }
  }
};

/**
 * Restaurant and dish recommendation triggers
 */
export const RecommendationTriggers = {
  /**
   * Trigger notification when new dish is added to a favorite restaurant
   */
  async onNewDishAtFavoriteRestaurant(dishId, dishName, restaurantId, restaurantName) {
    try {
      // Find users who have dishes from this restaurant in their lists
      const interestedUsersQuery = `
        SELECT DISTINCT l.user_id
        FROM list_dishes ld
        JOIN lists l ON ld.list_id = l.id
        JOIN dishes d ON ld.dish_id = d.id
        WHERE d.restaurant_id = $1
      `;
      const interestedUsersResult = await db.query(interestedUsersQuery, [restaurantId]);
      const userIds = interestedUsersResult.rows.map(row => row.user_id);
      
      if (userIds.length > 0) {
        await notificationService.handleNewDishAtFavoriteRestaurant(
          dishId,
          dishName,
          restaurantId,
          restaurantName,
          userIds
        );
      }
      
      logDebug(`[RecommendationTriggers] New dish notification triggered for ${userIds.length} users`);
      
    } catch (error) {
      logError('[RecommendationTriggers] Error triggering new dish notification:', error);
    }
  },

  /**
   * Trigger personalized restaurant recommendation
   */
  async onRestaurantRecommendation(userId, restaurantId, restaurantName, reason) {
    try {
      await notificationService.createAndDeliverNotification({
        recipientId: userId,
        senderId: null,
        notificationType: NOTIFICATION_TYPES.RESTAURANT_RECOMMENDATION,
        relatedEntityType: ENTITY_TYPES.RESTAURANT,
        relatedEntityId: restaurantId,
        title: 'Restaurant recommendation',
        message: `We think you'd love ${restaurantName}! ${reason}`,
        actionUrl: `/restaurants/${restaurantId}`,
        metadata: {
          restaurantId,
          restaurantName,
          reason,
          recommendationType: 'personalized'
        }
      });
      
      logDebug(`[RecommendationTriggers] Restaurant recommendation sent to user ${userId}`);
      
    } catch (error) {
      logError('[RecommendationTriggers] Error triggering restaurant recommendation:', error);
    }
  },

  /**
   * Trigger personalized dish recommendation
   */
  async onDishRecommendation(userId, dishId, dishName, restaurantName, reason) {
    try {
      await notificationService.createAndDeliverNotification({
        recipientId: userId,
        senderId: null,
        notificationType: NOTIFICATION_TYPES.DISH_RECOMMENDATION,
        relatedEntityType: ENTITY_TYPES.DISH,
        relatedEntityId: dishId,
        title: 'Dish recommendation',
        message: `Try ${dishName} at ${restaurantName}! ${reason}`,
        actionUrl: `/dishes/${dishId}`,
        metadata: {
          dishId,
          dishName,
          restaurantName,
          reason,
          recommendationType: 'personalized'
        }
      });
      
      logDebug(`[RecommendationTriggers] Dish recommendation sent to user ${userId}`);
      
    } catch (error) {
      logError('[RecommendationTriggers] Error triggering dish recommendation:', error);
    }
  }
};

/**
 * System notification triggers
 */
export const SystemTriggers = {
  /**
   * Send system announcement to all or specific users
   */
  async sendSystemAnnouncement(title, message, actionUrl = null, userIds = null) {
    try {
      await notificationService.sendSystemAnnouncement(title, message, actionUrl, userIds);
      logInfo(`[SystemTriggers] System announcement sent: ${title}`);
    } catch (error) {
      logError('[SystemTriggers] Error sending system announcement:', error);
    }
  },

  /**
   * Send promotional notification
   */
  async sendPromotionalNotification(userId, title, message, actionUrl = null, metadata = {}) {
    try {
      await notificationService.createAndDeliverNotification({
        recipientId: userId,
        senderId: null,
        notificationType: NOTIFICATION_TYPES.PROMOTIONAL,
        relatedEntityType: ENTITY_TYPES.SYSTEM,
        relatedEntityId: null,
        title,
        message,
        actionUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire in 7 days
        metadata: { ...metadata, isPromotional: true }
      });
      
      logDebug(`[SystemTriggers] Promotional notification sent to user ${userId}`);
      
    } catch (error) {
      logError('[SystemTriggers] Error sending promotional notification:', error);
    }
  }
};

/**
 * Utility function to integrate triggers with existing API endpoints
 */
export const integrateTriggerWithEndpoint = (triggerFunction) => {
  return async (...args) => {
    try {
      await triggerFunction(...args);
    } catch (error) {
      // Log error but don't throw to avoid breaking the main functionality
      logError('[NotificationTriggers] Trigger failed:', error);
    }
  };
};

/**
 * Batch notification helpers for efficiency
 */
export const BatchTriggers = {
  /**
   * Send bulk restaurant recommendations based on user preferences
   */
  async sendBulkRestaurantRecommendations(userRecommendations) {
    try {
      const notifications = userRecommendations.map(({ userId, restaurantId, restaurantName, reason }) => ({
        recipientId: userId,
        senderId: null,
        notificationType: NOTIFICATION_TYPES.RESTAURANT_RECOMMENDATION,
        relatedEntityType: ENTITY_TYPES.RESTAURANT,
        relatedEntityId: restaurantId,
        title: 'Restaurant recommendation',
        message: `We think you'd love ${restaurantName}! ${reason}`,
        actionUrl: `/restaurants/${restaurantId}`,
        metadata: {
          restaurantId,
          restaurantName,
          reason,
          recommendationType: 'bulk'
        }
      }));

      await notificationService.createBatchNotifications(notifications);
      logInfo(`[BatchTriggers] Sent ${notifications.length} bulk restaurant recommendations`);
      
    } catch (error) {
      logError('[BatchTriggers] Error sending bulk restaurant recommendations:', error);
    }
  },

  /**
   * Send weekly digest notifications
   */
  async sendWeeklyDigests(userDigests) {
    try {
      const notifications = userDigests.map(({ userId, summary, actionUrl }) => ({
        recipientId: userId,
        senderId: null,
        notificationType: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        relatedEntityType: ENTITY_TYPES.SYSTEM,
        relatedEntityId: null,
        title: 'Your weekly food digest',
        message: summary,
        actionUrl,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Expire in 2 weeks
        metadata: {
          isDigest: true,
          digestType: 'weekly'
        }
      }));

      await notificationService.createBatchNotifications(notifications);
      logInfo(`[BatchTriggers] Sent ${notifications.length} weekly digest notifications`);
      
    } catch (error) {
      logError('[BatchTriggers] Error sending weekly digest notifications:', error);
    }
  }
};

export default {
  LikeTriggers,
  FollowTriggers,
  ListTriggers,
  SubmissionTriggers,
  RecommendationTriggers,
  SystemTriggers,
  BatchTriggers,
  integrateTriggerWithEndpoint
}; 