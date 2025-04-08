// src/services/engagementService.js
import apiClient from '@/services/apiClient';

const logEngagement = async ({ item_id, item_type, engagement_type }) => {
    if (!item_id || !item_type || !engagement_type) {
        console.warn('[EngagementService] Missing required data for logging:', { item_id, item_type, engagement_type });
        return;
    }

    const payload = { item_id, item_type, engagement_type };
    const context = `Engagement Log (${item_type} ${item_id}, ${engagement_type})`;

    try {
        await apiClient('/api/engage', context, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error(`[EngagementService] Failed to log engagement (${context}):`, error.message || error);
    }
};

export const engagementService = {
    logEngagement,
};