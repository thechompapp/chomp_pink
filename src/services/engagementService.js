/* src/services/engagementService.js */
import apiClient from '@/services/apiClient.js';
import { logWarn, logError, logDebug } from '@/utils/logger.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import useAuthenticationStore from '@/stores/auth/useAuthenticationStore.js';

/**
 * Logs an engagement event to the backend.
 * Assumes backend endpoint /api/engage exists and handles the POST request.
 * Gracefully handles unauthenticated users by skipping the API call.
 */
const logEngagement = async ({ item_type, item_id, engagement_type }) => {
    // Check if user is authenticated first
    const authState = useAuthenticationStore.getState();
    const isAuthenticated = authState.isAuthenticated;
    if (!isAuthenticated) {
        logDebug(`[engagementService] Skipping engagement logging for unauthenticated user: ${engagement_type} for ${item_type} ${item_id}`);
        return; // Silently skip for unauthenticated users
    }

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
    const allowedEngagementTypes = [
        'view', 
        'click', 
        'add_to_list', 
        'share',
        'search_view',
        'search_click',
        'search_result_view',
        'search_result_click'
    ];

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
    
    // Use handleApiResponse for consistent error handling
    handleApiResponse(
        () => apiClient.post('/engage', payload),
        'engagementService.logEngagement'
    ).catch(result => {
        // This is a fire-and-forget operation, so we just log errors but don't throw
        if (!result.success) {
            // Check if this is an authentication error
            if (result.error?.status === 401 || result.error?.statusCode === 401) {
                logDebug(`[engagementService] Skipping engagement logging due to authentication error for ${item_type} ${numericItemId} (${engagement_type})`);
            } else {
                logError(`[engagementService] Failed to log engagement for ${item_type} ${numericItemId} (${engagement_type}):`, result.error);
            }
        }
    });
};

/**
 * Helper function to log search-specific engagements
 */
const logSearchEngagement = async ({ item_type, item_id, engagement_type, searchQuery, searchContext }) => {
    const authState = useAuthenticationStore.getState();
    const isAuthenticated = authState.isAuthenticated;
    if (!isAuthenticated) {
        logDebug(`[engagementService] Skipping search engagement logging for unauthenticated user: ${engagement_type} for ${item_type} ${item_id}`);
        return;
    }

    // Validate search engagement type
    const searchEngagementTypes = ['search_view', 'search_click', 'search_result_view', 'search_result_click'];
    if (!searchEngagementTypes.includes(engagement_type)) {
        logWarn(`[engagementService] Invalid search engagement type: ${engagement_type}`);
        return;
    }

    // Add search context as metadata if provided
    const metadata = {};
    if (searchQuery) metadata.search_query = searchQuery;
    if (searchContext) metadata.search_context = searchContext;

    // Log the engagement with metadata
    logDebug(`[engagementService] Logging search engagement: ${engagement_type} for ${item_type} ${item_id} with query: ${searchQuery}`);
    
    handleApiResponse(
        () => apiClient.post('/engage', {
            item_id: item_id ? Number(item_id) : null,
            item_type,
            engagement_type,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        }),
        'engagementService.logSearchEngagement'
    ).catch(result => {
        if (!result.success) {
            if (result.error?.status === 401 || result.error?.statusCode === 401) {
                logDebug(`[engagementService] Skipping search engagement logging due to authentication error for ${item_type} ${item_id} (${engagement_type})`);
            } else {
                logError(`[engagementService] Failed to log search engagement for ${item_type} ${item_id} (${engagement_type}):`, result.error);
            }
        }
    });
};

export const engagementService = {
    logEngagement,
    logSearchEngagement
};