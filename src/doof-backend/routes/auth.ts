/* src/doof-backend/routes/auth.ts */
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, param, ValidationChain } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/userModel.js'; // Added .js
import authMiddleware from '../middleware/auth.js'; // Added .js
import requireSuperuser from '../middleware/requireSuperuser.js'; // Added .js
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Import type with .js
import type { User } from '@/types/User'; // Assuming frontend types are aliased

const router = express.Router();

// --- Configuration ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("\n\nFATAL ERROR: JWT_SECRET environment variable is not set!\nAuth will not function.\n\n");
    // Potentially exit or throw an error during startup in a real app
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d'; // Default expiry to 1 day

// --- Helper Functions ---
// Removes password hash before sending user data to client
const formatUserForResponse = (user: any): Omit<User, 'password_hash'> | null => {
    if (!user) return null;
    const { password_hash, ...userData } = user; // Destructure to remove password_hash
    return {
        ...userData,
        id: parseInt(String(userData.id), 10), // Ensure ID is number
        account_type: userData.account_type || 'user' // Ensure account_type exists
    };
};

// Middleware to handle validation results
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Auth Route Validation Error] Path: ${req.path}`, errors.array());
        // Return only the first error message for a cleaner response
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- Validation Chains ---
const validateRegister: ValidationChain[] = [
    body('username', 'Username is required').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters').escape(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const validateLogin: ValidationChain[] = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists().notEmpty(), // Ensure password is not just whitespace
];

const validateAccountTypeUpdate: ValidationChain[] = [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer').toInt(), // Convert to int
    body('account_type').isIn(['user', 'contributor', 'superuser']).withMessage('Invalid account type specified')
];

// --- Routes ---

// POST /api/auth/register
router.post('/register', validateRegister, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    console.log(`[Auth Register] Attempting registration for email: ${email}, username: ${username}`);
    if (!JWT_SECRET) { // Check secret existence here
         console.error("[Auth Register] JWT_SECRET not set!");
         return next(new Error("Server configuration error."));
     }

    try {
        // Check for existing user by email or username
        const existingEmail = await UserModel.findUserByEmail(email);
        if (existingEmail) {
            console.warn(`[Auth Register] Failed: Email ${email} already exists.`);
            return res.status(400).json({ error: 'User with this email already exists.' });
        }
        const existingUsername = await UserModel.findUserByUsername(username);
        if (existingUsername) {
            console.warn(`[Auth Register] Failed: Username ${username} already exists.`);
            return res.status(400).json({ error: 'User with this username already exists.' });
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await UserModel.createUser(username, email, passwordHash);
        console.log(`[Auth Register] User created successfully: ID ${newUser.id}`);

        // Create JWT Payload
        const payload = {
            user: { // Nest user details under 'user' key in payload
                id: newUser.id,
                username: newUser.username,
                account_type: newUser.account_type || 'user', // Ensure default
            },
        };

        // Sign JWT
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        console.log(`[Auth Register] JWT generated for user ID ${newUser.id}`);

        // Send response
        res.status(201).json({
            // Wrap response in 'data' object for consistency
            data: {
                token,
                user: formatUserForResponse(newUser) // Format user data for client
            }
        });
    } catch (err) {
        console.error("[Auth Register] Error:", err);
        next(err); // Pass error to global handler
    }
});

// POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    console.log(`[Auth Login] Attempting login for email: ${email}`);
     if (!JWT_SECRET) { // Check secret existence here
         console.error("[Auth Login] JWT_SECRET not set!");
         return next(new Error("Server configuration error."));
     }

    try {
        // Find user by email
        const user = await UserModel.findUserByEmail(email);
        if (!user || !user.password_hash) { // Ensure user and hash exist
            console.warn(`[Auth Login] Failed: User not found or password hash missing for email: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.warn(`[Auth Login] Failed: Password mismatch for email: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        console.log(`[Auth Login] Login successful for user ID ${user.id}`);

        // Create JWT Payload
        const payload = {
            user: { // Nest user details under 'user' key
                id: user.id,
                username: user.username,
                account_type: user.account_type || 'user', // Ensure default
            },
        };

        // Sign JWT
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        console.log(`[Auth Login] JWT generated for user ID ${user.id}`);

        // Send response
        res.json({
            // Wrap response in 'data' object
            data: {
                token,
                user: formatUserForResponse(user) // Format user data
            }
        });
    } catch (err) {
        console.error("[Auth Login] Error:", err);
        next(err); // Pass error to global handler
    }
});

// PUT /api/auth/update-account-type/:userId (Superuser only)
router.put(
    '/update-account-type/:userId',
    authMiddleware, // Ensure user is logged in
    requireSuperuser, // Ensure user is a superuser
    validateAccountTypeUpdate, // Validate params and body
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const targetUserId = req.params.userId; // Already parsed to int by validator
        const { account_type } = req.body;
        const requestingUserId = req.user!.id; // Auth middleware ensures req.user exists

        console.log(`[Auth Update Type] Superuser ${requestingUserId} attempting to set user ${targetUserId} to type: ${account_type}`);

        // Prevent superuser from changing their own type via this route
        if (requestingUserId === targetUserId) {
            console.warn(`[Auth Update Type] Failed: Superuser ${requestingUserId} cannot change their own account type.`);
            return res.status(403).json({ error: 'Superusers cannot change their own account type via this route.' });
        }

        try {
            // Check if target user exists
            const targetUser = await UserModel.findUserById(targetUserId);
            if (!targetUser) {
                console.warn(`[Auth Update Type] Failed: Target user ${targetUserId} not found.`);
                return res.status(404).json({ error: 'Target user not found.' });
            }

            // Update the user's account type
            const updatedUser = await UserModel.updateUserAccountType(targetUserId, account_type);
            if (!updatedUser) {
                // This might happen if the DB update fails unexpectedly
                throw new Error(`Update failed for user ${targetUserId}, no user returned after update.`);
            }
            console.log(`[Auth Update Type] Successfully updated user ${targetUserId} to type: ${account_type}`);

            // Send back the updated user info (without password hash)
            res.json({
                data: formatUserForResponse(updatedUser)
            });
        } catch (err) {
            console.error(`[Auth Update Type] Error updating user ${targetUserId}:`, err);
            next(err); // Pass error to global handler
        }
    }
);

export default router;