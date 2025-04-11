import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as EngageModel from '../models/engageModel.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

const validateEngagement: ValidationChain[] = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(),
    body('item_type').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type (must be restaurant, dish, or list)'),
    body('engagement_type').isIn(['view', 'click', 'add_to_list', 'share']).withMessage('Invalid engagement type (must be view, click, add_to_list, or share)')
];

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
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
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { item_id, item_type, engagement_type } = req.body;
        const userId = req.user?.id;

        console.log(`[Engage POST /] Logging: User ${userId ?? 'Guest'}, Type ${engagement_type}, Item ${item_type}:${item_id}`);

        try {
            await EngageModel.logEngagement(userId, item_id, item_type, engagement_type);
            res.status(202).json({ message: 'Engagement logged successfully' });
        } catch (err) {
            console.error(`[Engage POST /] Error logging engagement:`, err);
            next(new Error('Failed to log engagement event.'));
        }
    }
);

export default router;