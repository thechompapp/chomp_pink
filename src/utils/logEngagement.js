// Filename: root/src/utils/logEngagement.js
/* src/utils/logEngagement.js */
import apiClient from '@/services/apiClient.js'; // Use alias
import { logDebug, logWarn, logError, logInfo } from '@/utils/logger.js'; // Updated imports

// Allowed types based on updated schema
// Schema Check: ['restaurant', 'dish', 'list', 'page']
const ALLOWED_ITEM_TYPES = ['restaurant', 'dish', 'list', 'page'];
// Schema Check: ['view', 'click', 'add_to_list', 'share', 'page_view']
const ALLOWED_ENGAGEMENT_TYPES = ['view', 'click', 'add_to_list', 'share', 'page_view'];

/**
 * Logs an engagement event to the backend.
 * item_id and item_type are optional for events like 'page_view'.
 * @param {object} params - The engagement parameters.
 * @param {string} params.engagement_type - The type of engagement (e.g., 'view', 'page_view').
 * @param {string} [params.item_type] - The type of item engaged with (e.g., 'restaurant', 'page'). Optional for some engagement types.
 * @param {(string|number)} [params.item_id] - The ID of the item engaged with. Optional for some engagement types.
 */
const logEngagement = async ({ engagement_type, item_type, item_id }) => {
    // Validate engagement_type first, as it dictates requirements for others
    if (!engagement_type || !ALLOWED_ENGAGEMENT_TYPES.includes(engagement_type)) {
        logWarn(`[logEngagement] Invalid or missing engagementType: ${engagement_type}`);
        return;
    }

    let finalItemId = null;
    let finalItemType = item_type || null; // Default to null if undefined/falsy

    // Validate item_id and item_type ONLY if required by the engagement_type
    // Assuming 'page_view' does not strictly require item_id/item_type from the caller
    if (engagement_type !== 'page_view') {
        // For non-page_view events, item_type and item_id are generally expected
        if (!finalItemType || !ALLOWED_ITEM_TYPES.includes(finalItemType)) {
            logWarn(`[logEngagement] Invalid or missing itemType for engagement "${engagement_type}": ${finalItemType}`);
            // Avoid sending invalid data
            return;
        }
        // item_id is also expected for these types
        if (item_id == null) {
             logWarn(`[logEngagement] Missing itemId for engagement "${engagement_type}"`);
             return; // Avoid sending invalid data
        }
        const numericItemId = Number(item_id);
        if (isNaN(numericItemId) || numericItemId <= 0) {
            logWarn(`[logEngagement] Invalid itemId for engagement "${engagement_type}": ${item_id}`);
            return; // Avoid sending invalid data
        }
        finalItemId = numericItemId;
    } else {
        // For 'page_view', set defaults if not provided
        // Default item_type to 'page' if not specified or invalid
        if (!finalItemType || !ALLOWED_ITEM_TYPES.includes(finalItemType)) {
             logDebug(`[logEngagement] Defaulting itemType to 'page' for page_view.`);
             finalItemType = 'page';
        }
        // Ensure item_id is explicitly null for page_view
        finalItemId = null;
    }

    // Construct payload with potentially null values
    const payload = {
        item_id: finalItemId,
        item_type: finalItemType,
        engagement_type,
        // Add any other relevant details you might want to track, e.g., current URL
        // details: { url: window.location.href } // Example: requires schema change for 'details' column
    };

    // Make the API call - fire and forget
    try {
        logInfo(`[logEngagement] Sending payload:`, payload); // Log payload being sent
        // Use apiClient directly for a POST to /api/engage
        // Ensure your backend API route '/api/engage' exists and is handled by engageController
        await apiClient.post('/api/engage', payload);

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logError(`[logEngagement] Failed to log engagement`, { payload, error: errorMessage });
    }
};

export { logEngagement };