/* src/utils/logEngagement.ts */
import apiClient from '@/services/apiClient'; // Use alias

// Define the structure for the payload more strictly
interface LogEngagementPayload {
    item_id: number; // Use number after validation
    item_type: 'restaurant' | 'dish' | 'list';
    engagement_type: 'view' | 'click' | 'add_to_list' | 'share';
}

/**
 * Logs an engagement event to the backend.
 * @param {object} params - The engagement parameters.
 * @param {'restaurant' | 'dish' | 'list'} params.item_type - The type of item.
 * @param {number|string} params.item_id - The ID of the item.
 * @param {'view' | 'click' | 'add_to_list' | 'share'} params.engagement_type - The type of engagement.
 */
const logEngagement = async ({ item_type, item_id, engagement_type }: {
    item_type: 'restaurant' | 'dish' | 'list';
    item_id: number | string;
    engagement_type: 'view' | 'click' | 'add_to_list' | 'share';
}): Promise<void> => { // Explicitly void return type

    // Input validation
    if (!item_type || item_id == null || !engagement_type) { // Check for null/undefined ID
        console.warn('[logEngagement] Missing required parameters:', { itemType: item_type, itemId: item_id, engagementType: engagement_type });
        return;
    }

    const numericItemId = Number(item_id);
    if (isNaN(numericItemId) || numericItemId <= 0) {
        console.warn(`[logEngagement] Invalid itemId: ${item_id}`);
        return;
    }

    // Validate itemType and engagementType against allowed values
    const allowedItemTypes: LogEngagementPayload['item_type'][] = ['restaurant', 'dish', 'list'];
    const allowedEngagementTypes: LogEngagementPayload['engagement_type'][] = ['view', 'click', 'add_to_list', 'share'];

    if (!allowedItemTypes.includes(item_type)) {
        console.warn(`[logEngagement] Invalid itemType: ${item_type}`);
        return;
    }
    if (!allowedEngagementTypes.includes(engagement_type)) {
        console.warn(`[logEngagement] Invalid engagementType: ${engagement_type}`);
        return;
    }

    const payload: LogEngagementPayload = {
        item_id: numericItemId,
        item_type,
        engagement_type,
    };

    try {
        // console.log(`[logEngagement] Sending engagement:`, payload);
        // Use apiClient - fire and forget
        await apiClient<void>('/api/engage', `Log Engagement - ${item_type} ${numericItemId} ${engagement_type}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        // Optional success log
        // console.log(`[logEngagement] Success: ${item_type} ${numericItemId} ${engagement_type}`);
    } catch (error) {
        // Log errors, but don't block UI
        console.error(`[logEngagement] Failed to log engagement for ${item_type} ${numericItemId} (${engagement_type}):`, error);
    }
};

// Export as named export if used elsewhere, otherwise maybe keep internal to service
export { logEngagement };

// Remove default export if named export is used
// export default logEngagement;