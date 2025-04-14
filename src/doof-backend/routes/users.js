/* src/doof-backend/routes/users.js */
import express from 'express';
import { param, validationResult } from 'express-validator';
import * as UserModel from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const validateUserId = [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer').toInt()
];
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Users Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

router.get(
    '/:userId/profile',
    authMiddleware, // Ensure user is logged in to view any profile (adjust if public profiles needed)
    validateUserId,
    handleValidationErrors,
    async (req, res, next) => {
        const userIdParam = req.params.userId;
        const requestingUserId = req.user.id; // User must be present due to authMiddleware
        const userId = parseInt(userIdParam, 10);

        // Optional: Restrict access so users can only see their own profile?
        // if (requestingUserId !== userId && req.user.account_type !== 'superuser') {
        //    return res.status(403).json({ error: 'Forbidden: Cannot view other user profiles.' });
        // }

        try {
            const userExists = await UserModel.findUserById(userId); // Fetches formatted user
            if (!userExists) {
                res.status(404).json({ success: false, error: 'User not found' }); // Add success flag
                return;
            }

            const profileStats = await UserModel.getUserProfileStats(userId);
            // Combine basic user info (without sensitive details) with stats
            const profileData = {
                user: userExists, // Contains id, username, email, account_type, created_at
                stats: profileStats
            };
            res.json({ success: true, data: profileData }); // Wrap response
        } catch (err) {
            console.error(`[Users GET /:userId/profile] Error for userId ${userId}:`, err);
            next(err);
        }
    }
);

export default router;