/* src/services/engagementService.js */
import apiClient from '@/services/apiClient.js';
import { logWarn, logError, logDebug } from '@/utils/logger.js';

/**
 * Logs an engagement event to the backend.
 * Assumes backend endpoint /api/engage exists and handles the POST request.
 */
const logEngagement = async ({ item_type, item_id, engagement_type }) => {
    // Basic JS Input validation
    if (!item_type || item_id == null || !engagement_type) {
        logWarn('[logEngagement] Missing required parameters:', { itemType: item_type, itemId: item_id, engagementType: engagement_type });
        return; // Don't proceed if essential info is missing
    }
    
    // Ensure item_id is a positive number
    const numericItemId = Number(item_id);
    if (isNaN(numericItemId) || numericItemId <= 0) {
         logWarn(`[logEngagement] Invalid itemId: ${item_id}. Must be a positive number.`);
         return;
    }

    const allowedItemTypes = ['restaurant', 'dish', 'list'];
    const allowedEngagementTypes = ['view', 'click', 'add_to_list', 'share'];

    if (!allowedItemTypes.includes(item_type)) {
        logWarn(`[logEngagement] Invalid itemType: ${item_type}`);
        return;
    }
    if (!allowedEngagementTypes.includes(engagement_type)) {
        logWarn(`[logEngagement] Invalid engagementType: ${engagement_type}`);
        return;
    }

    // Construct payload
    const payload = {
        item_id: numericItemId,
        item_type,
        engagement_type,
    };

    // Since this is a fire-and-forget operation, we can use a simplified approach
    logDebug(`[engagementService] Logging engagement: ${engagement_type} for ${item_type} ${numericItemId}`);
    
    // Fire and forget with error handling
    apiClient.post('/api/engage', payload)
        .catch(error => {
            logError(`[engagementService] Failed to log engagement for ${item_type} ${numericItemId} (${engagement_type}):`, error);
        });
};

export const engagementService = {
    logEngagement
};