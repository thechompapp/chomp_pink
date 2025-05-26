/**
 * List Sharing Service
 * 
 * Handles operations related to sharing lists, including
 * following/unfollowing, collaboration, and generating shareable links.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logInfo } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';
import { logEngagement } from '@/utils/logEngagement';

/**
 * List Sharing Service class
 */
class ListSharingService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/lists');
  }
  
  /**
   * Fetch lists followed by a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with followed lists
   */
  async getFollowedLists(userId, { page = 1, limit = 10 } = {}) {
    if (!validateId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }
    
    logDebug(`[ListSharingService] Getting lists followed by user ${userId}`);
    
    const params = {
      isFollowedByUserId: userId,
      page,
      limit
    };
    
    return this.get('', { params });
  }
  
  /**
   * User follows a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} Response with follow status
   */
  async followList(listId) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListSharingService] Following list ${listId}`);
    
    try {
      const result = await this.post(`/${listId}/follow`);
      
      // Log engagement if successful
      if (result.success) {
        logEngagement('follow_list', { listId });
      }
      
      return result;
    } catch (error) {
      logError(`[ListSharingService] Error following list ${listId}:`, error);
      return { success: false, message: 'Failed to follow list' };
    }
  }
  
  /**
   * User unfollows a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} Response with unfollow status
   */
  async unfollowList(listId) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListSharingService] Unfollowing list ${listId}`);
    
    try {
      const result = await this.delete(`/${listId}/follow`);
      
      // Log engagement if successful
      if (result.success) {
        logEngagement('unfollow_list', { listId });
      }
      
      return result;
    } catch (error) {
      logError(`[ListSharingService] Error unfollowing list ${listId}:`, error);
      return { success: false, message: 'Failed to unfollow list' };
    }
  }
  
  /**
   * Toggle follow status for a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} Response with toggle status
   */
  async toggleFollowList(listId) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListSharingService] Toggling follow status for list ${listId}`);
    
    try {
      // First check current follow status
      const statusResult = await this.checkFollowStatus(listId);
      
      if (!statusResult.success) {
        return statusResult;
      }
      
      // Toggle based on current status
      if (statusResult.isFollowing) {
        return this.unfollowList(listId);
      } else {
        return this.followList(listId);
      }
    } catch (error) {
      logError(`[ListSharingService] Error toggling follow status for list ${listId}:`, error);
      return { success: false, message: 'Failed to toggle follow status' };
    }
  }
  
  /**
   * Check if a user follows a specific list
   * @param {string} listId - List ID
   * @param {string} userId - User ID (optional, uses current user if not provided)
   * @returns {Promise<Object>} Response with follow status
   */
  async checkFollowStatus(listId, userId) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListSharingService] Checking follow status for list ${listId}`);
    
    const params = {};
    if (userId) params.userId = userId;
    
    try {
      const result = await this.get(`/${listId}/follow/status`, { params });
      
      return {
        success: true,
        isFollowing: result.data?.isFollowing || false
      };
    } catch (error) {
      logError(`[ListSharingService] Error checking follow status for list ${listId}:`, error);
      return { success: false, message: 'Failed to check follow status' };
    }
  }
  
  /**
   * Get a shareable link or details for a list
   * @param {string} listId - List ID
   * @param {Object} shareOptions - Sharing options
   * @param {boolean} shareOptions.generateShortLink - Whether to generate a short link
   * @param {string} shareOptions.expiresIn - Expiration time (e.g., '24h', '7d')
   * @param {boolean} shareOptions.trackClicks - Whether to track clicks on the link
   * @returns {Promise<Object>} Response with shareable link
   */
  async getShareableListLink(listId, shareOptions = {}) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListSharingService] Getting shareable link for list ${listId}`);
    
    try {
      const result = await this.post(`/${listId}/share`, shareOptions);
      
      // Log engagement if successful
      if (result.success) {
        logEngagement('generate_share_link', { listId });
      }
      
      return result;
    } catch (error) {
      logError(`[ListSharingService] Error generating shareable link for list ${listId}:`, error);
      return { success: false, message: 'Failed to generate shareable link' };
    }
  }
  
  /**
   * Fetch lists that a user has collaborated on
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with collaboration lists
   */
  async getCollaboratingLists(userId, { page = 1, limit = 10 } = {}) {
    if (!validateId(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }
    
    logDebug(`[ListSharingService] Getting lists collaborated on by user ${userId}`);
    
    const params = {
      collaboratorId: userId,
      page,
      limit
    };
    
    return this.get('/collaborating', { params });
  }
  
  /**
   * Add a collaborator to a list
   * @param {string} listId - List ID
   * @param {string} collaboratorUserId - Collaborator user ID
   * @param {string} role - Collaborator role (e.g., 'editor', 'viewer')
   * @returns {Promise<Object>} Response with collaboration status
   */
  async addCollaboratorToList(listId, collaboratorUserId, role = 'editor') {
    if (!validateId(listId) || !validateId(collaboratorUserId)) {
      return { success: false, message: 'Invalid list ID or user ID' };
    }
    
    logDebug(`[ListSharingService] Adding collaborator ${collaboratorUserId} to list ${listId}`);
    
    const data = {
      userId: collaboratorUserId,
      role
    };
    
    return this.post(`/${listId}/collaborators`, data);
  }
  
  /**
   * Remove a collaborator from a list
   * @param {string} listId - List ID
   * @param {string} collaboratorUserId - Collaborator user ID
   * @returns {Promise<Object>} Response with removal status
   */
  async removeCollaboratorFromList(listId, collaboratorUserId) {
    if (!validateId(listId) || !validateId(collaboratorUserId)) {
      return { success: false, message: 'Invalid list ID or user ID' };
    }
    
    logDebug(`[ListSharingService] Removing collaborator ${collaboratorUserId} from list ${listId}`);
    
    return this.delete(`/${listId}/collaborators/${collaboratorUserId}`);
  }
  
  /**
   * Update a collaborator's role on a list
   * @param {string} listId - List ID
   * @param {string} collaboratorUserId - Collaborator user ID
   * @param {string} role - New collaborator role
   * @returns {Promise<Object>} Response with update status
   */
  async updateCollaboratorRole(listId, collaboratorUserId, role) {
    if (!validateId(listId) || !validateId(collaboratorUserId)) {
      return { success: false, message: 'Invalid list ID or user ID' };
    }
    
    if (!role) {
      return { success: false, message: 'Role is required' };
    }
    
    logDebug(`[ListSharingService] Updating collaborator ${collaboratorUserId} role to ${role} on list ${listId}`);
    
    const data = { role };
    
    return this.put(`/${listId}/collaborators/${collaboratorUserId}`, data);
  }
  
  /**
   * Get collaborators for a list
   * @param {string} listId - List ID
   * @returns {Promise<Object>} Response with collaborators
   */
  async getListCollaborators(listId) {
    if (!validateId(listId)) {
      return { success: false, message: 'Invalid list ID' };
    }
    
    logDebug(`[ListSharingService] Getting collaborators for list ${listId}`);
    
    return this.get(`/${listId}/collaborators`);
  }
  
  /**
   * Merge two lists
   * @param {string} sourceListId - Source list ID (list to merge from)
   * @param {string} targetListId - Target list ID (list to merge into)
   * @param {Object} options - Merge options
   * @param {boolean} options.deleteSourceList - Whether to delete the source list after merging
   * @param {string} options.conflictResolution - How to handle conflicts ('keep_target', 'keep_source', 'keep_both')
   * @returns {Promise<Object>} Response with merge status
   */
  async mergeLists(sourceListId, targetListId, options = {}) {
    if (!validateId(sourceListId) || !validateId(targetListId)) {
      return { success: false, message: 'Invalid source or target list ID' };
    }
    
    logDebug(`[ListSharingService] Merging list ${sourceListId} into ${targetListId}`);
    
    const data = {
      sourceListId,
      targetListId,
      ...options
    };
    
    return this.post('/merge', data);
  }
}

// Create and export a singleton instance
export const listSharingService = new ListSharingService();

export default ListSharingService;
