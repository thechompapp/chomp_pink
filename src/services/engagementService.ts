/* src/services/engagementService.ts */
import apiClient from '@/services/apiClient';

// Define the structure for the payload
interface LogEngagementPayload {
    item_id: number;
    item_type: 'restaurant' | 'dish' | 'list';
    engagement_type: 'view' | 'click' | 'add_to_list' | 'share';
}

// Type the function parameters
const logEngagement = async ({ item_id, item_type, engagement_type }: LogEngagementPayload): Promise<void> => {
    // Basic validation (though route validation is primary)
    if (item_id == null || !item_type || !engagement_type) {
        console.warn('[EngagementService] Missing required data for logging:', { item_id, item_type, engagement_type });
        return; // Don't throw, just skip logging
    }
    const numericItemId = Number(item_id);
     if (isNaN(numericItemId) || numericItemId <= 0) {
         console.warn(`[EngagementService] Invalid item_id: ${item_id}`);
         return;
     }


    const payload: LogEngagementPayload = { item_id: numericItemId, item_type, engagement_type };
    const context = `Engagement Log (${item_type} ${numericItemId}, ${engagement_type})`;

    try {
        // Fire-and-forget: Call apiClient but don't necessarily await or handle the response unless needed for debugging.
        // apiClient should handle basic success/failure internally.
        // Assuming the endpoint returns a simple success/accepted response (e.g., 202) or an error.
        // We don't expect specific data back here.
        await apiClient<void>('/api/engage', context, { // Expecting void or a simple success message
            method: 'POST',
            body: JSON.stringify(payload),
        });
        // Optional: console.log(`[EngagementService] Logged: ${context}`);
    } catch (error) {
        // Log the error but don't let it crash the UI flow.
        console.error(`[EngagementService] Failed to log engagement (${context}):`, error instanceof Error ? error.message : error);
    }
};

export const engagementService = {
    logEngagement,
};