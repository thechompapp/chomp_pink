// Example: How to integrate notifications into existing doof controllers
// This file shows how to add notification triggers to your existing API endpoints

import { NotificationIntegration, LikeTriggers, FollowTriggers } from '../utils/notificationTriggers.js';

/**
 * Example 1: Adding notifications to an existing "like list" endpoint
 * 
 * Before (existing controller):
 */
export const likeListOriginal = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;
    
    // Your existing like logic
    const list = await ListModel.findById(listId);
    const like = await LikeModel.create({ userId, listId });
    
    res.json({ success: true, data: like });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * After (with notifications):
 */
export const likeListWithNotifications = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;
    
    // Your existing like logic
    const list = await ListModel.findById(listId);
    const like = await LikeModel.create({ userId, listId });
    
    // Add notification trigger (just one line!)
    await NotificationIntegration.handleLike('list', listId, list.ownerId, userId, {
      title: list.title
    });
    
    res.json({ success: true, data: like });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 2: Adding notifications to a follow user endpoint
 */
export const followUserWithNotifications = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const followerId = req.user.id;
    
    // Your existing follow logic
    const follow = await FollowModel.create({ followerId, followedId: targetUserId });
    const follower = await UserModel.findById(followerId);
    
    // Add notification trigger
    await NotificationIntegration.handleFollow(targetUserId, followerId, {
      username: follower.username
    });
    
    res.json({ success: true, data: follow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 3: Adding notifications to submission approval (admin)
 */
export const approveSubmissionWithNotifications = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Your existing approval logic
    const submission = await SubmissionModel.findById(submissionId);
    await SubmissionModel.updateStatus(submissionId, 'approved');
    
    // Add notification trigger
    await NotificationIntegration.handleSubmissionApproval(
      submissionId, 
      submission.submitterId, 
      {
        name: submission.name,
        type: submission.type
      },
      true // approved = true
    );
    
    res.json({ success: true, message: 'Submission approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 4: Direct notification creation for custom scenarios
 */
export const sendCustomNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // Use the trigger classes directly for more control
    await LikeTriggers.onListLiked(123, userId, req.user.id, "Amazing Restaurants");
    
    // Or create completely custom notifications
    const notification = await notificationModel.createNotification({
      recipientId: userId,
      senderId: req.user.id,
      notificationType: 'system_announcement',
      title: 'Custom Notification',
      message: message,
      actionUrl: '/custom-action',
      metadata: { customData: true }
    });
    
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 5: Batch notifications for system announcements
 */
export const sendSystemAnnouncement = async (req, res) => {
  try {
    const { title, message, targetUserIds } = req.body;
    
    // Send to specific users
    const notifications = await SystemTriggers.onSystemAnnouncement(
      targetUserIds,
      title,
      message,
      '/announcements'
    );
    
    res.json({ 
      success: true, 
      message: `Sent announcement to ${notifications.length} users` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Integration Steps:
 * 
 * 1. Import the notification triggers in your controller:
 *    import { NotificationIntegration } from '../utils/notificationTriggers.js';
 * 
 * 2. Add a single line after your existing logic:
 *    await NotificationIntegration.handleLike('list', listId, ownerId, likerId, entityData);
 * 
 * 3. That's it! The notification system handles:
 *    - Creating the notification in the database
 *    - Checking user preferences
 *    - Sending real-time updates via WebSocket/SSE
 *    - Grouping similar notifications
 *    - Handling delivery status
 * 
 * No changes needed to your existing database schema or frontend!
 */

export default {
  likeListWithNotifications,
  followUserWithNotifications,
  approveSubmissionWithNotifications,
  sendCustomNotification,
  sendSystemAnnouncement
}; 