/* src/doof-backend/routes/users.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as UserModel from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

const validateUserId: ValidationChain[] = [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer').toInt()
];
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Users Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg }); // Removed 'return'
        return; // Explicit return after sending response
    }
    next();
};

router.get(
    '/:userId/profile',
    authMiddleware,
    validateUserId,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // req.params is available on AuthenticatedRequest which extends Request
        const userIdParam = req.params.userId;
        // req.user is guaranteed by authMiddleware here
        const requestingUserId = req.user!.id;

        const userId = parseInt(userIdParam, 10); // Already parsed by validation .toInt()

        try {
            const userExists = await UserModel.findUserById(userId);
            if (!userExists) {
                res.status(404).json({ error: 'User not found' }); // Removed 'return'
                return; // Explicit return
            }

            const profileStats = await UserModel.getUserProfileStats(userId);
            res.json({ data: profileStats });
        } catch (err) {
            console.error(`[Users GET /:userId/profile] Error for userId ${userId}:`, err);
            next(err);
        }
    }
);

export default router;