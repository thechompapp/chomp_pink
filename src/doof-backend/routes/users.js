/* src/doof-backend/routes/users.js */
import express from 'express';
import { param, validationResult } from 'express-validator';
// Import model functions
import * as UserModel from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Middleware & Validation (Keep as is) ---
const validateUserId = [ /* ... */ ];
const handleValidationErrors = (req, res, next) => { /* ... */ };

// Route handler for GET /:userId/profile
router.get(
    '/:userId/profile',
    authMiddleware, // Ensure user is authenticated (even to view own profile)
    validateUserId,
    handleValidationErrors,
    async (req, res, next) => {
        const { userId } = req.params;
        const requestingUserId = req.user.id; // ID of the user making the request

        // Optional: Add check if user can view other profiles, or only their own
        // if (parseInt(userId, 10) !== requestingUserId) {
        //     return res.status(403).json({ error: "Forbidden: You can only view your own profile stats." });
        // }

        try {
            // Check if user exists (optional, model function might handle implicitly)
            const userExists = await UserModel.findUserById(userId);
            if (!userExists) {
                return res.status(404).json({ error: 'User not found' });
            }

            const profileStats = await UserModel.getUserProfileStats(userId); // Use Model
            res.json({ data: profileStats }); // Standard response

        } catch (err) {
            console.error(`[Users GET /:userId/profile] Error for userId ${userId}:`, err);
            next(err);
        }
    }
);

// Add other user routes here if needed (e.g., GET /users/me, PUT /users/me)

export default router;