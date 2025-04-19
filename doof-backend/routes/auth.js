/* src/doof-backend/routes/auth.js */
import express from 'express';
import { body, validationResult, param } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.error('\n\nERROR: JWT_SECRET environment variable is not set!\nFalling back to insecure default secret.\nThis must be fixed in production.\n\n');
    return 'default-secret';
})();
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';

const formatUserForResponse = (user) => {
    if (!user) return null;
    const { password_hash, ...userData } = user;
    return {
        ...userData,
        id: Number(userData.id),
        account_type: userData.account_type || 'user',
    };
};

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Auth Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const validateRegister = [
    body('username', 'Username is required')
        .trim()
        .notEmpty()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be 3-50 characters')
        .escape(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

const validateLogin = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists().notEmpty()
];

const validateAccountTypeUpdate = [
    param('userId')
        .isInt({ gt: 0 })
        .withMessage('User ID must be a positive integer')
        .toInt(),
    body('account_type')
        .isIn(['user', 'contributor', 'superuser'])
        .withMessage('Invalid account type specified')
];

router.post(
    '/register',
    validateRegister,
    handleValidationErrors,
    async (req, res, next) => {
        const { username, email, password } = req.body;
        // console.log(`[Auth Register] Attempting registration for email: ${email}, username: ${username}`); // Optional
        try {
            const existingEmail = await UserModel.findUserByEmail(email);
            if (existingEmail) {
                // console.warn(`[Auth Register] Failed: Email ${email} already exists.`); // Optional
                res.status(400).json({ error: 'User with this email already exists.' });
                return;
            }
            const existingUsername = await UserModel.findUserByUsername(username);
            if (existingUsername) {
                // console.warn(`[Auth Register] Failed: Username ${username} already exists.`); // Optional
                res.status(400).json({ error: 'User with this username already exists.' });
                return;
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = await UserModel.createUser(username, email, passwordHash); // Use default account type
            // console.log(`[Auth Register] User created successfully: ID ${newUser.id}`); // Optional
            const payload = {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    account_type: newUser.account_type || 'user',
                },
            };
            const signOptions = { expiresIn: JWT_EXPIRY };
            const token = jwt.sign(payload, JWT_SECRET, signOptions);
            // console.log(`[Auth Register] JWT generated for user ID ${newUser.id}`); // Optional
            res.status(201).json({
                success: true, // Add success flag
                data: {
                    token,
                    user: formatUserForResponse(newUser),
                },
            });
        } catch (err) {
            console.error('[Auth Register] Error:', err);
            next(err);
        }
    }
);

router.post(
    '/login',
    validateLogin,
    handleValidationErrors,
    async (req, res, next) => {
        const { email, password } = req.body;
        // console.log(`[Auth Login] Attempting login for email: ${email}`); // Optional
        try {
            const user = await UserModel.findUserByEmail(email); // Fetches user with hash
            if (!user || !user.password_hash) {
                // console.warn(`[Auth Login] Failed: User not found or password hash missing for email: ${email}`); // Optional
                res.status(401).json({ error: 'Invalid credentials.' });
                return;
            }
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                // console.warn(`[Auth Login] Failed: Password mismatch for email: ${email}`); // Optional
                res.status(401).json({ error: 'Invalid credentials.' });
                return;
            }
            // console.log(`[Auth Login] Login successful for user ID ${user.id}`); // Optional
            const payload = {
                user: {
                    id: user.id,
                    username: user.username,
                    account_type: user.account_type || 'user',
                },
            };
            const signOptions = { expiresIn: JWT_EXPIRY };
            const token = jwt.sign(payload, JWT_SECRET, signOptions);
            // console.log(`[Auth Login] JWT generated for user ID ${user.id}`); // Optional
            res.json({
                success: true, // Add success flag
                data: {
                    token,
                    user: formatUserForResponse(user), // Format without hash
                },
            });
        } catch (err) {
            console.error('[Auth Login] Error:', err);
            next(err);
        }
    }
);

router.put(
    '/update-account-type/:userId',
    authMiddleware,
    requireSuperuser,
    validateAccountTypeUpdate,
    handleValidationErrors,
    async (req, res, next) => {
        const targetUserId = Number(req.params.userId);
        const { account_type } = req.body;
        const requestingUserId = req.user.id;

        // console.log(`[Auth Update Type] Superuser ${requestingUserId} attempting to set user ${targetUserId} to type: ${account_type}`); // Optional

        if (requestingUserId === targetUserId) {
            // console.warn(`[Auth Update Type] Failed: Superuser ${requestingUserId} cannot change their own account type.`); // Optional
            res.status(403).json({ error: 'Superusers cannot change their own account type via this route.' });
            return;
        }

        try {
            const targetUser = await UserModel.findUserById(targetUserId); // Fetches formatted user
            if (!targetUser) {
                // console.warn(`[Auth Update Type] Failed: Target user ${targetUserId} not found.`); // Optional
                res.status(404).json({ error: 'Target user not found.' });
                return;
            }
            const updatedUser = await UserModel.updateUserAccountType(targetUserId, account_type);
            if (!updatedUser) {
                // Should not happen if user was found, but handle defensively
                throw new Error(`Update failed for user ${targetUserId}, no user returned after update.`);
            }
            // console.log(`[Auth Update Type] Successfully updated user ${targetUserId} to type: ${account_type}`); // Optional
            res.json({
                success: true, // Add success flag
                data: formatUserForResponse(updatedUser), // Ensure consistent formatting
            });
        } catch (err) {
            console.error(`[Auth Update Type] Error updating user ${targetUserId}:`, err);
            next(err);
        }
    }
);

export default router;