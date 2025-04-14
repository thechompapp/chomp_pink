/* src/services/engagementService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient'; // Use alias

// REMOVED: interface LogEngagementPayload { ... }

/**
 * Logs an engagement event to the backend.
 * Assumes backend endpoint /api/engage exists and handles the POST request.
 */
const logEngagement = async ({ item_type, item_id, engagement_type }) => { // REMOVED: Type hints & : Promise<void>
    // Basic JS Input validation
    if (!item_type || item_id == null || !engagement_type) {
        console.warn('[logEngagement] Missing required parameters:', { itemType: item_type, itemId: item_id, engagementType: engagement_type });
        return; // Don't proceed if essential info is missing
    }
    // Ensure item_id is a positive number
    const numericItemId = Number(item_id);
    if (isNaN(numericItemId) || numericItemId <= 0) {
         console.warn(`[logEngagement] Invalid itemId: ${item_id}. Must be a positive number.`);
         return;
    }

    const allowedItemTypes = ['restaurant', 'dish', 'list'];
    const allowedEngagementTypes = ['view', 'click', 'add_to_list', 'share'];

    if (!allowedItemTypes.includes(item_type)) {
        console.warn(`[logEngagement] Invalid itemType: ${item_type}`);
        return;
    }
    if (!allowedEngagementTypes.includes(engagement_type)) {
        console.warn(`[logEngagement] Invalid engagementType: ${engagement_type}`);
        return;
    }

    // Construct payload without type assertion
    const payload = {
        item_id: numericItemId,
        item_type,
        engagement_type,
    };

    try {
        // Use apiClient - fire and forget, no need to await if not handling response
        // REMOVED: <void> generic type argument
        apiClient('/api/engage', `Log Engagement - ${item_type} ${numericItemId} ${engagement_type}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }).catch(error => {
            // Add a catch block directly to the apiClient call if you want to log errors
            // without stopping other code execution (fire and forget style)
            console.error(`[logEngagement] Background log failed for ${item_type} ${numericItemId} (${engagement_type}):`, error?.message || error);
        });

    } catch (error) {
        // This catch block might be redundant if the apiClient call itself doesn't throw
        // synchronously and the promise rejection is handled by the .catch above.
        // Keeping it for safety, but the .catch on the promise is more typical for fire-and-forget.
        console.error(`[logEngagement] Error initiating log request for ${item_type} ${numericItemId} (${engagement_type}):`, error?.message || error);
    }
};

export const engagementService = {
    logEngagement
};