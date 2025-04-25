/*
 * Filename: root/doof-backend/controllers/engageController.js
 * Description: Handles the business logic for logging user engagement events.
 */
import { logEngagement as logEngagementModel } from '../models/engageModel.js'; // Rename to avoid conflict
import { validationResult } from 'express-validator'; // Use ESM import

// Controller to log user engagement
export const logEngagement = async (req, res, next) => {
    // Validation performed by middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array().map(e => ({ msg: e.msg, param: e.path })) });
    }

    const userId = req.user.id; // User ID from auth middleware
    // Extract expected fields from body - ensure these match your validator
    const {
        item_type, // e.g., 'restaurant', 'dish', 'list', potentially 'page' in future?
        item_id,   // ID of the item, potentially null for 'page' type
        engagement_type, // e.g., 'view', 'click', 'add_to_list', 'share', 'follow'
        // Add any other relevant context if needed (e.g., source_component)
        metadata // Optional JSONB field for additional context
    } = req.body;

    // Note: Handover doc mentioned limitations. Current structure likely requires item_id/item_type.
    // Refactoring to support page views without item_id would require model/schema changes.
    if (!item_type || !engagement_type) {
         // Basic check, though validator should handle this
         return res.status(400).json({ success: false, message: 'Missing required fields: item_type and engagement_type.' });
    }
    // If item_id is strictly required by current design (except for future 'page' types):
    if (item_type !== 'page' && (item_id === undefined || item_id === null)) {
         return res.status(400).json({ success: false, message: 'Missing required field: item_id for the specified item_type.' });
    }

    try {
        // Prepare data for the model
        const engagementData = {
            user_id: userId,
            item_type,
            // Ensure item_id is null if not provided/applicable, and numeric otherwise
            item_id: (item_id !== undefined && item_id !== null) ? parseInt(item_id, 10) : null,
            engagement_type,
            metadata, // Pass metadata if provided
        };

        // Check item_id parsing if it was provided
        if (item_id !== undefined && item_id !== null && isNaN(engagementData.item_id)) {
            return res.status(400).json({ success: false, message: 'Invalid item_id format. Must be numeric or null.' });
        }

        // Call renamed logEngagementModel
        await logEngagementModel(engagementData.user_id, engagementData.item_id, engagementData.item_type, engagementData.engagement_type, engagementData.metadata);

        // Typically, logging endpoints return 204 No Content or a simple success message
        res.status(204).send();
        // Or: res.status(200).json({ success: true, message: 'Engagement logged successfully.' });

    } catch (error) {
        console.error(`Error logging engagement for user ${userId}:`, error);
        // Handle potential specific errors, e.g., foreign key constraints if item_id must exist
        if (error.code === '23503') { // Foreign key violation on item_id/user_id
            return res.status(400).json({ success: false, message: 'Invalid item_id or user_id provided.' });
        }
        next(error);
    }
};