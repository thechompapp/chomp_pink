/* src/doof-backend/routes/engage.js */
import express from 'express';
import { body, validationResult } from 'express-validator';
import * as EngageModel from '../models/engageModel.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

const validateEngagement = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(),
    body('item_type').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type (must be restaurant, dish, or list)'),
    body('engagement_type').isIn(['view', 'click', 'add_to_list', 'share']).withMessage('Invalid engagement type (must be view, click, add_to_list, or share)')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Engage Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

router.post(
    '/',
    optionalAuthMiddleware,
    validateEngagement,
    handleValidationErrors,
    async (req, res, next) => {
        const { item_id, item_type, engagement_type } = req.body;
        const userId = req.user?.id; // User may not be present

        // console.log(`[Engage POST /] Logging: User ${userId ?? 'Guest'}, Type ${engagement_type}, Item ${item_type}:${item_id}`); // Optional

        try {
            await EngageModel.logEngagement(userId, item_id, item_type, engagement_type);
            res.status(202).json({ success: true, message: 'Engagement logged successfully' }); // Add success flag
        } catch (err) {
            console.error(`[Engage POST /] Error logging engagement:`, err);
            // Send error response instead of passing to generic handler?
            res.status(500).json({ success: false, error: 'Failed to log engagement event.' });
            // next(new Error('Failed to log engagement event.')); // Or pass to handler
        }
    }
);

export default router;