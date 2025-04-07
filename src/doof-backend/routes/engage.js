// src/doof-backend/routes/engage.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/index.js'; // Use global import alias '@/db/index.js' if configured, otherwise relative
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Use global import alias '@/middleware/optionalAuth.js' if configured, otherwise relative

const router = express.Router();

// Validation rules
const validateEngagement = [
  body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer'),
  body('item_type').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type'),
  body('engagement_type').isIn(['view', 'click', 'add_to_list', 'share']).withMessage('Invalid engagement type'),
];

// Middleware for handling validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("[Engage Route Validation Error]", req.path, errors.array());
      // Return only the first error message for simplicity
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// POST /api/engage
router.post(
    '/',
    optionalAuthMiddleware, // Get user ID if logged in
    validateEngagement,
    handleValidationErrors,
    async (req, res, next) => {
        const { item_id, item_type, engagement_type } = req.body;
        // User ID might be undefined if optional auth fails or no token provided
        const userId = req.user?.id;
        const currentDb = req.app?.get('db') || db;

        console.log(`[Engage POST /] Received engagement: User ${userId || 'Guest'}, Type: ${engagement_type}, ItemType: ${item_type}, ItemID: ${item_id}`);

        try {
            // Basic check if item exists (optional, but good practice)
            // This requires knowing the table based on item_type, could be complex
            // For now, we'll assume the frontend sends valid item IDs.
            // Example (Restaurant):
            // if (item_type === 'restaurant') {
            //    const check = await currentDb.query('SELECT 1 FROM Restaurants WHERE id = $1', [item_id]);
            //    if (check.rows.length === 0) return res.status(404).json({ error: 'Restaurant item not found' });
            // } // Add similar checks for 'dish' and 'list' if desired

            // Insert the engagement event
            const query = `
                INSERT INTO Engagements (user_id, item_id, item_type, engagement_type)
                VALUES ($1, $2, $3, $4)
            `;
            await currentDb.query(query, [userId, item_id, item_type, engagement_type]);

            // Respond with success (202 Accepted is suitable as it's fire-and-forget)
            res.status(202).json({ message: 'Engagement logged successfully' });

        } catch (err) {
            console.error(`[Engage POST /] Error logging engagement:`, err);
            // Avoid sending detailed DB errors to the client in production
            next(new Error('Failed to log engagement event')); // Pass to global error handler
        }
    }
);

export default router;