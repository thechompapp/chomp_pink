/* src/doof-backend/models/engageModel.js */
import db from '../db/index.js';

export const logEngagement = async (userId, itemId, itemType, engagementType) => {
    if (typeof itemId !== 'number' || itemId <= 0) {
        throw new Error('Invalid Item ID provided for engagement logging.');
    }
    const validItemTypes = ['restaurant', 'dish', 'list'];
    if (!validItemTypes.includes(itemType)) {
        throw new Error(`Invalid Item Type "${itemType}" provided for engagement logging.`);
    }
     const validEngagementTypes = ['view', 'click', 'add_to_list', 'share'];
     if (!validEngagementTypes.includes(engagementType)) {
         throw new Error(`Invalid Engagement Type "${engagementType}" provided for engagement logging.`);
     }

    const query = `
        INSERT INTO Engagements (user_id, item_id, item_type, engagement_type, engagement_timestamp)
        VALUES ($1, $2, $3, $4, NOW())
    `;
    await db.query(query, [userId ?? null, itemId, itemType, engagementType]);
    // console.log(`[EngageModel] Logged: User ${userId ?? 'Guest'}, Type ${engagementType}, Item ${itemType}:${itemId}`); // Optional logging
};