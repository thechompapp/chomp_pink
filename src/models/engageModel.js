/* src/doof-backend/models/engageModel.js */
import db from '../db/index.js';

export const logEngagement = async (userId, itemId, itemType, engagementType) => {
     // Basic item existence checks could be added here if critical
    const query = `
        INSERT INTO Engagements (user_id, item_id, item_type, engagement_type)
        VALUES ($1, $2, $3, $4)
    `;
    // userId can be null for guest engagements
    await db.query(query, [userId, itemId, itemType, engagementType]);
    // No return value needed for fire-and-forget logging
};