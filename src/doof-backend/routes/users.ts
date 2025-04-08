/* src/doof-backend/routes/users.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
// Import model functions - REMOVE .js extension
import * as UserModel from '../models/userModel'; // Corrected path
import authMiddleware from '../middleware/auth'; // Corrected path

const router = express.Router();

// --- Define types ---
interface AuthenticatedRequest extends Request {
    user?: { id: number; /* other user fields */ };
}

// --- Middleware & Validation ---
const validateUserId = [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer').toInt()
];
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Users Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Route handler for GET /:userId/profile
router.get(
    '/:userId/profile',
    authMiddleware, // Ensure user is authenticated
    validateUserId,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userIdParam = req.params.userId; // Keep as string for comparison if needed
        const requestingUserId = req.user?.id; // ID of the user making the request

        // Optional: Add check if user can view other profiles, or only their own
        if (requestingUserId === undefined) {
            return res.status(401).json({ error: "Authentication details missing." });
        }
        // if (userIdParam !== String(requestingUserId)) {
        //     return res.status(403).json({ error: "Forbidden: You can only view your own profile stats." });
        // }
        const userId = parseInt(userIdParam, 10); // Convert to number for model function

        try {
            const userExists = await UserModel.findUserById(userId);
            if (!userExists) {
                return res.status(404).json({ error: 'User not found' });
            }

            const profileStats = await UserModel.getUserProfileStats(userId);
            res.json({ data: profileStats }); // Standard response

        } catch (err) {
            console.error(`[Users GET /:userId/profile] Error for userId ${userId}:`, err);
            next(err);
        }
    }
);

// Add other user routes here if needed

export default router;