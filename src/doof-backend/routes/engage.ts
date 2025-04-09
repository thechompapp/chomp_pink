/* src/doof-backend/routes/engage.ts */
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import * as EngageModel from '../models/engageModel.js'; // Added .js
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Added .js
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Import type with .js

const router = express.Router();

// Validation rules for the engagement payload
const validateEngagement: ValidationChain[] = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(), // Ensure integer conversion
    body('item_type').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type (must be restaurant, dish, or list)'),
    // Updated allowed types to match model/schema
    body('engagement_type').isIn(['view', 'click', 'add_to_list', 'share']).withMessage('Invalid engagement type (must be view, click, add_to_list, or share)')
];

// Middleware to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Engage Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// POST /api/engage - Log an engagement event
router.post(
    '/',
    optionalAuthMiddleware, // Use optional auth to get user ID if available
    validateEngagement, // Apply validation rules
    handleValidationErrors, // Handle any validation errors
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Extract validated data
        const { item_id, item_type, engagement_type } = req.body;
        // Get user ID from optional auth middleware (might be undefined)
        const userId = req.user?.id;

        console.log(`[Engage POST /] Logging: User ${userId ?? 'Guest'}, Type ${engagement_type}, Item ${item_type}:${item_id}`);

        try {
            // Call the model function to log the engagement
            await EngageModel.logEngagement(userId, item_id, item_type, engagement_type);
            // Send a 202 Accepted response (fire and forget)
            res.status(202).json({ message: 'Engagement logged successfully' });
        } catch (err) {
            // Log the error and pass it to the global error handler
            console.error(`[Engage POST /] Error logging engagement:`, err);
            // Create a user-friendly error message
            next(new Error('Failed to log engagement event.'));
        }
    }
);

export default router;