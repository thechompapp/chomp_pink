/* src/doof-backend/routes/engage.js */
import express from 'express';
import { body, validationResult } from 'express-validator';
// Import model function
import * as EngageModel from '../models/engageModel.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

// --- Validation & Middleware (Keep as is) ---
const validateEngagement = [ /* ... */ ];
const handleValidationErrors = (req, res, next) => { /* ... */ };

// POST /api/engage
router.post( '/', optionalAuthMiddleware, validateEngagement, handleValidationErrors, async (req, res, next) => {
    const { item_id, item_type, engagement_type } = req.body;
    const userId = req.user?.id; // May be null

    try {
        await EngageModel.logEngagement(userId, item_id, item_type, engagement_type); // Use Model
        // Send 202 Accepted - standard success, no data needed
        res.status(202).json({ message: 'Engagement logged successfully' }); // Use standard message format if preferred over empty 202

    } catch (err) {
        console.error(`[Engage POST /] Error logging engagement:`, err);
        next(new Error('Failed to log engagement event')); // Pass generic error
    }
});

export default router;