/* src/utils/logEngagement.js */
/* REMOVED: All TypeScript syntax (interfaces, types) */
import apiClient from '@/services/apiClient'; // Use alias

// REMOVED: interface LogEngagementPayload { ... }

/**
 * Logs an engagement event to the backend.
 */
const logEngagement = async ({ item_type, item_id, engagement_type }) => { // REMOVED: Type hints & return type
    // Input validation
    if (!item_type || item_id == null || !engagement_type) {
        console.warn('[logEngagement] Missing required parameters:', { itemType: item_type, itemId: item_id, engagementType: engagement_type });
        return;
    }

    const numericItemId = Number(item_id);
    if (isNaN(numericItemId) || numericItemId <= 0) {
        console.warn(`[logEngagement] Invalid itemId: ${item_id}`);
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

    const payload = { // REMOVED: : LogEngagementPayload
        item_id: numericItemId,
        item_type,
        engagement_type,
    };

    try {
        // Use apiClient - fire and forget
        await apiClient/*REMOVED: <void>*/('/api/engage', `Log Engagement - ${item_type} ${numericItemId} ${engagement_type}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error(`[logEngagement] Failed to log engagement for ${item_type} ${numericItemId} (${engagement_type}):`, error);
    }
};

export { logEngagement };