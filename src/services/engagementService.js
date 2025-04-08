// src/services/engagementService.js
import apiClient from '@/services/apiClient'; // Corrected import (removed .js extension)

/**
 * Logs an engagement event to the backend.
 * This is intended to be a "fire-and-forget" call, so it doesn't return data
 * and handles errors internally to avoid disrupting the user flow.
 *
 * @param {object} engagementData
 * @param {number} engagementData.item_id - The ID of the item being engaged with.
 * @param {'restaurant' | 'dish' | 'list'} engagementData.item_type - The type of the item.
 * @param {'view' | 'click' | 'add_to_list' | 'share'} engagementData.engagement_type - The type of engagement.
 */
const logEngagement = async ({ item_id, item_type, engagement_type }) => {
  // Basic validation upfront
  if (!item_id || !item_type || !engagement_type) {
    console.warn('[EngagementService] Missing required data for logging:', { item_id, item_type, engagement_type });
    return; // Don't attempt to send incomplete data
  }

  const payload = { item_id, item_type, engagement_type };
  const context = `Engagement Log (${item_type} ${item_id}, ${engagement_type})`;

  try {
    // console.log(`[EngagementService] Logging: ${context}`, payload); // Optional: log before sending
    // Use apiClient to send the POST request.
    // We expect a 202 Accepted or similar success status, but don't need the response body.
    await apiClient('/api/engage', context, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // console.log(`[EngagementService] Successfully logged: ${context}`); // Optional: log success
  } catch (error) {
    // Log the error internally but don't throw it, as this shouldn't block UI.
    console.error(`[EngagementService] Failed to log engagement (${context}):`, error.message || error);
    // Handle specific errors if necessary (e.g., unauthorized shouldn't happen often here)
    // but generally fail silently for engagement logging.
  }
};

export const engagementService = {
  logEngagement,
};