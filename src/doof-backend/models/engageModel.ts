/* src/doof-backend/models/engageModel.ts */
import db from '../db/index.js'; // Corrected import path

// Define allowed types explicitly
type ItemType = 'restaurant' | 'dish' | 'list';
type EngagementType = 'view' | 'click' | 'add_to_list' | 'share'; // Use 'add_to_list' to match schema

export const logEngagement = async (
    userId: number | null | undefined, // Allow undefined from optional auth
    itemId: number,
    itemType: ItemType, // Use the defined type
    engagementType: EngagementType // Use the defined type
): Promise<void> => {
    // Validate inputs (redundant with route validation but good practice)
    if (typeof itemId !== 'number' || itemId <= 0) {
        throw new Error('Invalid Item ID provided for engagement logging.');
    }
    const validItemTypes: ItemType[] = ['restaurant', 'dish', 'list'];
    if (!validItemTypes.includes(itemType)) {
        throw new Error(`Invalid Item Type "${itemType}" provided for engagement logging.`);
    }
     const validEngagementTypes: EngagementType[] = ['view', 'click', 'add_to_list', 'share'];
     if (!validEngagementTypes.includes(engagementType)) {
         throw new Error(`Invalid Engagement Type "${engagementType}" provided for engagement logging.`);
     }


    const query = `
        INSERT INTO Engagements (user_id, item_id, item_type, engagement_type, engagement_timestamp)
        VALUES ($1, $2, $3, $4, NOW())
    `;

    // Ensure userId is passed as null if it's undefined
    await db.query(query, [userId ?? null, itemId, itemType, engagementType]);
    // console.log(`[EngageModel] Logged: User ${userId ?? 'Guest'}, Type ${engagementType}, Item ${itemType}:${itemId}`); // Optional logging
};