// src/utils/logEngagement.js
import apiClient from '@/services/apiClient'; // Use global import alias

/**
 * Logs an engagement event to the backend.
 * @param {string} itemType - The type of item ('restaurant', 'dish', 'list').
 * @param {number|string} itemId - The ID of the item.
 * @param {string} engagementType - The type of engagement ('view', 'click', 'add_to_list', 'share').
 */
const logEngagement = async (itemType, itemId, engagementType) => {
  // Input validation
  if (!itemType || !itemId || !engagementType) {
    console.warn('[logEngagement] Missing required parameters:', { itemType, itemId, engagementType });
    return;
  }
  // Validate itemType and engagementType against allowed values
  const allowedItemTypes = ['restaurant', 'dish', 'list'];
  const allowedEngagementTypes = ['view', 'click', 'add_to_list', 'share'];
  if (!allowedItemTypes.includes(itemType)) {
      console.warn(`[logEngagement] Invalid itemType: ${itemType}`);
      return;
  }
   if (!allowedEngagementTypes.includes(engagementType)) {
      console.warn(`[logEngagement] Invalid engagementType: ${engagementType}`);
      return;
  }

  const payload = {
    item_id: parseInt(String(itemId), 10), // Ensure ID is number
    item_type: itemType,
    engagement_type: engagementType,
  };

  // Basic check for valid ID after parsing
  if (isNaN(payload.item_id) || payload.item_id <= 0) {
      console.warn(`[logEngagement] Invalid itemId after parsing: ${itemId}`);
      return;
  }


  try {
    // console.log(`[logEngagement] Sending engagement:`, payload); // Optional: Log before sending
    // Use apiClient - fire and forget, no need to await or handle response unless debugging
    apiClient('/api/engage', `Log Engagement - ${itemType} ${itemId} ${engagementType}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    .then(response => {
        // Optional: Log success only if needed for debugging
        // console.log(`[logEngagement] Success: ${itemType} ${itemId} ${engagementType}`);
    })
    .catch(error => {
        // Log errors, but don't block UI
        console.error(`[logEngagement] Failed to log engagement for ${itemType} ${itemId} (${engagementType}):`, error);
    });
  } catch (error) {
    // Catch synchronous errors, though unlikely here
    console.error(`[logEngagement] Synchronous error during API call setup:`, error);
  }
};

export default logEngagement;